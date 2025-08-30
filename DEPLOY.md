# Guia de Deploy - Couples Financials

## Deploy Rápido (Recomendado)

Para deployments de desenvolvimento mais ágeis, use o **bypass do CloudFront**:

### Opção 1: GitHub Actions (Recomendado)
1. Vá para **Actions** no GitHub
2. Selecione **"Deploy to AWS"**
3. Clique **"Run workflow"**
4. Mantenha **"Bypass CloudFront"** = `true` (padrão)
5. ✅ Deploy será feito diretamente no ALB

### Opção 2: Script Local
```bash
# Deploy rápido (sem testes)
./scripts/quick-deploy.sh --skip-tests

# Deploy completo (com testes)
./scripts/deploy.sh --bypass-cloudfront
```

## URLs de Acesso

### ALB (Application Load Balancer)
- ✅ **Acesso imediato** após o deploy
- 🔗 URL: `https://[alb-dns-name]`
- 🎯 Use para testes e desenvolvimento

### CloudFront (CDN Global)
- ⏳ **Demora 5-15 minutos** para propagar
- 🌐 URL: `https://[cloudfront-domain]`
- 🚀 Use para produção (performance global)

## Deploy com CloudFront

Quando você tiver quota disponível no CloudFront:

### GitHub Actions
1. Use o workflow **"Deploy with CloudFront"**
2. Ou no workflow normal, mude **"Bypass CloudFront"** = `false`

### Script Local
```bash
./scripts/deploy.sh --invalidate-cache
```

## Scripts Úteis

### Verificar Status
```bash
# Ver URLs atuais
./scripts/cloudfront-utils.sh alb-url
./scripts/cloudfront-utils.sh cloudfront-url

# Ver status do CloudFront
./scripts/cloudfront-utils.sh status
```

### Invalidar Cache do CloudFront
```bash
./scripts/cloudfront-utils.sh invalidate
```

### Health Check
```bash
./scripts/cloudfront-utils.sh health-check https://seu-alb-url
```

### Comparar Performance
```bash
./scripts/cloudfront-utils.sh compare
```

## Troubleshooting

### Erro: TooManyDistributions
```
Error: creating CloudFront Distribution: TooManyDistributions
```

**Solução**: Use o bypass do CloudFront:
- GitHub Actions: `bypass_cloudfront: true`
- Local: `--bypass-cloudfront`

### Deploy Lento
- ✅ Use ALB direto: `./scripts/quick-deploy.sh`
- ⚡ Pule testes: `--skip-tests`

### Cache do CloudFront Desatualizado
```bash
./scripts/cloudfront-utils.sh invalidate
```

### App Não Carrega
1. Teste ALB primeiro: `./scripts/cloudfront-utils.sh alb-url`
2. Verifique health: `./scripts/cloudfront-utils.sh health-check`
3. Se ALB funciona mas CloudFront não, aguarde propagação

## Configuração de Produção

Para produção, recomendamos:

1. **Enable CloudFront** quando houver quota
2. **Custom Domain** configurado
3. **SSL Certificate** válido
4. **Auto-invalidação** habilitada

```bash
# terraform/terraform.tfvars
enable_cloudfront = true
auto_invalidate_cloudfront = true
domain_name = "seudominio.com"
```

## Monitoramento

### Logs
- ECS Logs: CloudWatch
- ALB Logs: S3 (se configurado)
- CloudFront Logs: CloudWatch

### Métricas
- ALB: Target Health, Response Time
- CloudFront: Cache Hit Rate, Origin Requests
- ECS: CPU, Memory Usage

### Alertas
Configure alertas para:
- ALB Target Unhealthy
- ECS Service Stopped
- CloudFront High Error Rate