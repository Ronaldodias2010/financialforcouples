-- Add user_question column to ai_history table to store the user's original question
ALTER TABLE public.ai_history 
ADD COLUMN user_question TEXT;