#!/bin/bash

# Script para testar a página 503 localmente
# Uso: ./scripts/test-503-page.sh

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

test_503_page() {
    log_info "🧪 Testando página 503 customizada..."
    
    # Verificar se o arquivo existe
    if [ ! -f "public/503.html" ]; then
        log_error "❌ Arquivo public/503.html não encontrado!"
        exit 1
    fi
    
    log_info "✅ Arquivo 503.html encontrado"
    
    # Verificar conteúdo básico
    if grep -q "Couples Financials" public/503.html; then
        log_info "✅ Conteúdo da página contém marca Couples Financials"
    else
        log_error "❌ Página não contém marca Couples Financials"
        exit 1
    fi
    
    # Verificar suporte multilíngue
    if grep -q "content-pt\|content-en\|content-es" public/503.html; then
        log_info "✅ Página tem suporte multilíngue"
    else
        log_warn "⚠️  Página pode não ter suporte multilíngue completo"
    fi
    
    # Verificar função de auto-retry
    if grep -q "setInterval" public/503.html; then
        log_info "✅ Página tem função de auto-retry"
    else
        log_warn "⚠️  Página pode não ter função de auto-retry"
    fi
    
    log_info "🎉 Teste da página 503 concluído com sucesso!"
}

test_nginx_config() {
    log_info "🔧 Testando configurações do nginx..."
    
    # Verificar nginx.conf
    if [ -f "nginx.conf" ]; then
        if grep -q "error_page.*503" nginx.conf; then
            log_info "✅ nginx.conf configurado para página 503 customizada"
        else
            log_warn "⚠️  nginx.conf pode não estar configurado para página 503"
        fi
    else
        log_error "❌ nginx.conf não encontrado"
        exit 1
    fi
    
    # Verificar nginx-proxy.conf
    if [ -f "nginx-proxy.conf" ]; then
        if grep -q "error_page.*503" nginx-proxy.conf; then
            log_info "✅ nginx-proxy.conf configurado para página 503 customizada"
        else
            log_warn "⚠️  nginx-proxy.conf pode não estar configurado para página 503"
        fi
    else
        log_warn "⚠️  nginx-proxy.conf não encontrado"
    fi
}

test_docker_config() {
    log_info "🐳 Testando configurações do Docker..."
    
    # Verificar Dockerfile
    if [ -f "Dockerfile" ]; then
        if grep -q "503.html" Dockerfile; then
            log_info "✅ Dockerfile configurado para copiar página 503"
        else
            log_warn "⚠️  Dockerfile pode não copiar página 503"
        fi
    else
        log_error "❌ Dockerfile não encontrado"
        exit 1
    fi
    
    # Verificar docker-compose.yml
    if [ -f "docker-compose.yml" ]; then
        if grep -q "503.html" docker-compose.yml; then
            log_info "✅ docker-compose.yml configurado para montar página 503"
        else
            log_warn "⚠️  docker-compose.yml pode não montar página 503"
        fi
    else
        log_warn "⚠️  docker-compose.yml não encontrado"
    fi
}

simulate_503_locally() {
    log_info "🎭 Simulando erro 503 localmente..."
    
    # Verificar se o Python está disponível para servir arquivos
    if command -v python3 &> /dev/null; then
        log_info "Iniciando servidor local para testar página 503..."
        
        # Navegar para o diretório public
        cd public
        
        # Iniciar servidor Python simples em background
        python3 -m http.server 8000 > /dev/null 2>&1 &
        local server_pid=$!
        
        # Aguardar servidor iniciar
        sleep 2
        
        # Testar se a página está acessível
        if curl -f -s "http://localhost:8000/503.html" > /dev/null 2>&1; then
            log_info "✅ Página 503 acessível em http://localhost:8000/503.html"
            log_info "🌐 Abra no navegador para ver o resultado"
            
            # Mostrar preview das primeiras linhas
            log_info "Preview da página:"
            curl -s "http://localhost:8000/503.html" | head -10 | grep -E "(title|h1)" || echo "Preview não disponível"
            
            # Manter servidor por 30 segundos
            log_info "Servidor ficará ativo por 30 segundos..."
            sleep 30
            
        else
            log_error "❌ Não foi possível acessar a página 503"
        fi
        
        # Parar servidor
        kill $server_pid 2>/dev/null || true
        cd ..
        
    elif command -v python &> /dev/null; then
        log_info "Iniciando servidor local para testar página 503..."
        
        cd public
        python -m SimpleHTTPServer 8000 > /dev/null 2>&1 &
        local server_pid=$!
        
        sleep 2
        
        if curl -f -s "http://localhost:8000/503.html" > /dev/null 2>&1; then
            log_info "✅ Página 503 acessível em http://localhost:8000/503.html"
            sleep 30
        else
            log_error "❌ Não foi possível acessar a página 503"
        fi
        
        kill $server_pid 2>/dev/null || true
        cd ..
        
    else
        log_warn "Python não está disponível. Instale Python para testar localmente."
        log_info "Alternativamente, abra public/503.html diretamente no navegador"
        
        # Tentar abrir no navegador se estiver no macOS/Linux
        if [[ "$OSTYPE" == "darwin"* ]]; then
            open "public/503.html"
        elif command -v xdg-open &> /dev/null; then
            xdg-open "public/503.html"
        fi
    fi
}

show_help() {
    echo "Script de teste para página 503 customizada"
    echo ""
    echo "Uso: $0 [opções]"
    echo ""
    echo "Opções:"
    echo "  --help          Mostrar esta ajuda"
    echo "  --page-only     Testar apenas a página 503"
    echo "  --config-only   Testar apenas configurações"
    echo "  --serve         Servir página localmente para teste"
    echo "  --full          Teste completo (padrão)"
    echo ""
    echo "Exemplo:"
    echo "  $0              # Teste completo"
    echo "  $0 --serve      # Servir página para teste no navegador"
    echo ""
}

main() {
    local page_only=false
    local config_only=false
    local serve=false
    
    # Processar argumentos
    while [[ $# -gt 0 ]]; do
        case $1 in
            --help)
                show_help
                exit 0
                ;;
            --page-only)
                page_only=true
                shift
                ;;
            --config-only)
                config_only=true
                shift
                ;;
            --serve)
                serve=true
                shift
                ;;
            --full)
                # Padrão - não precisa fazer nada
                shift
                ;;
            *)
                log_error "Opção desconhecida: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    log_info "🚀 Iniciando teste da página 503"
    
    if [ "$serve" = true ]; then
        simulate_503_locally
        exit 0
    fi
    
    if [ "$config_only" = false ]; then
        test_503_page
    fi
    
    if [ "$page_only" = false ]; then
        test_nginx_config
        test_docker_config
    fi
    
    log_info "✅ Todos os testes concluídos!"
    log_info "💡 Para testar no navegador, execute: $0 --serve"
}

# Executar função principal com todos os argumentos
main "$@"