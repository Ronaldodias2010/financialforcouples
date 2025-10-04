# 🚀 Quick Start - Deploy Imediato

## Executar AGORA - Passo a Passo

### ✅ Pré-requisito: Verificar Secrets do GitHub

Vá em: `Settings` → `Secrets and variables` → `Actions`

Confirme que existem estes secrets:
- ✅ `GCP_PROJECT_ID`
- ✅ `GCP_SERVICE_ACCOUNT_KEY`
- ✅ `SUPABASE_URL`
- ✅ `SUPABASE_ANON_KEY`
- ✅ `SUPABASE_SERVICE_ROLE_KEY`
- ✅ `TF_VAR_domain_name`
- ✅ `TF_VAR_secondary_domain_name`

---

## 🎯 PASSO 1: Inicializar Backend do Terraform

**No seu terminal (Windows PowerShell ou Git Bash):**

```bash
# 1. Navegar para a pasta do projeto
cd caminho/para/seu/projeto

# 2. Dar permissão de execução aos scripts
chmod +x scripts/*.sh

# 3. Autenticar no GCP (se ainda não fez)
gcloud auth login
gcloud config set project couplesfinancials

# 4. Executar script de inicialização (EXECUTAR APENAS UMA VEZ)
./scripts/init-terraform-backend.sh

# 5. IMPORTANTE: Após o primeiro terraform apply, execute:
./scripts/fix-service-account-permissions.sh
```

**Resultado esperado:**
```
✅ Backend do Terraform inicializado!
Bucket: gs://couplesfinancials-terraform-state
✅ Permissões corrigidas!
```

---

## 🎯 PASSO 2: Commit e Push para GitHub

**No terminal:**

```bash
# 1. Verificar arquivos modificados
git status

# 2. Adicionar todos os arquivos
git add .

# 3. Fazer commit
git commit -m "feat: implementar deploy automatizado com Terraform e GitHub Actions"

# 4. Push para main (isso vai acionar os workflows automaticamente)
git push origin main
```

**O que vai acontecer automaticamente:**

1. ⚙️ **Terraform Apply Workflow** vai executar (~5-10 minutos)
   - Provisionar Load Balancer
   - Criar Cloud Run service
   - Configurar SSL certificate
   - Habilitar Cloud CDN
   - Criar Storage buckets

2. 🚀 **Deploy Application Workflow** vai executar depois (~3-5 minutos)
   - Build Docker image
   - Push para Artifact Registry
   - Deploy no Cloud Run
   - Smoke tests

---

## 🎯 PASSO 3: Acompanhar Execução

**Ir para GitHub:**

1. Abra: `https://github.com/SEU_USERNAME/SEU_REPO/actions`
2. Você verá 2 workflows rodando:
   - ⚙️ `Terraform Apply`
   - 🚀 `Deploy Application to GCP`

**Aguardar conclusão (~10-15 minutos total)**

---

## 🎯 PASSO 4: Capturar Load Balancer IP

Após `Terraform Apply` concluir com sucesso:

**Opção A - Via GitHub Actions:**
1. Clique no workflow `Terraform Apply`
2. Veja a seção **Summary**
3. Anote o **Load Balancer IP**: `34.xxx.xxx.xxx`

**Opção B - Via Terminal:**
```bash
cd terraform-gcp
terraform output load_balancer_ip
```

---

## 🎯 PASSO 5: Configurar DNS

**Com o Load Balancer IP em mãos:**

### Se seus domínios estão no GoDaddy:
1. Acesse: https://dnsmanagement.godaddy.com/
2. Selecione `couplesfinancials.com`
3. DNS → Manage Zones
4. Adicionar registro:
   ```
   Type: A
   Name: @
   Value: [SEU_LOAD_BALANCER_IP]
   TTL: 600
   ```
5. Salvar
6. Repetir para `couplesfin.com`

### Se estão em outro provedor:
Consulte: `docs/DNS-CONFIGURATION.md`

---

## 🎯 PASSO 6: Verificar Status

**Após ~30 minutos (aguardar propagação DNS):**

```bash
# Verificar tudo de uma vez
./scripts/check-deployment-status.sh
```

**Ou manualmente:**

```bash
# 1. Testar DNS
dig couplesfinancials.com @8.8.8.8 +short
# Deve retornar: 34.xxx.xxx.xxx (seu Load Balancer IP)

# 2. Testar HTTPS
curl -I https://couplesfinancials.com
# Deve retornar: HTTP/2 200

# 3. Verificar SSL
gcloud compute ssl-certificates describe couples-financials-cert --global --format="value(managed.status)"
# Deve mostrar: ACTIVE (após DNS propagar)
```

---

## 🎯 PASSO 7: Acessar Aplicação

Após DNS e SSL configurados:

- ✅ https://couplesfinancials.com
- ✅ https://couplesfin.com

---

## ⚡ Resumo dos Comandos (Copiar e Colar)

```bash
# 1. Inicializar backend (UMA VEZ APENAS)
chmod +x scripts/*.sh
gcloud auth login
gcloud config set project couplesfinancials
./scripts/init-terraform-backend.sh

# 2. Deploy via GitHub
git add .
git commit -m "feat: deploy automatizado implementado"
git push origin main

# 3. Aguardar workflows (~15 min)
# Acessar: https://github.com/SEU_USERNAME/SEU_REPO/actions

# 4. Capturar IP
cd terraform-gcp
terraform output load_balancer_ip

# 5. Configurar DNS no provedor
# (usar IP capturado acima)

# 6. Verificar status (após ~30 min)
./scripts/check-deployment-status.sh

# 7. Acessar aplicação
# https://couplesfinancials.com
```

---

## 🐛 Se algo der errado

### ❌ Erro: Permission 'iam.serviceaccounts.actAs' denied
```bash
# Execute o script de correção
./scripts/fix-service-account-permissions.sh

# Ou manualmente:
gcloud iam service-accounts add-iam-policy-binding \
  couples-financials-run-sa@couplesfinancials.iam.gserviceaccount.com \
  --member="serviceAccount:github-actions-sa@couplesfinancials.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"

# Depois re-execute o workflow no GitHub Actions
```

### Workflow falhou?
```bash
# Ver logs no GitHub Actions
# Ou executar Terraform localmente:
./scripts/terraform-local-apply.sh
```

### DNS não propaga?
```bash
# Verificar propagação global
# https://dnschecker.org

# Testar DNS manualmente
dig couplesfinancials.com @8.8.8.8
```

### SSL não provisiona?
```bash
# Verificar status
gcloud compute ssl-certificates describe couples-financials-cert --global

# Aguardar até 15 minutos após DNS propagar
```

### Mais ajuda?
- 🔧 Troubleshooting completo: `docs/TROUBLESHOOTING-GCP.md`
- 📚 Documentação: `docs/DEPLOY-TERRAFORM-GITHUB.md`

---

## 📞 Suporte

- 📚 Documentação completa: `docs/DEPLOY-TERRAFORM-GITHUB.md`
- 🌐 Configuração DNS: `docs/DNS-CONFIGURATION.md`
- 🔍 Verificação: `scripts/check-deployment-status.sh`
- 📊 GitHub Actions: `https://github.com/SEU_USERNAME/SEU_REPO/actions`

---

## ✅ Checklist Final

- [ ] Backend do Terraform inicializado
- [ ] Código commitado e pushed para GitHub
- [ ] Workflow Terraform Apply concluído
- [ ] Workflow Deploy Application concluído
- [ ] Load Balancer IP capturado
- [ ] DNS A records configurados
- [ ] DNS propagou (verificado em dnschecker.org)
- [ ] SSL certificate está ACTIVE
- [ ] Site acessível via HTTPS
- [ ] Ambos domínios funcionando

🎉 **Deploy completo!**
