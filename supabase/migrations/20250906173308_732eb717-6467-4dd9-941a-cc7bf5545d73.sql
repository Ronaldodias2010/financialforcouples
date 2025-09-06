-- Fix the update_card_balance function to correctly calculate available limit after overpayments
CREATE OR REPLACE FUNCTION public.update_card_balance()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    card_record RECORD;
    total_gastos NUMERIC := 0;
    total_pagamentos NUMERIC := 0;
    efetivo_em_aberto NUMERIC := 0;
    limite_disponivel NUMERIC := 0;
BEGIN
    -- Recalcula para todos os cartões de crédito
    FOR card_record IN 
        SELECT DISTINCT c.id, c.credit_limit, c.initial_balance_original, c.card_type
        FROM public.cards c
        WHERE c.card_type = 'credit'
    LOOP
        -- Gastos no cartão (despesas)
        SELECT COALESCE(SUM(t.amount), 0) INTO total_gastos
        FROM public.transactions t
        WHERE t.card_id = card_record.id 
          AND t.type = 'expense';

        -- Pagamentos registrados no histórico
        SELECT COALESCE(SUM(p.payment_amount), 0) INTO total_pagamentos
        FROM public.card_payment_history p
        WHERE p.card_id = card_record.id;

        -- Saldo efetivo em aberto = saldo anterior carregado + gastos - pagamentos
        efetivo_em_aberto := COALESCE(card_record.initial_balance_original, 0) 
                           + COALESCE(total_gastos, 0)
                           - COALESCE(total_pagamentos, 0);

        -- Limite disponível baseado no saldo efetivo:
        -- Se há dívida (efetivo_em_aberto > 0): limite_disponivel = credit_limit - efetivo_em_aberto
        -- Se não há dívida (efetivo_em_aberto <= 0): limite_disponivel = credit_limit + abs(efetivo_em_aberto)
        -- Mas nunca pode exceder o credit_limit total
        IF efetivo_em_aberto > 0 THEN
            -- Há dívida: limite disponível = limite total - dívida atual
            limite_disponivel := GREATEST(0, COALESCE(card_record.credit_limit, 0) - efetivo_em_aberto);
        ELSE
            -- Não há dívida ou há crédito extra: limite disponível = limite total + crédito extra
            -- Mas limitado ao credit_limit máximo
            limite_disponivel := LEAST(
                COALESCE(card_record.credit_limit, 0),
                COALESCE(card_record.credit_limit, 0) + ABS(efetivo_em_aberto)
            );
        END IF;

        -- Atualiza os campos:
        -- current_balance: quanto se deve atualmente (pode ser negativo se há crédito)
        -- initial_balance: limite disponível para usar
        UPDATE public.cards
        SET 
            current_balance = efetivo_em_aberto,
            initial_balance = limite_disponivel,
            updated_at = now()
        WHERE id = card_record.id;

    END LOOP;

    RETURN NULL;
END;
$function$;