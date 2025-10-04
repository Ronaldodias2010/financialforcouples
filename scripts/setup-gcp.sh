#!/bin/bash
set -e

echo "🚀 Configuração inicial do Google Cloud Platform"
echo "=================================================="
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para verificar se comando existe
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# 1. Verificar pré-requisitos
echo "📋 Verificando pré-requisitos..."

if ! command_exists gcloud; then
    echo -e "${RED}❌ gcloud CLI não encontrado!${NC}"
    echo "Instale com: curl https://sdk.cloud.google.com | bash"
    exit 1
fi

if ! command_exists terraform; then
    echo -e "${RED}❌ Terraform não encontrado!${NC}"
    echo "Instale com: https://www.terraform.io/downloads"
    exit 1
fi

if ! command_exists docker; then
    echo -e "${RED}❌ Docker não encontrado!${NC}"
    echo "Instale com: https://docs.docker.com/get-docker/"
    exit 1
fi

echo -e "${GREEN}✅ Todos os pré-requisitos encontrados!${NC}"
echo ""

# 2. Configurar projeto GCP
echo "🔧 Configurando projeto GCP..."
PROJECT_ID="couplesfinancials"
PROJECT_NUMBER="778401426799"

echo "   ID do Projeto: $PROJECT_ID"
echo "   Número do Projeto: $PROJECT_NUMBER"
echo ""

# Configurar projeto ativo
gcloud config set project $PROJECT_ID
echo -e "${GREEN}✅ Projeto configurado: $PROJECT_ID${NC}"
echo ""

## 3. Verificar billing
#echo "💳 Verificando billing..."
#BILLING_ENABLED=$(gcloud beta billing projects describe $PROJECT_ID --format="value(billingEnabled)" 2>/dev/null || echo "false")

#if [ "$BILLING_ENABLED" != "True" ]; then
   # echo -e "${YELLOW}⚠️  Billing não habilitado!${NC}"
   # echo "Por favor, habilite billing em: https://console.cloud.google.com/billing/linkedaccount?project=$PROJECT_ID"
   # read -p "Pressione ENTER após habilitar o billing..."
#fi

#echo -e "${GREEN}✅ Billing verificado${NC}"
#echo ""

# 4. Habilitar APIs necessárias
echo "🔌 Habilitando APIs necessárias..."
APIS=(
    "run.googleapis.com"
    "compute.googleapis.com"
    "artifactregistry.googleapis.com"
    "secretmanager.googleapis.com"
    "cloudscheduler.googleapis.com"
    "logging.googleapis.com"
    "monitoring.googleapis.com"
    "iam.googleapis.com"
)

for api in "${APIS[@]}"; do
    echo "  - Habilitando $api..."
    gcloud services enable $api --quiet
done

echo -e "${GREEN}✅ APIs habilitadas!${NC}"
echo ""

# 5. Criar Artifact Registry
echo "📦 Criando Artifact Registry..."
REGION="us-central1"
REPO_NAME="couples-financials"

if ! gcloud artifacts repositories describe $REPO_NAME --location=$REGION &>/dev/null; then
    gcloud artifacts repositories create $REPO_NAME \
        --repository-format=docker \
        --location=$REGION \
        --description="Docker images for Couples Financials"
    echo -e "${GREEN}✅ Artifact Registry criado!${NC}"
else
    echo -e "${YELLOW}⚠️  Artifact Registry já existe${NC}"
fi

# Configurar Docker
gcloud auth configure-docker ${REGION}-docker.pkg.dev --quiet
echo ""

# 6. Criar Service Account para CI/CD
echo "🔑 Criando Service Account para GitHub Actions..."
SA_NAME="github-actions-sa"
SA_EMAIL="${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

if ! gcloud iam service-accounts describe $SA_EMAIL &>/dev/null; then
    gcloud iam service-accounts create $SA_NAME \
        --display-name="GitHub Actions Service Account" \
        --description="Service account for CI/CD with GitHub Actions"
    
    # Dar permissões necessárias a nível de projeto
    ROLES=(
        "roles/run.admin"
        "roles/artifactregistry.writer"
        "roles/iam.serviceAccountUser"
        "roles/storage.admin"
    )
    
    for role in "${ROLES[@]}"; do
        gcloud projects add-iam-policy-binding $PROJECT_ID \
            --member="serviceAccount:${SA_EMAIL}" \
            --role="$role" \
            --quiet
    done
    
    # IMPORTANTE: Dar permissão específica na Cloud Run Service Account
    # Isso é necessário para permitir que o GitHub Actions faça deploy
    echo -e "${YELLOW}Concedendo permissão actAs na Cloud Run Service Account...${NC}"
    CLOUDRUN_SA="couples-financials-run-sa@${PROJECT_ID}.iam.gserviceaccount.com"
    
    # Aguardar a SA do Cloud Run ser criada pelo Terraform
    echo -e "${YELLOW}Nota: Se a SA couples-financials-run-sa ainda não existe,${NC}"
    echo -e "${YELLOW}      execute este comando após o primeiro 'terraform apply':${NC}"
    echo -e "${YELLOW}      gcloud iam service-accounts add-iam-policy-binding ${CLOUDRUN_SA} \\${NC}"
    echo -e "${YELLOW}        --member=\"serviceAccount:${SA_EMAIL}\" \\${NC}"
    echo -e "${YELLOW}        --role=\"roles/iam.serviceAccountUser\"${NC}"
    
    # Tentar conceder (pode falhar se a SA ainda não existir)
    gcloud iam service-accounts add-iam-policy-binding ${CLOUDRUN_SA} \
        --member="serviceAccount:${SA_EMAIL}" \
        --role="roles/iam.serviceAccountUser" \
        --quiet 2>/dev/null || \
        echo -e "${YELLOW}⚠️  Cloud Run SA ainda não existe. Execute o comando acima após terraform apply.${NC}"
    
    echo -e "${GREEN}✅ Service Account criada!${NC}"
else
    echo -e "${YELLOW}⚠️  Service Account já existe${NC}"
fi

# Criar chave da service account
KEY_FILE="gcp-key.json"
if [ ! -f "$KEY_FILE" ]; then
    gcloud iam service-accounts keys create $KEY_FILE \
        --iam-account=$SA_EMAIL
    echo -e "${GREEN}✅ Chave da Service Account criada: $KEY_FILE${NC}"
    echo -e "${YELLOW}⚠️  IMPORTANTE: Adicione o conteúdo de $KEY_FILE aos secrets do GitHub!${NC}"
else
    echo -e "${YELLOW}⚠️  Arquivo de chave já existe: $KEY_FILE${NC}"
fi
echo ""

# 7. Criar secrets no Secret Manager
echo "🔐 Configurando secrets..."
read -p "Digite sua SUPABASE_ANON_KEY: " SUPABASE_ANON_KEY
read -sp "Digite sua SUPABASE_SERVICE_ROLE_KEY: " SUPABASE_SERVICE_ROLE_KEY
echo ""

# Criar secrets
if ! gcloud secrets describe supabase-anon-key &>/dev/null; then
    echo -n "$SUPABASE_ANON_KEY" | gcloud secrets create supabase-anon-key \
        --data-file=- \
        --replication-policy="automatic"
    echo -e "${GREEN}✅ Secret supabase-anon-key criado!${NC}"
else
    echo -e "${YELLOW}⚠️  Secret supabase-anon-key já existe${NC}"
fi

if ! gcloud secrets describe supabase-service-role-key &>/dev/null; then
    echo -n "$SUPABASE_SERVICE_ROLE_KEY" | gcloud secrets create supabase-service-role-key \
        --data-file=- \
        --replication-policy="automatic"
    echo -e "${GREEN}✅ Secret supabase-service-role-key criado!${NC}"
else
    echo -e "${YELLOW}⚠️  Secret supabase-service-role-key já existe${NC}"
fi
echo ""

# 8. Resumo final
echo ""
echo "=================================================="
echo -e "${GREEN}✅ Setup GCP concluído com sucesso!${NC}"
echo "=================================================="
echo ""
echo "📋 Informações do Projeto:"
echo "   Projeto: $PROJECT_ID (Número: $PROJECT_NUMBER)"
echo "   Região: $REGION"
echo "   Artifact Registry: ${REGION}-docker.pkg.dev/$PROJECT_ID/$REPO_NAME"
echo "   Service Account: $SA_EMAIL"
echo "   Chave gerada: $KEY_FILE"
echo ""
echo "📝 Próximos passos:"
echo ""
echo "1. Configure os GitHub Secrets:"
echo "   Vá em: Settings > Secrets and variables > Actions"
echo ""
echo "   Adicione:"
echo "   - Nome: GCP_PROJECT_ID"
echo "     Valor: $PROJECT_ID"
echo ""
echo "   - Nome: GCP_SERVICE_ACCOUNT_KEY"
echo "     Valor: (Cole todo o conteúdo do arquivo $KEY_FILE)"
echo ""
echo "   - Nome: SUPABASE_URL"
echo "     Valor: https://elxttabdtddlavhseipz.supabase.co"
echo ""
echo "2. Configure o terraform.tfvars:"
echo "   cd terraform-gcp"
echo "   cp terraform.tfvars.example terraform.tfvars"
echo "   nano terraform.tfvars"
echo "   # Edite: gcp_project_id = \"$PROJECT_ID\""
echo ""
echo "3. Execute o Terraform:"
echo "   terraform init"
echo "   terraform plan"
echo "   terraform apply"
echo ""
echo "4. Ou faça deploy manual primeiro:"
echo "   ./scripts/deploy-gcp.sh"
echo ""
echo "📊 Links úteis:"
echo "   - Dashboard: https://console.cloud.google.com/home/dashboard?project=$PROJECT_ID"
echo "   - Cloud Run: https://console.cloud.google.com/run?project=$PROJECT_ID"
echo "   - Artifact Registry: https://console.cloud.google.com/artifacts?project=$PROJECT_ID"
echo "   - Secret Manager: https://console.cloud.google.com/security/secret-manager?project=$PROJECT_ID"
echo "   - IAM & Admin: https://console.cloud.google.com/iam-admin/iam?project=$PROJECT_ID"
echo "   - Billing: https://console.cloud.google.com/billing/linkedaccount?project=$PROJECT_ID"
echo ""
