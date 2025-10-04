# ✅ Checklist de Migração AWS → GCP

Use este checklist para acompanhar o progresso da migração.

---

## 📅 ANTES DA MIGRAÇÃO

### Preparação
- [ ] Backup completo da aplicação AWS
- [ ] Documentar URLs e configurações atuais
- [ ] Exportar métricas de performance AWS (baseline)
- [ ] Notificar stakeholders sobre a migração
- [ ] Definir janela de manutenção

### Pré-requisitos
- [ ] Conta GCP criada
- [ ] Billing habilitado no GCP
- [ ] gcloud CLI instalado localmente
- [ ] Terraform >= 1.0 instalado
- [ ] Docker instalado e configurado
- [ ] Git configurado

---

## 🚀 FASE 1: Setup GCP (Dia 1 - 1h)

### Conta e Projeto
- [ ] Criar projeto GCP: `couples-financials-prod`
- [ ] Habilitar billing
- [ ] Configurar `gcloud config set project`
- [ ] Verificar quotas disponíveis

### APIs e Serviços
- [ ] Habilitar Cloud Run API
- [ ] Habilitar Compute Engine API
- [ ] Habilitar Artifact Registry API
- [ ] Habilitar Secret Manager API
- [ ] Habilitar Cloud Logging API
- [ ] Habilitar Cloud Monitoring API

### Artifact Registry
- [ ] Criar repositório Docker
- [ ] Configurar `gcloud auth configure-docker`
- [ ] Testar push de imagem teste

### Service Accounts
- [ ] Criar SA para Cloud Run
- [ ] Criar SA para GitHub Actions
- [ ] Configurar permissões necessárias
- [ ] Gerar chave JSON da SA do GitHub

### Secrets
- [ ] Criar secret: `supabase-anon-key`
- [ ] Criar secret: `supabase-service-role-key`
- [ ] Testar acesso aos secrets

**Script automatizado:**
```bash
chmod +x scripts/setup-gcp.sh
./scripts/setup-gcp.sh
```

---

## 🔧 FASE 2: Configurar GitHub (Dia 1 - 15min)

### GitHub Secrets
- [ ] Adicionar `GCP_PROJECT_ID`
- [ ] Adicionar `GCP_SERVICE_ACCOUNT_KEY`
- [ ] Verificar `SUPABASE_URL` existe
- [ ] Testar secrets não estão vazios

### Workflow
- [ ] Verificar `.github/workflows/deploy-gcp.yml` existe
- [ ] Revisar configurações do workflow
- [ ] Testar workflow manualmente (workflow_dispatch)

---

## 🏗️ FASE 3: Terraform (Dia 1 - 30min)

### Configuração
- [ ] Copiar `terraform.tfvars.example` → `terraform.tfvars`
- [ ] Preencher `gcp_project_id`
- [ ] Preencher `supabase_anon_key`
- [ ] Preencher `supabase_service_role_key`
- [ ] Definir `domain_name` (ou deixar vazio)

### Execução
- [ ] `terraform init` - sucesso
- [ ] `terraform plan` - revisar mudanças
- [ ] `terraform apply` - confirmar
- [ ] Verificar outputs:
  - [ ] `cloud_run_url`
  - [ ] `load_balancer_ip`
  - [ ] `storage_bucket_name`
  - [ ] `artifact_registry_repository`

### Validação
- [ ] Cloud Run service criado
- [ ] Load Balancer configurado
- [ ] Storage bucket criado
- [ ] Secrets acessíveis

---

## 📦 FASE 4: Primeiro Deploy (Dia 1 - 20min)

### Build e Deploy
- [ ] Executar `./scripts/deploy-gcp.sh`
- [ ] Build Docker bem-sucedido
- [ ] Push para Artifact Registry OK
- [ ] Deploy Cloud Run concluído

### Verificação
- [ ] Obter URL do Cloud Run
- [ ] Testar `curl https://[CLOUD_RUN_URL]`
- [ ] Aplicação responde HTTP 200/301/302
- [ ] Assets estáticos carregando
- [ ] Supabase conectado (testar login)

### Logs
- [ ] Ver logs: `gcloud run services logs read`
- [ ] Sem erros críticos nos logs
- [ ] Métricas aparecendo no console

---

## 🔄 FASE 5: CI/CD Automático (Dia 1 - 10min)

### Teste GitHub Actions
- [ ] Fazer commit teste
- [ ] Push para branch `main`
- [ ] Workflow acionado automaticamente
- [ ] Build passou
- [ ] Deploy passou
- [ ] Smoke test passou

### Validação
- [ ] Nova versão deployada
- [ ] URL atualizada
- [ ] Sem downtime
- [ ] Logs mostram nova versão

---

## 🌐 FASE 6: Domínio (Dia 2 - 1h)

### DNS
- [ ] Anotar Load Balancer IP
- [ ] Criar registro A para domínio principal
- [ ] Criar registro A para www (se aplicável)
- [ ] Aguardar propagação DNS (15-60min)
- [ ] Testar: `dig couplesfinancials.com`

### SSL
- [ ] Atualizar `terraform.tfvars` com domínios
- [ ] `terraform apply` novamente
- [ ] Aguardar provisionamento SSL (até 24h)
- [ ] Verificar: `terraform output ssl_certificate_status`
- [ ] Testar HTTPS: `https://couplesfinancials.com`

### Redirecionamento
- [ ] HTTP → HTTPS funcionando
- [ ] www → apex funcionando (ou vice-versa)
- [ ] Sem warnings de SSL no browser

---

## 💾 FASE 7: Migrar Assets (Dia 2 - 30min)

### S3 → Cloud Storage
- [ ] Listar assets do S3
- [ ] Baixar localmente (se necessário)
- [ ] Upload para Cloud Storage
- [ ] Configurar permissões públicas
- [ ] Testar URLs dos assets

### Atualizar Código
- [ ] Buscar referências hardcoded ao S3
- [ ] Atualizar para Cloud Storage URLs
- [ ] Testar todas as imagens carregam
- [ ] Commit e push das mudanças

---

## 🧪 FASE 8: Testes Intensivos (Dia 3-5)

### Testes Funcionais
- [ ] Login funciona
- [ ] Cadastro funciona
- [ ] CRUD de transações
- [ ] Upload de arquivos
- [ ] Gráficos e charts
- [ ] Filtros e buscas
- [ ] Exportação de dados
- [ ] Todas as páginas carregam

### Testes de Performance
- [ ] Tempo de resposta < 500ms
- [ ] Cold start < 3s
- [ ] Testes de carga (1000+ requests)
- [ ] Sem erros 500 em logs
- [ ] Memory usage OK
- [ ] CPU usage OK

### Testes de Integração
- [ ] Supabase auth funcionando
- [ ] Supabase database queries OK
- [ ] Email sending (se aplicável)
- [ ] APIs externas funcionando

### Monitoramento
- [ ] Configurar dashboard Cloud Monitoring
- [ ] Configurar alertas (error rate > 5%)
- [ ] Configurar alertas (latency > 1s)
- [ ] Configurar alertas (memory > 80%)
- [ ] Testar notificações

---

## 🎯 FASE 9: Período Paralelo (Dia 6-12)

### AWS e GCP Rodando Juntos
- [ ] Manter AWS ativo
- [ ] 50% tráfego AWS / 50% GCP (DNS Round Robin)
- [ ] Comparar métricas AWS vs GCP
- [ ] Monitorar erros em ambos
- [ ] Verificar custos GCP

### Análise Comparativa
- [ ] Performance: GCP >= AWS
- [ ] Disponibilidade: GCP >= AWS
- [ ] Custos: GCP < AWS
- [ ] Erros: GCP <= AWS

---

## ✨ FASE 10: Cutover Final (Dia 13)

### Preparação
- [ ] Backup final AWS
- [ ] Snapshot EBS (se aplicável)
- [ ] Exportar Terraform state AWS
- [ ] Notificar usuários (se aplicável)

### Migração de Tráfego
- [ ] Atualizar DNS para 100% GCP
- [ ] Aguardar propagação (15-60min)
- [ ] Verificar tráfego chegando no GCP
- [ ] AWS não recebendo mais tráfego

### Validação Pós-Cutover
- [ ] Aplicação funcionando 100%
- [ ] Nenhum erro crítico
- [ ] Performance OK
- [ ] Usuários conseguindo acessar
- [ ] Monitorar por 24-48h

---

## 🧹 FASE 11: Limpeza AWS (Dia 20+)

⚠️ **AGUARDE PELO MENOS 7 DIAS!**

### Backups Finais
- [ ] Backup de dados AWS
- [ ] Snapshot de volumes
- [ ] Exportar logs CloudWatch
- [ ] Salvar configurações importantes

### Destruir Recursos
- [ ] `terraform destroy` no diretório terraform/
- [ ] Confirmar todos recursos deletados
- [ ] Verificar billing AWS (deve ser $0)

### Limpeza Manual
- [ ] Deletar buckets S3 vazios
- [ ] Remover hosted zones Route 53
- [ ] Deletar secrets Secrets Manager
- [ ] Cancelar reservas/savings plans
- [ ] Desabilitar CloudWatch alarms

---

## 📊 FASE 12: Otimização (Dia 21-30)

### Performance
- [ ] Ajustar CPU/Memory se necessário
- [ ] Configurar min_instances se cold start é problema
- [ ] Otimizar cache CDN
- [ ] Configurar compressão

### Custos
- [ ] Revisar billing GCP
- [ ] Comparar com baseline AWS
- [ ] Identificar oportunidades de economia
- [ ] Configurar budget alerts

### Monitoramento
- [ ] Dashboards finalizados
- [ ] Alertas ajustados
- [ ] Runbooks documentados
- [ ] Time treinado

---

## 📝 DOCUMENTAÇÃO FINAL

- [ ] Atualizar README.md
- [ ] Documentar arquitetura GCP
- [ ] Atualizar diagramas
- [ ] Documentar runbooks operacionais
- [ ] Atualizar guia de deploy
- [ ] Documentar troubleshooting comum

---

## 🎉 SUCESSO!

### Métricas de Sucesso
- [ ] Uptime > 99.9%
- [ ] Performance >= AWS
- [ ] Custos reduzidos ~40%
- [ ] Zero downtime na migração
- [ ] Equipe treinada
- [ ] Documentação completa

### Celebração
- [ ] Email para stakeholders ✅
- [ ] Post-mortem meeting 📊
- [ ] Lições aprendidas documentadas 📚
- [ ] Pizza para o time! 🍕

---

## 🆘 ROLLBACK PLAN

**Se algo der errado:**

1. **Reverter DNS para AWS**
   ```bash
   # Atualizar registros DNS para IP do ALB AWS
   ```

2. **Manter GCP ativo para debugging**
   ```bash
   # NÃO destruir recursos GCP ainda
   gcloud run services logs read --limit=100
   ```

3. **Identificar problema**
   - Ver logs GCP
   - Comparar com logs AWS
   - Identificar diferença

4. **Corrigir e tentar novamente**
   - Fix no código
   - Deploy novo
   - Testar
   - Migrar novamente

---

**Tempo Total Estimado:** 10-15 dias (incluindo período de testes)

**ROI Esperado:** Economia de $40-60/mês (~$600/ano) 💰
