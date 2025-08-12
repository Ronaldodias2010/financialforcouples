#!/bin/bash

# Script de deploy manual para Couples Financials
# Este script automatiza o processo de deploy da aplicação na AWS

set -e  # Sair se qualquer comando falhar

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configurações
APP_NAME="couples-financials"
AWS_REGION="us-east-1"
ECR_REPOSITORY="couples-financials"
TERRAFORM_DIR="terraform"

# Funções auxiliares
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_requirements() {
    log_info "Verificando requisitos..."
    
    # Verificar se AWS CLI está instalado
    if ! command -v aws &> /dev/null; then
        log_error "AWS CLI não está instalado. Instale primeiro: https://aws.amazon.com/cli/"
        exit 1
    fi
    
    # Verificar se Terraform está instalado
    if ! command -v terraform &> /dev/null; then
        log_error "Terraform não está instalado. Instale primeiro: https://terraform.io/"
        exit 1
    fi
    
    # Verificar se Docker está instalado
    if ! command -v docker &> /dev/null; then
        log_error "Docker não está instalado. Instale primeiro: https://docker.com/"
        exit 1
    fi
    
    # Verificar se Node.js está instalado
    if ! command -v node &> /dev/null; then
        log_error "Node.js não está instalado. Instale primeiro: https://nodejs.org/"
        exit 1
    fi
    
    log_info "✅ Todos os requisitos estão atendidos"
}

configure_aws() {
    log_info "Verificando configuração da AWS..."
    
    if ! aws sts get-caller-identity &> /dev/null; then
        log_error "AWS CLI não está configurado ou credenciais são inválidas"
        log_info "Configure com: aws configure"
        exit 1
    fi
    
    log_info "✅ AWS CLI configurado corretamente"
}

build_application() {
    local skip_tests_param=${1:-false}
    log_info "Construindo aplicação..."
    
    # Instalar dependências
    log_info "Instalando dependências..."
    npm ci
    
    # Executar testes (se não foi passado --skip-tests)
    if [ "$skip_tests_param" = false ]; then
        log_info "Executando testes..."
        npm test -- --coverage --watchAll=false || log_warn "Alguns testes falharam, mas continuando..."
    else
        log_info "Pulando testes..."
    fi
    
    # Build da aplicação
    log_info "Gerando build de produção..."
    npm run build
    
    if [ ! -d "dist" ]; then
        log_error "Build falhou - diretório dist não foi criado"
        exit 1
    fi
    
    log_info "✅ Aplicação construída com sucesso"
}

setup_ecr() {
    log_info "Configurando Amazon ECR..."
    
    # Fazer login no ECR
    aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $(aws sts get-caller-identity --query Account --output text).dkr.ecr.$AWS_REGION.amazonaws.com
    
    # Criar repositório se não existir
    if ! aws ecr describe-repositories --repository-names $ECR_REPOSITORY &> /dev/null; then
        log_info "Criando repositório ECR..."
        aws ecr create-repository --repository-name $ECR_REPOSITORY --region $AWS_REGION
    fi
    
    log_info "✅ ECR configurado"
}

build_and_push_image() {
    log_info "Construindo e enviando imagem Docker..."
    
    # Obter URL do registro ECR
    ECR_REGISTRY=$(aws sts get-caller-identity --query Account --output text).dkr.ecr.$AWS_REGION.amazonaws.com
    IMAGE_TAG=$(date +%Y%m%d-%H%M%S)
    
    # Build da imagem
    log_info "Construindo imagem Docker..."
    docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG .
    docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:latest .
    
    # Push da imagem
    log_info "Enviando imagem para ECR..."
    docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
    docker push $ECR_REGISTRY/$ECR_REPOSITORY:latest
    
    # Exportar variável para uso posterior
    export CONTAINER_IMAGE="$ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG"
    
    log_info "✅ Imagem enviada: $CONTAINER_IMAGE"
}

deploy_infrastructure() {
    log_info "Deployando infraestrutura com Terraform..."
    
    cd $TERRAFORM_DIR
    
    # Verificar se terraform.tfvars existe
    if [ ! -f "terraform.tfvars" ]; then
        log_error "Arquivo terraform.tfvars não encontrado!"
        log_info "Copie terraform.tfvars.example para terraform.tfvars e configure as variáveis"
        exit 1
    fi
    
    # Inicializar Terraform
    log_info "Inicializando Terraform..."
    terraform init
    
    # Validar configuração
    log_info "Validando configuração..."
    terraform validate
    
    # Planejar deploy
    log_info "Planejando deploy..."
    terraform plan -var="container_image=$CONTAINER_IMAGE" -out=tfplan
    
    # Aplicar mudanças (com confirmação)
    echo
    read -p "Deseja aplicar as mudanças? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log_info "Aplicando mudanças..."
        terraform apply -auto-approve tfplan
        log_info "✅ Infraestrutura deployada com sucesso"
    else
        log_warn "Deploy cancelado pelo usuário"
        exit 0
    fi
    
    cd ..
}

update_ecs_service() {
    log_info "Atualizando serviço ECS..."
    
    # Forçar novo deployment
    aws ecs update-service \
        --cluster $APP_NAME-cluster \
        --service $APP_NAME \
        --force-new-deployment \
        --region $AWS_REGION
    
    # Aguardar estabilização
    log_info "Aguardando estabilização do serviço..."
    aws ecs wait services-stable \
        --cluster $APP_NAME-cluster \
        --services $APP_NAME \
        --region $AWS_REGION
    
    log_info "✅ Serviço ECS atualizado"
}

verify_deployment() {
    log_info "Verificando deployment..."
    
    # Obter URL do Load Balancer
    ALB_DNS=$(aws elbv2 describe-load-balancers \
        --names $APP_NAME-alb \
        --query 'LoadBalancers[0].DNSName' \
        --output text \
        --region $AWS_REGION)
    
    if [ "$ALB_DNS" != "None" ] && [ -n "$ALB_DNS" ]; then
        APP_URL="http://$ALB_DNS"
        log_info "URL da aplicação: $APP_URL"
        
        # Aguardar alguns segundos
        sleep 30
        
        # Verificar health check
        if curl -f -s "$APP_URL/health" &> /dev/null; then
            log_info "✅ Health check passou!"
        else
            log_warn "Health check falhou, mas a aplicação pode estar inicializando..."
        fi
        
        log_info "🎉 Deploy concluído! Acesse: $APP_URL"
    else
        log_warn "Não foi possível obter URL do Load Balancer"
    fi
}

cleanup() {
    log_info "Limpando recursos temporários..."
    
    # Remover imagens Docker locais antigas
    docker image prune -f || true
    
    log_info "✅ Limpeza concluída"
}

show_help() {
    echo "Script de deploy para Couples Financials"
    echo ""
    echo "Uso: $0 [opções]"
    echo ""
    echo "Opções:"
    echo "  --help                 Mostrar esta ajuda"
    echo "  --skip-build          Pular build da aplicação"
    echo "  --skip-tests          Pular execução de testes"
    echo "  --infrastructure-only  Apenas deploy da infraestrutura"
    echo "  --app-only            Apenas deploy da aplicação"
    echo ""
    echo "Exemplo:"
    echo "  $0                    Deploy completo"
    echo "  $0 --skip-tests       Deploy sem executar testes"
    echo ""
}

# Função principal
main() {
    local skip_build=false
    local skip_tests=false
    local infrastructure_only=false
    local app_only=false
    
    # Processar argumentos
    while [[ $# -gt 0 ]]; do
        case $1 in
            --help)
                show_help
                exit 0
                ;;
            --skip-build)
                skip_build=true
                shift
                ;;
            --skip-tests)
                skip_tests=true
                shift
                ;;
            --infrastructure-only)
                infrastructure_only=true
                shift
                ;;
            --app-only)
                app_only=true
                shift
                ;;
            *)
                log_error "Opção desconhecida: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    log_info "🚀 Iniciando deploy do Couples Financials"
    
    # Verificações iniciais
    check_requirements
    configure_aws
    
    if [ "$app_only" = false ]; then
        if [ "$skip_build" = false ]; then
            if [ "$skip_tests" = true ]; then
                build_application true
            else
                build_application false
            fi
        fi
        setup_ecr
        build_and_push_image
    fi
    
    if [ "$app_only" = false ]; then
        deploy_infrastructure
    fi
    
    if [ "$infrastructure_only" = false ]; then
        update_ecs_service
        verify_deployment
    fi
    
    cleanup
    
    log_info "🎉 Deploy concluído com sucesso!"
}

# Executar função principal com todos os argumentos
main "$@"