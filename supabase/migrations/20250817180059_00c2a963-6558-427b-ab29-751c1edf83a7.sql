-- Excluir transações duplicadas "Pastel" de R$ 51,00 do usuário atual
DELETE FROM public.transactions 
WHERE user_id = auth.uid() 
AND description = 'Pastel' 
AND amount = 51.00;