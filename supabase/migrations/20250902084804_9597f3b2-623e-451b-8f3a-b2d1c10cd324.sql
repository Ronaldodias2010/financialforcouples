-- Fix the trigger function to properly calculate credit card balances
-- Expenses are stored as positive amounts in transactions table
CREATE OR REPLACE FUNCTION update_card_balance()
RETURNS TRIGGER AS $$
DECLARE
    card_record RECORD;
    total_gastos NUMERIC := 0;
BEGIN
    -- Get all cards that might be affected
    FOR card_record IN 
        SELECT DISTINCT c.id, c.credit_limit, c.initial_balance_original, c.card_type
        FROM cards c
        WHERE c.card_type = 'credit'
    LOOP
        -- Calculate total spending for this card (expenses are positive amounts)
        SELECT COALESCE(SUM(t.amount), 0) INTO total_gastos
        FROM transactions t
        WHERE t.card_id = card_record.id 
        AND t.type = 'expense'; -- Expenses are stored as positive amounts
        
        -- Update the card's initial_balance (available limit)
        -- Available limit = credit_limit - initial_balance_original - total_spent
        -- Allow negative values to show over-limit spending
        UPDATE cards 
        SET initial_balance = card_record.credit_limit - COALESCE(card_record.initial_balance_original, 0) - total_gastos,
            updated_at = now()
        WHERE id = card_record.id;
    END LOOP;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Manually update all existing credit card balances with corrected calculation
DO $$
DECLARE
    card_record RECORD;
    total_gastos NUMERIC := 0;
    new_available_limit NUMERIC := 0;
BEGIN
    FOR card_record IN 
        SELECT id, name, credit_limit, initial_balance_original, card_type
        FROM cards
        WHERE card_type = 'credit'
    LOOP
        -- Calculate total spending for this card (expenses are positive amounts)
        SELECT COALESCE(SUM(amount), 0) INTO total_gastos
        FROM transactions
        WHERE card_id = card_record.id 
        AND type = 'expense'; -- Expenses are stored as positive amounts
        
        -- Calculate new available limit (allow negative values)
        new_available_limit := card_record.credit_limit - COALESCE(card_record.initial_balance_original, 0) - total_gastos;
        
        -- Update the card's initial_balance
        UPDATE cards 
        SET initial_balance = new_available_limit,
            updated_at = now()
        WHERE id = card_record.id;
        
        RAISE NOTICE 'Updated card %: credit_limit=%, initial_balance_original=%, total_gastos=%, new_available_limit=%', 
            card_record.name, 
            card_record.credit_limit, 
            card_record.initial_balance_original, 
            total_gastos, 
            new_available_limit;
    END LOOP;
END;
$$;