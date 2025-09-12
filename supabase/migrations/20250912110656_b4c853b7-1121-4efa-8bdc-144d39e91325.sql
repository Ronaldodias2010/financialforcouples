-- Test the updated exchange rate function
-- First check what we have now, then call the function
SELECT 
  'Before Update' as status,
  target_currency,
  rate as current_rate,
  1.0/rate as current_usd_to_brl,
  last_updated
FROM public.exchange_rates 
WHERE target_currency = 'USD';