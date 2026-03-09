

## Problem Identified

The `process_card_payment` function has a **double deduction bug**:

1. It manually runs `UPDATE accounts SET balance = balance - p_payment_amount` (first deduction)
2. It inserts an expense transaction with `account_id` set
3. The `update_account_balance_on_transaction` trigger fires and deducts the same amount **again** (second deduction)

Result: Account balance drops by 2x the payment amount. With R$15,843 and a R$15,750 payment, the account ends at R$15,843 - R$31,500 = negative, which explains the zero/wrong balance.

For the card side, the `initial_balance_original` reduction is correct, but the `update_card_balance` trigger recalculates `current_balance = ibo + total_expenses` — so the card balance should update correctly once the function is fixed.

## Fix

**Update `update_account_balance_on_transaction` trigger** to skip transactions where `card_transaction_type = 'card_payment'`, since `process_card_payment` already handles the account balance deduction manually.

This is the same pattern already applied to `validate_account_overdraft` and `update_card_balance` — they both skip card_payment transactions.

### SQL Migration

```sql
CREATE OR REPLACE FUNCTION public.update_account_balance_on_transaction()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  old_effect NUMERIC := 0;
  new_effect NUMERIC := 0;
BEGIN
  -- DELETE: revert old effect
  IF TG_OP = 'DELETE' THEN
    IF OLD.account_id IS NOT NULL THEN
      IF OLD.type = 'expense' THEN
        UPDATE public.accounts SET balance = balance + COALESCE(OLD.amount, 0), updated_at = now() WHERE id = OLD.account_id;
      ELSIF OLD.type = 'income' THEN
        UPDATE public.accounts SET balance = balance - COALESCE(OLD.amount, 0), updated_at = now() WHERE id = OLD.account_id;
      END IF;
    END IF;
    RETURN OLD;
  END IF;

  -- SKIP card_payment transactions (balance handled by process_card_payment)
  IF COALESCE(NEW.card_transaction_type, '') = 'card_payment' THEN
    RETURN NEW;
  END IF;

  -- ... rest of existing logic unchanged ...
END;
$$;
```

### Data Fix

Run a corrective query to fix the Inter account balance (add back the extra deduction of R$15,750), restoring the correct R$93 remainder (R$15,843 - R$15,750). This will be done via the insert tool after the migration.

### Summary

- **1 migration**: Update trigger function to skip card_payment transactions
- **1 data fix**: Correct the Inter account balance
- No frontend changes needed

