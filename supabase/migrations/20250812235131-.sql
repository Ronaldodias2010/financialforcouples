-- Add owner_user column to investment_goals table for couple sharing
ALTER TABLE investment_goals 
ADD COLUMN owner_user TEXT DEFAULT 'user1';

-- Update existing goals to have owner_user as 'user1'
UPDATE investment_goals 
SET owner_user = 'user1' 
WHERE owner_user IS NULL;