#!/bin/bash
set -e

echo "🚀 Deploy para Google Cloud Platform"
echo "====================================="
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configurações
PROJECT_ID=${GCP_PROJECT_ID:-$(gcloud config get-value project)}
REGION=${GCP_REGION:-"us-central1"}
SERVICE_NAME="couples-financials"
ARTIFACT_REGISTRY="${REGION}-docker.pkg.dev"

# Verificar se projeto está configurado
if [ -z "$PROJECT_ID" ]; then
    echo -e "${RED}❌ GCP_PROJECT_ID não configurado!${NC}"
    echo "Configure com: export GCP_PROJECT_ID=seu-projeto-id"
    exit 1
fi

echo -e "${BLUE}📦 Projeto: $PROJECT_ID${NC}"
echo -e "${BLUE}🌍 Região: $REGION${NC}"
echo ""

# 1. Build da imagem Docker
echo "🔨 Building Docker image..."
IMAGE_TAG="${ARTIFACT_REGISTRY}/${PROJECT_ID}/${SERVICE_NAME}/app:$(git rev-parse --short HEAD)"
IMAGE_LATEST="${ARTIFACT_REGISTRY}/${PROJECT_ID}/${SERVICE_NAME}/app:latest"

docker build \
    --tag $IMAGE_TAG \
    --tag $IMAGE_LATEST \
    --platform linux/amd64 \
    .

echo -e "${GREEN}✅ Imagem construída: $IMAGE_TAG${NC}"
echo ""

# 2. Push para Artifact Registry
echo "📤 Pushing image to Artifact Registry..."
docker push $IMAGE_TAG
docker push $IMAGE_LATEST

echo -e "${GREEN}✅ Imagem enviada para Artifact Registry${NC}"
echo ""

# 3. Deploy para Cloud Run
echo "🚀 Deploying to Cloud Run..."

# Verificar se service account existe
SA_EMAIL="${SERVICE_NAME}-run-sa@${PROJECT_ID}.iam.gserviceaccount.com"
if ! gcloud iam service-accounts describe $SA_EMAIL &>/dev/null; then
    echo -e "${YELLOW}⚠️  Service account não encontrada. Criando...${NC}"
    gcloud iam service-accounts create ${SERVICE_NAME}-run-sa \
        --display-name="Cloud Run Service Account"
    
    # Dar permissões de acesso aos secrets
    gcloud projects add-iam-policy-binding $PROJECT_ID \
        --member="serviceAccount:${SA_EMAIL}" \
        --role="roles/secretmanager.secretAccessor" \
        --quiet
fi

# Deploy
gcloud run deploy $SERVICE_NAME \
    --image=$IMAGE_TAG \
    --region=$REGION \
    --platform=managed \
    --allow-unauthenticated \
    --min-instances=0 \
    --max-instances=10 \
    --cpu=1 \
    --memory=512Mi \
    --timeout=300 \
    --concurrency=80 \
    --set-env-vars="NODE_ENV=production,SUPABASE_URL=https://elxttabdtddlavhseipz.supabase.co" \
    --set-secrets="SUPABASE_ANON_KEY=supabase-anon-key:latest,SUPABASE_SERVICE_ROLE_KEY=supabase-service-role-key:latest" \
    --service-account=$SA_EMAIL \
    --quiet

echo -e "${GREEN}✅ Deploy concluído!${NC}"
echo ""

# 4. Obter URL do serviço
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME \
    --region=$REGION \
    --format='value(status.url)')

echo ""
echo "=================================================="
echo -e "${GREEN}✅ Deploy bem-sucedido!${NC}"
echo "=================================================="
echo ""
echo -e "${BLUE}🌐 URL do serviço: $SERVICE_URL${NC}"
echo ""
echo "📊 Comandos úteis:"
echo ""
echo "  # Ver logs"
echo "  gcloud run services logs read $SERVICE_NAME --region=$REGION"
echo ""
echo "  # Ver status"
echo "  gcloud run services describe $SERVICE_NAME --region=$REGION"
echo ""
echo "  # Ver métricas"
echo "  gcloud monitoring dashboards list"
echo ""
echo "  # Invalidar cache CDN (se configurado)"
echo "  gcloud compute url-maps invalidate-cdn-cache ${SERVICE_NAME}-url-map --path='/*'"
echo ""

# 5. Smoke test
echo "🧪 Executando smoke test..."
sleep 5

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" $SERVICE_URL)
if [ $HTTP_CODE -eq 200 ] || [ $HTTP_CODE -eq 301 ] || [ $HTTP_CODE -eq 302 ]; then
    echo -e "${GREEN}✅ Aplicação está respondendo (HTTP $HTTP_CODE)${NC}"
else
    echo -e "${YELLOW}⚠️  Código HTTP inesperado: $HTTP_CODE${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Deploy finalizado com sucesso!${NC}"
