
-- =====================================================
-- FIX: update_card_balance trigger to include initial_balance_original
-- Problem: current_balance = SUM(transactions) ignoring pre-existing debt
-- Fix: current_balance = COALESCE(initial_balance_original, 0) + SUM(transactions)
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_card_balance()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_card_id uuid;
  total_expenses numeric;
  card_credit_limit numeric;
  ibo numeric;
BEGIN
  -- Determine which card to update
  IF TG_OP = 'DELETE' THEN
    target_card_id := OLD.card_id;
  ELSIF TG_OP = 'UPDATE' THEN
    -- If card_id changed, update both old and new cards
    IF OLD.card_id IS DISTINCT FROM NEW.card_id THEN
      -- Update old card
      IF OLD.card_id IS NOT NULL THEN
        SELECT COALESCE(SUM(amount), 0) INTO total_expenses
        FROM transactions
        WHERE card_id = OLD.card_id
          AND deleted_at IS NULL
          AND COALESCE(card_transaction_type, '') != 'card_payment';

        SELECT COALESCE(credit_limit, 0), COALESCE(initial_balance_original, 0)
        INTO card_credit_limit, ibo
        FROM cards WHERE id = OLD.card_id;

        UPDATE cards
        SET current_balance = ibo + total_expenses,
            initial_balance = GREATEST(0, card_credit_limit - ibo - total_expenses),
            updated_at = now()
        WHERE id = OLD.card_id;
      END IF;
      target_card_id := NEW.card_id;
    ELSE
      target_card_id := NEW.card_id;
    END IF;
  ELSE
    target_card_id := NEW.card_id;
  END IF;

  -- Skip if no card associated or if it's a card_payment transaction
  IF target_card_id IS NULL THEN
    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    ELSE
      RETURN NEW;
    END IF;
  END IF;

  -- Skip card_payment transactions from balance calculation
  IF TG_OP != 'DELETE' AND COALESCE(NEW.card_transaction_type, '') = 'card_payment' THEN
    RETURN NEW;
  END IF;

  -- Calculate total expenses for this card (excluding card_payment transactions)
  SELECT COALESCE(SUM(amount), 0) INTO total_expenses
  FROM transactions
  WHERE card_id = target_card_id
    AND deleted_at IS NULL
    AND COALESCE(card_transaction_type, '') != 'card_payment';

  -- Get card's credit_limit and initial_balance_original
  SELECT COALESCE(credit_limit, 0), COALESCE(initial_balance_original, 0)
  INTO card_credit_limit, ibo
  FROM cards WHERE id = target_card_id;

  -- Update card balance: current_balance = pre-existing debt + new expenses
  UPDATE cards
  SET current_balance = ibo + total_expenses,
      initial_balance = GREATEST(0, card_credit_limit - ibo - total_expenses),
      updated_at = now()
  WHERE id = target_card_id;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- =====================================================
-- RECALCULATE all existing card balances immediately
-- =====================================================
WITH card_expenses AS (
  SELECT
    c.id AS card_id,
    COALESCE(c.initial_balance_original, 0) AS ibo,
    COALESCE(c.credit_limit, 0) AS credit_limit,
    COALESCE(SUM(t.amount), 0) AS total_expenses
  FROM cards c
  LEFT JOIN transactions t ON t.card_id = c.id
    AND t.deleted_at IS NULL
    AND COALESCE(t.card_transaction_type, '') != 'card_payment'
  WHERE c.deleted_at IS NULL
  GROUP BY c.id, c.initial_balance_original, c.credit_limit
)
UPDATE cards
SET current_balance = ce.ibo + ce.total_expenses,
    initial_balance = GREATEST(0, ce.credit_limit - ce.ibo - ce.total_expenses),
    updated_at = now()
FROM card_expenses ce
WHERE cards.id = ce.card_id;
