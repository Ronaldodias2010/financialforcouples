-- Update current exchange rates with correct values
UPDATE public.exchange_rates 
SET rate = 0.1843, last_updated = now() 
WHERE base_currency = 'BRL' AND target_currency = 'USD';

UPDATE public.exchange_rates 
SET rate = 0.1572, last_updated = now() 
WHERE base_currency = 'BRL' AND target_currency = 'EUR';

-- Insert GBP rate if it doesn't exist
INSERT INTO public.exchange_rates (base_currency, target_currency, rate, last_updated)
VALUES ('BRL', 'GBP', 0.1285, now())
ON CONFLICT (base_currency, target_currency) 
DO UPDATE SET rate = 0.1285, last_updated = now();