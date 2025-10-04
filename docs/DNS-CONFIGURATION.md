# Guia de Configuração DNS

## 📋 Informações Necessárias

Antes de começar, você precisa do **Load Balancer IP** obtido após o `terraform apply`.

**Onde encontrar:**
1. GitHub Actions → Workflow `Terraform Apply` → Summary
2. Ou executar: `cd terraform-gcp && terraform output load_balancer_ip`

**Exemplo de IP:** `34.110.xxx.xxx`

## 🌐 Domínios a Configurar

- `couplesfinancials.com` (principal)
- `couplesfin.com` (secundário)

## ⚙️ Configuração por Provedor

### GoDaddy

1. Acesse [dns.godaddy.com](https://dnsmanagement.godaddy.com/)
2. Selecione o domínio `couplesfinancials.com`
3. Clique em **DNS** → **Manage Zones**
4. Adicionar/Editar registros:

```
Type: A
Name: @
Value: 34.110.xxx.xxx (seu Load Balancer IP)
TTL: 600 seconds (ou 10 minutes)
```

5. Salvar
6. Repetir para `couplesfin.com`

**Importante:** Remova qualquer registro A existente apontando para outro IP.

### Cloudflare

1. Acesse [dash.cloudflare.com](https://dash.cloudflare.com)
2. Selecione o domínio `couplesfinancials.com`
3. Vá em **DNS** → **Records**
4. Adicionar/Editar registro:

```
Type: A
Name: @ (ou deixe em branco)
IPv4 address: 34.110.xxx.xxx
Proxy status: DNS only (nuvem cinza) ⚠️ IMPORTANTE
TTL: Auto
```

**⚠️ CRÍTICO:** Desabilite o proxy do Cloudflare (nuvem cinza) para que o certificado SSL do Google seja usado.

5. Salvar
6. Repetir para `couplesfin.com`

### Registro.br

1. Acesse [registro.br](https://registro.br)
2. Login → Meus Domínios
3. Selecione `couplesfinancials.com`
4. Alterar Servidores DNS → **Usar DNS do Registro.br**
5. Editar Zona:

```
@ IN A 34.110.xxx.xxx
```

6. TTL: 600 (10 minutos)
7. Salvar
8. Repetir para `couplesfin.com`

### Namecheap

1. Acesse [namecheap.com](https://www.namecheap.com)
2. Account → Domain List
3. Manage `couplesfinancials.com`
4. Advanced DNS
5. Adicionar/Editar A Record:

```
Type: A Record
Host: @
Value: 34.110.xxx.xxx
TTL: 600 (10 min)
```

6. Salvar
7. Repetir para `couplesfin.com`

### AWS Route 53

1. Acesse [console.aws.amazon.com/route53](https://console.aws.amazon.com/route53)
2. Hosted Zones → Selecione `couplesfinancials.com`
3. Create Record:

```
Record name: (deixe em branco)
Record type: A
Value: 34.110.xxx.xxx
TTL: 300
Routing policy: Simple routing
```

4. Create Records
5. Repetir para `couplesfin.com`

### Google Domains (Cloud Domains)

1. Acesse [domains.google](https://domains.google)
2. Meus domínios → `couplesfinancials.com`
3. DNS
4. Gerenciar registros personalizados
5. Criar novo registro:

```
Host name: @
Type: A
TTL: 10 minutes
Data: 34.110.xxx.xxx
```

6. Salvar
7. Repetir para `couplesfin.com`

## ⏱️ Tempo de Propagação

| Provedor | Tempo Típico | Máximo |
|----------|--------------|--------|
| GoDaddy | 1-2 horas | 48 horas |
| Cloudflare | 5-15 minutos | 24 horas |
| Registro.br | 2-4 horas | 48 horas |
| Namecheap | 30 min - 2 horas | 48 horas |
| Route 53 | 5-15 minutos | 24 horas |
| Google Domains | 10-30 minutos | 48 horas |

## 🔍 Verificar Propagação

### Online (Recomendado)

1. **DNS Checker** (melhor opção)
   - https://dnschecker.org
   - Digite: `couplesfinancials.com`
   - Tipo: A
   - Verificar se IP está correto em múltiplos locations

2. **What's My DNS**
   - https://www.whatsmydns.net
   - Digite: `couplesfinancials.com`
   - Tipo: A

3. **Google Admin Toolbox**
   - https://toolbox.googleapps.com/apps/dig/
   - Digite: `couplesfinancials.com`
   - Tipo: A

### Linha de Comando

#### Windows (PowerShell)
```powershell
# Resolver DNS
nslookup couplesfinancials.com 8.8.8.8

# Verificar ambos os domínios
nslookup couplesfinancials.com 8.8.8.8
nslookup couplesfin.com 8.8.8.8
```

#### Linux / macOS
```bash
# Usar dig (mais detalhado)
dig couplesfinancials.com @8.8.8.8

# Usar nslookup
nslookup couplesfinancials.com 8.8.8.8

# Verificar propagação em múltiplos DNS servers
for server in 8.8.8.8 1.1.1.1 208.67.222.222; do
  echo "=== DNS Server: $server ==="
  dig couplesfinancials.com @$server +short
done
```

## ✅ Validação Completa

### 1. DNS Está Correto?
```bash
dig couplesfinancials.com @8.8.8.8 +short
# Deve retornar: 34.110.xxx.xxx (seu Load Balancer IP)
```

### 2. HTTP Funciona?
```bash
curl -I http://couplesfinancials.com
# Deve retornar: HTTP/1.1 301 Moved Permanently (redirect para HTTPS)
```

### 3. HTTPS Funciona?
```bash
curl -I https://couplesfinancials.com
# Deve retornar: HTTP/2 200
```

### 4. Certificado SSL Válido?
```bash
# Linux/macOS
openssl s_client -connect couplesfinancials.com:443 -servername couplesfinancials.com < /dev/null | grep "Verify return code"
# Deve retornar: Verify return code: 0 (ok)

# Ou use o browser
# Abra https://couplesfinancials.com
# Clique no cadeado → Certificado deve ser válido
```

### 5. Ambos os Domínios Funcionam?
```bash
curl -I https://couplesfinancials.com
curl -I https://couplesfin.com
# Ambos devem retornar HTTP/2 200
```

## 🐛 Troubleshooting DNS

### DNS não resolve (NXDOMAIN)

**Sintomas:**
```bash
dig couplesfinancials.com @8.8.8.8
# status: NXDOMAIN
```

**Causas e soluções:**
1. **Registro A não foi criado** → Criar registro A no provedor
2. **Mudanças ainda não propagaram** → Aguardar (verificar em dnschecker.org)
3. **Domínio expirado** → Renovar domínio
4. **Nameservers incorretos** → Verificar nameservers no registrar

### DNS resolve para IP errado

**Sintomas:**
```bash
dig couplesfinancials.com @8.8.8.8 +short
# Retorna: 1.2.3.4 (IP errado)
```

**Solução:**
1. Editar registro A no provedor DNS
2. Aguardar propagação
3. Limpar cache local:
```bash
# Windows
ipconfig /flushdns

# Linux
sudo systemd-resolve --flush-caches

# macOS
sudo dscacheutil -flushcache
```

### Certificado SSL não provisiona

**Sintomas:**
```bash
gcloud compute ssl-certificates describe couples-financials-cert --global --format="value(managed.status)"
# FAILED_NOT_VISIBLE ou PROVISIONING por muito tempo
```

**Solução:**
1. **Verificar DNS primeiro:**
```bash
dig couplesfinancials.com @8.8.8.8 +short
dig couplesfin.com @8.8.8.8 +short
# Ambos devem retornar o Load Balancer IP
```

2. **Se DNS correto, aguardar até 15 minutos**

3. **Se ainda falhar após 15 min:**
```bash
# Ver detalhes do certificado
gcloud compute ssl-certificates describe couples-financials-cert --global

# Verificar domínios na configuração
gcloud compute ssl-certificates describe couples-financials-cert --global --format="value(managed.domains)"
```

### HTTPS retorna erro de certificado

**Sintomas:**
```bash
curl https://couplesfinancials.com
# curl: (60) SSL certificate problem
```

**Causas:**
1. **SSL ainda provisionando** → Aguardar (até 15 min após DNS propagar)
2. **DNS não propagou** → Verificar com dnschecker.org
3. **Cloudflare proxy ativo** → Desabilitar proxy (nuvem cinza)

### Site carrega mas imagens não aparecem

**Causa:** CORS ou CDN não configurado.

**Verificar:**
```bash
# Testar storage bucket
gsutil ls gs://couplesfinancials-couples-financials-assets

# Verificar se bucket é público
gsutil iam get gs://couplesfinancials-couples-financials-assets
```

## 🔄 Atualizar DNS (Mudanças Futuras)

Se precisar mudar o IP (novo deploy, etc.):

1. Executar Terraform e capturar novo IP
2. Atualizar registros A nos provedores DNS
3. Aguardar propagação (TTL definido)
4. Novo certificado SSL será provisionado automaticamente

## 📚 Referências

- [Google Cloud DNS Documentation](https://cloud.google.com/dns/docs)
- [SSL Certificate Troubleshooting](https://cloud.google.com/load-balancing/docs/ssl-certificates/troubleshooting)
- [DNS Propagation Checker](https://dnschecker.org)
- [DNSViz - DNS Visualization](https://dnsviz.net)

## 💡 Dicas Importantes

1. **Sempre use TTL baixo** (300-600 segundos) para mudanças mais rápidas
2. **Desabilite proxy do Cloudflare** se usar (nuvem cinza)
3. **Aguarde propagação antes de testar SSL**
4. **Use dnschecker.org** para verificar propagação global
5. **Teste em modo anônimo** do browser (evita cache)
6. **Documente o IP do Load Balancer** para referência futura
7. **Configure ambos os domínios** (principal e secundário)
8. **Não delete registros antigos** até confirmar que novos funcionam

## ✨ Após Configuração

Uma vez que DNS e SSL estejam funcionando:

1. ✅ Site acessível via HTTPS
2. ✅ Certificado SSL válido
3. ✅ Ambos domínios funcionando
4. ✅ Redirect HTTP → HTTPS automático
5. ✅ Cloud CDN distribuindo conteúdo globalmente

**Próximo passo:** Monitorar uptime e performance em [Cloud Console](https://console.cloud.google.com/run).
