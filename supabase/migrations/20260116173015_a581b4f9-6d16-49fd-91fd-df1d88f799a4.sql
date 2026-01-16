-- Adicionar coluna purchase_type na tabela card_mileage_rules
-- Permite diferenciar regras para compras nacionais e internacionais

ALTER TABLE card_mileage_rules 
ADD COLUMN IF NOT EXISTS purchase_type TEXT DEFAULT 'domestic' 
CHECK (purchase_type IN ('domestic', 'international'));

-- Comentário explicativo
COMMENT ON COLUMN card_mileage_rules.purchase_type IS 'Tipo de compra: domestic (nacional/BRL) ou international (exterior/USD,EUR,etc)';

-- Criar índice para melhor performance nas consultas
CREATE INDEX IF NOT EXISTS idx_card_mileage_rules_card_purchase_type 
ON card_mileage_rules(card_id, purchase_type) 
WHERE is_active = true;