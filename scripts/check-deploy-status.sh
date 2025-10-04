#!/bin/bash

# Script para verificar o status do deploy

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PROJECT_ID="${GCP_PROJECT_ID:-couplesfinancials}"
REGION="us-central1"
SERVICE_NAME="couples-financials"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║              VERIFICAÇÃO DE STATUS - DEPLOY               ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

gcloud config set project ${PROJECT_ID} 2>/dev/null

# 1. Verificar Terraform State Bucket
echo -e "${YELLOW}[1/5] Terraform State Bucket${NC}"
if gsutil ls -b gs://${PROJECT_ID}-terraform-state &> /dev/null; then
    echo -e "${GREEN}✅ Bucket existe: gs://${PROJECT_ID}-terraform-state${NC}"
else
    echo -e "${RED}❌ Bucket não existe${NC}"
fi
echo ""

# 2. Verificar Service Account
echo -e "${YELLOW}[2/5] Service Accounts${NC}"
if gcloud iam service-accounts describe github-actions-sa@${PROJECT_ID}.iam.gserviceaccount.com &> /dev/null; then
    echo -e "${GREEN}✅ GitHub Actions SA: github-actions-sa@${PROJECT_ID}.iam.gserviceaccount.com${NC}"
else
    echo -e "${RED}❌ GitHub Actions SA não encontrada${NC}"
fi

if gcloud iam service-accounts describe ${SERVICE_NAME}-run-sa@${PROJECT_ID}.iam.gserviceaccount.com &> /dev/null; then
    echo -e "${GREEN}✅ Cloud Run SA: ${SERVICE_NAME}-run-sa@${PROJECT_ID}.iam.gserviceaccount.com${NC}"
else
    echo -e "${YELLOW}⚠️  Cloud Run SA não encontrada (será criada pelo Terraform)${NC}"
fi
echo ""

# 3. Verificar Artifact Registry
echo -e "${YELLOW}[3/5] Artifact Registry${NC}"
if gcloud artifacts repositories describe ${SERVICE_NAME} --location=${REGION} &> /dev/null; then
    echo -e "${GREEN}✅ Repository: ${REGION}-docker.pkg.dev/${PROJECT_ID}/${SERVICE_NAME}${NC}"
    
    # Listar últimas imagens
    IMAGES=$(gcloud artifacts docker images list ${REGION}-docker.pkg.dev/${PROJECT_ID}/${SERVICE_NAME}/app --limit=1 --format="value(package)" 2>/dev/null || echo "")
    if [ -n "$IMAGES" ]; then
        echo -e "${GREEN}   Imagem encontrada no registry${NC}"
    else
        echo -e "${YELLOW}   Nenhuma imagem no registry ainda${NC}"
    fi
else
    echo -e "${RED}❌ Repository não existe${NC}"
fi
echo ""

# 4. Verificar Cloud Run Service
echo -e "${YELLOW}[4/5] Cloud Run Service${NC}"
if gcloud run services describe ${SERVICE_NAME} --region=${REGION} --format="value(status.url)" &> /dev/null; then
    SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} --region=${REGION} --format="value(status.url)")
    echo -e "${GREEN}✅ Service ativo: ${SERVICE_NAME}${NC}"
    echo -e "${BLUE}   URL: ${SERVICE_URL}${NC}"
    
    # Status do service
    STATUS=$(gcloud run services describe ${SERVICE_NAME} --region=${REGION} --format="value(status.conditions[0].type)" 2>/dev/null || echo "Unknown")
    echo -e "   Status: ${STATUS}"
else
    echo -e "${YELLOW}⚠️  Service não encontrado (será criado no deploy)${NC}"
fi
echo ""

# 5. Verificar Load Balancer
echo -e "${YELLOW}[5/5] Load Balancer${NC}"
LB_IP=$(gcloud compute addresses describe ${SERVICE_NAME}-ip --global --format="value(address)" 2>/dev/null || echo "")
if [ -n "$LB_IP" ]; then
    echo -e "${GREEN}✅ IP Reservado: ${LB_IP}${NC}"
    echo -e "${BLUE}   Configure seu DNS com este IP${NC}"
else
    echo -e "${YELLOW}⚠️  IP não reservado (será criado pelo Terraform)${NC}"
fi
echo ""

# Resumo
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                         RESUMO                             ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}Links úteis:${NC}"
echo -e "  Cloud Run:  ${BLUE}https://console.cloud.google.com/run?project=${PROJECT_ID}${NC}"
echo -e "  Logs:       ${BLUE}https://console.cloud.google.com/logs/query?project=${PROJECT_ID}${NC}"
echo -e "  Artifact:   ${BLUE}https://console.cloud.google.com/artifacts?project=${PROJECT_ID}${NC}"
echo ""
