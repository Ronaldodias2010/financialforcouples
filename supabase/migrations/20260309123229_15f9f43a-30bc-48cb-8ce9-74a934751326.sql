
-- Create automatic_debits table for variable automatic payment configurations
CREATE TABLE public.automatic_debits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  debit_type TEXT NOT NULL DEFAULT 'variable', -- 'credit_card', 'variable_bill', 'one_time'
  card_id UUID REFERENCES public.cards(id) ON DELETE SET NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE, -- account to debit from
  debit_day INTEGER NOT NULL CHECK (debit_day >= 1 AND debit_day <= 31), -- day of month to process
  fixed_amount NUMERIC, -- NULL = variable (e.g. credit card bill uses current balance)
  description TEXT,
  owner_user UUID,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_processed_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.automatic_debits ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own automatic debits"
  ON public.automatic_debits FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR user_id IN (
    SELECT CASE WHEN user1_id = auth.uid() THEN user2_id ELSE user1_id END
    FROM public.user_couples WHERE (user1_id = auth.uid() OR user2_id = auth.uid()) AND status = 'active'
  ));

CREATE POLICY "Users can insert own automatic debits"
  ON public.automatic_debits FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own automatic debits"
  ON public.automatic_debits FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() OR user_id IN (
    SELECT CASE WHEN user1_id = auth.uid() THEN user2_id ELSE user1_id END
    FROM public.user_couples WHERE (user1_id = auth.uid() OR user2_id = auth.uid()) AND status = 'active'
  ));

CREATE POLICY "Users can delete own automatic debits"
  ON public.automatic_debits FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- DB function to process automatic debits daily
CREATE OR REPLACE FUNCTION public.process_automatic_debits_daily()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_debit RECORD;
  v_amount NUMERIC;
  v_account_balance NUMERIC;
  v_today_day INTEGER;
  v_today DATE;
  v_card RECORD;
BEGIN
  v_today := CURRENT_DATE;
  v_today_day := EXTRACT(DAY FROM v_today);

  FOR v_debit IN 
    SELECT ad.*, a.balance as account_balance, a.name as account_name
    FROM public.automatic_debits ad
    JOIN public.accounts a ON a.id = ad.account_id
    WHERE ad.is_active = true
      AND ad.debit_day = v_today_day
      AND (ad.last_processed_date IS NULL OR ad.last_processed_date < v_today)
  LOOP
    -- Determine amount
    IF v_debit.debit_type = 'credit_card' AND v_debit.card_id IS NOT NULL THEN
      -- Get current card balance (debt)
      SELECT * INTO v_card FROM public.cards WHERE id = v_debit.card_id;
      v_amount := ABS(COALESCE(v_card.current_balance, 0));
      IF v_amount <= 0 THEN
        CONTINUE; -- No debt, skip
      END IF;
    ELSIF v_debit.fixed_amount IS NOT NULL AND v_debit.fixed_amount > 0 THEN
      v_amount := v_debit.fixed_amount;
    ELSE
      CONTINUE; -- No amount to process
    END IF;

    -- Check account balance
    v_account_balance := COALESCE(v_debit.account_balance, 0);
    
    IF v_account_balance < v_amount THEN
      -- Insufficient funds → create overdue transaction
      INSERT INTO public.transactions (
        user_id, type, amount, description, transaction_date, due_date,
        status, category_id, payment_method, account_id, card_id,
        owner_user, card_transaction_type
      ) VALUES (
        v_debit.user_id, 'expense', v_amount,
        'Débito Automático: ' || v_debit.name,
        v_today, v_today, 'pending',
        v_debit.category_id, 'account_transfer', v_debit.account_id,
        v_debit.card_id, v_debit.owner_user,
        CASE WHEN v_debit.debit_type = 'credit_card' THEN 'card_payment' ELSE NULL END
      );
      
      RAISE NOTICE 'Insufficient funds for auto debit %: need % but have %', v_debit.name, v_amount, v_account_balance;
    ELSE
      -- Sufficient funds → process payment
      IF v_debit.debit_type = 'credit_card' AND v_debit.card_id IS NOT NULL THEN
        -- Use the existing process_card_payment function
        PERFORM public.process_card_payment(
          v_debit.card_id, v_debit.user_id, v_debit.account_id,
          v_amount, v_today::text, 'Débito Automático'
        );
      ELSE
        -- Regular debit: create completed expense transaction
        INSERT INTO public.transactions (
          user_id, type, amount, description, transaction_date, due_date,
          status, category_id, payment_method, account_id,
          owner_user, purchase_date
        ) VALUES (
          v_debit.user_id, 'expense', v_amount,
          'Débito Automático: ' || v_debit.name,
          v_today, v_today, 'completed',
          v_debit.category_id, 'account_transfer', v_debit.account_id,
          v_debit.owner_user, v_today
        );
      END IF;
    END IF;

    -- Mark as processed today
    UPDATE public.automatic_debits
    SET last_processed_date = v_today, updated_at = now()
    WHERE id = v_debit.id;

    -- Deactivate one-time debits after processing
    IF v_debit.debit_type = 'one_time' THEN
      UPDATE public.automatic_debits
      SET is_active = false, updated_at = now()
      WHERE id = v_debit.id;
    END IF;
  END LOOP;
END;
$$;
