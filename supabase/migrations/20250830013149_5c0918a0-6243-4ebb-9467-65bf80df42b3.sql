-- Create user_promotion_favorites table
CREATE TABLE public.user_promotion_favorites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  promotion_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, promotion_id)
);

-- Enable Row Level Security
ALTER TABLE public.user_promotion_favorites ENABLE ROW LEVEL SECURITY;

-- Create policies for user favorites
CREATE POLICY "Users can view their own promotion favorites" 
ON public.user_promotion_favorites 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own promotion favorites" 
ON public.user_promotion_favorites 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own promotion favorites" 
ON public.user_promotion_favorites 
FOR DELETE 
USING (auth.uid() = user_id);

-- Update airline_promotions with active dates and more variety
UPDATE public.airline_promotions SET 
  start_date = CURRENT_DATE,
  end_date = CURRENT_DATE + INTERVAL '90 days',
  is_active = true,
  last_synced_at = now()
WHERE id IN (
  SELECT id FROM public.airline_promotions LIMIT 5
);

-- Add trigger for updated_at on favorites
CREATE TRIGGER update_user_promotion_favorites_updated_at
BEFORE UPDATE ON public.user_promotion_favorites
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();