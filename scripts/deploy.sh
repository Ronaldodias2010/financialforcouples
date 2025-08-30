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
    
    # Planejar deploy (com configuração CloudFront)
    log_info "Planejando deploy..."
    if [ "$bypass_cloudfront" = true ]; then
        log_warn "CloudFront será desabilitado para deploy mais rápido"
        terraform plan -var="container_image=$CONTAINER_IMAGE" -var="enable_cloudfront=false" -out=tfplan
    else
        terraform plan -var="container_image=$CONTAINER_IMAGE" -out=tfplan
    fi
    
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
        ALB_URL="http://$ALB_DNS"
        log_info "📍 URL direta do ALB: $ALB_URL"
        
        # Verificar se CloudFront está habilitado
        if [ "$bypass_cloudfront" = false ]; then
            get_cloudfront_url
        fi
        
        # Aguardar alguns segundos
        sleep 30
        
        # Verificar health check no ALB
        if curl -f -s "$ALB_URL/health" &> /dev/null; then
            log_info "✅ Health check do ALB passou!"
        else
            log_warn "Health check do ALB falhou, mas a aplicação pode estar inicializando..."
        fi
        
        # Invalidar cache se solicitado
        if [ "$invalidate_cache" = true ] && [ "$bypass_cloudfront" = false ]; then
            invalidate_cloudfront_cache
        fi
        
        log_info "🎉 Deploy concluído!"
        log_info "📍 Acesse via ALB (mais rápido): $ALB_URL"
        
        if [ "$bypass_cloudfront" = false ]; then
            log_info "📍 CloudFront será disponibilizado em alguns minutos"
        fi
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

get_alb_url() {
    log_info "Obtendo URL direta do ALB..."
    
    ALB_DNS=$(aws elbv2 describe-load-balancers \
        --names $APP_NAME-alb \
        --query 'LoadBalancers[0].DNSName' \
        --output text \
        --region $AWS_REGION 2>/dev/null)
    
    if [ "$ALB_DNS" != "None" ] && [ -n "$ALB_DNS" ]; then
        echo "📍 URL direta do ALB: http://$ALB_DNS"
    else
        log_error "ALB não encontrado"
        exit 1
    fi
}

get_cloudfront_url() {
    log_info "Obtendo URL do CloudFront..."
    
    DISTRIBUTION_ID=$(aws cloudfront list-distributions \
        --query "DistributionList.Items[?contains(Comment, '$APP_NAME')].Id" \
        --output text 2>/dev/null | head -1)
    
    if [ -n "$DISTRIBUTION_ID" ] && [ "$DISTRIBUTION_ID" != "None" ]; then
        CLOUDFRONT_DOMAIN=$(aws cloudfront get-distribution \
            --id "$DISTRIBUTION_ID" \
            --query 'Distribution.DomainName' \
            --output text 2>/dev/null)
        echo "📍 URL do CloudFront: https://$CLOUDFRONT_DOMAIN"
    else
        log_warn "CloudFront não encontrado"
    fi
}

invalidate_cloudfront_cache() {
    log_info "Invalidando cache do CloudFront..."
    
    DISTRIBUTION_ID=$(aws cloudfront list-distributions \
        --query "DistributionList.Items[?contains(Comment, '$APP_NAME')].Id" \
        --output text 2>/dev/null | head -1)
    
    if [ -n "$DISTRIBUTION_ID" ] && [ "$DISTRIBUTION_ID" != "None" ]; then
        aws cloudfront create-invalidation \
            --distribution-id "$DISTRIBUTION_ID" \
            --paths "/*" \
            --region $AWS_REGION
        log_info "✅ Cache do CloudFront invalidado"
    else
        log_warn "CloudFront não encontrado para invalidação"
    fi
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
    echo "  --bypass-cloudfront   Desabilitar CloudFront durante deploy"
    echo "  --invalidate-cache    Invalidar cache do CloudFront"
    echo "  --get-alb-url         Mostrar URL direta do ALB"
    echo ""
    echo "Exemplo:"
    echo "  $0                           Deploy completo"
    echo "  $0 --skip-tests              Deploy sem executar testes"
    echo "  $0 --bypass-cloudfront       Deploy direto para ALB"
    echo "  $0 --get-alb-url            Obter URL direta do ALB"
    echo ""
}

# Função principal
main() {
    local skip_build=false
    local skip_tests=false
    local infrastructure_only=false
    local app_only=false
    local bypass_cloudfront=false
    local invalidate_cache=false
    local get_alb_url_only=false
    
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
            --bypass-cloudfront)
                bypass_cloudfront=true
                shift
                ;;
            --invalidate-cache)
                invalidate_cache=true
                shift
                ;;
            --get-alb-url)
                get_alb_url_only=true
                shift
                ;;
            *)
                log_error "Opção desconhecida: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    # Se apenas URL do ALB foi solicitada
    if [ "$get_alb_url_only" = true ]; then
        get_alb_url
        get_cloudfront_url
        exit 0
    fi
    
    # Se apenas invalidação foi solicitada
    if [ "$invalidate_cache" = true ] && [ "$skip_build" = false ] && [ "$infrastructure_only" = false ] && [ "$app_only" = false ]; then
        invalidate_cloudfront_cache
        exit 0
    fi
    
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