#!/bin/bash

# Script para verificar health da aplicação
# Uso: ./scripts/health-check.sh [url]

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configurações
APP_NAME="couples-financials"
AWS_REGION="us-east-1"
MAX_ATTEMPTS=10
WAIT_TIME=30

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

get_app_url() {
    if [ -n "$1" ]; then
        echo "$1"
    else
        # Obter URL do Load Balancer
        ALB_DNS=$(aws elbv2 describe-load-balancers \
            --names $APP_NAME-alb \
            --query 'LoadBalancers[0].DNSName' \
            --output text \
            --region $AWS_REGION 2>/dev/null || echo "")
        
        if [ -n "$ALB_DNS" ] && [ "$ALB_DNS" != "None" ]; then
            echo "http://$ALB_DNS"
        else
            log_error "Não foi possível obter URL do Load Balancer"
            exit 1
        fi
    fi
}

health_check() {
    local url=$1
    local health_url="$url/health"
    
    log_info "Verificando health da aplicação: $health_url"
    
    for i in $(seq 1 $MAX_ATTEMPTS); do
        log_info "Tentativa $i de $MAX_ATTEMPTS..."
        
        if curl -f -s "$health_url" > /dev/null 2>&1; then
            log_info "✅ Health check passou!"
            return 0
        else
            if [ $i -eq $MAX_ATTEMPTS ]; then
                log_error "❌ Health check falhou após $MAX_ATTEMPTS tentativas"
                return 1
            else
                log_warn "Health check falhou, tentando novamente em ${WAIT_TIME}s..."
                sleep $WAIT_TIME
            fi
        fi
    done
}

smoke_tests() {
    local url=$1
    
    log_info "Executando smoke tests..."
    
    # Teste 1: Página principal
    if curl -f -s "$url" | grep -q "Couples Financials" > /dev/null 2>&1; then
        log_info "✅ Página principal carrega corretamente"
    else
        log_error "❌ Página principal falhou"
        return 1
    fi
    
    # Teste 2: Verificar se é SPA (sem erros 404)
    if curl -f -s "$url/auth" > /dev/null 2>&1; then
        log_info "✅ Roteamento SPA funcionando"
    else
        log_warn "⚠️  Roteamento SPA pode ter problemas"
    fi
    
    # Teste 3: Verificar recursos estáticos
    if curl -f -s "$url/assets/" > /dev/null 2>&1; then
        log_info "✅ Assets estáticos acessíveis"
    else
        log_warn "⚠️  Assets estáticos podem ter problemas"
    fi
    
    log_info "✅ Smoke tests concluídos"
}

service_status() {
    log_info "Verificando status do serviço ECS..."
    
    aws ecs describe-services \
        --cluster $APP_NAME-cluster \
        --services $APP_NAME \
        --region $AWS_REGION \
        --query 'services[0].{ServiceName:serviceName,Status:status,RunningCount:runningCount,DesiredCount:desiredCount,TaskDefinition:taskDefinition}' \
        --output table
}

logs_recent() {
    log_info "Últimos logs da aplicação:"
    
    aws logs tail /ecs/$APP_NAME \
        --region $AWS_REGION \
        --since 10m \
        --format short || log_warn "Não foi possível obter logs"
}

show_help() {
    echo "Script de health check para Couples Financials"
    echo ""
    echo "Uso: $0 [opções] [url]"
    echo ""
    echo "Opções:"
    echo "  --help              Mostrar esta ajuda"
    echo "  --health-only       Apenas health check"
    echo "  --smoke-only        Apenas smoke tests"
    echo "  --status-only       Apenas status do ECS"
    echo "  --logs              Mostrar logs recentes"
    echo "  --full              Verificação completa (padrão)"
    echo ""
    echo "Exemplo:"
    echo "  $0                           # Verificação completa"
    echo "  $0 --health-only             # Apenas health check"
    echo "  $0 http://example.com        # Health check em URL específica"
    echo ""
}

main() {
    local health_only=false
    local smoke_only=false
    local status_only=false
    local show_logs=false
    local url=""
    
    # Processar argumentos
    while [[ $# -gt 0 ]]; do
        case $1 in
            --help)
                show_help
                exit 0
                ;;
            --health-only)
                health_only=true
                shift
                ;;
            --smoke-only)
                smoke_only=true
                shift
                ;;
            --status-only)
                status_only=true
                shift
                ;;
            --logs)
                show_logs=true
                shift
                ;;
            --full)
                # Padrão - não precisa fazer nada
                shift
                ;;
            http*)
                url="$1"
                shift
                ;;
            *)
                log_error "Opção desconhecida: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    log_info "🏥 Iniciando health check do Couples Financials"
    
    # Status do serviço ECS
    if [ "$status_only" = true ] || [ "$health_only" = false ] && [ "$smoke_only" = false ]; then
        service_status
    fi
    
    # Health check
    if [ "$status_only" = false ]; then
        APP_URL=$(get_app_url "$url")
        
        if [ "$smoke_only" = false ]; then
            health_check "$APP_URL"
        fi
        
        if [ "$health_only" = false ]; then
            smoke_tests "$APP_URL"
        fi
        
        log_info "🌐 URL da aplicação: $APP_URL"
    fi
    
    # Logs recentes
    if [ "$show_logs" = true ]; then
        logs_recent
    fi
    
    log_info "✅ Health check concluído!"
}

# Executar função principal com todos os argumentos
main "$@"