-- Corrigir saldo do cartão Inter Black que não foi atualizado pelo pagamento de R$100
-- current_balance deveria ser 5432.27 - 100 = 5332.27
UPDATE cards 
SET current_balance = current_balance - 100,
    updated_at = now()
WHERE id = 'c76d59fe-81ff-4236-a136-c6bb63dfc609';