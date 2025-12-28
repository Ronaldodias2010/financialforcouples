-- ============================================
-- MIGRAÇÃO 2: FASE 2a - FOREIGN KEYS GRUPO A (CRÍTICO)
-- ============================================
-- Rollback: 
-- ALTER TABLE transactions DROP CONSTRAINT IF EXISTS fk_transactions_account;
-- ALTER TABLE transactions DROP CONSTRAINT IF EXISTS fk_transactions_category;
-- ALTER TABLE transactions DROP CONSTRAINT IF EXISTS fk_transactions_card;
-- ALTER TABLE transactions DROP CONSTRAINT IF EXISTS fk_transactions_tag;
-- ALTER TABLE cards DROP CONSTRAINT IF EXISTS fk_cards_account;
-- ALTER TABLE categories DROP CONSTRAINT IF EXISTS fk_categories_default;

-- Registrar início da fase
INSERT INTO public.migration_audit_log (phase, action, status, notes)
VALUES ('2a', 'fk_group_a_start', 'in_progress', 'Iniciando criação de Foreign Keys do Grupo A (Crítico)');

-- ==========================================
-- GRUPO A: TRANSACTIONS (tabela principal)
-- ==========================================

-- FK: transactions.account_id -> accounts.id
ALTER TABLE public.transactions
ADD CONSTRAINT fk_transactions_account
FOREIGN KEY (account_id)
REFERENCES public.accounts(id)
ON DELETE SET NULL
NOT VALID;

-- FK: transactions.category_id -> categories.id
ALTER TABLE public.transactions
ADD CONSTRAINT fk_transactions_category
FOREIGN KEY (category_id)
REFERENCES public.categories(id)
ON DELETE SET NULL
NOT VALID;

-- FK: transactions.card_id -> cards.id
ALTER TABLE public.transactions
ADD CONSTRAINT fk_transactions_card
FOREIGN KEY (card_id)
REFERENCES public.cards(id)
ON DELETE SET NULL
NOT VALID;

-- FK: transactions.tag_id -> category_tags.id
ALTER TABLE public.transactions
ADD CONSTRAINT fk_transactions_tag
FOREIGN KEY (tag_id)
REFERENCES public.category_tags(id)
ON DELETE SET NULL
NOT VALID;

-- ==========================================
-- GRUPO A: CARDS
-- ==========================================

-- FK: cards.account_id -> accounts.id
ALTER TABLE public.cards
ADD CONSTRAINT fk_cards_account
FOREIGN KEY (account_id)
REFERENCES public.accounts(id)
ON DELETE SET NULL
NOT VALID;

-- ==========================================
-- GRUPO A: CATEGORIES
-- ==========================================

-- FK: categories.default_category_id -> default_categories.id (já existe como fk_categories_default_category)
-- Verificar se já existe antes de criar
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_categories_default_category'
  ) THEN
    ALTER TABLE public.categories
    ADD CONSTRAINT fk_categories_default
    FOREIGN KEY (default_category_id)
    REFERENCES public.default_categories(id)
    ON DELETE SET NULL
    NOT VALID;
  END IF;
END $$;

-- Registrar conclusão da fase
INSERT INTO public.migration_audit_log (phase, action, status, notes)
VALUES ('2a', 'fk_group_a_complete', 'completed', 'Foreign Keys do Grupo A criadas com sucesso: transactions(account, category, card, tag), cards(account), categories(default)');