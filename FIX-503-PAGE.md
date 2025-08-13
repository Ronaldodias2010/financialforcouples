# Solução para Página 503 Customizada em Produção

## Problema Identificado
A página 503 customizada não está aparecendo em produção, mostrando apenas uma tela branca.

## Correções Implementadas

### 1. **Política S3 Atualizada** ✅
- Adicionada permissão específica para acesso público à página `503.html`
- Garantido que o CloudFront pode acessar o arquivo através do OAC

### 2. **Upload S3 Melhorado** ✅
- Configurado `acl = "public-read"` para garantir acesso público
- Otimizado cache control para `max-age=0, no-cache, no-store, must-revalidate`
- ETags para garantir que o arquivo seja atualizado quando modificado

### 3. **Script de Deploy Especializado** ✅
- Criado `scripts/force-503-deploy.sh` para forçar o upload da página 503
- Inclui invalidação automática do cache do CloudFront
- Testes automáticos de conectividade

## Como Aplicar as Correções

### Passo 1: Deploy da Infraestrutura
```bash
cd terraform
terraform plan
terraform apply
```

### Passo 2: Forçar Upload da Página 503
```bash
chmod +x scripts/force-503-deploy.sh
./scripts/force-503-deploy.sh
```

### Passo 3: Verificação Manual
```bash
# Teste direto da página 503
curl -I https://seu-dominio.com/503.html

# Teste via CloudFront
curl -I https://cloudfront-url/503.html
```

## Configurações Importantes

### CloudFront
- ✅ `custom_error_response` configurado para códigos 500, 502, 503, 504
- ✅ `ordered_cache_behavior` específico para `/503.html` do S3
- ✅ Cache TTL zerado para atualizações imediatas

### S3
- ✅ Arquivo `503.html` com ACL pública
- ✅ Cache-Control configurado para sem cache
- ✅ Content-Type correto (`text/html`)

### Docker/Nginx
- ✅ Arquivo 503.html copiado para o container
- ✅ Configuração `error_page` no nginx.conf

## Testes de Validação

### 1. Teste de Acesso Direto
```bash
# Deve retornar status 200
curl -s -o /dev/null -w "%{http_code}" https://seu-dominio.com/503.html
```

### 2. Simulação de Erro 503
```bash
# Parar temporariamente o serviço ECS
aws ecs update-service --cluster couples-financials-cluster --service couples-financials-service --desired-count 0

# Aguardar alguns minutos e testar
curl https://seu-dominio.com
```

### 3. Verificar ETags
```bash
# Comparar ETags local vs S3
md5sum public/503.html
aws s3api head-object --bucket seu-bucket --key 503.html --query 'ETag'
```

## Troubleshooting

### Se ainda mostrar tela branca:

1. **Verificar Cache do Navegador**
   ```bash
   # Limpar cache do navegador ou usar modo incógnito
   # Ou forçar refresh: Ctrl+F5
   ```

2. **Aguardar Propagação CloudFront**
   ```bash
   # CloudFront pode levar até 15 minutos para propagar
   # Verificar status da invalidação:
   aws cloudfront list-invalidations --distribution-id SEU-DISTRIBUTION-ID
   ```

3. **Verificar Logs**
   ```bash
   # Logs do ALB
   aws logs tail --log-group-name /aws/elasticloadbalancing/application/couples-financials-alb

   # Logs do ECS
   aws logs tail --log-group-name /ecs/couples-financials-task
   ```

4. **Testar Diretamente do S3**
   ```bash
   # Acesso direto ao S3 (deve funcionar)
   curl https://seu-bucket.s3.amazonaws.com/503.html
   ```

## Arquivos Modificados

- ✅ `terraform/s3.tf` - Política S3 e configuração de upload
- ✅ `scripts/force-503-deploy.sh` - Script de deploy especializado
- ✅ `FIX-503-PAGE.md` - Esta documentação

## Próximos Passos

1. **Executar o deploy completo**:
   ```bash
   cd terraform && terraform apply
   ```

2. **Executar o script de força**:
   ```bash
   ./scripts/force-503-deploy.sh
   ```

3. **Testar a página**:
   - Acesso direto: `https://seu-dominio.com/503.html`
   - Durante erro real: Parar serviço ECS temporariamente

4. **Monitorar logs** durante o próximo deploy para confirmar funcionamento

## Validação Final

Após aplicar todas as correções, a página 503 customizada deve:
- ✅ Aparecer quando há erros 500, 502, 503, 504
- ✅ Ser acessível diretamente via `/503.html`
- ✅ Mostrar o design customizado com seletor de idiomas
- ✅ Funcionar tanto via CloudFront quanto ALB
- ✅ Atualizar automaticamente quando modificada

**Importante**: Se o problema persistir, verifique se não há cache do Service Worker interferindo no PWA.