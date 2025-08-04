-- Fix security warnings by setting search_path for functions

-- Update the existing calculate_miles_for_transaction function with secure search_path
CREATE OR REPLACE FUNCTION public.calculate_miles_for_transaction()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_temp'
AS $$
DECLARE
  rule_record RECORD;
  miles_earned NUMERIC;
  month_year_str TEXT;
BEGIN
  -- Only process expense transactions with card_id
  IF NEW.type = 'expense' AND NEW.card_id IS NOT NULL THEN
    -- Get active mileage rule for this card
    SELECT * INTO rule_record
    FROM public.card_mileage_rules
    WHERE card_id = NEW.card_id 
    AND user_id = NEW.user_id 
    AND is_active = true
    LIMIT 1;
    
    IF FOUND THEN
      -- Calculate miles earned
      miles_earned := (NEW.amount / rule_record.amount_threshold) * rule_record.miles_per_amount;
      month_year_str := TO_CHAR(NEW.transaction_date, 'YYYY-MM');
      
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
      
      -- Update mileage goals current_miles
      UPDATE public.mileage_goals
      SET current_miles = current_miles + miles_earned,
          is_completed = CASE 
            WHEN (current_miles + miles_earned) >= target_miles THEN true 
            ELSE is_completed 
          END
      WHERE user_id = NEW.user_id AND is_completed = false;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;