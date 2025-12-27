-- Tabela para rastrear atividade dos usuários
CREATE TABLE public.user_activity_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  first_access_at TIMESTAMPTZ,
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  activity_count INTEGER DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'inactive')),
  days_inactive INTEGER DEFAULT 0,
  entered_inactive_funnel_at TIMESTAMPTZ,
  last_reengagement_email_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.user_activity_tracking ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Admins can view all activity"
ON public.user_activity_tracking FOR SELECT
TO authenticated
USING (public.is_admin_user());

CREATE POLICY "Service role can manage activity"
ON public.user_activity_tracking FOR ALL
TO authenticated
USING (auth.role() = 'service_role');

CREATE POLICY "Users can view their own activity"
ON public.user_activity_tracking FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Função para registrar atividade do usuário
CREATE OR REPLACE FUNCTION public.track_user_activity(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.user_activity_tracking (user_id, first_access_at, last_activity_at, status)
  VALUES (p_user_id, now(), now(), 'active')
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    first_access_at = COALESCE(user_activity_tracking.first_access_at, now()),
    last_activity_at = now(),
    activity_count = user_activity_tracking.activity_count + 1,
    status = 'active',
    days_inactive = 0,
    entered_inactive_funnel_at = NULL,
    updated_at = now();
END;
$$;

-- Função para atualizar status de usuários inativos (rodar via cron)
CREATE OR REPLACE FUNCTION public.update_inactive_users()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  updated_count INTEGER := 0;
BEGIN
  -- Marcar como inativos usuários sem atividade há 10+ dias
  WITH updated AS (
    UPDATE public.user_activity_tracking
    SET 
      status = 'inactive',
      days_inactive = EXTRACT(DAY FROM (now() - last_activity_at))::integer,
      entered_inactive_funnel_at = CASE 
        WHEN status != 'inactive' THEN now() 
        ELSE entered_inactive_funnel_at 
      END,
      updated_at = now()
    WHERE last_activity_at < now() - INTERVAL '10 days'
      AND status = 'active'
    RETURNING id
  )
  SELECT COUNT(*) INTO updated_count FROM updated;
  
  -- Atualizar dias_inactive para todos os inativos
  UPDATE public.user_activity_tracking
  SET days_inactive = EXTRACT(DAY FROM (now() - last_activity_at))::integer,
      updated_at = now()
  WHERE status = 'inactive';
  
  RETURN updated_count;
END;
$$;

-- Função para obter usuários inativos (para o painel admin)
CREATE OR REPLACE FUNCTION public.get_inactive_users()
RETURNS TABLE (
  user_id uuid,
  email text,
  display_name text,
  first_access_at timestamptz,
  last_activity_at timestamptz,
  days_inactive integer,
  entered_inactive_funnel_at timestamptz,
  is_premium boolean
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    uat.user_id,
    u.email,
    p.display_name,
    uat.first_access_at,
    uat.last_activity_at,
    uat.days_inactive,
    uat.entered_inactive_funnel_at,
    COALESCE(p.subscribed, false) as is_premium
  FROM public.user_activity_tracking uat
  JOIN auth.users u ON u.id = uat.user_id
  LEFT JOIN public.profiles p ON p.user_id = uat.user_id
  WHERE uat.status = 'inactive'
  ORDER BY uat.days_inactive DESC;
$$;

-- Índices para performance
CREATE INDEX idx_user_activity_tracking_user_id ON public.user_activity_tracking(user_id);
CREATE INDEX idx_user_activity_tracking_status ON public.user_activity_tracking(status);
CREATE INDEX idx_user_activity_tracking_last_activity ON public.user_activity_tracking(last_activity_at);