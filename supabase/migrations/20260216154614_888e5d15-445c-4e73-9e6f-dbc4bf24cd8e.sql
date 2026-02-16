
-- Fix Priscila's card balances by adjusting ibo to compensate for payment transactions
-- The trigger calculates: current_balance = ibo + SUM(all non-card_payment expenses)
-- Since payment transactions are tagged as future_expense (not card_payment), 
-- we adjust ibo so the formula gives the correct result

-- Inter: 1151.12 total expenses, want 1130.81 → ibo = -20.31
UPDATE cards 
SET initial_balance_original = -20.31,
    current_balance = 1130.81,
    initial_balance = 13.65,
    updated_at = now()
WHERE id = 'a02ed5e9-e832-40e3-b229-6bddfdfc06b5';

-- Mercado Pago: 8007.28 total expenses, want 6400 → ibo = -1607.28
UPDATE cards 
SET initial_balance_original = -1607.28,
    current_balance = 6400.00,
    initial_balance = 0,
    updated_at = now()
WHERE id = '75676cb4-431b-4146-ab02-80d77d035bf1';
