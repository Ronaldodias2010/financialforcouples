-- Test current exchange rate manually by calling the edge function
SELECT 
  base_currency,
  target_currency, 
  rate as current_rate,
  1.0/rate as current_usd_to_brl,
  last_updated,
  'Should be around 5.39 according to user' as expected_rate
FROM public.exchange_rates 
WHERE target_currency = 'USD';