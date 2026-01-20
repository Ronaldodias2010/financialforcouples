-- Add subcategory_id to manual_future_incomes table
ALTER TABLE manual_future_incomes 
ADD COLUMN subcategory_id UUID REFERENCES subcategories(id);

-- Add subcategory_id to recurring_expenses table
ALTER TABLE recurring_expenses 
ADD COLUMN subcategory_id UUID REFERENCES subcategories(id);

-- Create indexes for better query performance
CREATE INDEX idx_manual_future_incomes_subcategory ON manual_future_incomes(subcategory_id);
CREATE INDEX idx_recurring_expenses_subcategory ON recurring_expenses(subcategory_id);