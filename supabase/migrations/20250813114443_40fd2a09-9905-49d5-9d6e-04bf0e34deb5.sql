-- Add contract_duration_months column to recurring_expenses table
ALTER TABLE recurring_expenses 
ADD COLUMN contract_duration_months INTEGER;