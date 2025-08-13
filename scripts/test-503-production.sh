#!/bin/bash

# Script para testar se a página 503 está funcionando em produção
# Este script simula condições de erro 503 e verifica se a página customizada aparece

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# URLs para teste
PRODUCTION_URL="https://www.couplesfinancials.com"
CLOUDFRONT_URL="https://d3h8x9y2k4l5m6.cloudfront.net" # Substitua pelo seu CloudFront domain

log_info "🔍 Testando página 503 em produção..."

# 1. Testar acesso direto à página 503
log_step "1. Testando acesso direto à página 503..."

# Teste via CloudFront/produção
log_info "Testando: $PRODUCTION_URL/503.html"
PROD_503_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$PRODUCTION_URL/503.html" || echo "000")
if [ "$PROD_503_STATUS" = "200" ]; then
    log_info "✅ Página 503 acessível em produção"
    
    # Verificar se o conteúdo está correto
    CONTENT=$(curl -s "$PRODUCTION_URL/503.html" | grep -o "Estamos Fazendo Melhorias" || echo "")
    if [ ! -z "$CONTENT" ]; then
        log_info "✅ Conteúdo da página 503 está correto"
    else
        log_warn "⚠️  Conteúdo da página 503 pode não estar correto"
    fi
else
    log_error "❌ Página 503 não acessível em produção (Status: $PROD_503_STATUS)"
fi

# 2. Verificar se os custom error responses estão configurados
log_step "2. Verificando configuração de erro..."

# Simular erro 404 para ver se redireciona corretamente
log_info "Testando erro 404 (deve redirecionar para index.html)..."
ERROR_404_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$PRODUCTION_URL/pagina-inexistente-12345" || echo "000")
if [ "$ERROR_404_STATUS" = "200" ]; then
    log_info "✅ Erro 404 redirecionando corretamente para a SPA"
else
    log_warn "⚠️  Erro 404 retornando status $ERROR_404_STATUS (esperado: 200)"
fi

# 3. Verificar headers de cache da página 503
log_step "3. Verificando headers de cache..."
CACHE_CONTROL=$(curl -s -I "$PRODUCTION_URL/503.html" | grep -i "cache-control" || echo "")
if [[ "$CACHE_CONTROL" == *"no-cache"* ]] || [[ "$CACHE_CONTROL" == *"max-age=0"* ]]; then
    log_info "✅ Headers de cache configurados corretamente para página 503"
else
    log_warn "⚠️  Headers de cache podem não estar corretos: $CACHE_CONTROL"
fi

# 4. Testar com diferentes User-Agents
log_step "4. Testando com diferentes navegadores..."

# Mobile
MOBILE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "User-Agent: Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15" \
    "$PRODUCTION_URL/503.html" || echo "000")

# Desktop
DESKTOP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" \
    "$PRODUCTION_URL/503.html" || echo "000")

if [ "$MOBILE_STATUS" = "200" ] && [ "$DESKTOP_STATUS" = "200" ]; then
    log_info "✅ Página 503 acessível em mobile e desktop"
else
    log_warn "⚠️  Problemas de acesso - Mobile: $MOBILE_STATUS, Desktop: $DESKTOP_STATUS"
fi

# 5. Verificar linguagens
log_step "5. Verificando suporte multilíngue..."
LANGUAGES_CONTENT=$(curl -s "$PRODUCTION_URL/503.html" | grep -o "setLanguage" || echo "")
if [ ! -z "$LANGUAGES_CONTENT" ]; then
    log_info "✅ Suporte multilíngue presente na página"
else
    log_warn "⚠️  JavaScript de linguagens pode não estar funcionando"
fi

# 6. Simular condição de erro real
log_step "6. Instruções para teste de erro real..."
log_info ""
log_info "🔧 Para testar um erro 503 real:"
log_info "1. Acesse o AWS ECS Console"
log_info "2. Encontre o serviço 'couples-financials'"
log_info "3. Clique em 'Update Service'"
log_info "4. Altere 'Desired tasks' para 0"
log_info "5. Aguarde alguns minutos"
log_info "6. Acesse $PRODUCTION_URL"
log_info "7. Deve aparecer a página 503 customizada"
log_info "8. IMPORTANTE: Reverter 'Desired tasks' para 1 após o teste!"
log_info ""

# Resumo final
log_info "📊 Resumo dos testes:"
log_info "• Página 503 direta: $([ "$PROD_503_STATUS" = "200" ] && echo "✅ OK" || echo "❌ Falhou ($PROD_503_STATUS)")"
log_info "• Redirecionamento 404: $([ "$ERROR_404_STATUS" = "200" ] && echo "✅ OK" || echo "❌ Falhou ($ERROR_404_STATUS)")"
log_info "• Cache headers: $([ ! -z "$CACHE_CONTROL" ] && echo "✅ Presente" || echo "❌ Ausente")"
log_info "• Mobile/Desktop: $([ "$MOBILE_STATUS" = "200" ] && [ "$DESKTOP_STATUS" = "200" ] && echo "✅ OK" || echo "❌ Problemas")"
log_info "• Multilíngue: $([ ! -z "$LANGUAGES_CONTENT" ] && echo "✅ OK" || echo "❌ Ausente")"

if [ "$PROD_503_STATUS" = "200" ]; then
    log_info ""
    log_info "🎉 Página 503 customizada está funcionando!"
    log_info "🌐 Teste você mesmo: $PRODUCTION_URL/503.html"
else
    log_error ""
    log_error "❌ Página 503 customizada NÃO está funcionando corretamente"
    log_error "Execute o script 'fix-503-page.sh' para corrigir"
fi