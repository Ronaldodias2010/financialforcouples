-- Criar tabela para carrinhos abandonados
CREATE TABLE public.checkout_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  selected_plan TEXT NOT NULL DEFAULT 'monthly',
  status TEXT NOT NULL DEFAULT 'pending',
  session_token TEXT UNIQUE DEFAULT gen_random_uuid(),
  user_id UUID DEFAULT NULL,
  stripe_session_id TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + '24 hours'::interval)
);

-- Enable Row Level Security
ALTER TABLE public.checkout_sessions ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Admin can view all checkout sessions" ON public.checkout_sessions
FOR ALL USING (is_admin_user());

CREATE POLICY "Users can view their own checkout sessions" ON public.checkout_sessions
FOR SELECT USING (user_id = auth.uid());

-- Add updated_at trigger
CREATE TRIGGER update_checkout_sessions_updated_at
  BEFORE UPDATE ON public.checkout_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add column to profiles for checkout tracking
ALTER TABLE public.profiles 
ADD COLUMN checkout_session_id UUID DEFAULT NULL;