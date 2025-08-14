#!/bin/bash

# Script final para corrigir a página 503 customizada
# Este script faz o deploy completo e testa a funcionalidade

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
TERRAFORM_DIR="./terraform"

# Funções de log
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

# Função para obter outputs do Terraform
get_terraform_output() {
    local key=$1
    cd "$TERRAFORM_DIR"
    terraform output -raw "$key" 2>/dev/null || echo ""
    cd - > /dev/null
}

# Verificar se o arquivo 503.html existe
if [ ! -f "public/503.html" ]; then
    log_error "Arquivo public/503.html não encontrado!"
    exit 1
fi

log_step "1. Aplicando configurações Terraform..."
cd "$TERRAFORM_DIR"
terraform plan -target=aws_s3_object.maintenance_page
terraform apply -target=aws_s3_object.maintenance_page -auto-approve
cd - > /dev/null

log_step "2. Obtendo informações da infraestrutura..."
S3_BUCKET=$(get_terraform_output "s3_bucket_name")
CLOUDFRONT_ID=$(get_terraform_output "cloudfront_distribution_id")
CLOUDFRONT_DOMAIN=$(get_terraform_output "cloudfront_domain_name")

if [ -z "$S3_BUCKET" ]; then
    log_error "Não foi possível obter o nome do bucket S3"
    exit 1
fi

log_info "S3 Bucket: $S3_BUCKET"
log_info "CloudFront ID: $CLOUDFRONT_ID"
log_info "CloudFront Domain: $CLOUDFRONT_DOMAIN"

log_step "3. Fazendo upload forçado da página 503.html..."
aws s3 cp public/503.html "s3://$S3_BUCKET/503.html" \
    --content-type "text/html" \
    --cache-control "max-age=0, no-cache, no-store, must-revalidate" \
    --acl public-read

log_step "4. Verificando upload no S3..."
if aws s3api head-object --bucket "$S3_BUCKET" --key "503.html" > /dev/null 2>&1; then
    log_info "✅ Página 503.html encontrada no S3"
else
    log_error "❌ Página 503.html NÃO encontrada no S3"
    exit 1
fi

log_step "5. Invalidando cache do CloudFront..."
if [ -n "$CLOUDFRONT_ID" ]; then
    INVALIDATION_ID=$(aws cloudfront create-invalidation \
        --distribution-id "$CLOUDFRONT_ID" \
        --paths "/503.html" \
        --query 'Invalidation.Id' \
        --output text)
    
    log_info "Invalidação criada: $INVALIDATION_ID"
    
    log_info "Aguardando invalidação completar..."
    aws cloudfront wait invalidation-completed \
        --distribution-id "$CLOUDFRONT_ID" \
        --id "$INVALIDATION_ID"
    
    log_info "✅ Invalidação do CloudFront concluída"
else
    log_warn "CloudFront ID não encontrado, pulando invalidação"
fi

log_step "6. Testando acesso à página 503..."

# Teste direto no S3
log_info "Testando acesso direto no S3..."
S3_URL="https://$S3_BUCKET.s3.amazonaws.com/503.html"
S3_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$S3_URL")

if [ "$S3_STATUS" = "200" ]; then
    log_info "✅ S3: Página 503 acessível (Status: $S3_STATUS)"
else
    log_error "❌ S3: Página 503 NÃO acessível (Status: $S3_STATUS)"
fi

# Teste via CloudFront
if [ -n "$CLOUDFRONT_DOMAIN" ]; then
    log_info "Testando acesso via CloudFront..."
    CLOUDFRONT_URL="https://$CLOUDFRONT_DOMAIN/503.html"
    CLOUDFRONT_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$CLOUDFRONT_URL")
    
    if [ "$CLOUDFRONT_STATUS" = "200" ]; then
        log_info "✅ CloudFront: Página 503 acessível (Status: $CLOUDFRONT_STATUS)"
    else
        log_warn "⚠️ CloudFront: Página 503 ainda propagando (Status: $CLOUDFRONT_STATUS)"
        log_info "Aguardando 30 segundos para nova tentativa..."
        sleep 30
        
        CLOUDFRONT_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$CLOUDFRONT_URL")
        if [ "$CLOUDFRONT_STATUS" = "200" ]; then
            log_info "✅ CloudFront: Página 503 acessível após aguardar (Status: $CLOUDFRONT_STATUS)"
        else
            log_error "❌ CloudFront: Página 503 ainda não acessível (Status: $CLOUDFRONT_STATUS)"
        fi
    fi
fi

log_step "7. Verificando integridade do arquivo..."
LOCAL_ETAG=$(md5sum public/503.html | cut -d' ' -f1)
S3_ETAG=$(aws s3api head-object --bucket "$S3_BUCKET" --key "503.html" --query 'ETag' --output text | tr -d '"')

if [ "$LOCAL_ETAG" = "$S3_ETAG" ]; then
    log_info "✅ ETags coincidem - arquivo íntegro"
else
    log_warn "⚠️ ETags diferem - pode haver problema na sincronização"
    log_info "Local: $LOCAL_ETAG"
    log_info "S3: $S3_ETAG"
fi

log_step "8. Aplicando configuração completa do Terraform..."
cd "$TERRAFORM_DIR"
terraform apply -auto-approve
cd - > /dev/null

echo ""
log_info "=== RESUMO DO DEPLOY ==="
log_info "S3 Status: $([ "$S3_STATUS" = "200" ] && echo "✅ OK" || echo "❌ ERRO")"
if [ -n "$CLOUDFRONT_DOMAIN" ]; then
    log_info "CloudFront Status: $([ "$CLOUDFRONT_STATUS" = "200" ] && echo "✅ OK" || echo "❌ ERRO")"
fi
log_info "Integridade: $([ "$LOCAL_ETAG" = "$S3_ETAG" ] && echo "✅ OK" || echo "⚠️ VERIFICAR")"

echo ""
log_info "=== PRÓXIMOS PASSOS ==="
log_info "1. Acesse diretamente: $CLOUDFRONT_URL"
if [ -n "$CLOUDFRONT_DOMAIN" ]; then
    log_info "2. URL da aplicação: https://$CLOUDFRONT_DOMAIN"
fi
log_info "3. Para simular erro 503, reduza o serviço ECS para 0 instâncias"

echo ""
log_info "🎉 Deploy da página 503 concluído!"