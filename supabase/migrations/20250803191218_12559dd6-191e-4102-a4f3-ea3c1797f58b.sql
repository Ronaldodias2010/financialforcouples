-- Função para atualizar o saldo do cartão baseado nas transações
CREATE OR REPLACE FUNCTION update_card_balance()
RETURNS TRIGGER AS $$
BEGIN
  -- Se é uma inserção ou atualização
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    -- Atualizar saldo do cartão se a transação usa cartão
    IF NEW.card_id IS NOT NULL THEN
      UPDATE cards 
      SET current_balance = (
        SELECT COALESCE(SUM(amount), 0)
        FROM transactions 
        WHERE card_id = NEW.card_id 
        AND type = 'expense'
      )
      WHERE id = NEW.card_id;
    END IF;
    
    -- Se é uma atualização e o cartão mudou, atualizar o cartão anterior também
    IF TG_OP = 'UPDATE' AND OLD.card_id IS NOT NULL AND OLD.card_id != NEW.card_id THEN
      UPDATE cards 
      SET current_balance = (
        SELECT COALESCE(SUM(amount), 0)
        FROM transactions 
        WHERE card_id = OLD.card_id 
        AND type = 'expense'
      )
      WHERE id = OLD.card_id;
    END IF;
    
    RETURN NEW;
  END IF;
  
  -- Se é uma exclusão
  IF TG_OP = 'DELETE' THEN
    -- Atualizar saldo do cartão se a transação usava cartão
    IF OLD.card_id IS NOT NULL THEN
      UPDATE cards 
      SET current_balance = (
        SELECT COALESCE(SUM(amount), 0)
        FROM transactions 
        WHERE card_id = OLD.card_id 
        AND type = 'expense'
      )
      WHERE id = OLD.card_id;
    END IF;
    
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Criar o trigger para atualizar saldo do cartão automaticamente
CREATE TRIGGER trigger_update_card_balance
  AFTER INSERT OR UPDATE OR DELETE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_card_balance();