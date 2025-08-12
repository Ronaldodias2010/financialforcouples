#!/bin/bash

# Script para testar a página 503 localmente
# Executa um servidor HTTP temporário e testa a página 503

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
    log_info "Testando página 503.html..."
    
    # Verificar se arquivo existe
    if [ ! -f "public/503.html" ]; then
        log_error "Arquivo public/503.html não encontrado!"
        return 1
    fi
    
    # Verificar se tem conteúdo
    if [ ! -s "public/503.html" ]; then
        log_error "Arquivo public/503.html está vazio!"
        return 1
    fi
    
    # Verificar se contém HTML válido
    if ! grep -q "<!DOCTYPE html>" "public/503.html"; then
        log_error "Arquivo public/503.html não parece ser HTML válido!"
        return 1
    fi
    
    # Verificar se contém o conteúdo esperado
    if ! grep -q "Couples Financials" "public/503.html"; then
        log_error "Arquivo public/503.html não contém 'Couples Financials'!"
        return 1
    fi
    
    log_info "✅ Arquivo 503.html parece estar correto"
    return 0
}

start_local_server() {
    log_info "Iniciando servidor local para testar página 503..."
    
    # Porta para o servidor
    local port=8503
    
    # Verificar se porta está livre
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        log_warn "Porta $port já está em uso, parando processo..."
        kill $(lsof -t -i:$port) 2>/dev/null || true
        sleep 2
    fi
    
    # Criar servidor Python simples
    cd public
    python3 -m http.server $port > /dev/null 2>&1 &
    local server_pid=$!
    cd ..
    
    log_info "Servidor iniciado na porta $port (PID: $server_pid)"
    
    # Aguardar servidor iniciar
    sleep 2
    
    # Testar se servidor está respondendo
    if curl -f -s "http://localhost:$port/503.html" > /dev/null; then
        log_info "✅ Servidor respondendo corretamente"
        log_info "🌐 Acesse: http://localhost:$port/503.html"
        
        # Mostrar preview do conteúdo
        log_info "Preview da página:"
        curl -s "http://localhost:$port/503.html" | head -5
        
        # Manter servidor rodando por alguns segundos
        log_info "Servidor ficará ativo por 30 segundos para testes..."
        sleep 30
        
        # Parar servidor
        kill $server_pid 2>/dev/null || true
        log_info "Servidor parado"
        
        return 0
    else
        log_error "❌ Servidor não está respondendo"
        kill $server_pid 2>/dev/null || true
        return 1
    fi
}

test_nginx_config() {
    log_info "Testando configuração nginx..."
    
    # Verificar sintaxe do nginx.conf
    if command -v nginx >/dev/null 2>&1; then
        if nginx -t -c "$(pwd)/nginx.conf" 2>/dev/null; then
            log_info "✅ Configuração nginx.conf válida"
        else
            log_warn "⚠️  Problemas na configuração nginx.conf"
        fi
        
        if nginx -t -c "$(pwd)/nginx-proxy.conf" 2>/dev/null; then
            log_info "✅ Configuração nginx-proxy.conf válida"
        else
            log_warn "⚠️  Problemas na configuração nginx-proxy.conf"
        fi
    else
        log_warn "⚠️  Nginx não instalado, pulando validação de configuração"
    fi
}

simulate_503_error() {
    log_info "Simulando erro 503 com Docker..."
    
    if command -v docker >/dev/null 2>&1; then
        # Construir e testar com Docker
        log_info "Construindo imagem Docker..."
        if docker build -t couples-financials-test . > /dev/null 2>&1; then
            log_info "✅ Build Docker bem-sucedido"
            
            # Executar container temporário
            log_info "Executando container temporário..."
            docker run -d --name test-503 -p 8080:80 couples-financials-test
            
            # Aguardar container iniciar
            sleep 5
            
            # Testar página 503
            if curl -f -s "http://localhost:8080/503.html" > /dev/null; then
                log_info "✅ Página 503 acessível via Docker"
            else
                log_warn "⚠️  Página 503 não acessível via Docker"
            fi
            
            # Limpar container
            docker stop test-503 > /dev/null 2>&1
            docker rm test-503 > /dev/null 2>&1
            
        else
            log_warn "⚠️  Falha no build Docker"
        fi
    else
        log_warn "⚠️  Docker não disponível, pulando teste de container"
    fi
}

show_help() {
    echo "Script para testar página 503 localmente"
    echo ""
    echo "Uso: $0 [opções]"
    echo ""
    echo "Opções:"
    echo "  --help        Mostrar esta ajuda"
    echo "  --serve       Apenas iniciar servidor HTTP"
    echo "  --nginx       Apenas testar configuração nginx"
    echo "  --docker      Apenas testar com Docker"
    echo "  --full        Executar todos os testes (padrão)"
    echo ""
}

main() {
    local serve_only=false
    local nginx_only=false
    local docker_only=false
    
    # Processar argumentos
    while [[ $# -gt 0 ]]; do
        case $1 in
            --help)
                show_help
                exit 0
                ;;
            --serve)
                serve_only=true
                shift
                ;;
            --nginx)
                nginx_only=true
                shift
                ;;
            --docker)
                docker_only=true
                shift
                ;;
            --full)
                # Padrão - todos os testes
                shift
                ;;
            *)
                log_error "Opção desconhecida: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    log_info "🔧 Testando página 503 do Couples Financials"
    
    if [ "$serve_only" = true ]; then
        test_503_page && start_local_server
    elif [ "$nginx_only" = true ]; then
        test_nginx_config
    elif [ "$docker_only" = true ]; then
        simulate_503_error
    else
        # Teste completo
        test_503_page
        test_nginx_config
        start_local_server
        simulate_503_error
    fi
    
    log_info "✅ Testes da página 503 concluídos!"
}

# Executar função principal
main "$@"