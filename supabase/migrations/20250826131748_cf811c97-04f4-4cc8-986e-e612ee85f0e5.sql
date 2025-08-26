-- Create AI history table for premium users
CREATE TABLE public.ai_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_type TEXT NOT NULL DEFAULT 'limit_exceeded', -- 'limit_exceeded', 'ai_analysis', 'recommendation'
  message TEXT NOT NULL,
  card_name TEXT,
  amount NUMERIC,
  currency TEXT DEFAULT 'BRL',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_history ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view couple AI history" 
ON public.ai_history 
FOR SELECT 
USING ((auth.uid() = user_id) OR (EXISTS ( SELECT 1
   FROM user_couples
  WHERE ((user_couples.status = 'active'::text) AND (((user_couples.user1_id = auth.uid()) AND (user_couples.user2_id = ai_history.user_id)) OR ((user_couples.user2_id = auth.uid()) AND (user_couples.user1_id = ai_history.user_id)))))));

CREATE POLICY "Users can create their own AI history" 
ON public.ai_history 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own AI history" 
ON public.ai_history 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own AI history" 
ON public.ai_history 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_ai_history_updated_at
BEFORE UPDATE ON public.ai_history
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();