-- Fix Priscila's Santander account balance from R$111 to R$711
UPDATE accounts 
SET balance = 711, updated_at = now() 
WHERE id = 'c29e2b54-a496-4fd0-9f66-62a6341f789d';