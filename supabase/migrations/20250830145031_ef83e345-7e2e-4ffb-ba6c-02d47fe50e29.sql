-- Criar sistema de indicações/referrals

-- Tabela para códigos de indicação
CREATE TABLE public.referral_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  max_uses INTEGER NOT NULL DEFAULT 10,
  current_uses INTEGER NOT NULL DEFAULT 0,
  expiry_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  reward_amount NUMERIC NOT NULL DEFAULT 0,
  free_days_granted INTEGER NOT NULL DEFAULT 7,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by_admin_id UUID REFERENCES auth.users(id)
);

-- Tabela para rastrear indicações
CREATE TABLE public.referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  referred_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  free_days_granted INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  activated_at TIMESTAMP WITH TIME ZONE,
  
  CONSTRAINT referrals_status_check CHECK (status IN ('pending', 'activated', 'expired', 'cancelled'))
);

-- Tabela para recompensas por indicação
CREATE TABLE public.referral_rewards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_id UUID REFERENCES public.referrals(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  payment_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  CONSTRAINT referral_rewards_status_check CHECK (status IN ('pending', 'approved', 'paid', 'cancelled'))
);

-- Enable RLS
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_rewards ENABLE ROW LEVEL SECURITY;

-- RLS Policies para referral_codes
CREATE POLICY "Only admins can manage referral codes"
ON public.referral_codes
FOR ALL
USING (is_admin_user());

-- RLS Policies para referrals
CREATE POLICY "Users can view their own referrals"
ON public.referrals
FOR SELECT
USING (auth.uid() = referrer_user_id OR auth.uid() = referred_user_id OR is_admin_user());

CREATE POLICY "Service role can manage referrals"
ON public.referrals
FOR ALL
USING (auth.role() = 'service_role' OR is_admin_user());

-- RLS Policies para referral_rewards
CREATE POLICY "Users can view their own rewards"
ON public.referral_rewards
FOR SELECT
USING (auth.uid() = referrer_user_id OR is_admin_user());

CREATE POLICY "Only admins can insert rewards"
ON public.referral_rewards
FOR INSERT
WITH CHECK (is_admin_user());

CREATE POLICY "Only admins can update rewards"
ON public.referral_rewards
FOR UPDATE
USING (is_admin_user());

CREATE POLICY "Only admins can delete rewards"
ON public.referral_rewards
FOR DELETE
USING (is_admin_user());

-- Triggers para updated_at
CREATE TRIGGER update_referral_codes_updated_at
BEFORE UPDATE ON public.referral_codes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_referral_rewards_updated_at
BEFORE UPDATE ON public.referral_rewards
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();