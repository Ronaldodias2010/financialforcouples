# Configuração do CRON Job para Limpeza Automática

Este documento explica como configurar o job de limpeza automática de rate limits e audit logs.

## Pré-requisitos

As extensões `pg_cron` e `pg_net` já foram habilitadas via migração.

## Configurar o CRON Job

Execute o seguinte SQL no **SQL Editor do Supabase** para agendar a limpeza diária:

```sql
-- Agendar job de limpeza para rodar todos os dias às 3:00 AM UTC
SELECT cron.schedule(
  'cleanup-rate-limits-daily',
  '0 3 * * *',
  $$
  SELECT net.http_post(
    url := 'https://elxttabdtddlavhseipz.supabase.co/functions/v1/cleanup-rate-limits',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVseHR0YWJkdGRkbGF2aHNlaXB6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxNTQ0OTMsImV4cCI6MjA2OTczMDQ5M30.r2-vpMnG9eyp7-pa1U_Mdj6qGW0VjQXbdppP50usC7E'
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
```

## Verificar o Job

```sql
-- Ver todos os jobs agendados
SELECT * FROM cron.job;

-- Ver histórico de execuções
SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;
```

## Remover o Job (se necessário)

```sql
-- Remover o job de limpeza
SELECT cron.unschedule('cleanup-rate-limits-daily');
```

## O que é limpo automaticamente

1. **Rate Limit Entries**: Entradas com mais de 24 horas são removidas
2. **Audit Logs**: Logs com mais de 90 dias são removidos
3. **Checkout Sessions**: Sessões pendentes/expiradas com mais de 7 dias são removidas

## Formato CRON

```
* * * * *
│ │ │ │ │
│ │ │ │ └── Dia da semana (0-7, domingo = 0 ou 7)
│ │ │ └──── Mês (1-12)
│ │ └────── Dia do mês (1-31)
│ └──────── Hora (0-23)
└────────── Minuto (0-59)
```

Exemplos:
- `0 3 * * *` - Todo dia às 3:00 AM UTC
- `0 */6 * * *` - A cada 6 horas
- `0 0 * * 0` - Todo domingo à meia-noite
