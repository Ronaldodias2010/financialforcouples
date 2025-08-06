-- Criar transações de teste para demonstrar o compartilhamento
-- Primeiro, vamos criar uma categoria básica para o usuário parceiro se não existir
INSERT INTO public.categories (user_id, name, category_type, color, owner_user, created_at) 
VALUES ('91b37387-dee2-401e-93f7-3d8b15f39a20', 'Alimentação', 'expense', '#ff6b6b', 'user2', now())
ON CONFLICT DO NOTHING;

-- Agora criar algumas transações para o usuário parceiro (user2)
INSERT INTO public.transactions (
  user_id, 
  type, 
  amount, 
  description, 
  category_id, 
  transaction_date, 
  currency, 
  owner_user,
  created_at
) VALUES 
  ('91b37387-dee2-401e-93f7-3d8b15f39a20', 'income', 5000.00, 'Salário Dezembro', NULL, '2025-08-01', 'BRL', 'user2', now()),
  ('91b37387-dee2-401e-93f7-3d8b15f39a20', 'expense', 150.00, 'Supermercado', (SELECT id FROM categories WHERE user_id = '91b37387-dee2-401e-93f7-3d8b15f39a20' AND name = 'Alimentação' LIMIT 1), '2025-08-02', 'BRL', 'user2', now()),
  ('91b37387-dee2-401e-93f7-3d8b15f39a20', 'expense', 80.00, 'Restaurante', (SELECT id FROM categories WHERE user_id = '91b37387-dee2-401e-93f7-3d8b15f39a20' AND name = 'Alimentação' LIMIT 1), '2025-08-03', 'BRL', 'user2', now());