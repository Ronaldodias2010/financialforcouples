-- Corrigir problemas de segurança identificados pelo linter

-- 1. Corrigir funções sem search_path definido
CREATE OR REPLACE FUNCTION public.set_owner_user_on_insert()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_id IS NULL THEN
    RETURN NEW; -- let constraints handle it
  END IF;

  -- Always set to the correct value to avoid race conditions from clients
  NEW.owner_user := public.determine_owner_user(NEW.user_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION public.set_user_id_on_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- If user_id is not provided by client, set it from auth context
  IF NEW.user_id IS NULL THEN
    NEW.user_id := auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;