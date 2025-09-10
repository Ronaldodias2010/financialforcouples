-- Corrigir função criada para ter search_path seguro
CREATE OR REPLACE FUNCTION public.update_moblix_offers_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;