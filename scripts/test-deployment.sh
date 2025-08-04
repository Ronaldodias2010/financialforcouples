#!/bin/bash

# Script para testar o deployment do Couples Financials
# Executa uma série de testes para verificar se a aplicação está funcionando corretamente

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
TIMEOUT=30

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_test() {
    echo -e "${BLUE}[TEST]${NC} $1"
}

get_application_url() {
    log_info "Obtendo URL da aplicação..."
    
    # Tentar obter URL do CloudFront primeiro
    CLOUDFRONT_URL=$(aws cloudfront list-distributions \
        --query "DistributionList.Items[?Comment=='CloudFront distribution for $APP_NAME'].DomainName" \
        --output text \
        --region $AWS_REGION 2>/dev/null || echo "")
    
    if [ -n "$CLOUDFRONT_URL" ] && [ "$CLOUDFRONT_URL" != "None" ]; then
        APP_URL="https://$CLOUDFRONT_URL"
        log_info "URL CloudFront encontrada: $APP_URL"
        return 0
    fi
    
    # Fallback para ALB
    ALB_DNS=$(aws elbv2 describe-load-balancers \
        --names $APP_NAME-alb \
        --query 'LoadBalancers[0].DNSName' \
        --output text \
        --region $AWS_REGION 2>/dev/null || echo "")
    
    if [ -n "$ALB_DNS" ] && [ "$ALB_DNS" != "None" ]; then
        APP_URL="http://$ALB_DNS"
        log_info "URL ALB encontrada: $APP_URL"
        return 0
    fi
    
    log_error "Não foi possível encontrar URL da aplicação"
    return 1
}

test_health_endpoint() {
    log_test "Testando endpoint de health..."
    
    local health_url="$APP_URL/health"
    local attempts=0
    local max_attempts=10
    
    while [ $attempts -lt $max_attempts ]; do
        if curl -f -s --max-time $TIMEOUT "$health_url" > /dev/null; then
            log_info "✅ Health check passou!"
            return 0
        fi
        
        attempts=$((attempts + 1))
        log_warn "Tentativa $attempts/$max_attempts falhou, aguardando..."
        sleep 30
    done
    
    log_error "❌ Health check falhou após $max_attempts tentativas"
    return 1
}

test_main_page() {
    log_test "Testando página principal..."
    
    local response=$(curl -s --max-time $TIMEOUT "$APP_URL" || echo "")
    
    if echo "$response" | grep -q "Couples Financials"; then
        log_info "✅ Página principal carregou com sucesso"
        return 0
    elif echo "$response" | grep -q "html"; then
        log_warn "⚠️  Página carregou mas conteúdo pode estar incorreto"
        return 0
    else
        log_error "❌ Página principal não carregou corretamente"
        return 1
    fi
}

test_static_assets() {
    log_test "Testando assets estáticos..."
    
    # Lista de assets comuns para testar
    local assets=(
        "/favicon.ico"
        "/manifest.json"
    )
    
    local success=0
    local total=${#assets[@]}
    
    for asset in "${assets[@]}"; do
        if curl -f -s --max-time $TIMEOUT "$APP_URL$asset" > /dev/null; then
            log_info "✅ Asset encontrado: $asset"
            success=$((success + 1))
        else
            log_warn "⚠️  Asset não encontrado: $asset"
        fi
    done
    
    if [ $success -gt 0 ]; then
        log_info "✅ $success/$total assets testados com sucesso"
        return 0
    else
        log_error "❌ Nenhum asset foi encontrado"
        return 1
    fi
}

test_spa_routing() {
    log_test "Testando roteamento SPA..."
    
    # Testar algumas rotas da aplicação
    local routes=(
        "/auth"
        "/accounts"
        "/cards"
    )
    
    local success=0
    
    for route in "${routes[@]}"; do
        local response=$(curl -s --max-time $TIMEOUT "$APP_URL$route" || echo "")
        
        if echo "$response" | grep -q "html"; then
            log_info "✅ Rota acessível: $route"
            success=$((success + 1))
        else
            log_warn "⚠️  Rota pode ter problemas: $route"
        fi
    done
    
    if [ $success -gt 0 ]; then
        log_info "✅ Roteamento SPA funcionando"
        return 0
    else
        log_warn "⚠️  Roteamento SPA pode ter problemas"
        return 1
    fi
}

test_ssl_certificate() {
    log_test "Testando certificado SSL..."
    
    if [[ "$APP_URL" == https://* ]]; then
        if curl -f -s --max-time $TIMEOUT "$APP_URL" > /dev/null; then
            log_info "✅ Certificado SSL válido"
            return 0
        else
            log_error "❌ Problema com certificado SSL"
            return 1
        fi
    else
        log_warn "⚠️  Aplicação não está usando HTTPS"
        return 1
    fi
}

test_performance() {
    log_test "Testando performance básica..."
    
    local start_time=$(date +%s%N)
    
    if curl -f -s --max-time $TIMEOUT "$APP_URL" > /dev/null; then
        local end_time=$(date +%s%N)
        local duration=$((($end_time - $start_time) / 1000000)) # em milissegundos
        
        if [ $duration -lt 5000 ]; then
            log_info "✅ Tempo de resposta: ${duration}ms (ótimo)"
        elif [ $duration -lt 10000 ]; then
            log_info "✅ Tempo de resposta: ${duration}ms (bom)"
        else
            log_warn "⚠️  Tempo de resposta: ${duration}ms (lento)"
        fi
        
        return 0
    else
        log_error "❌ Falha no teste de performance"
        return 1
    fi
}

test_aws_resources() {
    log_test "Verificando recursos AWS..."
    
    local tests_passed=0
    
    # Testar ECS Service
    if aws ecs describe-services \
        --cluster $APP_NAME-cluster \
        --services $APP_NAME \
        --region $AWS_REGION \
        --query 'services[0].status' \
        --output text | grep -q "ACTIVE"; then
        log_info "✅ ECS Service ativo"
        tests_passed=$((tests_passed + 1))
    else
        log_error "❌ ECS Service não está ativo"
    fi
    
    # Testar ALB
    if aws elbv2 describe-load-balancers \
        --names $APP_NAME-alb \
        --region $AWS_REGION \
        --query 'LoadBalancers[0].State.Code' \
        --output text | grep -q "active"; then
        log_info "✅ Load Balancer ativo"
        tests_passed=$((tests_passed + 1))
    else
        log_error "❌ Load Balancer não está ativo"
    fi
    
    # Testar Target Group Health
    local tg_arn=$(aws elbv2 describe-target-groups \
        --names $APP_NAME-tg \
        --region $AWS_REGION \
        --query 'TargetGroups[0].TargetGroupArn' \
        --output text 2>/dev/null || echo "")
    
    if [ -n "$tg_arn" ] && [ "$tg_arn" != "None" ]; then
        local healthy_targets=$(aws elbv2 describe-target-health \
            --target-group-arn "$tg_arn" \
            --region $AWS_REGION \
            --query 'TargetHealthDescriptions[?TargetHealth.State==`healthy`]' \
            --output text | wc -l)
        
        if [ "$healthy_targets" -gt 0 ]; then
            log_info "✅ $healthy_targets target(s) saudável(is)"
            tests_passed=$((tests_passed + 1))
        else
            log_error "❌ Nenhum target saudável encontrado"
        fi
    else
        log_warn "⚠️  Target Group não encontrado"
    fi
    
    return $tests_passed
}

generate_report() {
    log_info "📊 Gerando relatório de testes..."
    
    local report_file="test-report-$(date +%Y%m%d-%H%M%S).txt"
    
    cat > "$report_file" << EOF
# Relatório de Testes - Couples Financials
Data: $(date)
URL da Aplicação: $APP_URL

## Resumo dos Testes
- Total de testes: $TOTAL_TESTS
- Testes passou: $TESTS_PASSED
- Testes falhou: $TESTS_FAILED
- Taxa de sucesso: $(( TESTS_PASSED * 100 / TOTAL_TESTS ))%

## Status dos Recursos AWS
$(test_aws_resources 2>&1)

## Recomendações
EOF
    
    if [ $TESTS_FAILED -gt 0 ]; then
        cat >> "$report_file" << EOF
- Revisar logs do CloudWatch: https://console.aws.amazon.com/cloudwatch/
- Verificar status do ECS: https://console.aws.amazon.com/ecs/
- Monitorar métricas do ALB: https://console.aws.amazon.com/ec2/v2/home#LoadBalancers
EOF
    else
        cat >> "$report_file" << EOF
- Aplicação está funcionando corretamente
- Considerar configurar monitoramento adicional
- Revisar logs periodicamente
EOF
    fi
    
    log_info "📄 Relatório salvo em: $report_file"
}

show_help() {
    echo "Script de teste para deployment do Couples Financials"
    echo ""
    echo "Uso: $0 [opções]"
    echo ""
    echo "Opções:"
    echo "  --help          Mostrar esta ajuda"
    echo "  --url URL       Usar URL específica para testes"
    echo "  --quick         Executar apenas testes básicos"
    echo "  --report        Gerar relatório detalhado"
    echo ""
}

main() {
    local quick_mode=false
    local generate_report_flag=false
    local custom_url=""
    
    # Processar argumentos
    while [[ $# -gt 0 ]]; do
        case $1 in
            --help)
                show_help
                exit 0
                ;;
            --url)
                custom_url="$2"
                shift 2
                ;;
            --quick)
                quick_mode=true
                shift
                ;;
            --report)
                generate_report_flag=true
                shift
                ;;
            *)
                log_error "Opção desconhecida: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    log_info "🧪 Iniciando testes do Couples Financials"
    
    # Obter URL da aplicação
    if [ -n "$custom_url" ]; then
        APP_URL="$custom_url"
        log_info "Usando URL personalizada: $APP_URL"
    else
        if ! get_application_url; then
            log_error "Não foi possível obter URL da aplicação"
            exit 1
        fi
    fi
    
    # Contadores de teste
    TOTAL_TESTS=0
    TESTS_PASSED=0
    TESTS_FAILED=0
    
    # Executar testes
    tests=(
        "test_health_endpoint"
        "test_main_page"
        "test_static_assets"
    )
    
    if [ "$quick_mode" = false ]; then
        tests+=(
            "test_spa_routing"
            "test_ssl_certificate"
            "test_performance"
        )
    fi
    
    for test in "${tests[@]}"; do
        TOTAL_TESTS=$((TOTAL_TESTS + 1))
        
        if $test; then
            TESTS_PASSED=$((TESTS_PASSED + 1))
        else
            TESTS_FAILED=$((TESTS_FAILED + 1))
        fi
        echo
    done
    
    # Resultados
    echo "════════════════════════════════════════"
    log_info "📊 Resultados dos Testes"
    log_info "Total: $TOTAL_TESTS | Passou: $TESTS_PASSED | Falhou: $TESTS_FAILED"
    
    if [ $TESTS_FAILED -eq 0 ]; then
        log_info "🎉 Todos os testes passaram!"
        log_info "Aplicação está funcionando corretamente: $APP_URL"
    else
        log_warn "⚠️  Alguns testes falharam. Revisar logs e configurações."
    fi
    
    if [ "$generate_report_flag" = true ]; then
        generate_report
    fi
    
    # Exit code baseado nos resultados
    exit $TESTS_FAILED
}

# Executar função principal com todos os argumentos
main "$@"