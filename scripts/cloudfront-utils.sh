#!/bin/bash

# Utilitários para gerenciamento do CloudFront
# Script para facilitar operações comuns do CloudFront durante deploys

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configurações
APP_NAME="couples-financials"
AWS_REGION="us-east-1"

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

get_distribution_id() {
    aws cloudfront list-distributions \
        --query "DistributionList.Items[?contains(Comment, '$APP_NAME')].Id" \
        --output text 2>/dev/null | head -1
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
    
    DISTRIBUTION_ID=$(get_distribution_id)
    
    if [ -n "$DISTRIBUTION_ID" ] && [ "$DISTRIBUTION_ID" != "None" ]; then
        CLOUDFRONT_DOMAIN=$(aws cloudfront get-distribution \
            --id "$DISTRIBUTION_ID" \
            --query 'Distribution.DomainName' \
            --output text 2>/dev/null)
        echo "📍 URL do CloudFront: https://$CLOUDFRONT_DOMAIN"
        echo "📍 Distribution ID: $DISTRIBUTION_ID"
    else
        log_warn "CloudFront não encontrado"
    fi
}

get_cloudfront_status() {
    log_info "Verificando status do CloudFront..."
    
    DISTRIBUTION_ID=$(get_distribution_id)
    
    if [ -n "$DISTRIBUTION_ID" ] && [ "$DISTRIBUTION_ID" != "None" ]; then
        STATUS=$(aws cloudfront get-distribution \
            --id "$DISTRIBUTION_ID" \
            --query 'Distribution.Status' \
            --output text 2>/dev/null)
        ENABLED=$(aws cloudfront get-distribution \
            --id "$DISTRIBUTION_ID" \
            --query 'Distribution.DistributionConfig.Enabled' \
            --output text 2>/dev/null)
        
        echo "📊 Status: $STATUS"
        echo "📊 Habilitado: $ENABLED"
        echo "📊 Distribution ID: $DISTRIBUTION_ID"
    else
        log_warn "CloudFront não encontrado"
    fi
}

invalidate_cache() {
    log_info "Invalidando cache do CloudFront..."
    
    DISTRIBUTION_ID=$(get_distribution_id)
    
    if [ -n "$DISTRIBUTION_ID" ] && [ "$DISTRIBUTION_ID" != "None" ]; then
        INVALIDATION_ID=$(aws cloudfront create-invalidation \
            --distribution-id "$DISTRIBUTION_ID" \
            --paths "/*" \
            --query 'Invalidation.Id' \
            --output text)
        
        log_info "✅ Invalidação criada: $INVALIDATION_ID"
        log_info "⏳ Aguarde alguns minutos para propagação..."
    else
        log_error "CloudFront não encontrado para invalidação"
        exit 1
    fi
}

wait_for_invalidation() {
    log_info "Aguardando invalidação do CloudFront..."
    
    DISTRIBUTION_ID=$(get_distribution_id)
    
    if [ -n "$DISTRIBUTION_ID" ] && [ "$DISTRIBUTION_ID" != "None" ]; then
        # Obter a invalidação mais recente
        INVALIDATION_ID=$(aws cloudfront list-invalidations \
            --distribution-id "$DISTRIBUTION_ID" \
            --query 'InvalidationList.Items[0].Id' \
            --output text 2>/dev/null)
        
        if [ -n "$INVALIDATION_ID" ] && [ "$INVALIDATION_ID" != "None" ]; then
            log_info "Aguardando invalidação $INVALIDATION_ID..."
            aws cloudfront wait invalidation-completed \
                --distribution-id "$DISTRIBUTION_ID" \
                --id "$INVALIDATION_ID"
            log_info "✅ Invalidação concluída!"
        else
            log_warn "Nenhuma invalidação ativa encontrada"
        fi
    else
        log_error "CloudFront não encontrado"
        exit 1
    fi
}

health_check() {
    local url="$1"
    local max_attempts=10
    local attempt=1
    
    log_info "Executando health check em: $url"
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f -s "$url/health" &> /dev/null; then
            log_info "✅ Health check passou (tentativa $attempt)"
            return 0
        fi
        
        log_warn "Health check falhou (tentativa $attempt/$max_attempts)"
        sleep 30
        ((attempt++))
    done
    
    log_error "Health check falhou após $max_attempts tentativas"
    return 1
}

compare_performance() {
    log_info "Comparando performance ALB vs CloudFront..."
    
    # Obter URLs
    ALB_DNS=$(aws elbv2 describe-load-balancers \
        --names $APP_NAME-alb \
        --query 'LoadBalancers[0].DNSName' \
        --output text \
        --region $AWS_REGION 2>/dev/null)
    
    DISTRIBUTION_ID=$(get_distribution_id)
    
    if [ "$ALB_DNS" != "None" ] && [ -n "$ALB_DNS" ] && [ -n "$DISTRIBUTION_ID" ] && [ "$DISTRIBUTION_ID" != "None" ]; then
        ALB_URL="http://$ALB_DNS"
        
        CLOUDFRONT_DOMAIN=$(aws cloudfront get-distribution \
            --id "$DISTRIBUTION_ID" \
            --query 'Distribution.DomainName' \
            --output text 2>/dev/null)
        CLOUDFRONT_URL="https://$CLOUDFRONT_DOMAIN"
        
        echo "🔍 Testando velocidade..."
        echo ""
        
        # Teste ALB
        echo "📊 ALB (direto):"
        time curl -s "$ALB_URL" > /dev/null 2>&1 || echo "   ❌ Falhou"
        
        echo ""
        
        # Teste CloudFront
        echo "📊 CloudFront:"
        time curl -s "$CLOUDFRONT_URL" > /dev/null 2>&1 || echo "   ❌ Falhou"
        
    else
        log_error "Não foi possível obter URLs para comparação"
    fi
}

show_help() {
    echo "Utilitários para CloudFront - Couples Financials"
    echo ""
    echo "Uso: $0 <comando>"
    echo ""
    echo "Comandos disponíveis:"
    echo "  alb-url              Mostrar URL direta do ALB"
    echo "  cloudfront-url       Mostrar URL do CloudFront"
    echo "  status               Verificar status do CloudFront"
    echo "  invalidate           Invalidar cache do CloudFront"
    echo "  wait-invalidation    Aguardar conclusão da invalidação"
    echo "  health-check <url>   Executar health check na URL"
    echo "  compare              Comparar performance ALB vs CloudFront"
    echo "  help                 Mostrar esta ajuda"
    echo ""
    echo "Exemplos:"
    echo "  $0 alb-url"
    echo "  $0 invalidate"
    echo "  $0 health-check http://example.com"
    echo ""
}

# Função principal
main() {
    case "${1:-help}" in
        alb-url)
            get_alb_url
            ;;
        cloudfront-url)
            get_cloudfront_url
            ;;
        status)
            get_cloudfront_status
            ;;
        invalidate)
            invalidate_cache
            ;;
        wait-invalidation)
            wait_for_invalidation
            ;;
        health-check)
            if [ -z "$2" ]; then
                log_error "URL é obrigatória para health check"
                echo "Uso: $0 health-check <url>"
                exit 1
            fi
            health_check "$2"
            ;;
        compare)
            compare_performance
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            log_error "Comando desconhecido: $1"
            show_help
            exit 1
            ;;
    esac
}

# Executar função principal
main "$@"