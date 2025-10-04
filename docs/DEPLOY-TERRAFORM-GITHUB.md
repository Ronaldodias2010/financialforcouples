# Guia Completo de Deploy com Terraform e GitHub Actions

## 📋 Índice

1. [Pré-requisitos](#pré-requisitos)
2. [Configuração de Secrets](#configuração-de-secrets)
3. [Inicialização do Backend](#inicialização-do-backend)
4. [Execução via GitHub Actions](#execução-via-github-actions)
5. [Configuração DNS](#configuração-dns)
6. [Verificação do Deploy](#verificação-do-deploy)
7. [Troubleshooting](#troubleshooting)

## 🔧 Pré-requisitos

### Contas e Serviços
- ✅ Conta GCP ativa com billing habilitado
- ✅ Projeto GCP criado: `couplesfinancials`
- ✅ Conta Supabase configurada
- ✅ Repositório GitHub com o código
- ✅ Domínios registrados:
  - `couplesfinancials.com`
  - `couplesfin.com`

### Ferramentas Locais (para execução manual)
- Google Cloud SDK (`gcloud`)
- Terraform >= 1.6.0
- Bash shell

## 🔐 Configuração de Secrets

### 1. Service Account do GCP

**Criar Service Account:**
```bash
# Criar service account
gcloud iam service-accounts create github-actions \
  --display-name="GitHub Actions" \
  --project=couplesfinancials

# Conceder permissões necessárias
gcloud projects add-iam-policy-binding couplesfinancials \
  --member="serviceAccount:github-actions@couplesfinancials.iam.gserviceaccount.com" \
  --role="roles/editor"

gcloud projects add-iam-policy-binding couplesfinancials \
  --member="serviceAccount:github-actions@couplesfinancials.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"

# Gerar chave JSON
gcloud iam service-accounts keys create gcp-key.json \
  --iam-account=github-actions@couplesfinancials.iam.gserviceaccount.com
```

### 2. Secrets do GitHub

Vá em `Settings` → `Secrets and variables` → `Actions` e adicione:

| Secret Name | Descrição | Exemplo |
|-------------|-----------|---------|
| `GCP_PROJECT_ID` | ID do projeto GCP | `couplesfinancials` |
| `GCP_SERVICE_ACCOUNT_KEY` | Conteúdo completo do `gcp-key.json` | `{"type": "service_account",...}` |
| `SUPABASE_URL` | URL do projeto Supabase | `https://elxttabdtddlavhseipz.supabase.co` |
| `SUPABASE_ANON_KEY` | Chave pública anônima | `eyJhbGci...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave de service role | `eyJhbGci...` |
| `TF_VAR_domain_name` | Domínio principal | `couplesfinancials.com` |
| `TF_VAR_secondary_domain_name` | Domínio secundário | `couplesfin.com` |

### 3. Verificar Secrets

```bash
# Listar secrets configurados
gh secret list
```

## 🚀 Inicialização do Backend

### Executar Script de Inicialização

O backend do Terraform armazena o state no Google Cloud Storage.

**Uma única vez, execute:**

```bash
# Autenticar no GCP
gcloud auth login
gcloud config set project couplesfinancials

# Dar permissão de execução
chmod +x scripts/init-terraform-backend.sh

# Executar
./scripts/init-terraform-backend.sh
```

**O que o script faz:**
- ✅ Cria bucket GCS: `couplesfinancials-terraform-state`
- ✅ Habilita versionamento do bucket
- ✅ Configura lifecycle policy (manter últimas 5 versões)
- ✅ Configura labels e metadata
- ✅ Configura encryption

**Resultado esperado:**
```
✅ Backend do Terraform inicializado!
Bucket: gs://couplesfinancials-terraform-state
```

## ⚙️ Execução via GitHub Actions

### Fluxo Automático

#### 1. Pull Request (Terraform Plan)

Quando você cria um PR que modifica arquivos em `terraform-gcp/`:

```bash
git checkout -b feature/new-infra
# Fazer mudanças em terraform-gcp/
git add terraform-gcp/
git commit -m "feat: adicionar nova configuração"
git push origin feature/new-infra
```

**O que acontece:**
- ✅ GitHub Actions executa `terraform plan`
- ✅ Resultado é postado como comentário no PR
- ✅ Você pode revisar mudanças antes do merge

#### 2. Merge na Main (Terraform Apply)

Quando você faz merge do PR na branch `main`:

```bash
git checkout main
git merge feature/new-infra
git push origin main
```

**O que acontece:**
1. ✅ **Terraform Apply Workflow** executa automaticamente
2. ✅ Provisiona toda a infraestrutura:
   - Cloud Run service
   - Load Balancer global
   - Certificado SSL gerenciado
   - Cloud CDN
   - Storage buckets
   - Secret Manager
3. ✅ **Deployment Workflow** executa depois:
   - Build da imagem Docker
   - Push para Artifact Registry
   - Deploy no Cloud Run
   - Smoke tests

#### 3. Capturar Outputs

Após o `terraform apply`, os outputs são salvos como **artifacts** no GitHub Actions.

**Ver outputs:**
1. Vá em `Actions` → workflow `Terraform Apply`
2. Clique no run mais recente
3. Na seção **Summary**, você verá:
   - Load Balancer IP
   - Cloud Run URL
   - SSL Certificate Status
   - DNS Records necessários
4. Baixe o artifact `terraform-outputs` para ver JSON completo

**Exemplo de output:**
```json
{
  "load_balancer_ip": {
    "value": "34.110.xxx.xxx"
  },
  "cloud_run_url": {
    "value": "https://couples-financials-xxx-uc.a.run.app"
  },
  "ssl_certificate_status": {
    "value": "PROVISIONING"
  },
  "dns_records": {
    "value": {
      "primary_domain": {
        "type": "A",
        "name": "couplesfinancials.com",
        "value": "34.110.xxx.xxx"
      },
      "secondary_domain": {
        "type": "A",
        "name": "couplesfin.com",
        "value": "34.110.xxx.xxx"
      }
    }
  }
}
```

## 🌐 Configuração DNS

Após receber o **Load Balancer IP** dos outputs do Terraform, configure os DNS A records no seu provedor de domínios.

**Consulte o guia detalhado:** [DNS-CONFIGURATION.md](./DNS-CONFIGURATION.md)

### Configuração Básica

| Domínio | Tipo | Nome | Valor (IP do LB) |
|---------|------|------|------------------|
| couplesfinancials.com | A | @ | `34.110.xxx.xxx` |
| couplesfin.com | A | @ | `34.110.xxx.xxx` |

### Tempo de Propagação

- **Mínimo**: 15-30 minutos
- **Máximo**: 48 horas
- **Típico**: 1-2 horas

**Verificar propagação:**
- https://dnschecker.org
- `dig couplesfinancials.com @8.8.8.8`
- `nslookup couplesfinancials.com 8.8.8.8`

## ✅ Verificação do Deploy

### Script Automático

```bash
chmod +x scripts/check-deployment-status.sh
./scripts/check-deployment-status.sh
```

**O que o script verifica:**
1. ✅ Cloud Run service status
2. ✅ Load Balancer IP
3. ✅ Cloud CDN habilitado
4. ✅ Certificado SSL status
5. ✅ DNS configuração e propagação
6. ✅ Storage buckets

### Verificações Manuais

#### 1. Cloud Run
```bash
gcloud run services describe couples-financials \
  --region=us-central1 \
  --format="value(status.url)"
```

#### 2. Load Balancer
```bash
gcloud compute addresses describe couples-financials-ip \
  --global \
  --format="value(address)"
```

#### 3. SSL Certificate
```bash
gcloud compute ssl-certificates describe couples-financials-cert \
  --global \
  --format="value(managed.status)"
```

**Status do SSL:**
- `PROVISIONING` → Aguardar (até 15 min após DNS propagar)
- `FAILED_NOT_VISIBLE` → DNS não configurado/propagado
- `ACTIVE` → ✅ Funcionando

#### 4. Testar Endpoints

```bash
# Cloud Run direto
SERVICE_URL=$(gcloud run services describe couples-financials --region=us-central1 --format="value(status.url)")
curl -I $SERVICE_URL

# Via domínio (após DNS e SSL)
curl -I https://couplesfinancials.com
curl -I https://couplesfin.com
```

## 🔧 Troubleshooting

### Erro: "Terraform state locked"

**Causa:** Execução anterior não terminou ou falhou.

**Solução:**
```bash
cd terraform-gcp
terraform force-unlock <LOCK_ID>
```

### Erro: "SSL Certificate FAILED_NOT_VISIBLE"

**Causa:** DNS não está configurado ou não propagou.

**Solução:**
1. Verificar configuração DNS no provedor
2. Aguardar propagação (usar https://dnschecker.org)
3. Após propagação, o SSL será provisionado automaticamente (até 15 min)

### Erro: "Service not found" no Cloud Run

**Causa:** Primeira execução do Terraform ainda não completou.

**Solução:**
1. Verificar logs do workflow `Terraform Apply`
2. Se necessário, executar manualmente:
```bash
./scripts/terraform-local-apply.sh
```

### Erro: "Permission denied" no GCP

**Causa:** Service account sem permissões adequadas.

**Solução:**
```bash
# Conceder roles necessários
gcloud projects add-iam-policy-binding couplesfinancials \
  --member="serviceAccount:github-actions@couplesfinancials.iam.gserviceaccount.com" \
  --role="roles/editor"
```

### Workflow não executa automaticamente

**Verificar:**
1. Branch está na `main`
2. Mudanças estão em `terraform-gcp/` ou `.github/workflows/`
3. Secrets estão configurados corretamente
4. GitHub Actions está habilitado no repo

### DNS não propaga

**Verificar:**
1. A records configurados corretamente (tipo A, nome @)
2. IP correto (do Load Balancer, não do Cloud Run)
3. TTL baixo (300-600 segundos) para propagação mais rápida
4. Usar `dig` ou `nslookup` para testar:
```bash
dig couplesfinancials.com @8.8.8.8
nslookup couplesfinancials.com 8.8.8.8
```

### Application não responde

**Verificar em ordem:**
1. Cloud Run está rodando: `gcloud run services list`
2. Load Balancer backend está healthy
3. DNS aponta para IP correto
4. SSL certificate está ACTIVE
5. Firewall rules permitem tráfego

**Ver logs:**
```bash
# Cloud Run logs
gcloud run services logs read couples-financials --region=us-central1 --limit=50

# Load Balancer logs
gcloud logging read "resource.type=http_load_balancer" --limit=50
```

## 📝 Comandos Úteis

### Terraform

```bash
# Ver outputs
cd terraform-gcp
terraform output

# Ver outputs em JSON
terraform output -json

# Refresh state
terraform refresh

# Destroy tudo (cuidado!)
terraform destroy
```

### GCP

```bash
# Ver todos os recursos
gcloud run services list
gcloud compute addresses list
gcloud compute backend-services list
gcloud compute ssl-certificates list

# Ver logs
gcloud run services logs read couples-financials --region=us-central1
gcloud logging read "resource.type=cloud_run_revision" --limit=100

# Ver custos estimados
gcloud billing accounts list
```

### GitHub Actions

```bash
# Ver workflows
gh workflow list

# Ver runs de um workflow
gh run list --workflow=terraform-apply.yml

# Ver logs de um run
gh run view <RUN_ID> --log
```

## 🎯 Checklist de Deploy Completo

- [ ] Backend do Terraform inicializado
- [ ] Secrets configurados no GitHub
- [ ] Código commitado na branch main
- [ ] Terraform Apply executou com sucesso
- [ ] Load Balancer IP capturado
- [ ] DNS A records configurados
- [ ] DNS propagação verificada
- [ ] SSL Certificate está ACTIVE
- [ ] Application responde via HTTPS
- [ ] Cloud CDN funcionando
- [ ] Smoke tests passando

## 📚 Referências

- [Terraform Google Provider](https://registry.terraform.io/providers/hashicorp/google/latest/docs)
- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Cloud Load Balancing](https://cloud.google.com/load-balancing/docs)
- [Cloud CDN](https://cloud.google.com/cdn/docs)
- [GitHub Actions](https://docs.github.com/en/actions)
