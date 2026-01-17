-- Fix 1: Corrigir calculate_miles_for_transaction (text <> currency_type)
CREATE OR REPLACE FUNCTION public.calculate_miles_for_transaction()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  rule_record RECORD;
  miles_earned NUMERIC;
  month_year_str TEXT;
  transaction_currency TEXT;
  purchase_type_var TEXT;
  amount_in_rule_currency NUMERIC;
  exchange_rate NUMERIC;
  rate_brl_to_target NUMERIC;
  rate_source_to_brl NUMERIC;
BEGIN
  -- Only process expense transactions with card_id
  IF NEW.type = 'expense' AND NEW.card_id IS NOT NULL THEN

    -- Determinar a moeda da transação (padrão: BRL)
    transaction_currency := COALESCE(NEW.currency::text, 'BRL');

    -- Determinar tipo de compra baseado na moeda da transação
    IF transaction_currency IN ('USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CHF') THEN
      purchase_type_var := 'international';
    ELSE
      purchase_type_var := 'domestic';
    END IF;

    -- Buscar regra específica para o tipo de compra, com fallback para domestic
    SELECT * INTO rule_record
    FROM public.card_mileage_rules
    WHERE card_id = NEW.card_id
      AND user_id = NEW.user_id
      AND is_active = true
      AND (purchase_type = purchase_type_var OR purchase_type = 'domestic' OR purchase_type IS NULL)
    ORDER BY
      CASE WHEN purchase_type = purchase_type_var THEN 0 ELSE 1 END
    LIMIT 1;

    IF FOUND THEN
      -- Iniciar com o valor original da transação
      amount_in_rule_currency := NEW.amount;

      -- Converter valor para moeda da regra se necessário
      IF transaction_currency <> rule_record.currency::text THEN

        -- Caso 1: Transação em BRL, regra em moeda estrangeira (USD/EUR)
        -- Exemplo: Compra R$ 100, regra em USD → converter R$ 100 para USD
        IF transaction_currency = 'BRL' AND rule_record.currency::text <> 'BRL' THEN
          -- Buscar taxa BRL -> moeda da regra (ex: BRL -> USD = 0.1843)
          SELECT rate INTO rate_brl_to_target
          FROM public.exchange_rates
          WHERE base_currency = 'BRL' AND target_currency = rule_record.currency::text
          ORDER BY last_updated DESC
          LIMIT 1;

          IF rate_brl_to_target IS NOT NULL AND rate_brl_to_target > 0 THEN
            amount_in_rule_currency := NEW.amount * rate_brl_to_target;
            RAISE NOTICE 'Mileage: Converting BRL % to % = % (rate: %)',
              NEW.amount, rule_record.currency::text, amount_in_rule_currency, rate_brl_to_target;
          ELSE
            RAISE WARNING 'Mileage: No exchange rate found for BRL -> %, using original amount', rule_record.currency::text;
          END IF;

        -- Caso 2: Transação em moeda estrangeira, regra em BRL
        -- Exemplo: Compra US$ 50, regra em BRL → converter US$ 50 para BRL
        ELSIF transaction_currency <> 'BRL' AND rule_record.currency::text = 'BRL' THEN
          -- Buscar taxa moeda da transação -> BRL
          -- Primeiro tentamos encontrar a taxa invertida (BRL -> source)
          SELECT rate INTO rate_brl_to_target
          FROM public.exchange_rates
          WHERE base_currency = 'BRL' AND target_currency = transaction_currency
          ORDER BY last_updated DESC
          LIMIT 1;

          IF rate_brl_to_target IS NOT NULL AND rate_brl_to_target > 0 THEN
            -- Inverter a taxa: se BRL->USD = 0.18, então USD->BRL = 1/0.18 = 5.43
            amount_in_rule_currency := NEW.amount / rate_brl_to_target;
            RAISE NOTICE 'Mileage: Converting % % to BRL = % (rate: %)',
              transaction_currency, NEW.amount, amount_in_rule_currency, rate_brl_to_target;
          ELSE
            RAISE WARNING 'Mileage: No exchange rate found for % -> BRL, using original amount', transaction_currency;
          END IF;

        -- Caso 3: Transação e regra em moedas estrangeiras diferentes
        -- Exemplo: Compra em EUR, regra em USD → EUR -> BRL -> USD
        ELSE
          -- Converter transação para BRL primeiro
          SELECT rate INTO rate_brl_to_target
          FROM public.exchange_rates
          WHERE base_currency = 'BRL' AND target_currency = transaction_currency
          ORDER BY last_updated DESC
          LIMIT 1;

          IF rate_brl_to_target IS NOT NULL AND rate_brl_to_target > 0 THEN
            -- Inverter: transaction_currency -> BRL
            amount_in_rule_currency := NEW.amount / rate_brl_to_target;

            -- Agora converter BRL para moeda da regra
            SELECT rate INTO rate_brl_to_target
            FROM public.exchange_rates
            WHERE base_currency = 'BRL' AND target_currency = rule_record.currency::text
            ORDER BY last_updated DESC
            LIMIT 1;

            IF rate_brl_to_target IS NOT NULL AND rate_brl_to_target > 0 THEN
              amount_in_rule_currency := amount_in_rule_currency * rate_brl_to_target;
              RAISE NOTICE 'Mileage: Converting % % to % = % (via BRL)',
                transaction_currency, NEW.amount, rule_record.currency::text, amount_in_rule_currency;
            END IF;
          ELSE
            RAISE WARNING 'Mileage: No exchange rate found for cross-currency conversion, using original amount';
          END IF;
        END IF;
      END IF;

      -- Calcular milhas usando valor convertido
      miles_earned := (amount_in_rule_currency / rule_record.amount_threshold) * rule_record.miles_per_amount;
      month_year_str := TO_CHAR(NEW.transaction_date, 'YYYY-MM');

      RAISE NOTICE 'Mileage: amount_in_rule_currency=%, threshold=%, miles_per_amount=%, miles_earned=%',
        amount_in_rule_currency, rule_record.amount_threshold, rule_record.miles_per_amount, miles_earned;

      -- Insert mileage history record
      INSERT INTO public.mileage_history (
        user_id,
        card_id,
        rule_id,
        transaction_id,
        amount_spent,
        miles_earned,
        calculation_date,
        month_year
      ) VALUES (
        NEW.user_id,
        NEW.card_id,
        rule_record.id,
        NEW.id,
        NEW.amount,
        miles_earned,
        NEW.transaction_date,
        month_year_str
      );

      -- Update mileage goals current_miles for this specific user
      UPDATE public.mileage_goals
      SET current_miles = current_miles + miles_earned,
          is_completed = CASE
            WHEN (current_miles + miles_earned) >= target_miles THEN true
            ELSE is_completed
          END,
          updated_at = now()
      WHERE user_id = NEW.user_id
        AND is_completed = false
        AND (source_card_id IS NULL OR source_card_id = NEW.card_id);
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

COMMENT ON FUNCTION public.calculate_miles_for_transaction() IS
'Calcula milhas automaticamente quando uma transação é inserida.
Suporta conversão de moeda usando exchange_rates.';


-- Fix 2: Corrigir RLS permissiva (WITH CHECK (true)) em user_financial_notifications
DROP POLICY IF EXISTS "Service role can insert financial notifications" ON public.user_financial_notifications;

CREATE POLICY "Service role can insert financial notifications"
ON public.user_financial_notifications
FOR INSERT
TO public
WITH CHECK (auth.role() = 'service_role');
