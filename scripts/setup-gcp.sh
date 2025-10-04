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
read -p "Digite o ID do seu projeto GCP (ex: couples-financials-prod): " PROJECT_ID

if [ -z "$PROJECT_ID" ]; then
    echo -e "${RED}❌ ID do projeto é obrigatório!${NC}"
    exit 1
fi

# Verificar se projeto existe
if ! gcloud projects describe $PROJECT_ID &>/dev/null; then
    echo -e "${YELLOW}⚠️  Projeto não encontrado. Criando...${NC}"
    gcloud projects create $PROJECT_ID --name="Couples Financials"
fi

# Configurar projeto ativo
gcloud config set project $PROJECT_ID
echo -e "${GREEN}✅ Projeto configurado: $PROJECT_ID${NC}"
echo ""

# 3. Verificar billing
echo "💳 Verificando billing..."
BILLING_ENABLED=$(gcloud beta billing projects describe $PROJECT_ID --format="value(billingEnabled)" 2>/dev/null || echo "false")

if [ "$BILLING_ENABLED" != "True" ]; then
    echo -e "${YELLOW}⚠️  Billing não habilitado!${NC}"
    echo "Por favor, habilite billing em: https://console.cloud.google.com/billing/linkedaccount?project=$PROJECT_ID"
    read -p "Pressione ENTER após habilitar o billing..."
fi

echo -e "${GREEN}✅ Billing verificado${NC}"
echo ""

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
    
    # Dar permissões necessárias
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
echo "📝 Próximos passos:"
echo ""
echo "1. Configure os GitHub Secrets:"
echo "   - GCP_PROJECT_ID: $PROJECT_ID"
echo "   - GCP_SERVICE_ACCOUNT_KEY: (conteúdo de $KEY_FILE)"
echo "   - SUPABASE_URL: https://elxttabdtddlavhseipz.supabase.co"
echo ""
echo "2. Configure o terraform.tfvars:"
echo "   cd terraform-gcp"
echo "   cp terraform.tfvars.example terraform.tfvars"
echo "   nano terraform.tfvars"
echo ""
echo "3. Execute o Terraform:"
echo "   terraform init"
echo "   terraform plan"
echo "   terraform apply"
echo ""
echo "4. Faça push para main para acionar deploy automático:"
echo "   git add ."
echo "   git commit -m 'Configure GCP deployment'"
echo "   git push origin main"
echo ""
echo "📊 Links úteis:"
echo "   - Console GCP: https://console.cloud.google.com/home/dashboard?project=$PROJECT_ID"
echo "   - Cloud Run: https://console.cloud.google.com/run?project=$PROJECT_ID"
echo "   - Artifact Registry: https://console.cloud.google.com/artifacts?project=$PROJECT_ID"
echo "   - Secret Manager: https://console.cloud.google.com/security/secret-manager?project=$PROJECT_ID"
echo ""
