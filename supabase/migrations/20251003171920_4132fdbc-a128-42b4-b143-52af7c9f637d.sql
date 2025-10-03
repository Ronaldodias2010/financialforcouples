-- Phase 3.1: Setup pg_cron job to auto-complete pending transactions daily
-- This will automatically call the function every day at 01:00 AM UTC

-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

-- Schedule daily execution at 01:00 AM UTC
SELECT cron.schedule(
  'auto-complete-pending-transactions',
  '0 1 * * *',  -- Every day at 01:00 AM UTC
  $$SELECT public.auto_complete_pending_transactions();$$
);

-- Verify the job was created
COMMENT ON EXTENSION pg_cron IS 'Job scheduler for PostgreSQL - used to auto-complete pending transactions daily';
