# Troubleshooting de Deploy - Couples Financials

## Problema: Página 503 não customizada durante deploy

### Sintomas
- Durante o deploy, ao acessar www.couplesfinancials.com aparece erro 503 padrão do nginx
- A página 503 customizada não é exibida

### Causas Possíveis

1. **Página 503 não copiada para containers**
2. **Configuração nginx incorreta**
3. **Problema na ordem de inicialização dos containers**
4. **Página 503 não acessível pelo proxy**

### Soluções Implementadas

#### 1. Dockerfile Atualizado
```dockerfile
# Copiar página de erro customizada
COPY public/503.html /usr/share/nginx/html/503.html
```

#### 2. Docker Compose Atualizado
```yaml
volumes:
  - ./nginx-proxy.conf:/etc/nginx/nginx.conf:ro
  - ./public/503.html:/usr/share/nginx/html/503.html:ro
```

#### 3. Configuração Nginx
```nginx
# Em nginx.conf e nginx-proxy.conf
error_page 503 502 504 /503.html;
location = /503.html {
    root /usr/share/nginx/html;
    internal;
}
```

### Verificação Local

1. **Testar página 503**:
```bash
chmod +x scripts/test-503-page.sh
./scripts/test-503-page.sh --full
```

2. **Servir página localmente**:
```bash
./scripts/test-503-page.sh --serve
```

3. **Testar com Docker Compose**:
```bash
docker-compose up --build
# Em outro terminal
curl -I http://localhost/503.html
```

### Verificação em Produção

1. **Verificar se página existe no container**:
```bash
docker exec -it couples-financials-app ls -la /usr/share/nginx/html/503.html
docker exec -it couples-financials-proxy ls -la /usr/share/nginx/html/503.html
```

2. **Testar configuração nginx**:
```bash
docker exec -it couples-financials-app nginx -t
docker exec -it couples-financials-proxy nginx -t
```

3. **Forçar erro 503 para teste**:
```bash
# Parar container da aplicação temporariamente
docker stop couples-financials-app
# Acessar site - deve mostrar página 503 customizada
curl http://www.couplesfinancials.com
```

### Fluxo de Deploy Recomendado

1. **Antes do deploy**:
```bash
./scripts/test-503-page.sh --full
```

2. **Durante o deploy**:
   - Página 503 customizada deve aparecer automaticamente
   - Auto-retry a cada 30 segundos
   - Suporte a PT/EN/ES

3. **Após o deploy**:
```bash
./scripts/health-check.sh --full
```

### Checklist de Correção

- [x] Página 503.html criada com conteúdo multilíngue
- [x] Dockerfile atualizado para copiar 503.html
- [x] Docker Compose atualizado para montar 503.html
- [x] nginx.conf configurado com error_page 503
- [x] nginx-proxy.conf configurado com error_page 503
- [x] Script de teste criado
- [x] Documentação atualizada

### Logs Importantes

Durante problemas de deploy, verificar:

1. **Logs do container principal**:
```bash
docker logs couples-financials-app
```

2. **Logs do proxy**:
```bash
docker logs couples-financials-proxy
```

3. **Logs do ECS (produção)**:
```bash
aws logs tail /ecs/couples-financials --region us-east-1 --since 10m
```

### Contatos de Emergência

Em caso de problemas críticos de deploy:
- Verificar status da AWS: https://status.aws.amazon.com/
- Logs detalhados disponíveis no CloudWatch
- Rollback automático configurado para falhas críticas

---

**Última atualização**: Dezembro 2024
**Responsável**: Equipe DevOps Couples Financials