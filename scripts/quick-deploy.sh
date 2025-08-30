#!/bin/bash

# Script de deploy rápido com bypass do CloudFront
# Para deploys de desenvolvimento mais ágeis

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[QUICK-DEPLOY]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[QUICK-DEPLOY]${NC} $1"
}

log_error() {
    echo -e "${RED}[QUICK-DEPLOY]${NC} $1"
}

show_help() {
    echo "🚀 Deploy Rápido - Couples Financials"
    echo ""
    echo "Este script faz deploy direto para o ALB, pulando o CloudFront"
    echo "para maior velocidade durante desenvolvimento."
    echo ""
    echo "Uso: $0 [opções]"
    echo ""
    echo "Opções:"
    echo "  --help           Mostrar esta ajuda"
    echo "  --skip-tests     Pular execução de testes"
    echo "  --check-only     Apenas verificar URLs e status"
    echo ""
    echo "O que este script faz:"
    echo "  1. Build da aplicação (com opção de pular testes)"
    echo "  2. Deploy com CloudFront desabilitado"
    echo "  3. Mostra URL direta do ALB para teste imediato"
    echo "  4. Executa health check"
    echo ""
}

quick_deploy() {
    local skip_tests=${1:-false}
    
    log_info "🚀 Iniciando deploy rápido (bypass CloudFront)"
    
    # Usar o script principal com flags de bypass
    local deploy_flags="--bypass-cloudfront --app-only"
    
    if [ "$skip_tests" = true ]; then
        deploy_flags="$deploy_flags --skip-tests"
    fi
    
    log_info "Executando: ./scripts/deploy.sh $deploy_flags"
    ./scripts/deploy.sh $deploy_flags
    
    log_info "✅ Deploy rápido concluído!"
    log_info "🔗 Use a URL do ALB mostrada acima para teste imediato"
}

check_status() {
    log_info "🔍 Verificando status atual..."
    
    # Usar utilitários do CloudFront
    ./scripts/cloudfront-utils.sh alb-url
    ./scripts/cloudfront-utils.sh cloudfront-url
    ./scripts/cloudfront-utils.sh status
    
    echo ""
    log_info "💡 Dica: Use 'quick-deploy.sh' para deploy direto no ALB"
    log_info "💡 Use 'cloudfront-utils.sh invalidate' para atualizar CloudFront"
}

main() {
    local skip_tests=false
    local check_only=false
    
    # Processar argumentos
    while [[ $# -gt 0 ]]; do
        case $1 in
            --help|-h)
                show_help
                exit 0
                ;;
            --skip-tests)
                skip_tests=true
                shift
                ;;
            --check-only)
                check_only=true
                shift
                ;;
            *)
                log_error "Opção desconhecida: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    if [ "$check_only" = true ]; then
        check_status
    else
        quick_deploy $skip_tests
    fi
}

# Executar função principal
main "$@"