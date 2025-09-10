-- Schedule daily processing of recurring expenses at 6 AM UTC (3 AM Brazil)
-- First, enable the pg_cron extension if not already enabled
SELECT cron.schedule(
  'process-recurring-expenses-daily',
  '0 6 * * *', -- Daily at 6:00 AM UTC
  $$
  SELECT
    net.http_post(
      url := 'https://elxttabdtddlavhseipz.supabase.co/functions/v1/process-recurring-expenses',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVseHR0YWJkdGRkbGF2aHNlaXB6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxNTQ0OTMsImV4cCI6MjA2OTczMDQ5M30.r2-vpMnG9eyp7-pa1U_Mdj6qGW0VjQXbdppP50usC7E"}'::jsonb,
      body := json_build_object('source', 'cron_job', 'timestamp', now())::jsonb
    ) AS request_id;
  $$
);