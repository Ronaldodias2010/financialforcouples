#!/bin/bash

# Script para criar e configurar secrets no GCP Secret Manager
set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}=== Configurando Secrets no GCP Secret Manager ===${NC}\n"

# Configurações
PROJECT_ID="${GCP_PROJECT_ID:-couplesfinancials}"
GITHUB_SA="github-actions-sa@${PROJECT_ID}.iam.gserviceaccount.com"
CLOUDRUN_SA="couples-financials-run-sa@${PROJECT_ID}.iam.gserviceaccount.com"

echo -e "${YELLOW}Projeto: ${PROJECT_ID}${NC}"
echo -e "${YELLOW}GitHub SA: ${GITHUB_SA}${NC}"
echo -e "${YELLOW}Cloud Run SA: ${CLOUDRUN_SA}${NC}\n"

# Verificar se gcloud está configurado
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ gcloud CLI não encontrado${NC}"
    exit 1
fi

# Configurar projeto
gcloud config set project ${PROJECT_ID}

# Função para criar ou atualizar secret
create_or_update_secret() {
    local secret_name=$1
    local secret_value=$2
    
    echo -e "${YELLOW}Processando secret: ${secret_name}${NC}"
    
    # Verificar se secret existe
    if gcloud secrets describe ${secret_name} --project=${PROJECT_ID} &>/dev/null; then
        echo "  Secret já existe, adicionando nova versão..."
        echo -n "${secret_value}" | gcloud secrets versions add ${secret_name} \
            --project=${PROJECT_ID} \
            --data-file=-
    else
        echo "  Criando novo secret..."
        echo -n "${secret_value}" | gcloud secrets create ${secret_name} \
            --project=${PROJECT_ID} \
            --replication-policy="automatic" \
            --data-file=-
    fi
    
    echo -e "${GREEN}  ✓ Secret ${secret_name} configurado${NC}\n"
}

# Solicitar valores dos secrets
echo -e "${YELLOW}Por favor, forneça os valores dos secrets do Supabase:${NC}\n"

read -p "SUPABASE_ANON_KEY: " SUPABASE_ANON_KEY
read -p "SUPABASE_SERVICE_ROLE_KEY: " SUPABASE_SERVICE_ROLE_KEY

if [ -z "$SUPABASE_ANON_KEY" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo -e "${RED}❌ Ambos os valores são obrigatórios${NC}"
    exit 1
fi

# Criar ou atualizar secrets
create_or_update_secret "supabase-anon-key" "$SUPABASE_ANON_KEY"
create_or_update_secret "supabase-service-role-key" "$SUPABASE_SERVICE_ROLE_KEY"

# Conceder permissões ao GitHub Actions SA
echo -e "${YELLOW}Concedendo permissões ao GitHub Actions SA...${NC}"

for secret in "supabase-anon-key" "supabase-service-role-key"; do
    echo "  Configurando ${secret}..."
    
    # Secretmanager.secretAccessor para ler
    gcloud secrets add-iam-policy-binding ${secret} \
        --project=${PROJECT_ID} \
        --member="serviceAccount:${GITHUB_SA}" \
        --role="roles/secretmanager.secretAccessor" \
        --quiet
    
    # Secretmanager.admin para gerenciar IAM
    gcloud secrets add-iam-policy-binding ${secret} \
        --project=${PROJECT_ID} \
        --member="serviceAccount:${GITHUB_SA}" \
        --role="roles/secretmanager.admin" \
        --quiet
done

echo -e "${GREEN}✓ Permissões concedidas ao GitHub Actions SA${NC}\n"

# Conceder permissões ao Cloud Run SA
echo -e "${YELLOW}Concedendo permissões ao Cloud Run SA...${NC}"

for secret in "supabase-anon-key" "supabase-service-role-key"; do
    echo "  Configurando ${secret}..."
    
    gcloud secrets add-iam-policy-binding ${secret} \
        --project=${PROJECT_ID} \
        --member="serviceAccount:${CLOUDRUN_SA}" \
        --role="roles/secretmanager.secretAccessor" \
        --quiet
done

echo -e "${GREEN}✓ Permissões concedidas ao Cloud Run SA${NC}\n"

# Verificar configuração
echo -e "${YELLOW}Verificando configuração dos secrets...${NC}"
gcloud secrets list --project=${PROJECT_ID}

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}✅ Secrets configurados com sucesso!${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "\n${YELLOW}Próximos passos:${NC}"
echo -e "1. Aguarde 1-2 minutos para propagação das permissões"
echo -e "2. Re-execute o workflow do GitHub Actions"
echo -e "\nOs secrets estão prontos para uso! 🚀"
