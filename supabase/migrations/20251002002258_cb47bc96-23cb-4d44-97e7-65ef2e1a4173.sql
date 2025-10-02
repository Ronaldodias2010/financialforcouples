-- Criar cron job para executar a transferência de despesas atrasadas diariamente

-- Habilitar as extensões necessárias se ainda não estiverem habilitadas
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Remover job anterior se existir
SELECT cron.unschedule('transfer-overdue-expenses-daily') 
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'transfer-overdue-expenses-daily'
);

-- Criar job para rodar todo dia à meia-noite (00:00)
SELECT cron.schedule(
  'transfer-overdue-expenses-daily',
  '0 0 * * *', -- Todo dia à meia-noite
  $$
  SELECT
    net.http_post(
      url := 'https://elxttabdtddlavhseipz.supabase.co/functions/v1/transfer-overdue-expenses',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVseHR0YWJkdGRkbGF2aHNlaXB6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxNTQ0OTMsImV4cCI6MjA2OTczMDQ5M30.r2-vpMnG9eyp7-pa1U_Mdj6qGW0VjQXbdppP50usC7E"}'::jsonb,
      body := '{"scheduled": true}'::jsonb
    ) as request_id;
  $$
);

-- Comentário explicativo
COMMENT ON EXTENSION pg_cron IS 'Job scheduler for automatic overdue expense transfers';
