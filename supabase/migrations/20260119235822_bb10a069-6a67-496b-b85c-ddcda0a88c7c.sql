-- Corrigir view para usar SECURITY INVOKER (padrão seguro)
DROP VIEW IF EXISTS public.active_subcategories;

CREATE VIEW public.active_subcategories 
WITH (security_invoker = on) AS
SELECT * FROM public.subcategories
WHERE deleted_at IS NULL;