# 🔄 Guia de Migração AWS → GCP

Este guia detalha o processo completo de migração da aplicação Couples Financials da AWS para o Google Cloud Platform (GCP).

## 📊 Comparação de Custos

| Serviço | AWS (Mensal) | GCP (Mensal) | Economia |
|---------|--------------|--------------|----------|
| Compute | ECS Fargate: $50-80 | Cloud Run: $20-40 | ~50% |
| Load Balancer | ALB: $20-25 | Cloud LB: $18-22 | ~15% |
| CDN | CloudFront: $15-30 | Cloud CDN: $10-20 | ~33% |
| Storage | S3: $5-10 | Cloud Storage: $4-8 | ~20% |
| Registry | ECR: $5 | Artifact Registry: Grátis (0.5GB) | 100% |
| **TOTAL** | **$95-150** | **$52-90** | **~40-45%** |

### Vantagens Adicionais do GCP:
- ✅ Cloud Run escala para **ZERO** instâncias (economia de 100% em horários sem tráfego)
- ✅ Certificados SSL **100% gerenciados** e gratuitos
- ✅ Cloud CDN já **integrado** ao Load Balancer
- ✅ Menos configuração e manutenção

---

## 🏗️ Arquitetura Atual (AWS) vs Nova (GCP)

### AWS (Atual)
```
Internet → Route 53 → CloudFront → ALB → ECS Fargate → Supabase
                         ↓
                      S3 (Assets)
```

### GCP (Nova)
```
Internet → Cloud DNS → Cloud CDN/LB → Cloud Run → Supabase
                              ↓
                        Cloud Storage
```

---

## 📋 Pré-requisitos

### 1. Ferramentas Necessárias
- ✅ gcloud CLI instalado
- ✅ Terraform >= 1.0
- ✅ Docker
- ✅ Git
- ✅ Conta GCP com billing habilitado

### 2. Informações Necessárias
- [ ] SUPABASE_ANON_KEY
- [ ] SUPABASE_SERVICE_ROLE_KEY
- [ ] Nome de domínio (opcional)
- [ ] ID do projeto GCP

---

## 🚀 Processo de Migração (Passo a Passo)

### **FASE 1: Setup Inicial do GCP** (30 min)

#### 1.1. Criar Projeto GCP
```bash
# Instalar gcloud CLI (se necessário)
curl https://sdk.cloud.google.com | bash
exec -l $SHELL

# Autenticar
gcloud init

# Criar projeto
gcloud projects create couples-financials-prod --name="Couples Financials"
gcloud config set project couples-financials-prod
```

#### 1.2. Habilitar Billing
1. Acesse: https://console.cloud.google.com/billing
2. Vincule um método de pagamento ao projeto
3. Verifique: `gcloud beta billing projects describe couples-financials-prod`

#### 1.3. Executar Script de Setup Automatizado
```bash
chmod +x scripts/setup-gcp.sh
./scripts/setup-gcp.sh
```

Este script irá:
- ✅ Criar Artifact Registry
- ✅ Habilitar APIs necessárias
- ✅ Criar Service Account para CI/CD
- ✅ Configurar secrets no Secret Manager
- ✅ Gerar chave de autenticação

---

### **FASE 2: Configurar GitHub Secrets** (10 min)

Acesse: `https://github.com/SEU_USER/SEU_REPO/settings/secrets/actions`

Adicione os seguintes secrets:

| Nome | Valor | Onde obter |
|------|-------|------------|
| `GCP_PROJECT_ID` | ID do projeto GCP | Console GCP |
| `GCP_SERVICE_ACCOUNT_KEY` | JSON da service account | `gcp-key.json` gerado pelo script |
| `SUPABASE_URL` | https://elxttabdtddlavhseipz.supabase.co | Já configurado |

---

### **FASE 3: Deploy da Infraestrutura com Terraform** (20 min)

#### 3.1. Configurar Variáveis
```bash
cd terraform-gcp
cp terraform.tfvars.example terraform.tfvars
nano terraform.tfvars
```

Edite `terraform.tfvars`:
```hcl
gcp_project_id = "couples-financials-prod"
gcp_region = "us-central1"
environment = "prod"
app_name = "couples-financials"

# Domínios (opcional - deixe vazio por enquanto)
domain_name = ""
secondary_domain_name = ""

# Supabase
supabase_url = "https://elxttabdtddlavhseipz.supabase.co"
supabase_anon_key = "SUA_CHAVE_AQUI"
supabase_service_role_key = "SUA_CHAVE_AQUI"

# Container (será atualizado após primeiro deploy)
container_image = "us-central1-docker.pkg.dev/couples-financials-prod/couples-financials/app:latest"
```

#### 3.2. Aplicar Terraform
```bash
# Inicializar
terraform init

# Planejar (revisar mudanças)
terraform plan

# Aplicar
terraform apply
```

#### 3.3. Verificar Outputs
```bash
terraform output
```

Anote o **Load Balancer IP** para configurar DNS depois.

---

### **FASE 4: Primeiro Deploy da Aplicação** (15 min)

#### 4.1. Deploy Manual (Primeira Vez)
```bash
chmod +x scripts/deploy-gcp.sh
./scripts/deploy-gcp.sh
```

#### 4.2. Verificar Deploy
```bash
# Obter URL do Cloud Run
gcloud run services describe couples-financials --region=us-central1

# Testar aplicação
curl https://couples-financials-XXXXX-uc.a.run.app
```

---

### **FASE 5: Configurar CI/CD Automático** (5 min)

O GitHub Actions já está configurado! A partir de agora, todo push para `main` irá:
1. ✅ Rodar testes
2. ✅ Build da imagem Docker
3. ✅ Push para Artifact Registry
4. ✅ Deploy no Cloud Run
5. ✅ Smoke test

**Teste fazendo um commit:**
```bash
git add .
git commit -m "Test GCP deployment"
git push origin main
```

Acompanhe em: `https://github.com/SEU_USER/SEU_REPO/actions`

---

### **FASE 6: Configurar Domínio Customizado** (Opcional - 30 min)

#### 6.1. Atualizar DNS
No seu provedor de DNS (Registro.br, Cloudflare, etc), adicione:

```
Tipo: A
Nome: @
Valor: [IP do Load Balancer obtido no terraform output]
TTL: 300

Tipo: A
Nome: www
Valor: [IP do Load Balancer]
TTL: 300
```

#### 6.2. Atualizar Terraform com Domínio
Edite `terraform-gcp/terraform.tfvars`:
```hcl
domain_name = "couplesfinancials.com"
secondary_domain_name = "www.couplesfinancials.com"
```

Aplique:
```bash
cd terraform-gcp
terraform apply
```

#### 6.3. Aguardar Provisionamento SSL
O Google irá provisionar certificados SSL automaticamente. Pode levar **até 24 horas**.

Verificar status:
```bash
terraform output ssl_certificate_status
```

---

### **FASE 7: Migração de Assets do S3** (20 min)

Se você tem assets no S3 da AWS:

#### 7.1. Baixar Assets do S3
```bash
# Instalar AWS CLI (se necessário)
aws s3 sync s3://SEU_BUCKET_AWS ./temp-assets/
```

#### 7.2. Upload para Cloud Storage
```bash
# Upload para GCP
gsutil -m cp -r ./temp-assets/* gs://couples-financials-prod-couples-financials-assets/

# Tornar públicos (se necessário)
gsutil -m acl ch -u AllUsers:R gs://couples-financials-prod-couples-financials-assets/*
```

#### 7.3. Atualizar URLs no Código
Se há referências hardcoded para S3, atualize para Cloud Storage:
```
https://BUCKET.s3.amazonaws.com/file.jpg
→
https://storage.googleapis.com/BUCKET/file.jpg
```

---

### **FASE 8: Período de Testes (1-3 dias)**

#### 8.1. Testes Funcionais
- [ ] Login/Autenticação funciona
- [ ] CRUD de transações funciona
- [ ] Upload de arquivos funciona
- [ ] Gráficos e dashboards carregam
- [ ] Performance está adequada

#### 8.2. Testes de Performance
```bash
# Teste de carga com Apache Bench
ab -n 1000 -c 10 https://SEU_DOMINIO/

# Ou com hey
hey -n 1000 -c 10 https://SEU_DOMINIO/
```

#### 8.3. Monitorar Logs
```bash
# Logs do Cloud Run
gcloud run services logs read couples-financials --region=us-central1 --limit=50

# Logs em tempo real
gcloud run services logs tail couples-financials --region=us-central1
```

#### 8.4. Verificar Métricas
Acesse o console: https://console.cloud.google.com/run?project=SEU_PROJECT_ID

Verifique:
- ✅ Request count
- ✅ Request latency
- ✅ Error rate
- ✅ Instance count
- ✅ CPU/Memory usage

---

### **FASE 9: Cutover Final (30 min)**

#### 9.1. Backup Final da AWS
```bash
# Backup da configuração AWS
cd terraform/
terraform show > aws-state-backup.txt

# Backup de dados (se aplicável)
aws s3 sync s3://SEU_BUCKET ./backup-final/
```

#### 9.2. Redirecionar Tráfego 100% para GCP
Se estava usando DNS para split de tráfego, remova os registros AWS e mantenha apenas GCP.

#### 9.3. Monitorar Intensivamente (24-48h)
```bash
# Criar dashboard de monitoramento
# Acesse: https://console.cloud.google.com/monitoring/dashboards

# Configurar alertas
gcloud alpha monitoring policies create \
  --notification-channels=CHANNEL_ID \
  --display-name="High Error Rate" \
  --condition-threshold-value=5 \
  --condition-threshold-duration=60s
```

---

### **FASE 10: Descomissionar AWS (Após 7 dias)** (1 hora)

⚠️ **AGUARDE PELO MENOS 7 DIAS** antes de descomissionar AWS!

#### 10.1. Backup Final
```bash
# Snapshot de volumes EBS (se aplicável)
aws ec2 create-snapshot --volume-id vol-XXXXX

# Exportar configuração Terraform
cd terraform/
terraform state pull > aws-final-state.json
```

#### 10.2. Destruir Recursos AWS
```bash
cd terraform/

# CUIDADO: Isso remove TODOS os recursos AWS
terraform destroy

# Confirme digitando: yes
```

#### 10.3. Limpeza Final
- [ ] Cancelar reservas/savings plans AWS
- [ ] Remover Route 53 hosted zones
- [ ] Deletar buckets S3 vazios
- [ ] Remover secrets do Secrets Manager
- [ ] Desabilitar CloudWatch alarms

---

## 📊 Monitoramento Contínuo

### Dashboards Importantes

#### 1. Cloud Run
```
https://console.cloud.google.com/run/detail/us-central1/couples-financials/metrics
```

#### 2. Cloud CDN
```
https://console.cloud.google.com/net-services/loadbalancing/list
```

#### 3. Logs
```
https://console.cloud.google.com/logs/query
```

### Comandos Úteis
```bash
# Ver logs em tempo real
gcloud run services logs tail couples-financials --region=us-central1

# Ver serviços
gcloud run services list

# Atualizar serviço
gcloud run services update couples-financials --region=us-central1 --memory=1Gi

# Rollback (para revisão anterior)
gcloud run services update-traffic couples-financials \
  --region=us-central1 \
  --to-revisions=PREVIOUS_REVISION=100

# Invalidar cache CDN
gcloud compute url-maps invalidate-cdn-cache couples-financials-url-map --path="/*"
```

---

## 🆘 Troubleshooting

### Problema: "Permission denied"
```bash
gcloud auth application-default login
```

### Problema: "Billing not enabled"
- Habilite em: https://console.cloud.google.com/billing

### Problema: Cloud Run retorna 500
```bash
# Ver logs detalhados
gcloud run services logs read couples-financials --region=us-central1 --limit=50

# Verificar secrets
gcloud secrets versions access latest --secret=supabase-anon-key
```

### Problema: SSL não provisiona
- Aguarde até 24 horas
- Verifique DNS: `dig couplesfinancials.com`
- Verifique status: `terraform output ssl_certificate_status`

### Problema: Performance ruim
```bash
# Aumentar recursos
gcloud run services update couples-financials \
  --region=us-central1 \
  --cpu=2 \
  --memory=1Gi \
  --min-instances=1
```

---

## 🎯 Checklist de Sucesso

- [ ] Aplicação respondendo corretamente no GCP
- [ ] SSL configurado e funcionando
- [ ] Logs e métricas sendo coletados
- [ ] CI/CD funcionando automaticamente
- [ ] Performance igual ou melhor que AWS
- [ ] Custos reduzidos em ~40%
- [ ] Backups configurados
- [ ] Alertas configurados
- [ ] Documentação atualizada
- [ ] Time treinado nas novas ferramentas

---

## 📚 Recursos Adicionais

- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Terraform GCP Provider](https://registry.terraform.io/providers/hashicorp/google/latest/docs)
- [GCP Pricing Calculator](https://cloud.google.com/products/calculator)
- [Cloud Run Best Practices](https://cloud.google.com/run/docs/tips)
- [GCP Architecture Center](https://cloud.google.com/architecture)

---

## 💡 Dicas Finais

1. **Comece em horário de baixo tráfego** (madrugada/fim de semana)
2. **Mantenha AWS rodando em paralelo** por pelo menos 7 dias
3. **Configure alertas** antes do cutover final
4. **Documente problemas encontrados** para referência futura
5. **Treine a equipe** nas ferramentas GCP antes da migração
6. **Teste rollback** antes do cutover (criar revisão anterior e reverter)

---

## ✅ Conclusão

Seguindo este guia, você terá:
- ✅ Aplicação rodando no GCP
- ✅ ~40% de redução de custos
- ✅ Auto-scaling até zero instâncias
- ✅ CI/CD totalmente automatizado
- ✅ Monitoramento e logs centralizados
- ✅ SSL gerenciado gratuitamente

**Tempo total estimado**: 4-6 horas (+ período de testes)

**ROI**: Economia de ~$40-60/mês = ~$480-720/ano 💰
