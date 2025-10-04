#!/bin/bash

# Script Master de Deploy - Couples Financials
# Este script orquestra todo o processo de deploy no GCP

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         DEPLOY MASTER - COUPLES FINANCIALS                ║${NC}"
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo ""

# Configurações
PROJECT_ID="${GCP_PROJECT_ID:-couplesfinancials}"
REGION="us-central1"

# Verificar pré-requisitos
echo -e "${YELLOW}[1/6] Verificando pré-requisitos...${NC}"

if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ gcloud CLI não encontrado${NC}"
    exit 1
fi

if ! command -v git &> /dev/null; then
    echo -e "${RED}❌ git não encontrado${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Pré-requisitos verificados${NC}\n"

# Autenticação GCP
echo -e "${YELLOW}[2/6] Verificando autenticação GCP...${NC}"

if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" &> /dev/null; then
    echo -e "${YELLOW}⚠️  Não autenticado. Iniciando login...${NC}"
    gcloud auth login
    gcloud auth application-default login
fi

gcloud config set project ${PROJECT_ID}
echo -e "${GREEN}✅ Autenticado no projeto: ${PROJECT_ID}${NC}\n"

# Setup GCP (APIs, Service Account, Secrets)
echo -e "${YELLOW}[3/6] Configurando projeto GCP...${NC}"
echo -e "${BLUE}Este passo vai:${NC}"
echo -e "  - Habilitar APIs necessárias"
echo -e "  - Criar Artifact Registry"
echo -e "  - Criar Service Account para GitHub Actions"
echo -e "  - Configurar secrets no Secret Manager"
echo ""

read -p "Executar setup do GCP? (s/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Ss]$ ]]; then
    chmod +x scripts/setup-gcp.sh
    ./scripts/setup-gcp.sh
    echo -e "${GREEN}✅ Setup GCP concluído${NC}\n"
else
    echo -e "${YELLOW}⚠️  Pulando setup GCP${NC}\n"
fi

# Inicializar backend Terraform
echo -e "${YELLOW}[4/6] Inicializando backend do Terraform...${NC}"
echo -e "${BLUE}Este passo cria o bucket GCS para o Terraform State${NC}\n"

read -p "Criar bucket Terraform? (s/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Ss]$ ]]; then
    chmod +x scripts/init-terraform-backend.sh
    ./scripts/init-terraform-backend.sh
    echo -e "${GREEN}✅ Backend Terraform inicializado${NC}\n"
else
    echo -e "${YELLOW}⚠️  Pulando criação do bucket${NC}\n"
fi

# Verificar GitHub Secrets
echo -e "${YELLOW}[5/6] Verificando GitHub Secrets...${NC}"
echo -e "${BLUE}Certifique-se de que os seguintes secrets estão configurados:${NC}"
echo ""
echo -e "  ${YELLOW}Obrigatórios:${NC}"
echo -e "    - GCP_PROJECT_ID"
echo -e "    - GCP_SA_KEY (conteúdo do gcp-key.json)"
echo -e "    - SUPABASE_URL"
echo -e "    - SUPABASE_ANON_KEY"
echo -e "    - SUPABASE_SERVICE_ROLE_KEY"
echo ""
echo -e "  ${YELLOW}Opcionais (para DNS):${NC}"
echo -e "    - DOMAIN_NAME"
echo -e "    - WWW_DOMAIN_NAME"
echo ""

if [ -f "gcp-key.json" ]; then
    echo -e "${GREEN}✅ Arquivo gcp-key.json encontrado${NC}"
    echo -e "${BLUE}Copie o conteúdo deste arquivo para o secret GCP_SA_KEY:${NC}"
    echo -e "${YELLOW}cat gcp-key.json | base64${NC}"
    echo ""
fi

read -p "Secrets configurados no GitHub? (s/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo -e "${YELLOW}⚠️  Configure os secrets antes de continuar:${NC}"
    echo -e "${BLUE}https://github.com/SEU_USUARIO/SEU_REPO/settings/secrets/actions${NC}"
    exit 1
fi

# Git commit e push
echo -e "${YELLOW}[6/6] Preparando deploy via GitHub Actions...${NC}"
echo ""

# Verificar se há mudanças para commit
if [[ -n $(git status -s) ]]; then
    echo -e "${BLUE}Mudanças detectadas:${NC}"
    git status -s
    echo ""
    
    read -p "Fazer commit e push? (s/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Ss]$ ]]; then
        git add .
        git commit -m "feat: configuração completa para deploy GCP"
        
        # Verificar branch atual
        CURRENT_BRANCH=$(git branch --show-current)
        echo -e "${BLUE}Branch atual: ${CURRENT_BRANCH}${NC}"
        
        git push origin ${CURRENT_BRANCH}
        echo -e "${GREEN}✅ Código enviado para GitHub${NC}\n"
    fi
else
    echo -e "${GREEN}✅ Nenhuma mudança para commit${NC}\n"
fi

# Resumo final
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                    DEPLOY INICIADO                        ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}✅ Configuração completa!${NC}"
echo ""
echo -e "${YELLOW}Próximos passos:${NC}"
echo -e "  1. Acesse: ${BLUE}https://github.com/SEU_USUARIO/SEU_REPO/actions${NC}"
echo -e "  2. Acompanhe o workflow 'Terraform Apply'"
echo -e "  3. Após conclusão, acompanhe 'Deploy to GCP'"
echo -e "  4. Capture o IP do Load Balancer nos outputs"
echo -e "  5. Configure o DNS apontando para o IP"
echo ""
echo -e "${BLUE}Comandos úteis:${NC}"
echo -e "  Verificar status:  ${YELLOW}./scripts/check-deploy-status.sh${NC}"
echo -e "  Logs do Cloud Run: ${YELLOW}gcloud run services logs read couples-financials --region=us-central1${NC}"
echo ""
