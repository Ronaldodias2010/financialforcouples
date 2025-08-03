-- Corrigir owner_user de emails para 'user1'
UPDATE transactions 
SET owner_user = 'user1' 
WHERE owner_user NOT IN ('user1', 'user2') AND owner_user IS NOT NULL;

-- Corrigir accounts com emails
UPDATE accounts 
SET owner_user = 'user1' 
WHERE owner_user NOT IN ('user1', 'user2') AND owner_user IS NOT NULL;

-- Corrigir cards com emails  
UPDATE cards 
SET owner_user = 'user1' 
WHERE owner_user NOT IN ('user1', 'user2') AND owner_user IS NOT NULL;

-- Corrigir categories com emails
UPDATE categories 
SET owner_user = 'user1' 
WHERE owner_user NOT IN ('user1', 'user2') AND owner_user IS NOT NULL;

-- Corrigir recurring_expenses com emails
UPDATE recurring_expenses 
SET owner_user = 'user1' 
WHERE owner_user NOT IN ('user1', 'user2') AND owner_user IS NOT NULL;