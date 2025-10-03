# Configuração do CRON para Processamento Automático de Parcelas

Este documento contém as instruções para configurar o processamento automático diário de parcelas futuras.

## 🎯 Objetivo

O sistema processará automaticamente todas as parcelas que vencerem, movendo-as de "Gastos Futuros" para "Gastos Atuais" no dashboard.

## 📋 Pré-requisitos

1. A função `process_installment_payment` já está criada no banco
2. A Edge Function `process-installments` já foi deployada
3. Você precisa ter acesso ao SQL Editor do Supabase

## 🔧 Passo a Passo

### 1. Ativar as Extensões Necessárias

Execute no SQL Editor do Supabase:

```sql
-- Ativar pg_cron (para agendar tarefas)
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

-- Ativar pg_net (para fazer requisições HTTP)
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
```

### 2. Agendar o Processamento Diário

Execute no SQL Editor do Supabase:

```sql
-- Agendar processamento diário às 01:00 AM (horário UTC)
SELECT cron.schedule(
  'process-installments-daily',
  '0 1 * * *',
  $$
  SELECT
    net.http_post(
        url:='https://elxttabdtddlavhseipz.supabase.co/functions/v1/process-installments',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVseHR0YWJkdGRkbGF2aHNlaXB6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxNTQ0OTMsImV4cCI6MjA2OTczMDQ5M30.r2-vpMnG9eyp7-pa1U_Mdj6qGW0VjQXbdppP50usC7E"}'::jsonb,
        body:=concat('{"scheduled": true, "timestamp": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);
```

### 3. Verificar se o CRON foi Criado

```sql
-- Ver todos os jobs agendados
SELECT * FROM cron.job;
```

Você deverá ver uma linha com:
- **jobname**: `process-installments-daily`
- **schedule**: `0 1 * * *`
- **active**: `true`

### 4. Testar Manualmente (Opcional)

Para testar o processamento sem esperar pela execução do CRON:

```sql
-- Executar manualmente o processamento
SELECT
  net.http_post(
      url:='https://elxttabdtddlavhseipz.supabase.co/functions/v1/process-installments',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVseHR0YWJkdGRkbGF2aHNlaXB6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxNTQ0OTMsImV4cCI6MjA2OTczMDQ5M30.r2-vpMnG9eyp7-pa1U_Mdj6qGW0VjQXbdppP50usC7E"}'::jsonb,
      body:='{"manual_test": true}'::jsonb
  ) as request_id;
```

## 📊 Monitoramento

### Ver Histórico de Execuções

```sql
-- Ver últimas 10 execuções do CRON
SELECT 
  jobid,
  runid,
  job_pid,
  database,
  username,
  command,
  status,
  return_message,
  start_time,
  end_time
FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'process-installments-daily')
ORDER BY start_time DESC
LIMIT 10;
```

### Ver Logs da Edge Function

Acesse: [Edge Function Logs](https://supabase.com/dashboard/project/elxttabdtddlavhseipz/functions/process-installments/logs)

## 🔄 Atualizar o Horário do CRON

Se quiser mudar o horário de execução:

```sql
-- Remover o CRON atual
SELECT cron.unschedule('process-installments-daily');

-- Criar com novo horário (exemplo: 03:00 AM)
SELECT cron.schedule(
  'process-installments-daily',
  '0 3 * * *',
  $$
  SELECT
    net.http_post(
        url:='https://elxttabdtddlavhseipz.supabase.co/functions/v1/process-installments',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVseHR0YWJkdGRkbGF2aHNlaXB6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxNTQ0OTMsImV4cCI6MjA2OTczMDQ5M30.r2-vpMnG9eyp7-pa1U_Mdj6qGW0VjQXbdppP50usC7E"}'::jsonb,
        body:=concat('{"scheduled": true, "timestamp": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);
```

## 🗑️ Remover o CRON

Para desativar completamente o processamento automático:

```sql
SELECT cron.unschedule('process-installments-daily');
```

## ⏰ Formato do CRON

O formato `0 1 * * *` significa:
- **0**: minuto 0
- **1**: hora 1 (01:00 AM)
- **\***: todos os dias do mês
- **\***: todos os meses
- **\***: todos os dias da semana

Exemplos de outros horários:
- `0 */6 * * *` - A cada 6 horas
- `30 2 * * *` - Às 02:30 AM diariamente
- `0 0 * * 0` - Domingo à meia-noite
- `0 12 1 * *` - Dia 1 de cada mês ao meio-dia

## ✅ Checklist de Configuração

- [ ] Extensões `pg_cron` e `pg_net` ativadas
- [ ] CRON job criado com sucesso
- [ ] Teste manual executado com sucesso
- [ ] Logs verificados e sem erros
- [ ] Sistema monitorando execuções diárias

## 🆘 Troubleshooting

### Problema: CRON não está executando

**Solução**: Verificar se as extensões estão ativas
```sql
SELECT * FROM pg_extension WHERE extname IN ('pg_cron', 'pg_net');
```

### Problema: Edge Function retorna erro 401

**Solução**: Verificar se o token de autorização está correto e se a função está deployada

### Problema: Parcelas não estão sendo processadas

**Solução**: Verificar logs da Edge Function e executar manualmente para debug
```sql
-- Ver se há parcelas pendentes
SELECT * FROM future_expense_payments 
WHERE expense_source_type = 'installment'
  AND original_due_date <= CURRENT_DATE
  AND transaction_id IS NULL;
```

## 📚 Referências

- [Supabase pg_cron Documentation](https://supabase.com/docs/guides/database/extensions/pg_cron)
- [Supabase pg_net Documentation](https://supabase.com/docs/guides/database/extensions/pg_net)
- [Edge Functions Documentation](https://supabase.com/docs/guides/functions)
