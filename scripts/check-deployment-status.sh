#!/bin/bash

# Script para verificar status do deployment completo

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PROJECT_ID="${GCP_PROJECT_ID:-couplesfinancials}"
REGION="us-central1"
SERVICE_NAME="couples-financials"
DOMAINS=("couplesfinancials.com" "couplesfin.com")

echo -e "${BLUE}=== Status do Deployment ===${NC}"
echo -e "${YELLOW}Projeto: ${PROJECT_ID}${NC}"
echo -e "${YELLOW}Região: ${REGION}${NC}\n"

# 1. Verificar Cloud Run
echo -e "${BLUE}[1/6] Verificando Cloud Run Service...${NC}"
if gcloud run services describe ${SERVICE_NAME} --region=${REGION} --project=${PROJECT_ID} &> /dev/null; then
    SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} --region=${REGION} --project=${PROJECT_ID} --format="value(status.url)")
    echo -e "${GREEN}✅ Cloud Run ativo${NC}"
    echo -e "   URL: ${SERVICE_URL}"
    
    # Testar endpoint
    if curl -s -o /dev/null -w "%{http_code}" "${SERVICE_URL}" | grep -q "200\|301\|302"; then
        echo -e "${GREEN}✅ Service respondendo${NC}"
    else
        echo -e "${RED}❌ Service não responde corretamente${NC}"
    fi
else
    echo -e "${RED}❌ Cloud Run service não encontrado${NC}"
fi

# 2. Verificar Load Balancer
echo -e "\n${BLUE}[2/6] Verificando Load Balancer...${NC}"
if gcloud compute addresses describe ${SERVICE_NAME}-ip --global --project=${PROJECT_ID} &> /dev/null 2>&1; then
    LB_IP=$(gcloud compute addresses describe ${SERVICE_NAME}-ip --global --project=${PROJECT_ID} --format="value(address)")
    echo -e "${GREEN}✅ Load Balancer ativo${NC}"
    echo -e "   IP: ${LB_IP}"
else
    echo -e "${YELLOW}⚠️  Load Balancer não encontrado ou ainda sendo criado${NC}"
fi

# 3. Verificar Backend Service (CDN)
echo -e "\n${BLUE}[3/6] Verificando Cloud CDN...${NC}"
if gcloud compute backend-services describe ${SERVICE_NAME}-backend --global --project=${PROJECT_ID} &> /dev/null 2>&1; then
    CDN_ENABLED=$(gcloud compute backend-services describe ${SERVICE_NAME}-backend --global --project=${PROJECT_ID} --format="value(enableCDN)")
    if [ "$CDN_ENABLED" = "True" ]; then
        echo -e "${GREEN}✅ Cloud CDN habilitado${NC}"
    else
        echo -e "${YELLOW}⚠️  Cloud CDN não habilitado${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Backend service não encontrado${NC}"
fi

# 4. Verificar Certificado SSL
echo -e "\n${BLUE}[4/6] Verificando Certificado SSL...${NC}"
if gcloud compute ssl-certificates describe ${SERVICE_NAME}-cert --global --project=${PROJECT_ID} &> /dev/null 2>&1; then
    SSL_STATUS=$(gcloud compute ssl-certificates describe ${SERVICE_NAME}-cert --global --project=${PROJECT_ID} --format="value(managed.status)")
    echo -e "   Status: ${SSL_STATUS}"
    
    case "$SSL_STATUS" in
        "ACTIVE")
            echo -e "${GREEN}✅ Certificado SSL ativo${NC}"
            ;;
        "PROVISIONING")
            echo -e "${YELLOW}⚠️  Certificado SSL sendo provisionado (aguarde até 15 min)${NC}"
            ;;
        "FAILED_NOT_VISIBLE")
            echo -e "${RED}❌ DNS não configurado ou não propagado${NC}"
            echo -e "   Configure os A records e aguarde propagação"
            ;;
        *)
            echo -e "${YELLOW}⚠️  Status: ${SSL_STATUS}${NC}"
            ;;
    esac
else
    echo -e "${YELLOW}⚠️  Certificado SSL não encontrado${NC}"
fi

# 5. Verificar DNS
echo -e "\n${BLUE}[5/6] Verificando DNS...${NC}"
for domain in "${DOMAINS[@]}"; do
    echo -e "\n   ${YELLOW}Domínio: ${domain}${NC}"
    
    # Verificar A record
    DNS_IP=$(dig +short ${domain} @8.8.8.8 | tail -n1)
    if [ -n "$DNS_IP" ]; then
        echo -e "   DNS resolve para: ${DNS_IP}"
        if [ "$DNS_IP" = "$LB_IP" ]; then
            echo -e "   ${GREEN}✅ DNS configurado corretamente${NC}"
        else
            echo -e "   ${RED}❌ DNS aponta para IP incorreto${NC}"
            echo -e "   ${YELLOW}Configure A record para: ${LB_IP}${NC}"
        fi
    else
        echo -e "   ${RED}❌ DNS não configurado${NC}"
        echo -e "   ${YELLOW}Configure A record para: ${LB_IP}${NC}"
    fi
    
    # Testar HTTPS (se DNS estiver configurado)
    if [ -n "$DNS_IP" ] && [ "$DNS_IP" = "$LB_IP" ]; then
        if curl -s -o /dev/null -w "%{http_code}" "https://${domain}" --connect-timeout 5 | grep -q "200\|301\|302"; then
            echo -e "   ${GREEN}✅ HTTPS funcionando${NC}"
        else
            echo -e "   ${YELLOW}⚠️  HTTPS não responde (SSL pode estar sendo provisionado)${NC}"
        fi
    fi
done

# 6. Verificar Storage Buckets
echo -e "\n${BLUE}[6/6] Verificando Storage Buckets...${NC}"
if gsutil ls -b gs://${PROJECT_ID}-${SERVICE_NAME}-assets &> /dev/null; then
    echo -e "${GREEN}✅ Bucket de assets existe${NC}"
else
    echo -e "${YELLOW}⚠️  Bucket de assets não encontrado${NC}"
fi

if gsutil ls -b gs://${PROJECT_ID}-${SERVICE_NAME}-backups &> /dev/null; then
    echo -e "${GREEN}✅ Bucket de backups existe${NC}"
else
    echo -e "${YELLOW}⚠️  Bucket de backups não encontrado${NC}"
fi

# Resumo
echo -e "\n${BLUE}========================================${NC}"
echo -e "${BLUE}=== RESUMO ===${NC}"
echo -e "${BLUE}========================================${NC}"

if [ -n "$LB_IP" ]; then
    echo -e "\n${GREEN}Load Balancer IP: ${LB_IP}${NC}"
    echo -e "\n${YELLOW}Configure os seguintes A records no seu provedor DNS:${NC}"
    for domain in "${DOMAINS[@]}"; do
        echo -e "  ${domain} → ${LB_IP}"
    done
fi

if [ -n "$SERVICE_URL" ]; then
    echo -e "\n${GREEN}Cloud Run URL: ${SERVICE_URL}${NC}"
fi

echo -e "\n${YELLOW}Dicas:${NC}"
echo -e "  • DNS propagation: até 48h (geralmente 15-30 min)"
echo -e "  • SSL provisioning: até 15 min após DNS propagar"
echo -e "  • Verifique em: https://dnschecker.org"
echo -e "  • Logs: gcloud run services logs read ${SERVICE_NAME} --region=${REGION}"
