-- Enable the pg_cron extension to schedule tasks
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable the pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule exchange rate updates every 4 hours
SELECT cron.schedule(
  'update-exchange-rates-daily',
  '0 */4 * * *', -- Every 4 hours
  $$
  SELECT
    net.http_post(
        url:='https://elxttabdtddlavhseipz.supabase.co/functions/v1/update-exchange-rates',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVseHR0YWJkdGRkbGF2aHNlaXB6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxNTQ0OTMsImV4cCI6MjA2OTczMDQ5M30.r2-vpMnG9eyp7-pa1U_Mdj6qGW0VjQXbdppP50usC7E"}'::jsonb,
        body:='{"scheduled": true}'::jsonb
    ) as request_id;
  $$
);

-- Manually trigger an update now
SELECT
  net.http_post(
      url:='https://elxttabdtddlavhseipz.supabase.co/functions/v1/update-exchange-rates',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVseHR0YWJkdGRkbGF2aHNlaXB6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxNTQ0OTMsImV4cCI6MjA2OTczMDQ5M30.r2-vpMnG9eyp7-pa1U_Mdj6qGW0VjQXbdppP50usC7E"}'::jsonb,
      body:='{"manual": true}'::jsonb
  ) as request_id;