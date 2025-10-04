# Guia de Deploy - Couples Financials

## 🚀 Deploy Automático em 6 Passos

### Pré-requisitos
- Conta GCP com projeto `couplesfinancials` criado
- Billing habilitado no projeto
- Git Bash ou terminal Linux/Mac
- gcloud CLI instalado e configurado

---

## Execução Rápida

### 1️⃣ Executar Script Master

```bash
# Dar permissão de execução
chmod +x scripts/deploy-master.sh

# Executar
./scripts/deploy-master.sh
```

O script vai guiar você por todo o processo:
- ✅ Verificar pré-requisitos
- ✅ Autenticar no GCP
- ✅ Configurar projeto GCP (APIs, Service Account, Secrets)
- ✅ Criar bucket do Terraform
- ✅ Verificar GitHub Secrets
- ✅ Fazer commit e push

---

## 2️⃣ Configurar GitHub Secrets

Acesse: `https://github.com/SEU_USUARIO/SEU_REPO/settings/secrets/actions`

### Secrets Obrigatórios:

```bash
GCP_PROJECT_ID=couplesfinancials

# Conteúdo do arquivo gcp-key.json (em base64 ou JSON direto)
GCP_SA_KEY=<conteúdo do gcp-key.json>

SUPABASE_URL=https://elxttabdtddlavhseipz.supabase.co
SUPABASE_ANON_KEY=<sua_anon_key>
SUPABASE_SERVICE_ROLE_KEY=<sua_service_role_key>
```

### Secrets Opcionais (para DNS):
```bash
DOMAIN_NAME=couplesfinancials.com
WWW_DOMAIN_NAME=www.couplesfinancials.com
```

**Para obter o conteúdo do GCP_SA_KEY:**
```bash
cat gcp-key.json
# Ou em base64:
cat gcp-key.json | base64
```

---

## 3️⃣ Fazer Commit e Push

O script master já faz isso, mas se precisar fazer manualmente:

```bash
# Configurar suas credenciais Git
git config --global user.name "ronaldo"
git config --global user.email "ronadias2010@gmail.com"

# Adicionar mudanças
git add .

# Commit
git commit -m "feat: configuração completa para deploy GCP"

# Push
git push origin main
```

---

## 4️⃣ Acompanhar Deploy no GitHub Actions

1. Acesse: `https://github.com/SEU_USUARIO/SEU_REPO/actions`
2. Primeiro executa: **Terraform Apply** (cria infraestrutura)
3. Depois executa: **Deploy to GCP** (faz deploy da aplicação)

---

## 5️⃣ Capturar IP do Load Balancer

Após o **Terraform Apply** terminar:

### Opção A - Via GitHub Actions:
- Vá na aba **Summary** do workflow
- Copie o **Load Balancer IP**

### Opção B - Via terminal:
```bash
gcloud compute addresses describe couples-financials-ip --global --format="value(address)"
```

---

## 6️⃣ Configurar DNS

Aponte seus domínios para o IP capturado:

```
Tipo: A
Nome: @
Valor: <IP_DO_LOAD_BALANCER>
TTL: 3600

Tipo: A
Nome: www
Valor: <IP_DO_LOAD_BALANCER>
TTL: 3600
```

---

## 🔍 Verificar Status

```bash
# Verificar status completo
./scripts/check-deploy-status.sh

# Ver logs do Cloud Run
gcloud run services logs read couples-financials --region=us-central1 --limit=50

# Verificar serviço
gcloud run services describe couples-financials --region=us-central1
```

---

## ⚠️ Solução de Problemas

### Erro: "Bucket doesn't exist"
```bash
./scripts/init-terraform-backend.sh
```

### Erro: "Permission denied on service account"
O Terraform já corrigiu as permissões. Espere o workflow terminar e tente novamente.

### Erro: "SSL Certificate FAILED_NOT_VISIBLE"
Aguarde 10-30 minutos após configurar o DNS. O Google precisa validar o domínio.

### Verificar se DNS propagou:
```bash
nslookup couplesfinancials.com
# Deve retornar o IP do Load Balancer
```

---

## 📱 Links Úteis

- **Cloud Run Console**: https://console.cloud.google.com/run?project=couplesfinancials
- **Logs**: https://console.cloud.google.com/logs/query?project=couplesfinancials
- **Artifact Registry**: https://console.cloud.google.com/artifacts?project=couplesfinancials
- **Load Balancer**: https://console.cloud.google.com/net-services/loadbalancing?project=couplesfinancials

---

## 🎯 Resumo dos Comandos

```bash
# Setup completo
./scripts/deploy-master.sh

# Verificar status
./scripts/check-deploy-status.sh

# Ver logs
gcloud run services logs read couples-financials --region=us-central1 --limit=50

# Capturar IP
gcloud compute addresses describe couples-financials-ip --global --format="value(address)"

# Forçar novo deploy (se necessário)
git commit --allow-empty -m "chore: trigger deploy"
git push origin main
```

---

## ✅ Checklist de Deploy

- [ ] gcloud CLI instalado
- [ ] Autenticado no GCP (`gcloud auth login`)
- [ ] Projeto GCP criado com billing
- [ ] Script master executado (`./scripts/deploy-master.sh`)
- [ ] GitHub Secrets configurados
- [ ] Código commitado e pushed
- [ ] Terraform Apply concluído com sucesso
- [ ] Deploy GCP concluído com sucesso
- [ ] IP do Load Balancer capturado
- [ ] DNS configurado
- [ ] SSL Certificate provisionado (aguardar 10-30 min)
- [ ] Aplicação acessível via HTTPS

---

## 🆘 Precisa de Ajuda?

1. Execute: `./scripts/check-deploy-status.sh`
2. Verifique os logs no GitHub Actions
3. Consulte: `docs/DEPLOY-TERRAFORM-GITHUB.md`
