#!/bin/bash

# Script para corrigir e verificar a página 503 customizada
# Este script força o deploy da página 503 e verifica se está funcionando

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

log_info "🚀 Iniciando correção da página 503 customizada..."

# Obter informações do Terraform
log_step "Obtendo informações da infraestrutura..."
S3_BUCKET=$(get_terraform_output "s3_bucket_name")
CLOUDFRONT_ID=$(get_terraform_output "cloudfront_distribution_id")
CLOUDFRONT_DOMAIN=$(get_terraform_output "cloudfront_domain_name")

if [ -z "$S3_BUCKET" ]; then
    log_error "Não foi possível obter o nome do bucket S3. Executando terraform apply primeiro..."
    cd $TERRAFORM_DIR
    terraform apply -auto-approve
    cd ..
    S3_BUCKET=$(get_terraform_output "s3_bucket_name")
fi

log_info "Bucket S3: $S3_BUCKET"
log_info "CloudFront ID: $CLOUDFRONT_ID"
log_info "CloudFront Domain: $CLOUDFRONT_DOMAIN"

# 1. Forçar upload da página 503 para o S3
log_step "Fazendo upload forçado da página 503.html para o S3..."
aws s3 cp public/503.html s3://$S3_BUCKET/503.html \
    --content-type "text/html" \
    --cache-control "max-age=0, no-cache, no-store, must-revalidate" \
    --metadata-directive REPLACE \
    --acl public-read \
    --region $AWS_REGION

log_info "✅ Upload da página 503.html concluído"

# 2. Verificar se o arquivo existe no S3
log_step "Verificando se o arquivo existe no S3..."
S3_EXISTS=$(aws s3api head-object --bucket $S3_BUCKET --key 503.html --region $AWS_REGION 2>/dev/null && echo "true" || echo "false")
if [ "$S3_EXISTS" = "true" ]; then
    log_info "✅ Arquivo 503.html confirmado no S3"
else
    log_error "❌ Arquivo 503.html não encontrado no S3"
    exit 1
fi

# 3. Invalidar cache do CloudFront
if [ ! -z "$CLOUDFRONT_ID" ]; then
    log_step "Invalidando cache do CloudFront..."
    INVALIDATION_ID=$(aws cloudfront create-invalidation \
        --distribution-id $CLOUDFRONT_ID \
        --paths "/503.html" \
        --region $AWS_REGION \
        --query 'Invalidation.Id' \
        --output text)
    
    log_info "✅ Invalidação criada: $INVALIDATION_ID"
    
    # Aguardar invalidação completar
    log_step "Aguardando invalidação do CloudFront completar..."
    aws cloudfront wait invalidation-completed \
        --distribution-id $CLOUDFRONT_ID \
        --id $INVALIDATION_ID \
        --region $AWS_REGION
    
    log_info "✅ Cache do CloudFront invalidado com sucesso"
else
    log_warn "CloudFront não configurado, pulando invalidação do cache"
fi

# 4. Testar acesso direto à página 503
log_step "Testando acesso à página 503..."

# Teste direto no S3
log_info "Testando acesso direto ao S3..."
S3_URL="https://$S3_BUCKET.s3.$AWS_REGION.amazonaws.com/503.html"
S3_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$S3_URL" || echo "000")
if [ "$S3_STATUS" = "200" ]; then
    log_info "✅ Página 503 acessível via S3: $S3_URL"
else
    log_warn "⚠️  Página 503 retornou status $S3_STATUS via S3"
fi

# Teste via CloudFront
if [ ! -z "$CLOUDFRONT_DOMAIN" ]; then
    log_info "Testando acesso via CloudFront..."
    CF_URL="https://$CLOUDFRONT_DOMAIN/503.html"
    CF_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$CF_URL" || echo "000")
    if [ "$CF_STATUS" = "200" ]; then
        log_info "✅ Página 503 acessível via CloudFront: $CF_URL"
    else
        log_warn "⚠️  Página 503 retornou status $CF_STATUS via CloudFront"
        log_info "Aguardando 30 segundos para propagação do CloudFront..."
        sleep 30
        CF_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$CF_URL" || echo "000")
        if [ "$CF_STATUS" = "200" ]; then
            log_info "✅ Página 503 acessível via CloudFront após aguardar: $CF_URL"
        else
            log_warn "⚠️  Página 503 ainda retorna status $CF_STATUS via CloudFront"
        fi
    fi
fi

# 5. Verificar ETags
log_step "Verificando integridade do arquivo..."
LOCAL_ETAG=$(md5sum public/503.html | awk '{print "\"" $1 "\""}')
S3_ETAG=$(aws s3api head-object --bucket $S3_BUCKET --key 503.html --query 'ETag' --output text --region $AWS_REGION 2>/dev/null || echo "")

if [ "$S3_ETAG" = "$LOCAL_ETAG" ]; then
    log_info "✅ Arquivo no S3 está atualizado (ETags coincidem)"
else
    log_warn "⚠️  ETags não coincidem - S3: $S3_ETAG, Local: $LOCAL_ETAG"
fi

# 6. Recriar o recurso Terraform se necessário
log_step "Aplicando configuração do Terraform para garantir consistência..."
cd $TERRAFORM_DIR
terraform apply -target=aws_s3_object.maintenance_page -auto-approve
cd ..

log_info "🎉 Correção da página 503 concluída!"
log_info ""
log_info "📋 Resumo dos testes:"
log_info "• S3 direto: Status $S3_STATUS"
if [ ! -z "$CLOUDFRONT_DOMAIN" ]; then
    log_info "• CloudFront: Status $CF_STATUS"
fi
log_info "• ETags coincidem: $([ "$S3_ETAG" = "$LOCAL_ETAG" ] && echo "✅ Sim" || echo "❌ Não")"
log_info ""
log_info "🔍 Para simular um erro 503:"
log_info "1. Pare o serviço ECS temporariamente"
log_info "2. Acesse sua aplicação"
log_info "3. Deve aparecer a página 503 customizada"
log_info ""
if [ ! -z "$CLOUDFRONT_DOMAIN" ]; then
    log_info "🌐 Teste direto: https://$CLOUDFRONT_DOMAIN/503.html"
fi