-- Add source_card_id column to mileage_goals table to track the card used as source of initial miles
ALTER TABLE public.mileage_goals 
ADD COLUMN source_card_id UUID REFERENCES public.cards(id);