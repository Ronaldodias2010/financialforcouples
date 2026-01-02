-- Create table for 2FA settings
CREATE TABLE public.user_2fa_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  method TEXT CHECK (method IN ('totp', 'sms', 'email', 'none')) DEFAULT 'none',
  is_enabled BOOLEAN DEFAULT false,
  phone_number TEXT,
  totp_secret TEXT, -- Encrypted TOTP secret for app authenticator
  backup_codes TEXT[], -- Hashed backup codes
  backup_codes_used INTEGER DEFAULT 0,
  last_verified_at TIMESTAMPTZ,
  failed_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create table for 2FA verification codes (SMS/Email)
CREATE TABLE public.user_2fa_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  code_hash TEXT NOT NULL,
  method TEXT CHECK (method IN ('sms', 'email')) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX idx_2fa_codes_user_expires ON public.user_2fa_codes(user_id, expires_at);
CREATE INDEX idx_2fa_settings_user ON public.user_2fa_settings(user_id);

-- Enable RLS
ALTER TABLE public.user_2fa_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_2fa_codes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_2fa_settings
CREATE POLICY "Users can view own 2fa settings"
  ON public.user_2fa_settings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own 2fa settings"
  ON public.user_2fa_settings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own 2fa settings"
  ON public.user_2fa_settings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for user_2fa_codes (only edge functions should access this)
CREATE POLICY "Service role only for 2fa codes"
  ON public.user_2fa_codes FOR ALL
  TO service_role
  USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_2fa_settings_updated_at
  BEFORE UPDATE ON public.user_2fa_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Function to cleanup expired 2FA codes
CREATE OR REPLACE FUNCTION public.cleanup_expired_2fa_codes()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.user_2fa_codes 
  WHERE expires_at < now() OR used_at IS NOT NULL;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;