-- First, let's fix the trigger function to properly calculate credit card balances
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
        -- Calculate total spending for this card
        SELECT COALESCE(SUM(ABS(t.amount)), 0) INTO total_gastos
        FROM transactions t
        WHERE t.card_id = card_record.id 
        AND t.amount < 0; -- Only negative amounts (expenses)
        
        -- Update the card's initial_balance
        -- For credit cards: available_limit = credit_limit - initial_balance_original - total_spent
        UPDATE cards 
        SET initial_balance = card_record.credit_limit - COALESCE(card_record.initial_balance_original, 0) - total_gastos,
            updated_at = now()
        WHERE id = card_record.id;
    END LOOP;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_update_card_balance ON transactions;

-- Create the trigger on transactions table
CREATE TRIGGER trigger_update_card_balance
    AFTER INSERT OR UPDATE OR DELETE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_card_balance();

-- Now let's manually update all existing credit card balances
DO $$
DECLARE
    card_record RECORD;
    total_gastos NUMERIC := 0;
BEGIN
    FOR card_record IN 
        SELECT id, credit_limit, initial_balance_original, card_type
        FROM cards
        WHERE card_type = 'credit'
    LOOP
        -- Calculate total spending for this card
        SELECT COALESCE(SUM(ABS(amount)), 0) INTO total_gastos
        FROM transactions
        WHERE card_id = card_record.id 
        AND amount < 0; -- Only negative amounts (expenses)
        
        -- Update the card's initial_balance
        -- Available limit = credit_limit - initial_balance_original - total_spent
        UPDATE cards 
        SET initial_balance = card_record.credit_limit - COALESCE(card_record.initial_balance_original, 0) - total_gastos,
            updated_at = now()
        WHERE id = card_record.id;
        
        RAISE NOTICE 'Updated card %: credit_limit=%, initial_balance_original=%, total_gastos=%, new_initial_balance=%', 
            card_record.id, 
            card_record.credit_limit, 
            card_record.initial_balance_original, 
            total_gastos, 
            card_record.credit_limit - COALESCE(card_record.initial_balance_original, 0) - total_gastos;
    END LOOP;
END;
$$;