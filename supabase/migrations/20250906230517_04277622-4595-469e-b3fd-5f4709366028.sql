
BEGIN;

-- 1) Corrigir o trigger de atualização de saldo para não reaplicar efeito em updates não financeiros
CREATE OR REPLACE FUNCTION public.update_account_balance_on_transaction()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  old_effect NUMERIC := 0;
  new_effect NUMERIC := 0;
BEGIN
  -- DELETE: reverter o efeito antigo
  IF TG_OP = 'DELETE' THEN
    IF OLD.account_id IS NOT NULL THEN
      IF OLD.type = 'expense' THEN
        UPDATE public.accounts
        SET balance = balance + COALESCE(OLD.amount, 0),
            updated_at = now()
        WHERE id = OLD.account_id;
      ELSIF OLD.type = 'income' THEN
        UPDATE public.accounts
        SET balance = balance - COALESCE(OLD.amount, 0),
            updated_at = now()
        WHERE id = OLD.account_id;
      END IF;
    END IF;
    RETURN OLD;
  END IF;

  -- Pré-cálculo de efeitos
  IF TG_OP = 'UPDATE' AND OLD.account_id IS NOT NULL THEN
    IF OLD.type = 'expense' THEN
      old_effect := -COALESCE(OLD.amount, 0);  -- despesa diminuiu saldo
    ELSIF OLD.type = 'income' THEN
      old_effect := COALESCE(OLD.amount, 0);   -- receita aumentou saldo
    END IF;
  END IF;

  IF NEW.account_id IS NOT NULL THEN
    IF NEW.type = 'expense' THEN
      new_effect := -COALESCE(NEW.amount, 0);
    ELSIF NEW.type = 'income' THEN
      new_effect := COALESCE(NEW.amount, 0);
    END IF;
  END IF;

  -- INSERT: aplicar apenas uma vez
  IF TG_OP = 'INSERT' THEN
    IF NEW.account_id IS NOT NULL THEN
      UPDATE public.accounts
      SET balance = balance + new_effect,
          updated_at = now()
      WHERE id = NEW.account_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Só ajustar saldos se houve mudança financeira:
    -- account_id, type ou amount
    IF (OLD.account_id IS DISTINCT FROM NEW.account_id)
       OR (OLD.type IS DISTINCT FROM NEW.type)
       OR (OLD.amount IS DISTINCT FROM NEW.amount) THEN

      -- Reverter efeito antigo na conta antiga (se existir)
      IF OLD.account_id IS NOT NULL THEN
        UPDATE public.accounts
        SET balance = balance - old_effect,  -- subtrair o efeito antigo reverte o impacto
            updated_at = now()
        WHERE id = OLD.account_id;
      END IF;

      -- Aplicar novo efeito na conta nova (se existir)
      IF NEW.account_id IS NOT NULL THEN
        UPDATE public.accounts
        SET balance = balance + new_effect,
            updated_at = now()
        WHERE id = NEW.account_id;
      END IF;
    END IF;

    RETURN NEW;
  END IF;

  RETURN NULL;
END;
$function$;

-- 2) Recalcular saldos de TODAS as contas com base nas transações (receitas - despesas)

-- 2.1) Atualiza contas que possuem transações
WITH txn AS (
  SELECT
    t.account_id,
    COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE -t.amount END), 0) AS net
  FROM public.transactions t
  WHERE t.account_id IS NOT NULL
  GROUP BY t.account_id
)
UPDATE public.accounts a
SET balance = txn.net,
    updated_at = now()
FROM txn
WHERE a.id = txn.account_id;

-- 2.2) Zera contas que não possuem nenhuma transação vinculada
UPDATE public.accounts a
SET balance = 0,
    updated_at = now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.transactions t WHERE t.account_id = a.id
);

COMMIT;
