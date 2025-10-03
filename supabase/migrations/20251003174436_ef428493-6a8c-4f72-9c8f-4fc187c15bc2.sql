-- Phase 5.1: Update auto_complete_pending_transactions function to handle credit card installments
CREATE OR REPLACE FUNCTION public.auto_complete_pending_transactions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  updated_count INTEGER;
BEGIN
  -- Update all pending transactions (including credit card installments) that are due today or overdue
  WITH updated AS (
    UPDATE public.transactions
    SET status = 'completed',
        transaction_date = CURRENT_DATE,
        updated_at = now()
    WHERE status = 'pending'
      AND due_date <= CURRENT_DATE
    RETURNING id
  )
  SELECT COUNT(*) INTO updated_count FROM updated;
  
  -- Log the operation
  IF updated_count > 0 THEN
    RAISE NOTICE 'Auto-completed % pending transactions (including credit card installments)', updated_count;
  END IF;
END;
$function$;