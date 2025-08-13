#!/bin/bash

# Script para forçar deploy da página 503 customizada
# Este script força o upload da página 503.html para o S3 e invalida o cache do CloudFront

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
TERRAFORM_DIR="terraform"

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

# Função para obter informações do Terraform
get_terraform_output() {
    cd $TERRAFORM_DIR
    terraform output -raw $1 2>/dev/null || echo ""
    cd ..
}

# Verificar se estamos no diretório correto
if [ ! -f "public/503.html" ]; then
    log_error "Arquivo public/503.html não encontrado. Execute este script do diretório raiz do projeto."
    exit 1
fi

log_info "🚀 Iniciando deploy forçado da página 503 customizada..."

# Obter informações do Terraform
log_step "Obtendo informações da infraestrutura..."
S3_BUCKET=$(get_terraform_output "s3_bucket_name")
CLOUDFRONT_ID=$(get_terraform_output "cloudfront_distribution_id")

if [ -z "$S3_BUCKET" ]; then
    log_error "Não foi possível obter o nome do bucket S3. Certifique-se de que a infraestrutura está deployada."
    exit 1
fi

log_info "Bucket S3: $S3_BUCKET"
log_info "CloudFront ID: $CLOUDFRONT_ID"

# Upload do arquivo 503.html para o S3
log_step "Fazendo upload da página 503.html para o S3..."
aws s3 cp public/503.html s3://$S3_BUCKET/503.html \
    --content-type "text/html" \
    --cache-control "max-age=0, no-cache, no-store, must-revalidate" \
    --metadata-directive REPLACE \
    --region $AWS_REGION

log_info "✅ Upload da página 503.html concluído"

# Invalidar cache do CloudFront se disponível
if [ ! -z "$CLOUDFRONT_ID" ]; then
    log_step "Invalidando cache do CloudFront..."
    aws cloudfront create-invalidation \
        --distribution-id $CLOUDFRONT_ID \
        --paths "/503.html" \
        --region $AWS_REGION > /dev/null
    
    log_info "✅ Cache do CloudFront invalidado"
else
    log_warn "CloudFront não configurado, pulando invalidação do cache"
fi

# Teste de conectividade
log_step "Testando acesso à página 503..."
CLOUDFRONT_URL=$(get_terraform_output "cloudfront_domain_name")
ALB_URL=$(get_terraform_output "load_balancer_dns_name")

if [ ! -z "$CLOUDFRONT_URL" ]; then
    log_info "Testando via CloudFront: https://$CLOUDFRONT_URL/503.html"
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://$CLOUDFRONT_URL/503.html" || echo "000")
    if [ "$HTTP_STATUS" = "200" ]; then
        log_info "✅ Página 503 acessível via CloudFront"
    else
        log_warn "⚠️  Página 503 retornou status $HTTP_STATUS via CloudFront"
    fi
fi

if [ ! -z "$ALB_URL" ]; then
    log_info "Testando via ALB: http://$ALB_URL/503.html"
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://$ALB_URL/503.html" || echo "000")
    if [ "$HTTP_STATUS" = "200" ]; then
        log_info "✅ Página 503 acessível via ALB"
    else
        log_warn "⚠️  Página 503 retornou status $HTTP_STATUS via ALB"
    fi
fi

# Verificar conteúdo do arquivo no S3
log_step "Verificando conteúdo no S3..."
S3_ETAG=$(aws s3api head-object --bucket $S3_BUCKET --key 503.html --query 'ETag' --output text --region $AWS_REGION 2>/dev/null || echo "")
LOCAL_ETAG=$(md5sum public/503.html | awk '{print "\"" $1 "\""}')

if [ "$S3_ETAG" = "$LOCAL_ETAG" ]; then
    log_info "✅ Arquivo no S3 está atualizado (ETags coincidem)"
else
    log_warn "⚠️  ETags não coincidem - S3: $S3_ETAG, Local: $LOCAL_ETAG"
fi

log_info "🎉 Deploy da página 503 concluído!"
log_info ""
log_info "📋 Próximos passos:"
log_info "1. Aguarde alguns minutos para a propagação do CloudFront"
log_info "2. Teste acessando sua aplicação durante uma manutenção"
log_info "3. Verifique se a página customizada aparece corretamente"
log_info ""
log_info "💡 Para simular um erro 503, você pode:"
log_info "- Parar o serviço ECS temporariamente"
log_info "- Acessar diretamente: https://your-domain.com/503.html"