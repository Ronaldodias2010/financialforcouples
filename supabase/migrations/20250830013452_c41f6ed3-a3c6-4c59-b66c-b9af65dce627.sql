-- Create a cron job to sync airline promotions daily at 6 AM
SELECT cron.schedule(
  'sync-airline-promotions-daily',
  '0 6 * * *', -- Daily at 6 AM
  $$
  SELECT
    net.http_post(
        url:='https://elxttabdtddlavhseipz.supabase.co/functions/v1/sync-airline-promotions',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVseHR0YWJkdGRkbGF2aHNlaXB6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxNTQ0OTMsImV4cCI6MjA2OTczMDQ5M30.r2-vpMnG9eyp7-pa1U_Mdj6qGW0VjQXbdppP50usC7E"}'::jsonb,
        body:='{"scheduled": true}'::jsonb
    ) as request_id;
  $$
);