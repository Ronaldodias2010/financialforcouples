#!/bin/bash

# Script de Diagnóstico Completo - DNS e SSL
# Este script verifica toda a configuração de domínio e SSL

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}==================================================${NC}"
echo -e "${BLUE}  Diagnóstico DNS e SSL - Couples Financials${NC}"
echo -e "${BLUE}==================================================${NC}\n"

# Variáveis
PRIMARY_DOMAIN="couplesfinancials.com"
SECONDARY_DOMAIN="couplesfin.com"
EXPECTED_IP="34.107.231.152"
PROJECT_ID="couplesfinancials"
REGION="us-central1"
APP_NAME="couples-financials"

# Função para verificar DNS
check_dns() {
    local domain=$1
    echo -e "\n${YELLOW}[DNS] Verificando $domain...${NC}"
    
    # Usar diferentes servidores DNS
    for dns_server in "8.8.8.8" "1.1.1.1" "8.8.4.4"; do
        echo -e "${BLUE}  → Consultando $dns_server${NC}"
        result=$(nslookup $domain $dns_server 2>/dev/null | grep -A1 "Name:" | tail -1 | awk '{print $2}' || echo "ERRO")
        
        if [ "$result" == "$EXPECTED_IP" ]; then
            echo -e "    ${GREEN}✓ OK: $result${NC}"
        elif [ "$result" == "ERRO" ]; then
            echo -e "    ${RED}✗ ERRO: Não foi possível resolver${NC}"
        else
            echo -e "    ${RED}✗ INCORRETO: $result (esperado: $EXPECTED_IP)${NC}"
        fi
    done
}

# Função para verificar HTTP/HTTPS
check_http() {
    local domain=$1
    echo -e "\n${YELLOW}[HTTP] Testando http://$domain...${NC}"
    
    http_code=$(curl -s -o /dev/null -w "%{http_code}" -L --max-time 10 "http://$domain" 2>/dev/null || echo "ERRO")
    
    if [ "$http_code" == "200" ] || [ "$http_code" == "301" ] || [ "$http_code" == "302" ]; then
        echo -e "  ${GREEN}✓ HTTP funciona (código: $http_code)${NC}"
    else
        echo -e "  ${RED}✗ HTTP falhou (código: $http_code)${NC}"
    fi
}

check_https() {
    local domain=$1
    echo -e "\n${YELLOW}[HTTPS] Testando https://$domain...${NC}"
    
    https_code=$(curl -s -o /dev/null -w "%{http_code}" -L --max-time 10 "https://$domain" 2>/dev/null || echo "ERRO")
    
    if [ "$https_code" == "200" ]; then
        echo -e "  ${GREEN}✓ HTTPS funciona (código: $https_code)${NC}"
        
        # Verificar certificado SSL
        echo -e "${BLUE}  → Verificando certificado SSL...${NC}"
        ssl_info=$(echo | openssl s_client -servername $domain -connect $domain:443 2>/dev/null | openssl x509 -noout -subject -dates 2>/dev/null || echo "ERRO")
        
        if [ "$ssl_info" != "ERRO" ]; then
            echo -e "    ${GREEN}✓ Certificado válido${NC}"
            echo "$ssl_info" | sed 's/^/    /'
        else
            echo -e "    ${RED}✗ Erro ao verificar certificado${NC}"
        fi
    else
        echo -e "  ${RED}✗ HTTPS falhou (código: $https_code)${NC}"
    fi
}

# Função para verificar GCP
check_gcp() {
    echo -e "\n${YELLOW}[GCP] Verificando configuração no Google Cloud...${NC}"
    
    # Verificar se está autenticado
    if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" > /dev/null 2>&1; then
        echo -e "${RED}✗ Não autenticado no GCP. Execute: gcloud auth login${NC}"
        return 1
    fi
    
    echo -e "${GREEN}✓ Autenticado no GCP${NC}"
    
    # Verificar Load Balancer IP
    echo -e "\n${BLUE}  → Verificando IP do Load Balancer...${NC}"
    lb_ip=$(gcloud compute addresses list --filter="name:${APP_NAME}-ip" --format="value(address)" 2>/dev/null || echo "ERRO")
    
    if [ "$lb_ip" == "$EXPECTED_IP" ]; then
        echo -e "    ${GREEN}✓ IP correto: $lb_ip${NC}"
    else
        echo -e "    ${RED}✗ IP incorreto ou não encontrado: $lb_ip${NC}"
        echo -e "    ${YELLOW}  Esperado: $EXPECTED_IP${NC}"
    fi
    
    # Verificar Certificado SSL
    echo -e "\n${BLUE}  → Verificando certificado SSL gerenciado...${NC}"
    ssl_status=$(gcloud compute ssl-certificates describe ${APP_NAME}-ssl-cert --global --format="value(managed.status)" 2>/dev/null || echo "NAO_ENCONTRADO")
    
    case $ssl_status in
        "ACTIVE")
            echo -e "    ${GREEN}✓ Certificado ATIVO${NC}"
            ;;
        "PROVISIONING")
            echo -e "    ${YELLOW}⏳ Certificado em PROVISIONAMENTO (aguarde 15 min)${NC}"
            ;;
        "FAILED_NOT_VISIBLE")
            echo -e "    ${RED}✗ Certificado FALHOU - DNS não visível${NC}"
            echo -e "    ${YELLOW}  SOLUÇÃO: Deletar e recriar certificado${NC}"
            ;;
        "NAO_ENCONTRADO")
            echo -e "    ${RED}✗ Certificado NÃO ENCONTRADO${NC}"
            echo -e "    ${YELLOW}  SOLUÇÃO: Executar terraform apply${NC}"
            ;;
        *)
            echo -e "    ${YELLOW}⚠ Status desconhecido: $ssl_status${NC}"
            ;;
    esac
    
    # Verificar domínios no certificado
    if [ "$ssl_status" != "NAO_ENCONTRADO" ]; then
        echo -e "\n${BLUE}  → Domínios no certificado:${NC}"
        gcloud compute ssl-certificates describe ${APP_NAME}-ssl-cert --global --format="value(managed.domains)" 2>/dev/null | tr ';' '\n' | sed 's/^/    /'
    fi
    
    # Verificar Forwarding Rules
    echo -e "\n${BLUE}  → Verificando Forwarding Rules...${NC}"
    
    https_rule=$(gcloud compute forwarding-rules list --filter="name:${APP_NAME}-https-rule" --format="value(IPAddress)" 2>/dev/null || echo "NAO_ENCONTRADO")
    http_rule=$(gcloud compute forwarding-rules list --filter="name:${APP_NAME}-http-rule" --format="value(IPAddress)" 2>/dev/null || echo "NAO_ENCONTRADO")
    
    if [ "$https_rule" == "$EXPECTED_IP" ]; then
        echo -e "    ${GREEN}✓ HTTPS Rule: $https_rule${NC}"
    else
        echo -e "    ${RED}✗ HTTPS Rule não encontrada ou incorreta: $https_rule${NC}"
    fi
    
    if [ "$http_rule" == "$EXPECTED_IP" ]; then
        echo -e "    ${GREEN}✓ HTTP Rule: $http_rule${NC}"
    else
        echo -e "    ${RED}✗ HTTP Rule não encontrada ou incorreta: $http_rule${NC}"
    fi
}

# Executar diagnósticos
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}1. VERIFICAÇÃO DE DNS${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

check_dns $PRIMARY_DOMAIN
check_dns $SECONDARY_DOMAIN

echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}2. VERIFICAÇÃO DE CONECTIVIDADE${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

check_http $PRIMARY_DOMAIN
check_https $PRIMARY_DOMAIN
check_http $SECONDARY_DOMAIN
check_https $SECONDARY_DOMAIN

echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}3. VERIFICAÇÃO GCP${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

check_gcp

# Resumo e próximos passos
echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}RESUMO E PRÓXIMOS PASSOS${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

echo -e "${YELLOW}Se DNS está INCORRETO:${NC}"
echo -e "  1. Acesse seu provedor de DNS (GoDaddy, Cloudflare, etc.)"
echo -e "  2. Adicione/edite registro A:"
echo -e "     Type: A"
echo -e "     Name: @ (ou deixe em branco)"
echo -e "     Value: $EXPECTED_IP"
echo -e "     TTL: 600"
echo -e "  3. Execute: ./scripts/fix-ssl-certificate.sh"

echo -e "\n${YELLOW}Se Certificado SSL está FAILED_NOT_VISIBLE:${NC}"
echo -e "  1. Execute: ./scripts/fix-ssl-certificate.sh"

echo -e "\n${YELLOW}Se Load Balancer não existe:${NC}"
echo -e "  1. cd terraform-gcp"
echo -e "  2. terraform apply -auto-approve"

echo -e "\n${YELLOW}Comandos úteis:${NC}"
echo -e "  • Ver logs LB: gcloud logging read 'resource.type=http_load_balancer' --limit 20"
echo -e "  • Ver status SSL: gcloud compute ssl-certificates list"
echo -e "  • Invalidar cache: gcloud compute url-maps invalidate-cdn-cache ${APP_NAME}-url-map --path='/*'"

echo -e "\n${GREEN}Diagnóstico completo!${NC}\n"
