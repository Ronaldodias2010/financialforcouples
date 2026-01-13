-- Adicionar coluna temp_password à tabela user_invites
ALTER TABLE public.user_invites 
ADD COLUMN IF NOT EXISTS temp_password TEXT;