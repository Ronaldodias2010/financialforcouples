# 🌐 Configuração Multi-Domínio

Este guia explica como configurar e fazer deploy da aplicação com **múltiplos domínios** (couplesfinancials.com + couplesfin.com).

## 📋 Pré-requisitos

### 1. Domínios Registrados
Você deve ter AMBOS os domínios registrados e com acesso ao painel DNS:
- ✅ `couplesfinancials.com`
- ✅ `couplesfin.com`

### 2. Zonas Route53 Criadas
Crie zonas hospedadas (Hosted Zones) no AWS Route53 para cada domínio:

```bash
# Criar zona para domínio principal
aws route53 create-hosted-zone \
  --name couplesfinancials.com \
  --caller-reference "couples-$(date +%s)"

# Criar zona para domínio secundário
aws route53 create-hosted-zone \
  --name couplesfin.com \
  --caller-reference "couples-secondary-$(date +%s)"
```

### 3. Configurar Name Servers
Após criar as zonas, o Route53 fornecerá 4 name servers para cada domínio. 

**Configure estes name servers no seu registrador de domínios:**
- No painel do registrador (ex: GoDaddy, Namecheap, Registro.br)
- Substitua os name servers padrão pelos fornecidos pelo Route53
- Aguarde propagação DNS (pode levar até 48 horas)

**Exemplo de name servers Route53:**
```
ns-123.awsdns-45.com
ns-678.awsdns-90.net
ns-1234.awsdns-56.org
ns-5678.awsdns-78.co.uk
```

## 🚀 Deploy com Múltiplos Domínios

### Passo 1: Configurar terraform.tfvars

Copie o arquivo de exemplo:
```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars
```

Edite `terraform.tfvars` e configure AMBOS os domínios:
```hcl
domain_name = "couplesfinancials.com"
secondary_domain_name = "couplesfin.com"
```

### Passo 2: Deploy com Script

```bash
# Deploy completo com CloudFront e ambos domínios
./scripts/deploy.sh
```

Ou manualmente com Terraform:
```bash
cd terraform
terraform init
terraform plan
terraform apply
```

### Passo 3: Verificar Certificado SSL

O Terraform criará **UM único certificado ACM** que cobre AMBOS os domínios através de **SANs (Subject Alternative Names)**.

**Validação automática:**
- O Terraform criará registros DNS em ambas as zonas Route53
- A validação será automática (pode levar 5-30 minutos)
- O CloudFront usará este certificado único para ambos os domínios

**Verificar status:**
```bash
# Verificar certificado
aws acm describe-certificate \
  --certificate-arn $(terraform output -raw ssl_certificate_arn)

# Deve mostrar:
# - DomainName: couplesfinancials.com
# - SubjectAlternativeNames: [couplesfinancials.com, couplesfin.com]
# - Status: ISSUED
```

## 🔍 Verificação Pós-Deploy

### 1. Testar Ambos Domínios

```bash
# Domínio principal
curl -I https://couplesfinancials.com
# Deve retornar: HTTP/2 200

# Domínio secundário
curl -I https://couplesfin.com
# Deve retornar: HTTP/2 200
```

### 2. Verificar CloudFront

```bash
# Ver distribuição
./scripts/cloudfront-utils.sh status

# Ver URLs configuradas
terraform output all_domains
# Saída: couplesfinancials.com, couplesfin.com
```

### 3. Health Check

```bash
# ALB direto
curl http://$(terraform output -raw alb_dns_name)/health

# Através do CloudFront (ambos domínios)
curl https://couplesfinancials.com/health
curl https://couplesfin.com/health
```

## 🔧 Como Funciona

### Certificado SSL Único com SANs
```
Certificado ACM:
├── Domain Name: couplesfinancials.com (principal)
└── SANs:
    └── couplesfin.com (secundário)
```

### CloudFront Aliases
```
CloudFront Distribution:
├── Aliases:
│   ├── couplesfinancials.com
│   └── couplesfin.com
└── SSL Certificate: [certificado único acima]
```

### Route53 Zones
```
Route53:
├── Zona: couplesfinancials.com
│   ├── Registro A → CloudFront
│   └── Registros validação SSL
└── Zona: couplesfin.com
    ├── Registro A → CloudFront
    └── Registros validação SSL
```

## 🛠️ Troubleshooting

### Erro: "Zona Route53 não encontrada"
**Solução:** Certifique-se de criar as zonas hospedadas ANTES do deploy:
```bash
aws route53 list-hosted-zones
```

### Erro: "Certificado não valida"
**Causa:** Name servers não configurados corretamente no registrador.

**Verificar propagação DNS:**
```bash
# Verificar couplesfinancials.com
dig couplesfinancials.com NS

# Verificar couplesfin.com
dig couplesfin.com NS

# Devem retornar os name servers do Route53
```

**Solução:**
1. Acesse o painel do seu registrador de domínios
2. Configure os name servers do Route53
3. Aguarde propagação (até 48h)
4. Execute `terraform apply` novamente

### Tela branca no couplesfin.com

**Causa:** Domínio não reconhecido pela aplicação.

**Solução:** Já aplicada no código! O código agora reconhece ambos os domínios:
- `src/components/seo/RouteSEO.tsx` - URLs dinâmicas
- `src/utils/tutorialUtils.ts` - Tutorial com domínio correto

### Invalidar Cache após Mudanças

```bash
# Invalidar CloudFront (ambos domínios compartilham a mesma distribuição)
./scripts/cloudfront-utils.sh invalidate

# Ou manualmente
aws cloudfront create-invalidation \
  --distribution-id $(terraform output -raw cloudfront_distribution_id) \
  --paths "/*"
```

## 📊 Monitoramento

### Ver Todos os Domínios Configurados
```bash
terraform output all_domains
# Saída: couplesfinancials.com, couplesfin.com
```

### Ver Status do Domínio Secundário
```bash
terraform output secondary_domain_configured
# Saída: true ou false
```

### Logs CloudFront
- Ambos domínios aparecem nos logs da mesma distribuição
- Use o campo `Host` para diferenciar requests

## 🔄 Adicionar/Remover Domínio Secundário

### Adicionar Depois
Se você fez deploy apenas com o domínio principal e quer adicionar o secundário:

1. Edite `terraform.tfvars`:
   ```hcl
   secondary_domain_name = "couplesfin.com"
   ```

2. Aplique mudanças:
   ```bash
   terraform apply
   ```

3. O Terraform vai:
   - ✅ Atualizar o certificado para incluir o novo domínio
   - ✅ Adicionar alias no CloudFront
   - ✅ Criar registros DNS no Route53

### Remover Domínio Secundário
1. Edite `terraform.tfvars`:
   ```hcl
   secondary_domain_name = ""
   ```

2. Aplique mudanças:
   ```bash
   terraform apply
   ```

## 📚 Referências

- [AWS ACM Multi-Domain Certificates](https://docs.aws.amazon.com/acm/latest/userguide/acm-certificate.html)
- [CloudFront Alternate Domain Names](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/CNAMEs.html)
- [Route53 Hosted Zones](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/hosted-zones-working-with.html)

## 💡 Dicas

1. **Use o mesmo certificado para ambos** - Mais barato e simples
2. **Configure name servers primeiro** - Antes de fazer deploy
3. **Teste localmente** - Use `/etc/hosts` para testar antes da propagação DNS
4. **Monitore a propagação** - Use [DNSChecker.org](https://dnschecker.org)
5. **Aguarde validação SSL** - Pode levar até 30 minutos após propagação DNS

## ✅ Checklist Final

Antes de considerar o deploy completo, verifique:

- [ ] Ambas zonas Route53 criadas
- [ ] Name servers configurados no registrador
- [ ] Propagação DNS concluída (24-48h)
- [ ] `terraform apply` executado com sucesso
- [ ] Certificado SSL status = ISSUED
- [ ] Ambos domínios acessíveis via HTTPS
- [ ] CloudFront respondendo em ambos
- [ ] Health check passando em ambos
- [ ] Cache invalidado após deploy
