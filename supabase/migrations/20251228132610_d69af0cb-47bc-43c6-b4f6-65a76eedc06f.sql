-- Tornar VIEWs explicitamente SECURITY INVOKER para eliminar falsos positivos de warning
-- As VIEWs já usam SECURITY INVOKER por padrão, mas vamos deixar explícito

ALTER VIEW public.active_transactions SET (security_invoker = true);
ALTER VIEW public.active_accounts SET (security_invoker = true);
ALTER VIEW public.active_cards SET (security_invoker = true);
ALTER VIEW public.active_categories SET (security_invoker = true);
ALTER VIEW public.active_investments SET (security_invoker = true);