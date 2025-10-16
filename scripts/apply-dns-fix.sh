#!/bin/bash

# Script para aplicar correção de DNS e SSL para ambos domínios
# couplesfinancials.com e couplesfin.com

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configurações
APP_NAME="couples-financials"
PROJECT_ID="couplesfinancials"
SSL_CERT_NAME="${APP_NAME}-ssl-cert"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Correção de DNS e SSL - Ambos Domínios${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Verificar autenticação GCP
echo -e "${YELLOW}Verificando autenticação GCP...${NC}"
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q "@"; then
    echo -e "${RED}❌ Erro: Você não está autenticado no GCP${NC}"
    echo -e "${YELLOW}Execute: gcloud auth login${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Autenticado no GCP${NC}"

# Passo 1: Deletar certificado SSL existente
echo ""
echo -e "${YELLOW}Passo 1: Deletando certificado SSL existente...${NC}"
if gcloud compute ssl-certificates describe $SSL_CERT_NAME --global &>/dev/null; then
    echo -e "${YELLOW}Deletando certificado: $SSL_CERT_NAME${NC}"
    gcloud compute ssl-certificates delete $SSL_CERT_NAME --global --quiet
    echo -e "${GREEN}✓ Certificado deletado${NC}"
    
    echo -e "${YELLOW}Aguardando 30 segundos para propagação...${NC}"
    sleep 30
else
    echo -e "${BLUE}ℹ Certificado não existe ou já foi deletado${NC}"
fi

# Passo 2: Aplicar Terraform
echo ""
echo -e "${YELLOW}Passo 2: Aplicando Terraform...${NC}"
cd terraform-gcp

# Inicializar Terraform
echo -e "${BLUE}Inicializando Terraform...${NC}"
terraform init -upgrade

# Validar configuração
echo -e "${BLUE}Validando configuração...${NC}"
terraform validate

# Aplicar mudanças
echo -e "${BLUE}Aplicando infraestrutura...${NC}"
terraform apply -auto-approve

echo -e "${GREEN}✓ Terraform aplicado com sucesso!${NC}"

# Passo 3: Verificar status do certificado
echo ""
echo -e "${YELLOW}Passo 3: Verificando certificado SSL...${NC}"
sleep 5

CERT_STATUS=$(gcloud compute ssl-certificates describe $SSL_CERT_NAME --global --format="value(managed.status)" 2>/dev/null || echo "NOT_FOUND")

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Status do Certificado SSL${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if [ "$CERT_STATUS" = "ACTIVE" ]; then
    echo -e "${GREEN}✓ Status: ACTIVE${NC}"
    echo -e "${GREEN}✓ Certificado SSL está funcionando!${NC}"
elif [ "$CERT_STATUS" = "PROVISIONING" ]; then
    echo -e "${YELLOW}⏳ Status: PROVISIONING${NC}"
    echo -e "${YELLOW}O certificado está sendo provisionado...${NC}"
    echo ""
    echo -e "${BLUE}Aguarde até 15 minutos para o Google validar os domínios.${NC}"
    echo ""
    echo -e "${BLUE}Verificar status com:${NC}"
    echo -e "  gcloud compute ssl-certificates describe $SSL_CERT_NAME --global"
else
    echo -e "${RED}⚠ Status: $CERT_STATUS${NC}"
    echo -e "${YELLOW}Verifique os logs para mais detalhes.${NC}"
fi

# Passo 4: Verificar domínios no certificado
echo ""
echo -e "${YELLOW}Passo 4: Verificando domínios no certificado...${NC}"
gcloud compute ssl-certificates describe $SSL_CERT_NAME --global --format="value(managed.domains)" 2>/dev/null || echo "Aguardando certificado..."

# Instruções finais
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Próximos Passos${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${GREEN}1. Aguarde 10-15 minutos para o certificado provisionar${NC}"
echo ""
echo -e "${GREEN}2. Verifique DNS propagado em:${NC}"
echo -e "   https://dnschecker.org"
echo -e "   Buscar: ${BLUE}couplesfinancials.com${NC} (tipo A)"
echo -e "   Buscar: ${BLUE}couplesfin.com${NC} (tipo A)"
echo ""
echo -e "${GREEN}3. Teste os domínios:${NC}"
echo -e "   curl -I https://couplesfinancials.com"
echo -e "   curl -I https://couplesfin.com"
echo ""
echo -e "${GREEN}4. Monitore o status do certificado:${NC}"
echo -e "   watch -n 30 'gcloud compute ssl-certificates describe $SSL_CERT_NAME --global --format=\"value(managed.status)\"'"
echo ""
echo -e "${YELLOW}5. Após ACTIVE, invalidar cache CDN:${NC}"
echo -e "   gcloud compute url-maps invalidate-cdn-cache ${APP_NAME}-url-map --path='/*' --async"
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
