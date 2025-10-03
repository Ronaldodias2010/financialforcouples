-- Corrigir parcelas futuras: transaction_date deve ser igual a due_date quando status='pending'
-- Isso permite que apareçam em "Despesas Futuras" filtradas por status
UPDATE transactions
SET transaction_date = due_date,
    updated_at = now()
WHERE status = 'pending'
  AND is_installment = true
  AND payment_method = 'credit_card'
  AND transaction_date < due_date;

-- Garantir que parcelas futuras têm installment_number e total_installments preenchidos
UPDATE transactions
SET installment_number = COALESCE(installment_number, 1),
    total_installments = COALESCE(total_installments, 1),
    updated_at = now()
WHERE is_installment = true
  AND (installment_number IS NULL OR total_installments IS NULL);