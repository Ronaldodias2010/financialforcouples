
-- 1) Adicionar colunas usadas pela UI para associar parceiro e detalhar recompensa
ALTER TABLE public.promo_codes
  ADD COLUMN IF NOT EXISTS partner_email text,
  ADD COLUMN IF NOT EXISTS reward_type text DEFAULT 'monetary',
  ADD COLUMN IF NOT EXISTS reward_currency text DEFAULT 'BRL',
  ADD COLUMN IF NOT EXISTS reward_description text;

-- 2) Garantir que reward_amount exista (idempotente)
ALTER TABLE public.promo_codes
  ADD COLUMN IF NOT EXISTS reward_amount numeric DEFAULT 0;

-- Observação:
-- - owner_user_id permanece como uuid (correto). A UI passará o id do admin logado.
-- - As RLS de promo_codes já restringem "ALL" a is_admin_user(), então admins seguem podendo inserir/editar.
