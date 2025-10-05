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

# Conceder role de admin nos secrets (necessário para Terraform gerenciar IAM)
echo "Concedendo role secretmanager.admin ao GitHub Actions SA..."
gcloud projects add-iam-policy-binding "${GCP_PROJECT_ID}" \
  --member="serviceAccount:${GITHUB_ACTIONS_SA}" \
  --role="roles/secretmanager.admin" \
  --condition=None

echo -e "${GREEN}✓${NC} Role admin concedido\n"

echo -e "${GREEN}=== ✓ Permissões concedidas com sucesso! ===${NC}\n"
echo "Aguarde 1-2 minutos para propagação das permissões."
echo "Depois execute novamente o workflow Terraform Apply."
