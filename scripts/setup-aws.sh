#!/bin/bash

# Script para configuração inicial da AWS para Couples Financials
# Este script ajuda a configurar os recursos básicos necessários

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configurações
APP_NAME="couples-financials"
AWS_REGION="us-east-1"

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

check_aws_cli() {
    log_step "Verificando AWS CLI..."
    
    if ! command -v aws &> /dev/null; then
        log_error "AWS CLI não está instalado!"
        echo "Instale o AWS CLI:"
        echo "- macOS: brew install awscli"
        echo "- Ubuntu/Debian: sudo apt install awscli"
        echo "- Windows: https://aws.amazon.com/cli/"
        exit 1
    fi
    
    log_info "✅ AWS CLI encontrado: $(aws --version)"
}

configure_aws_credentials() {
    log_step "Configurando credenciais da AWS..."
    
    # Verificar se já está configurado
    if aws sts get-caller-identity &> /dev/null; then
        ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
        USER_ARN=$(aws sts get-caller-identity --query Arn --output text)
        log_info "✅ AWS já configurado"
        log_info "Conta: $ACCOUNT_ID"
        log_info "Usuário: $USER_ARN"
        
        read -p "Deseja reconfigurar? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            return 0
        fi
    fi
    
    echo
    log_info "Para configurar a AWS, você precisará de:"
    log_info "1. AWS Access Key ID"
    log_info "2. AWS Secret Access Key"
    log_info "3. Região padrão (sugerido: us-east-1)"
    echo
    log_warn "Certifique-se de que o usuário IAM tem as seguintes permissões:"
    log_warn "- EC2FullAccess"
    log_warn "- ECSFullAccess"
    log_warn "- ECRFullAccess"
    log_warn "- S3FullAccess"
    log_warn "- CloudFrontFullAccess"
    log_warn "- IAMFullAccess"
    log_warn "- SecretsManagerFullAccess"
    log_warn "- CloudWatchFullAccess"
    log_warn "- Route53FullAccess (se usar domínio personalizado)"
    echo
    
    read -p "Pressione Enter para continuar com aws configure..."
    aws configure
    
    # Verificar se funcionou
    if aws sts get-caller-identity &> /dev/null; then
        log_info "✅ Credenciais configuradas com sucesso!"
    else
        log_error "❌ Falha na configuração das credenciais"
        exit 1
    fi
}

create_terraform_vars() {
    log_step "Configurando variáveis do Terraform..."
    
    TERRAFORM_VARS_FILE="terraform/terraform.tfvars"
    
    if [ -f "$TERRAFORM_VARS_FILE" ]; then
        log_warn "Arquivo terraform.tfvars já existe"
        read -p "Deseja sobrescrever? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            return 0
        fi
    fi
    
    echo
    log_info "Vamos configurar as variáveis do Terraform..."
    
    # Região
    read -p "Região da AWS [$AWS_REGION]: " input_region
    REGION=${input_region:-$AWS_REGION}
    
    # Ambiente
    read -p "Ambiente (prod/staging/dev) [prod]: " input_env
    ENVIRONMENT=${input_env:-prod}
    
    # Nome da aplicação
    read -p "Nome da aplicação [$APP_NAME]: " input_app_name
    APP_NAME_VAR=${input_app_name:-$APP_NAME}
    
    # Domínio personalizado (opcional)
    echo
    log_info "Domínio personalizado (opcional):"
    log_info "Se você possui um domínio registrado na Route53, pode configurá-lo agora"
    log_info "Deixe em branco se não tiver ou quiser configurar depois"
    read -p "Domínio (ex: meuapp.com.br): " DOMAIN_NAME
    
    # Credenciais do Supabase
    echo
    log_info "Credenciais do Supabase:"
    log_info "Você pode encontrar estas informações no painel do Supabase:"
    log_info "1. Acesse https://app.supabase.com/"
    log_info "2. Selecione seu projeto"
    log_info "3. Vá em Settings > API"
    echo
    
    read -p "URL do Supabase [https://elxttabdtddlavhseipz.supabase.co]: " input_supabase_url
    SUPABASE_URL=${input_supabase_url:-https://elxttabdtddlavhseipz.supabase.co}
    
    read -p "Supabase Anon Key: " SUPABASE_ANON_KEY
    read -p "Supabase Service Role Key: " SUPABASE_SERVICE_ROLE_KEY
    
    # Configurações opcionais
    echo
    log_info "Configurações de recursos (opcional - pressione Enter para usar padrão):"
    read -p "Número de instâncias [2]: " input_desired_count
    DESIRED_COUNT=${input_desired_count:-2}
    
    read -p "CPU (256, 512, 1024) [256]: " input_cpu
    CPU=${input_cpu:-256}
    
    read -p "Memória em MB [512]: " input_memory
    MEMORY=${input_memory:-512}
    
    # Criar arquivo terraform.tfvars
    cat > "$TERRAFORM_VARS_FILE" << EOF
# Configurações do Couples Financials
# Gerado automaticamente em $(date)

# Configurações gerais
aws_region  = "$REGION"
environment = "$ENVIRONMENT"
app_name    = "$APP_NAME_VAR"

EOF
    
    if [ -n "$DOMAIN_NAME" ]; then
        echo "# Domínio personalizado" >> "$TERRAFORM_VARS_FILE"
        echo "domain_name = \"$DOMAIN_NAME\"" >> "$TERRAFORM_VARS_FILE"
        echo "" >> "$TERRAFORM_VARS_FILE"
    fi
    
    cat >> "$TERRAFORM_VARS_FILE" << EOF
# Credenciais do Supabase
supabase_url              = "$SUPABASE_URL"
supabase_anon_key         = "$SUPABASE_ANON_KEY"
supabase_service_role_key = "$SUPABASE_SERVICE_ROLE_KEY"

# Configurações do container
container_image = "$APP_NAME_VAR:latest"
container_port  = 80

# Configurações de escala
desired_count = $DESIRED_COUNT
cpu          = $CPU
memory       = $MEMORY

# CloudFront
enable_cloudfront = true

# Logs
cloudwatch_log_retention_days = 7
EOF
    
    log_info "✅ Arquivo terraform.tfvars criado!"
}

setup_github_secrets() {
    log_step "Configurando secrets do GitHub Actions..."
    
    echo
    log_info "Para o CI/CD funcionar, você precisa configurar os seguintes secrets no GitHub:"
    echo
    log_info "1. Acesse: https://github.com/seu-usuario/seu-repositorio/settings/secrets/actions"
    log_info "2. Adicione os seguintes secrets:"
    echo
    echo "AWS_ACCESS_KEY_ID          = sua_access_key_aqui"
    echo "AWS_SECRET_ACCESS_KEY      = sua_secret_key_aqui"
    echo "SUPABASE_ANON_KEY         = sua_supabase_anon_key"
    echo "SUPABASE_SERVICE_ROLE_KEY = sua_supabase_service_role_key"
    echo
    
    # Obter as chaves da configuração atual da AWS
    if aws configure get aws_access_key_id &> /dev/null; then
        ACCESS_KEY=$(aws configure get aws_access_key_id)
        log_info "Seu AWS Access Key ID: $ACCESS_KEY"
    fi
    
    echo
    read -p "Pressione Enter quando tiver configurado os secrets no GitHub..."
}

verify_permissions() {
    log_step "Verificando permissões da AWS..."
    
    log_info "Testando permissões necessárias..."
    
    # Testar permissões básicas
    tests=(
        "aws sts get-caller-identity"
        "aws ec2 describe-regions --region-names $AWS_REGION"
        "aws ecs list-clusters --region $AWS_REGION"
        "aws ecr describe-repositories --region $AWS_REGION || true"
        "aws s3 ls"
        "aws iam list-roles --max-items 1"
    )
    
    for test in "${tests[@]}"; do
        if eval "$test" &> /dev/null; then
            log_info "✅ $(echo $test | cut -d' ' -f2)"
        else
            log_warn "⚠️  $(echo $test | cut -d' ' -f2) - Pode precisar de permissões adicionais"
        fi
    done
}

show_next_steps() {
    log_step "Próximos passos:"
    echo
    log_info "1. Revise o arquivo terraform/terraform.tfvars"
    log_info "2. Execute o deploy:"
    log_info "   ./scripts/deploy.sh"
    echo
    log_info "Ou execute manualmente:"
    log_info "   cd terraform"
    log_info "   terraform init"
    log_info "   terraform plan"
    log_info "   terraform apply"
    echo
    log_info "Para CI/CD automatizado:"
    log_info "   - Configure os secrets no GitHub"
    log_info "   - Faça push para branch main"
    echo
    log_info "📚 Documentação completa em: README.md"
}

main() {
    log_info "🚀 Configuração inicial da AWS para Couples Financials"
    echo
    
    check_aws_cli
    configure_aws_credentials
    create_terraform_vars
    setup_github_secrets
    verify_permissions
    show_next_steps
    
    echo
    log_info "🎉 Configuração concluída!"
    log_info "Execute ./scripts/deploy.sh quando estiver pronto para fazer o deploy"
}

# Executar função principal
main "$@"