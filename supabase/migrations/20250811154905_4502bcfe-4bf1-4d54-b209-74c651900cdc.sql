-- Ensure card available limit is driven by user-provided initial_balance and updated by expenses
-- Function to validate and update card available balance on transactions
CREATE OR REPLACE FUNCTION public.handle_card_available_on_transaction()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  avail NUMERIC;
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.type = 'expense' AND NEW.card_id IS NOT NULL THEN
      SELECT initial_balance INTO avail FROM public.cards WHERE id = NEW.card_id FOR UPDATE;
      IF avail IS NULL THEN
        avail := 0;
      END IF;
      IF NEW.amount > GREATEST(avail, 0) THEN
        RAISE EXCEPTION 'Limite do cartão insuficiente. Disponível: %, Tentativa: %', avail, NEW.amount;
      END IF;
      UPDATE public.cards
      SET initial_balance = GREATEST(0, COALESCE(initial_balance,0) - COALESCE(NEW.amount,0)),
          current_balance = COALESCE(current_balance,0) + COALESCE(NEW.amount,0),
          updated_at = now()
      WHERE id = NEW.card_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Revert OLD effect if it was an expense with a card
    IF OLD.type = 'expense' AND OLD.card_id IS NOT NULL THEN
      UPDATE public.cards
      SET initial_balance = COALESCE(initial_balance,0) + COALESCE(OLD.amount,0),
          current_balance = GREATEST(0, COALESCE(current_balance,0) - COALESCE(OLD.amount,0)),
          updated_at = now()
      WHERE id = OLD.card_id;
    END IF;

    -- Apply NEW effect if it is an expense with a card
    IF NEW.type = 'expense' AND NEW.card_id IS NOT NULL THEN
      SELECT initial_balance INTO avail FROM public.cards WHERE id = NEW.card_id FOR UPDATE;
      IF avail IS NULL THEN
        avail := 0;
      END IF;
      IF NEW.amount > GREATEST(avail, 0) THEN
        RAISE EXCEPTION 'Limite do cartão insuficiente. Disponível: %, Tentativa: %', avail, NEW.amount;
      END IF;
      UPDATE public.cards
      SET initial_balance = GREATEST(0, COALESCE(initial_balance,0) - COALESCE(NEW.amount,0)),
          current_balance = COALESCE(current_balance,0) + COALESCE(NEW.amount,0),
          updated_at = now()
      WHERE id = NEW.card_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.type = 'expense' AND OLD.card_id IS NOT NULL THEN
      UPDATE public.cards
      SET initial_balance = COALESCE(initial_balance,0) + COALESCE(OLD.amount,0),
          current_balance = GREATEST(0, COALESCE(current_balance,0) - COALESCE(OLD.amount,0)),
          updated_at = now()
      WHERE id = OLD.card_id;
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$function$;

-- Trigger to invoke the function on transaction changes
DROP TRIGGER IF EXISTS trg_card_available_on_transaction ON public.transactions;

CREATE TRIGGER trg_card_available_on_transaction
AFTER INSERT OR UPDATE OF amount, type, card_id OR DELETE
ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION public.handle_card_available_on_transaction();