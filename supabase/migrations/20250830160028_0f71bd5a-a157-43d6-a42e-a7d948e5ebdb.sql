-- Create promotional codes table (different from referral_codes)
CREATE TABLE public.promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  owner_user_id UUID NOT NULL,
  discount_type TEXT NOT NULL DEFAULT 'fixed_price', -- 'fixed_price', 'percentage', 'amount_off'
  discount_value NUMERIC NOT NULL DEFAULT 0, -- For fixed_price: new price, for percentage: %, for amount_off: amount
  stripe_price_id TEXT, -- Special price ID to use when this code is applied
  max_uses INTEGER NOT NULL DEFAULT 100,
  current_uses INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  valid_for_countries TEXT[] DEFAULT ARRAY['BR'], -- Countries where code is valid
  expiry_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by_admin_id UUID
);

-- Create promotional code usage tracking
CREATE TABLE public.promo_code_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_code_id UUID NOT NULL REFERENCES public.promo_codes(id) ON DELETE CASCADE,
  user_id UUID,
  email TEXT NOT NULL,
  checkout_session_id UUID,
  stripe_session_id TEXT,
  amount_paid NUMERIC,
  currency TEXT DEFAULT 'BRL',
  applied_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  payment_completed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending' -- 'pending', 'completed', 'failed'
);

-- Create promotional rewards table (for code owners)
CREATE TABLE public.promo_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL,
  promo_code_id UUID NOT NULL REFERENCES public.promo_codes(id) ON DELETE CASCADE,
  usage_id UUID NOT NULL REFERENCES public.promo_code_usage(id) ON DELETE CASCADE,
  reward_amount NUMERIC NOT NULL DEFAULT 0,
  reward_currency TEXT NOT NULL DEFAULT 'BRL',
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'paid', 'cancelled'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at TIMESTAMPTZ
);

-- Add promo code field to checkout_sessions
ALTER TABLE public.checkout_sessions 
ADD COLUMN promo_code TEXT,
ADD COLUMN applied_promo_discount NUMERIC DEFAULT 0,
ADD COLUMN promo_final_price NUMERIC;

-- Enable RLS
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_code_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_rewards ENABLE ROW LEVEL SECURITY;

-- RLS Policies for promo_codes
CREATE POLICY "Authenticated users can view active promo codes" 
ON public.promo_codes 
FOR SELECT 
USING (is_active = true AND (expiry_date IS NULL OR expiry_date >= CURRENT_DATE));

CREATE POLICY "Only admins can manage promo codes" 
ON public.promo_codes 
FOR ALL 
USING (is_admin_user());

-- RLS Policies for promo_code_usage
CREATE POLICY "Users can view their own promo usage" 
ON public.promo_code_usage 
FOR SELECT 
USING (user_id = auth.uid() OR email = auth.email());

CREATE POLICY "Service role can manage promo usage" 
ON public.promo_code_usage 
FOR ALL 
USING (auth.role() = 'service_role');

CREATE POLICY "Admins can view all promo usage" 
ON public.promo_code_usage 
FOR SELECT 
USING (is_admin_user());

-- RLS Policies for promo_rewards
CREATE POLICY "Users can view their own promo rewards" 
ON public.promo_rewards 
FOR SELECT 
USING (owner_user_id = auth.uid());

CREATE POLICY "Only admins can manage promo rewards" 
ON public.promo_rewards 
FOR ALL 
USING (is_admin_user());

-- Create indexes for performance
CREATE INDEX idx_promo_codes_code ON public.promo_codes(code) WHERE is_active = true;
CREATE INDEX idx_promo_code_usage_email ON public.promo_code_usage(email);
CREATE INDEX idx_promo_code_usage_session ON public.promo_code_usage(checkout_session_id);
CREATE INDEX idx_promo_rewards_owner ON public.promo_rewards(owner_user_id);

-- Insert sample promo code (for testing)
INSERT INTO public.promo_codes (
  code, 
  owner_user_id, 
  discount_type, 
  discount_value,
  stripe_price_id,
  max_uses,
  valid_for_countries,
  created_by_admin_id
) VALUES (
  'DESCONTO179',
  (SELECT id FROM auth.users WHERE email = 'admin@arxexperience.com.br' LIMIT 1),
  'fixed_price',
  179.80,
  'price_1Ruie7FOhUY5r0H1qXXFouNn',
  1000,
  ARRAY['BR'],
  (SELECT id FROM auth.users WHERE email = 'admin@arxexperience.com.br' LIMIT 1)
);