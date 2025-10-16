#!/bin/bash

# Script para validar configuração completa de ambos domínios

set -e

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Validação de Domínios${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Domínios
DOMAIN1="couplesfinancials.com"
DOMAIN2="couplesfin.com"
EXPECTED_IP="34.107.231.152"

# Função para testar DNS
test_dns() {
    local domain=$1
    echo -e "${YELLOW}Testando DNS: $domain${NC}"
    
    local resolved_ip=$(nslookup $domain 8.8.8.8 | grep -A1 "Name:" | grep "Address:" | awk '{print $2}' | head -1)
    
    if [ "$resolved_ip" = "$EXPECTED_IP" ]; then
        echo -e "${GREEN}✓ DNS correto: $resolved_ip${NC}"
        return 0
    else
        echo -e "${RED}✗ DNS incorreto: $resolved_ip (esperado: $EXPECTED_IP)${NC}"
        return 1
    fi
}

# Função para testar HTTP
test_http() {
    local domain=$1
    echo -e "${YELLOW}Testando HTTP: $domain${NC}"
    
    local status=$(curl -s -o /dev/null -w "%{http_code}" -L "http://$domain" --max-time 10)
    
    if [ "$status" = "200" ] || [ "$status" = "301" ] || [ "$status" = "302" ]; then
        echo -e "${GREEN}✓ HTTP funciona: $status${NC}"
        return 0
    else
        echo -e "${RED}✗ HTTP falhou: $status${NC}"
        return 1
    fi
}

# Função para testar HTTPS
test_https() {
    local domain=$1
    echo -e "${YELLOW}Testando HTTPS: $domain${NC}"
    
    local status=$(curl -s -o /dev/null -w "%{http_code}" "https://$domain" --max-time 10)
    
    if [ "$status" = "200" ]; then
        echo -e "${GREEN}✓ HTTPS funciona: $status${NC}"
        
        # Verificar certificado SSL
        local cert_valid=$(echo | openssl s_client -servername $domain -connect $domain:443 2>/dev/null | openssl x509 -noout -dates 2>/dev/null)
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✓ Certificado SSL válido${NC}"
        fi
        return 0
    else
        echo -e "${RED}✗ HTTPS falhou: $status${NC}"
        return 1
    fi
}

# Teste completo
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Testando: $DOMAIN1${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
test_dns $DOMAIN1
test_http $DOMAIN1
test_https $DOMAIN1

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Testando: $DOMAIN2${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
test_dns $DOMAIN2
test_http $DOMAIN2
test_https $DOMAIN2

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Verificação de Certificado GCP${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if command -v gcloud &> /dev/null; then
    CERT_STATUS=$(gcloud compute ssl-certificates describe couples-financials-ssl-cert --global --format="value(managed.status)" 2>/dev/null || echo "NOT_FOUND")
    CERT_DOMAINS=$(gcloud compute ssl-certificates describe couples-financials-ssl-cert --global --format="value(managed.domains)" 2>/dev/null || echo "N/A")
    
    echo -e "Status: ${GREEN}$CERT_STATUS${NC}"
    echo -e "Domínios: ${BLUE}$CERT_DOMAINS${NC}"
else
    echo -e "${YELLOW}gcloud não instalado - pule esta verificação${NC}"
fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}Validação completa!${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
