-- Create exchange rates table for centralized currency conversion
CREATE TABLE public.exchange_rates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  base_currency TEXT NOT NULL DEFAULT 'BRL',
  target_currency TEXT NOT NULL,
  rate NUMERIC(10,6) NOT NULL,
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create unique index to prevent duplicate currency pairs
CREATE UNIQUE INDEX idx_exchange_rates_currencies ON public.exchange_rates(base_currency, target_currency);

-- Insert default exchange rates
INSERT INTO public.exchange_rates (base_currency, target_currency, rate) VALUES
('BRL', 'USD', 0.19),
('BRL', 'EUR', 0.17),
('BRL', 'BRL', 1.0);

-- Enable RLS
ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read exchange rates
CREATE POLICY "Exchange rates are readable by all authenticated users"
ON public.exchange_rates
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Only service role can update exchange rates
CREATE POLICY "Only service role can update exchange rates"
ON public.exchange_rates
FOR ALL
USING (auth.role() = 'service_role');

-- Create function to update exchange rates (for future automation)
CREATE OR REPLACE FUNCTION public.update_exchange_rate(
  p_base_currency TEXT,
  p_target_currency TEXT,
  p_rate NUMERIC
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.exchange_rates (base_currency, target_currency, rate)
  VALUES (p_base_currency, p_target_currency, p_rate)
  ON CONFLICT (base_currency, target_currency)
  DO UPDATE SET 
    rate = p_rate,
    last_updated = now();
END;
$$;