#!/bin/bash

# Script para corrigir permissões do Cloud Run e Service Account
set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}=== Corrigindo Permissões Cloud Run ===${NC}"

PROJECT_ID="${GCP_PROJECT_ID:-couplesfinancials}"
PROJECT_NUMBER="778401426799"
SA_NAME="couples-financials-run-sa"
SA_EMAIL="${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"
GITHUB_SA="github-actions-sa@${PROJECT_ID}.iam.gserviceaccount.com"

echo -e "\n${YELLOW}Projeto: ${PROJECT_ID}${NC}"
echo -e "${YELLOW}Service Account: ${SA_EMAIL}${NC}"

# Configurar projeto
gcloud config set project ${PROJECT_ID}

# 1. Verificar se a SA existe, se não, criar
echo -e "\n${YELLOW}1. Verificando Service Account...${NC}"
if ! gcloud iam service-accounts describe ${SA_EMAIL} &>/dev/null; then
    echo -e "${YELLOW}Criando Service Account...${NC}"
    gcloud iam service-accounts create ${SA_NAME} \
        --display-name="Cloud Run Service Account" \
        --description="Service account for Cloud Run services"
    echo -e "${GREEN}✅ Service Account criada!${NC}"
else
    echo -e "${GREEN}✅ Service Account já existe${NC}"
fi

# 2. Dar permissões necessárias à SA do Cloud Run
echo -e "\n${YELLOW}2. Concedendo permissões à Service Account...${NC}"

ROLES=(
    "roles/secretmanager.secretAccessor"
    "roles/logging.logWriter"
)

for role in "${ROLES[@]}"; do
    echo -e "  - Concedendo ${role}..."
    gcloud projects add-iam-policy-binding ${PROJECT_ID} \
        --member="serviceAccount:${SA_EMAIL}" \
        --role="${role}" \
        --quiet
done

echo -e "${GREEN}✅ Permissões de projeto concedidas!${NC}"

# 3. Dar permissão específica nos secrets
echo -e "\n${YELLOW}3. Concedendo acesso aos secrets...${NC}"

SECRETS=(
    "supabase-anon-key"
    "supabase-service-role-key"
)

for secret in "${SECRETS[@]}"; do
    echo -e "  - Secret: ${secret}..."
    if gcloud secrets describe ${secret} &>/dev/null; then
        gcloud secrets add-iam-policy-binding ${secret} \
            --member="serviceAccount:${SA_EMAIL}" \
            --role="roles/secretmanager.secretAccessor" \
            --quiet
        echo -e "    ${GREEN}✅${NC}"
    else
        echo -e "    ${RED}❌ Secret não existe${NC}"
    fi
done

# 4. Permitir que GitHub Actions use a Cloud Run SA
echo -e "\n${YELLOW}4. Permitindo GitHub Actions usar a Service Account...${NC}"
gcloud iam service-accounts add-iam-policy-binding ${SA_EMAIL} \
    --member="serviceAccount:${GITHUB_SA}" \
    --role="roles/iam.serviceAccountUser" \
    --quiet

echo -e "${GREEN}✅ Permissão actAs concedida!${NC}"

# 5. Adicionar permissão na compute default SA também (fallback)
echo -e "\n${YELLOW}5. Concedendo permissões à Compute Default SA (fallback)...${NC}"
COMPUTE_SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

for secret in "${SECRETS[@]}"; do
    if gcloud secrets describe ${secret} &>/dev/null; then
        gcloud secrets add-iam-policy-binding ${secret} \
            --member="serviceAccount:${COMPUTE_SA}" \
            --role="roles/secretmanager.secretAccessor" \
            --quiet 2>/dev/null || true
    fi
done

echo -e "${GREEN}✅ Fallback configurado!${NC}"

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}✅ Correção concluída!${NC}"
echo -e "${GREEN}========================================${NC}"

echo -e "\n${YELLOW}Próximos passos:${NC}"
echo -e "1. Faça novo push para GitHub (ou re-execute o workflow)"
echo -e "2. O deploy deve funcionar agora"
echo -e "\n${YELLOW}Para verificar o status:${NC}"
echo -e "./scripts/check-deploy-status.sh"
