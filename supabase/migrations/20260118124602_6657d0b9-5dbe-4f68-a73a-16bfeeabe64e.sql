-- Create emergency accounts for all existing users who don't have one
INSERT INTO accounts (user_id, owner_user, name, account_type, account_model, balance, overdraft_limit, currency, is_active, is_cash_account)
SELECT 
  p.user_id,
  'user1',
  'Reserva de Emergência',
  'emergency',
  'personal',
  0,
  0,
  COALESCE(p.preferred_currency, 'BRL'),
  true,
  false
FROM profiles p
LEFT JOIN accounts a ON a.user_id = p.user_id AND a.account_type = 'emergency' AND a.deleted_at IS NULL
WHERE a.id IS NULL;