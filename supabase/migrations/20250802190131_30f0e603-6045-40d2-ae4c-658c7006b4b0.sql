-- Add missing fields to transactions table
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS payment_method TEXT CHECK (payment_method IN ('cash', 'credit_card', 'debit_card')),
ADD COLUMN IF NOT EXISTS subcategory TEXT;

-- Update categories table to include subcategories
CREATE TABLE IF NOT EXISTS public.subcategories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on subcategories
ALTER TABLE public.subcategories ENABLE ROW LEVEL SECURITY;

-- Create policies for subcategories
CREATE POLICY "Users can view their own subcategories" 
ON public.subcategories 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own subcategories" 
ON public.subcategories 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subcategories" 
ON public.subcategories 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own subcategories" 
ON public.subcategories 
FOR DELETE 
USING (auth.uid() = user_id);