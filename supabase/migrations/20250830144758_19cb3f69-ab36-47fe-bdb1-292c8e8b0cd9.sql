-- Adicionar as funções auxiliares primeiro
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER := 0;
  code_exists BOOLEAN := true;
BEGIN
  WHILE code_exists LOOP
    result := '';
    FOR i IN 1..8 LOOP
      result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    
    SELECT EXISTS(SELECT 1 FROM public.referral_codes WHERE code = result) INTO code_exists;
  END LOOP;
  
  RETURN result;
END;
$$;

-- Função para validar e usar código de indicação
CREATE OR REPLACE FUNCTION public.use_referral_code(p_code TEXT, p_referred_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_referral_code RECORD;
  v_referral_id UUID;
  v_reward_id UUID;
BEGIN
  -- Buscar código de indicação válido
  SELECT * INTO v_referral_code
  FROM public.referral_codes
  WHERE code = p_code
    AND is_active = true
    AND (expiry_date IS NULL OR expiry_date >= CURRENT_DATE)
    AND current_uses < max_uses;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Código inválido ou expirado');
  END IF;
  
  -- Verificar se usuário já foi indicado antes
  IF EXISTS(SELECT 1 FROM public.referrals WHERE referred_user_id = p_referred_user_id) THEN
    RETURN jsonb_build_object('success', false, 'message', 'Usuário já foi indicado anteriormente');
  END IF;
  
  -- Criar registro de indicação
  INSERT INTO public.referrals (
    referrer_user_id,
    referred_user_id,
    referral_code,
    status,
    free_days_granted,
    activated_at
  ) VALUES (
    v_referral_code.user_id,
    p_referred_user_id,
    p_code,
    'activated',
    v_referral_code.free_days_granted,
    now()
  ) RETURNING id INTO v_referral_id;
  
  -- Atualizar contador do código
  UPDATE public.referral_codes
  SET current_uses = current_uses + 1,
      updated_at = now()
  WHERE id = v_referral_code.id;
  
  -- Criar recompensa pendente para o indicador
  INSERT INTO public.referral_rewards (
    referrer_user_id,
    referral_id,
    amount,
    status
  ) VALUES (
    v_referral_code.user_id,
    v_referral_id,
    v_referral_code.reward_amount,
    'pending'
  ) RETURNING id INTO v_reward_id;
  
  -- Conceder acesso premium temporário ao indicado
  INSERT INTO public.manual_premium_access (
    email,
    user_id,
    start_date,
    end_date,
    status,
    created_by_admin_id
  ) VALUES (
    (SELECT email FROM auth.users WHERE id = p_referred_user_id),
    p_referred_user_id,
    CURRENT_DATE,
    CURRENT_DATE + (v_referral_code.free_days_granted || ' days')::interval,
    'active',
    v_referral_code.created_by_admin_id
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Código aplicado com sucesso',
    'free_days', v_referral_code.free_days_granted,
    'referral_id', v_referral_id,
    'reward_amount', v_referral_code.reward_amount
  );
END;
$$;