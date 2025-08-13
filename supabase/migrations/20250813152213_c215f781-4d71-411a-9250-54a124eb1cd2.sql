-- Adicionar campos de rentabilidade aos investimentos
ALTER TABLE public.investments 
ADD COLUMN yield_type text CHECK (yield_type IN ('percentage', 'fixed_amount')),
ADD COLUMN yield_value numeric DEFAULT 0,
ADD COLUMN last_yield_date date,
ADD COLUMN auto_calculate_yield boolean DEFAULT false;