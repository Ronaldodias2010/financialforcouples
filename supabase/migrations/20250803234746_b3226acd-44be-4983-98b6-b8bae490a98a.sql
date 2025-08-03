-- Criar tabela de objetivos de investimento
CREATE TABLE public.investment_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  target_amount NUMERIC NOT NULL DEFAULT 0,
  current_amount NUMERIC NOT NULL DEFAULT 0,
  target_date DATE,
  currency currency_type NOT NULL DEFAULT 'BRL',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de investimentos
CREATE TABLE public.investments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  owner_user TEXT DEFAULT 'user1',
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'renda_fixa', 'renda_variavel', 'cripto', 'fundos', 'tesouro_direto'
  amount NUMERIC NOT NULL DEFAULT 0,
  current_value NUMERIC NOT NULL DEFAULT 0,
  purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
  currency currency_type NOT NULL DEFAULT 'BRL',
  is_shared BOOLEAN DEFAULT false,
  goal_id UUID REFERENCES public.investment_goals(id),
  broker TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de performance histórica dos investimentos
CREATE TABLE public.investment_performance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  investment_id UUID NOT NULL REFERENCES public.investments(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  value NUMERIC NOT NULL DEFAULT 0,
  yield_percentage NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.investment_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investment_performance ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para investment_goals
CREATE POLICY "Users can view their own investment goals" 
ON public.investment_goals 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own investment goals" 
ON public.investment_goals 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own investment goals" 
ON public.investment_goals 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own investment goals" 
ON public.investment_goals 
FOR DELETE 
USING (auth.uid() = user_id);

-- Políticas RLS para investments
CREATE POLICY "Users can view their own investments" 
ON public.investments 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own investments" 
ON public.investments 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own investments" 
ON public.investments 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own investments" 
ON public.investments 
FOR DELETE 
USING (auth.uid() = user_id);

-- Políticas RLS para investment_performance
CREATE POLICY "Users can view performance of their investments" 
ON public.investment_performance 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.investments 
    WHERE investments.id = investment_performance.investment_id 
    AND investments.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create performance records for their investments" 
ON public.investment_performance 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.investments 
    WHERE investments.id = investment_performance.investment_id 
    AND investments.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update performance records of their investments" 
ON public.investment_performance 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.investments 
    WHERE investments.id = investment_performance.investment_id 
    AND investments.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete performance records of their investments" 
ON public.investment_performance 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.investments 
    WHERE investments.id = investment_performance.investment_id 
    AND investments.user_id = auth.uid()
  )
);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_investment_goals_updated_at
BEFORE UPDATE ON public.investment_goals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_investments_updated_at
BEFORE UPDATE ON public.investments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();