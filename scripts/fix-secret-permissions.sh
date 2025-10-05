#!/bin/bash

# Script para corrigir permissões de acesso aos secrets do Supabase
set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Corrigindo Permissões de Secrets ===${NC}"

# Configurações
PROJECT_ID="${GCP_PROJECT_ID:-couplesfinancials}"
CLOUDRUN_SA="couples-financials-run-sa@${PROJECT_ID}.iam.gserviceaccount.com"

echo -e "\n${YELLOW}Projeto: ${PROJECT_ID}${NC}"
echo -e "${YELLOW}Cloud Run SA: ${CLOUDRUN_SA}${NC}"

# Verificar se gcloud está configurado
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ gcloud CLI não encontrado${NC}"
    exit 1
fi

# Configurar projeto
echo -e "\n${YELLOW}Configurando projeto...${NC}"
gcloud config set project ${PROJECT_ID}

# Conceder permissões no secret supabase-anon-key
echo -e "\n${YELLOW}Concedendo permissão no secret supabase-anon-key...${NC}"
gcloud secrets add-iam-policy-binding supabase-anon-key \
    --member="serviceAccount:${CLOUDRUN_SA}" \
    --role="roles/secretmanager.secretAccessor" \
    --quiet

echo -e "${GREEN}✅ Permissão concedida no supabase-anon-key${NC}"

# Conceder permissões no secret supabase-service-role-key
echo -e "\n${YELLOW}Concedendo permissão no secret supabase-service-role-key...${NC}"
gcloud secrets add-iam-policy-binding supabase-service-role-key \
    --member="serviceAccount:${CLOUDRUN_SA}" \
    --role="roles/secretmanager.secretAccessor" \
    --quiet

echo -e "${GREEN}✅ Permissão concedida no supabase-service-role-key${NC}"

# Verificar permissões
echo -e "\n${YELLOW}Verificando permissões do supabase-anon-key...${NC}"
gcloud secrets get-iam-policy supabase-anon-key

echo -e "\n${YELLOW}Verificando permissões do supabase-service-role-key...${NC}"
gcloud secrets get-iam-policy supabase-service-role-key

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}✅ Permissões corrigidas com sucesso!${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "\n${YELLOW}Próximos passos:${NC}"
echo -e "1. Faça um novo commit e push"
echo -e "2. Ou re-execute o workflow do GitHub Actions"
echo -e "\nO deploy deve funcionar agora! 🚀"
