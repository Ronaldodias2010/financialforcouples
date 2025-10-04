#!/bin/bash

# Script para corrigir permissões da Service Account do GitHub Actions
# Resolve o erro: Permission 'iam.serviceaccounts.actAs' denied

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Corrigindo Permissões de Service Account ===${NC}"

# Configurações
PROJECT_ID="${GCP_PROJECT_ID:-couplesfinancials}"
GITHUB_SA="github-actions-sa@${PROJECT_ID}.iam.gserviceaccount.com"
CLOUDRUN_SA="couples-financials-run-sa@${PROJECT_ID}.iam.gserviceaccount.com"

echo -e "\n${YELLOW}Projeto: ${PROJECT_ID}${NC}"
echo -e "${YELLOW}GitHub SA: ${GITHUB_SA}${NC}"
echo -e "${YELLOW}Cloud Run SA: ${CLOUDRUN_SA}${NC}"

# Verificar se gcloud está configurado
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ gcloud CLI não encontrado${NC}"
    exit 1
fi

# Configurar projeto
echo -e "\n${YELLOW}Configurando projeto...${NC}"
gcloud config set project ${PROJECT_ID}

# Conceder permissão de actAs na service account específica
echo -e "\n${YELLOW}Concedendo permissão iam.serviceAccountUser na Cloud Run SA...${NC}"
gcloud iam service-accounts add-iam-policy-binding ${CLOUDRUN_SA} \
    --member="serviceAccount:${GITHUB_SA}" \
    --role="roles/iam.serviceAccountUser" \
    --quiet

echo -e "${GREEN}✅ Permissão concedida!${NC}"

# Verificar permissões
echo -e "\n${YELLOW}Verificando permissões...${NC}"
gcloud iam service-accounts get-iam-policy ${CLOUDRUN_SA}

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}✅ Permissões corrigidas com sucesso!${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "\n${YELLOW}Agora você pode:${NC}"
echo -e "1. Fazer um novo commit e push"
echo -e "2. Ou re-executar o workflow do GitHub Actions"
echo -e "\nO deploy deve funcionar agora! 🚀"
