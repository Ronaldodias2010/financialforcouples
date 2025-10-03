-- ============================================
-- CLEANUP: Remove installments from future_expense_payments
-- Mantém gastos recorrentes para continuar funcionando
-- ============================================

-- FASE 1: Verificação de dados (comentado para referência)
-- SELECT COUNT(*) as total_installments FROM future_expense_payments WHERE expense_source_type = 'installment';
-- SELECT COUNT(*) as total_recurring FROM future_expense_payments WHERE expense_source_type != 'installment' OR expense_source_type IS NULL;

-- FASE 2: Backup de segurança (criar tabela temporária para rollback se necessário)
CREATE TABLE IF NOT EXISTS _backup_future_expense_payments_installments AS
SELECT * FROM future_expense_payments
WHERE expense_source_type = 'installment';

-- FASE 3: Deletar APENAS parcelas (installments)
-- Mantém gastos recorrentes intactos para continuar funcionando
DELETE FROM future_expense_payments
WHERE expense_source_type = 'installment';

-- FASE 4: Adicionar comentário na tabela para documentar
COMMENT ON TABLE future_expense_payments IS 
'Tabela mantida apenas para gastos recorrentes (recurring expenses). Parcelas (installments) agora são gerenciadas exclusivamente na tabela transactions com status=pending/completed.';

-- FASE 5: Criar índice para melhorar performance de queries de gastos recorrentes
CREATE INDEX IF NOT EXISTS idx_future_expense_payments_recurring 
ON future_expense_payments(user_id, recurring_expense_id) 
WHERE recurring_expense_id IS NOT NULL;

-- Log da operação
DO $$
DECLARE
  deleted_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO deleted_count FROM _backup_future_expense_payments_installments;
  RAISE NOTICE 'Limpeza concluída: % registros de parcelas removidos de future_expense_payments', deleted_count;
  RAISE NOTICE 'Backup criado em: _backup_future_expense_payments_installments';
  RAISE NOTICE 'Gastos recorrentes mantidos e funcionando normalmente';
END $$;