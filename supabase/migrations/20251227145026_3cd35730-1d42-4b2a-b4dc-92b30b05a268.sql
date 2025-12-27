-- Remover constraint antiga de 90 dias e adicionar nova com 365 dias
ALTER TABLE public.manual_premium_access 
DROP CONSTRAINT IF EXISTS max_90_days;

ALTER TABLE public.manual_premium_access 
ADD CONSTRAINT max_365_days 
CHECK (end_date <= (start_date + INTERVAL '365 days'));