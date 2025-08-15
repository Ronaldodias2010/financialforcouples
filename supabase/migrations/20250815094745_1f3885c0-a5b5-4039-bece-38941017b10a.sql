-- Create investment types table for custom user-defined investment types
CREATE TABLE public.investment_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, name)
);

-- Enable Row Level Security
ALTER TABLE public.investment_types ENABLE ROW LEVEL SECURITY;

-- Create policies for investment types
CREATE POLICY "Users can view couple investment types" 
ON public.investment_types 
FOR SELECT 
USING (
  (auth.uid() = user_id) OR 
  (EXISTS (
    SELECT 1 
    FROM user_couples 
    WHERE status = 'active' 
    AND (
      (user1_id = auth.uid() AND user2_id = investment_types.user_id) OR 
      (user2_id = auth.uid() AND user1_id = investment_types.user_id)
    )
  ))
);

CREATE POLICY "Users can create their own investment types" 
ON public.investment_types 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own investment types" 
ON public.investment_types 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own investment types" 
ON public.investment_types 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_investment_types_updated_at
  BEFORE UPDATE ON public.investment_types
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default investment types for existing users
INSERT INTO public.investment_types (user_id, name)
SELECT DISTINCT user_id, 'Renda Fixa' FROM public.investments
WHERE NOT EXISTS (
  SELECT 1 FROM public.investment_types 
  WHERE investment_types.user_id = investments.user_id 
  AND investment_types.name = 'Renda Fixa'
);

INSERT INTO public.investment_types (user_id, name)
SELECT DISTINCT user_id, 'Renda Variável' FROM public.investments
WHERE NOT EXISTS (
  SELECT 1 FROM public.investment_types 
  WHERE investment_types.user_id = investments.user_id 
  AND investment_types.name = 'Renda Variável'
);

INSERT INTO public.investment_types (user_id, name)
SELECT DISTINCT user_id, 'Criptomoedas' FROM public.investments
WHERE NOT EXISTS (
  SELECT 1 FROM public.investment_types 
  WHERE investment_types.user_id = investments.user_id 
  AND investment_types.name = 'Criptomoedas'
);

INSERT INTO public.investment_types (user_id, name)
SELECT DISTINCT user_id, 'Fundos' FROM public.investments
WHERE NOT EXISTS (
  SELECT 1 FROM public.investment_types 
  WHERE investment_types.user_id = investments.user_id 
  AND investment_types.name = 'Fundos'
);

INSERT INTO public.investment_types (user_id, name)
SELECT DISTINCT user_id, 'Tesouro Direto' FROM public.investments
WHERE NOT EXISTS (
  SELECT 1 FROM public.investment_types 
  WHERE investment_types.user_id = investments.user_id 
  AND investment_types.name = 'Tesouro Direto'
);