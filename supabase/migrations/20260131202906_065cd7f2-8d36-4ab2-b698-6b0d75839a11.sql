-- Create table to store WebAuthn/Passkey credentials
CREATE TABLE public.webauthn_credentials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  credential_id TEXT NOT NULL UNIQUE,
  public_key TEXT NOT NULL,
  algorithm TEXT NOT NULL DEFAULT 'ES256',
  counter INTEGER NOT NULL DEFAULT 0,
  transports TEXT[] DEFAULT '{}',
  device_name TEXT,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for fast lookup by credential_id
CREATE INDEX idx_webauthn_credentials_credential_id ON public.webauthn_credentials(credential_id);

-- Create index for user lookup
CREATE INDEX idx_webauthn_credentials_user_id ON public.webauthn_credentials(user_id);

-- Enable Row Level Security
ALTER TABLE public.webauthn_credentials ENABLE ROW LEVEL SECURITY;

-- Users can view their own credentials
CREATE POLICY "Users can view their own webauthn credentials" 
ON public.webauthn_credentials 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can insert their own credentials
CREATE POLICY "Users can insert their own webauthn credentials" 
ON public.webauthn_credentials 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can update their own credentials
CREATE POLICY "Users can update their own webauthn credentials" 
ON public.webauthn_credentials 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Users can delete their own credentials
CREATE POLICY "Users can delete their own webauthn credentials" 
ON public.webauthn_credentials 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_webauthn_credentials_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_webauthn_credentials_updated_at
BEFORE UPDATE ON public.webauthn_credentials
FOR EACH ROW
EXECUTE FUNCTION public.update_webauthn_credentials_updated_at();

-- Create table for WebAuthn challenges (temporary storage)
CREATE TABLE public.webauthn_challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  challenge TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('registration', 'authentication')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '5 minutes'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for challenge lookup
CREATE INDEX idx_webauthn_challenges_user_id ON public.webauthn_challenges(user_id);
CREATE INDEX idx_webauthn_challenges_challenge ON public.webauthn_challenges(challenge);

-- Enable RLS
ALTER TABLE public.webauthn_challenges ENABLE ROW LEVEL SECURITY;

-- Users can manage their own challenges
CREATE POLICY "Users can view their own challenges" 
ON public.webauthn_challenges 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own challenges" 
ON public.webauthn_challenges 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own challenges" 
ON public.webauthn_challenges 
FOR DELETE 
USING (auth.uid() = user_id);