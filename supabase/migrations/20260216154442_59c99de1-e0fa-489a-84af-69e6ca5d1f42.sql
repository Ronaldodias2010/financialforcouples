
-- Force correct values for Priscila's cards (after trigger settled)

-- Inter: current_balance = 1130.81, limit = 1144.46
UPDATE cards 
SET current_balance = 1130.81,
    initial_balance = 13.65,
    initial_balance_original = 1110.81,
    updated_at = now()
WHERE id = 'a02ed5e9-e832-40e3-b229-6bddfdfc06b5';

-- Mercado Pago: current_balance = 6400, limit = 6000
UPDATE cards 
SET current_balance = 6400.00,
    initial_balance = 0,
    initial_balance_original = 3392.72,
    updated_at = now()
WHERE id = '75676cb4-431b-4146-ab02-80d77d035bf1';
