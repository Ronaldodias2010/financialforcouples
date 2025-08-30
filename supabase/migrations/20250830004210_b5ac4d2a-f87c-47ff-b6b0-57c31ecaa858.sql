-- Create airline_promotions table for tracking airline mileage promotions
CREATE TABLE public.airline_promotions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  airline_code TEXT NOT NULL, -- LATAM, GOL, AZUL, AVIANCA, etc.
  airline_name TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  promotion_type TEXT NOT NULL DEFAULT 'transfer_bonus', -- transfer_bonus, purchase_discount, route_promotion, etc.
  miles_required NUMERIC,
  bonus_percentage NUMERIC,
  discount_percentage NUMERIC,
  route_from TEXT,
  route_to TEXT,
  promotion_url TEXT,
  terms_conditions TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  currency TEXT DEFAULT 'BRL',
  original_price NUMERIC,
  promotional_price NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  external_promotion_id TEXT, -- ID from airline API
  last_synced_at TIMESTAMP WITH TIME ZONE
);

-- Create user_promotion_notifications table to track sent notifications
CREATE TABLE public.user_promotion_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  promotion_id UUID NOT NULL REFERENCES public.airline_promotions(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL DEFAULT 'eligible', -- eligible, expiring, new_promotion
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_miles_at_notification NUMERIC NOT NULL DEFAULT 0,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.airline_promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_promotion_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for airline_promotions - readable by all authenticated users
CREATE POLICY "Promotions are viewable by all authenticated users" 
ON public.airline_promotions 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND is_active = true);

-- Only service role can manage promotions (for API updates)
CREATE POLICY "Service role can manage promotions" 
ON public.airline_promotions 
FOR ALL 
USING (auth.role() = 'service_role');

-- RLS Policies for user_promotion_notifications
CREATE POLICY "Users can view their own notifications" 
ON public.user_promotion_notifications 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" 
ON public.user_promotion_notifications 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage notifications" 
ON public.user_promotion_notifications 
FOR ALL 
USING (auth.role() = 'service_role');

-- Create indexes for better performance
CREATE INDEX idx_airline_promotions_active_dates ON public.airline_promotions(is_active, start_date, end_date);
CREATE INDEX idx_airline_promotions_airline ON public.airline_promotions(airline_code);
CREATE INDEX idx_user_notifications_user_id ON public.user_promotion_notifications(user_id);
CREATE INDEX idx_user_notifications_promotion_id ON public.user_promotion_notifications(promotion_id);

-- Create trigger for updating updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_airline_promotions_updated_at 
    BEFORE UPDATE ON public.airline_promotions 
    FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

-- Insert some sample promotions for testing
INSERT INTO public.airline_promotions (airline_code, airline_name, title, description, promotion_type, miles_required, bonus_percentage, route_from, route_to, start_date, end_date, promotion_url) VALUES
('LATAM', 'LATAM Pass', 'Transferência com 100% de Bônus', 'Transfira pontos de cartões de crédito com 100% de bônus até 31 de janeiro', 'transfer_bonus', NULL, 100, NULL, NULL, '2025-01-01', '2025-01-31', 'https://www.latampass.com'),
('GOL', 'Smiles', 'Promoção Fidelidade - 50% Off', 'Milhas com 50% de desconto para membros Smiles', 'purchase_discount', NULL, NULL, NULL, NULL, '2025-01-15', '2025-02-15', 'https://www.smiles.com.br'),
('AZUL', 'TudoAzul', 'São Paulo → Paris por 45.000 pontos', 'Viagem para Paris com desconto especial em pontos', 'route_promotion', 45000, NULL, 'São Paulo', 'Paris', '2025-01-01', '2025-03-31', 'https://www.tudoazul.com'),
('LATAM', 'LATAM Pass', 'Rio → Miami Promocional', 'Voos para Miami com pontos em promoção', 'route_promotion', 35000, NULL, 'Rio de Janeiro', 'Miami', '2025-01-01', '2025-02-28', 'https://www.latampass.com');

-- Create function to check user eligibility for promotions
CREATE OR REPLACE FUNCTION public.check_user_promotion_eligibility(p_user_id UUID, p_promotion_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_total_miles NUMERIC;
  v_promotion_miles_required NUMERIC;
BEGIN
  -- Get user's total miles (from existing function logic)
  SELECT 
    COALESCE(
      (SELECT SUM(miles_earned) FROM mileage_history WHERE user_id = p_user_id), 0
    ) + 
    COALESCE(
      (SELECT SUM(existing_miles) FROM card_mileage_rules WHERE user_id = p_user_id AND is_active = true), 0
    )
  INTO v_user_total_miles;
  
  -- Get promotion requirements
  SELECT miles_required INTO v_promotion_miles_required
  FROM airline_promotions
  WHERE id = p_promotion_id AND is_active = true;
  
  -- Return true if user has enough miles or if promotion doesn't require specific miles
  RETURN (v_promotion_miles_required IS NULL OR v_user_total_miles >= v_promotion_miles_required);
END;
$$;