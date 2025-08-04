-- Create table for credit card mileage rules
CREATE TABLE public.card_mileage_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  card_id UUID REFERENCES public.cards(id) ON DELETE CASCADE,
  bank_name TEXT NOT NULL,
  card_brand TEXT NOT NULL,
  miles_per_amount NUMERIC NOT NULL DEFAULT 1,
  amount_threshold NUMERIC NOT NULL DEFAULT 1,
  currency currency_type NOT NULL DEFAULT 'BRL',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for mileage history
CREATE TABLE public.mileage_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  card_id UUID REFERENCES public.cards(id) ON DELETE CASCADE,
  rule_id UUID REFERENCES public.card_mileage_rules(id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
  amount_spent NUMERIC NOT NULL,
  miles_earned NUMERIC NOT NULL,
  calculation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  month_year TEXT NOT NULL, -- Format: YYYY-MM for grouping
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for mileage goals
CREATE TABLE public.mileage_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  target_miles NUMERIC NOT NULL,
  current_miles NUMERIC NOT NULL DEFAULT 0,
  target_date DATE,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.card_mileage_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mileage_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mileage_goals ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for card_mileage_rules
CREATE POLICY "Users can view their own mileage rules" 
ON public.card_mileage_rules 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own mileage rules" 
ON public.card_mileage_rules 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own mileage rules" 
ON public.card_mileage_rules 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own mileage rules" 
ON public.card_mileage_rules 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for mileage_history
CREATE POLICY "Users can view their own mileage history" 
ON public.mileage_history 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own mileage history" 
ON public.mileage_history 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own mileage history" 
ON public.mileage_history 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own mileage history" 
ON public.mileage_history 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for mileage_goals
CREATE POLICY "Users can view their own mileage goals" 
ON public.mileage_goals 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own mileage goals" 
ON public.mileage_goals 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own mileage goals" 
ON public.mileage_goals 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own mileage goals" 
ON public.mileage_goals 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create triggers for updated_at columns
CREATE TRIGGER update_card_mileage_rules_updated_at
BEFORE UPDATE ON public.card_mileage_rules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_mileage_goals_updated_at
BEFORE UPDATE ON public.mileage_goals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to calculate miles for transactions
CREATE OR REPLACE FUNCTION public.calculate_miles_for_transaction()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Create trigger for automatic mileage calculation
CREATE TRIGGER calculate_miles_on_transaction
AFTER INSERT ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION public.calculate_miles_for_transaction();