-- Keep available limit exactly as entered on card creation
-- Remove card recalculation triggers and conflicting transaction triggers, keep only expense-driven updates

-- 1) Drop possible card triggers that recalc initial_balance from credit_limit
DROP TRIGGER IF EXISTS set_card_available_fields_before_insert ON public.cards;
DROP TRIGGER IF EXISTS set_card_available_fields_before_update ON public.cards;

-- 2) Drop old/alternative transaction triggers to avoid double updates or alternate validations
DROP TRIGGER IF EXISTS trg_update_card_balance ON public.transactions;
DROP TRIGGER IF EXISTS validate_transaction_card_limit_trigger ON public.transactions;

-- 3) Ensure our expense-driven trigger is in place (recreate idempotently)
DROP TRIGGER IF EXISTS trg_card_available_on_transaction ON public.transactions;
CREATE TRIGGER trg_card_available_on_transaction
AFTER INSERT OR UPDATE OF amount, type, card_id OR DELETE
ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION public.handle_card_available_on_transaction();
