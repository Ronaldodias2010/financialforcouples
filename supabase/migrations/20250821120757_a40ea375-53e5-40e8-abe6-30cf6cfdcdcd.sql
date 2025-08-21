-- 1) Add account_id to cards
ALTER TABLE public.cards
ADD COLUMN IF NOT EXISTS account_id uuid REFERENCES public.accounts(id) ON DELETE SET NULL;

-- 2) Unique index: avoid duplicate last_four_digits within same type per user
CREATE UNIQUE INDEX IF NOT EXISTS unique_card_digits_per_type_per_user
ON public.cards (user_id, card_type, last_four_digits)
WHERE last_four_digits IS NOT NULL;

-- 3) Validation trigger: debit cards must be linked to an account; for credit, nullify account_id
CREATE OR REPLACE FUNCTION public.validate_and_normalize_card_account()
RETURNS trigger AS $$
BEGIN
  IF NEW.card_type = 'debit' THEN
    IF NEW.account_id IS NULL THEN
      RAISE EXCEPTION 'Cartão de débito deve estar vinculado a uma conta.';
    END IF;
  ELSE
    -- normalize: credit cards shouldn't carry account link
    NEW.account_id := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_validate_and_normalize_card_account ON public.cards;
CREATE TRIGGER trg_validate_and_normalize_card_account
BEFORE INSERT OR UPDATE ON public.cards
FOR EACH ROW
EXECUTE FUNCTION public.validate_and_normalize_card_account();

-- 4) Redirect debit-card transactions to the linked account to avoid credit-limit checks
CREATE OR REPLACE FUNCTION public.redirect_debit_card_transactions()
RETURNS trigger AS $$
DECLARE
  v_card_type text;
  v_account_id uuid;
BEGIN
  IF NEW.card_id IS NOT NULL THEN
    SELECT card_type, account_id INTO v_card_type, v_account_id
    FROM public.cards WHERE id = NEW.card_id;

    IF v_card_type = 'debit' THEN
      IF v_account_id IS NULL THEN
        RAISE EXCEPTION 'Cartão de débito sem conta vinculada. Configure a conta no cadastro do cartão.';
      END IF;
      -- Move para conta e remove card_id para não acionar lógica de crédito
      NEW.account_id := v_account_id;
      NEW.card_id := NULL;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_redirect_debit_card_transactions_ins ON public.transactions;
CREATE TRIGGER trg_redirect_debit_card_transactions_ins
BEFORE INSERT ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION public.redirect_debit_card_transactions();

DROP TRIGGER IF EXISTS trg_redirect_debit_card_transactions_upd ON public.transactions;
CREATE TRIGGER trg_redirect_debit_card_transactions_upd
BEFORE UPDATE ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION public.redirect_debit_card_transactions();