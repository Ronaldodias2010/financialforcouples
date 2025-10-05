#!/bin/bash

# Script para conceder acesso aos secrets do Secret Manager para o GitHub Actions SA

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== Concedendo acesso aos secrets para GitHub Actions SA ===${NC}\n"

# Verificar variáveis
if [ -z "$GCP_PROJECT_ID" ]; then
  echo -e "${RED}Erro: GCP_PROJECT_ID não definido${NC}"
  echo "Execute: export GCP_PROJECT_ID=couplesfinancials"
  exit 1
fi

GITHUB_ACTIONS_SA="github-actions-sa@${GCP_PROJECT_ID}.iam.gserviceaccount.com"

echo -e "${GREEN}✓${NC} Projeto: ${GCP_PROJECT_ID}"
echo -e "${GREEN}✓${NC} Service Account: ${GITHUB_ACTIONS_SA}\n"

# Conceder acesso ao secret supabase-anon-key
echo "Concedendo acesso ao secret: supabase-anon-key..."
gcloud secrets add-iam-policy-binding supabase-anon-key \
  --project="${GCP_PROJECT_ID}" \
  --member="serviceAccount:${GITHUB_ACTIONS_SA}" \
  --role="roles/secretmanager.secretAccessor"

echo -e "${GREEN}✓${NC} Acesso concedido ao supabase-anon-key\n"

# Conceder acesso ao secret supabase-service-role-key
echo "Concedendo acesso ao secret: supabase-service-role-key..."
gcloud secrets add-iam-policy-binding supabase-service-role-key \
  --project="${GCP_PROJECT_ID}" \
  --member="serviceAccount:${GITHUB_ACTIONS_SA}" \
  --role="roles/secretmanager.secretAccessor"

echo -e "${GREEN}✓${NC} Acesso concedido ao supabase-service-role-key\n"

echo -e "${GREEN}=== ✓ Permissões concedidas com sucesso! ===${NC}\n"
echo "Aguarde 1-2 minutos para propagação das permissões."
echo "Depois execute novamente o workflow Terraform Apply."
