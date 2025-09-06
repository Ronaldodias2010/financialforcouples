-- Atualizar cron job para rodar 3 vezes ao dia (8h, 14h, 20h)
SELECT cron.alter_job(
  job_id := 1,
  schedule := '0 8,14,20 * * *'
);