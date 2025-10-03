# Sistema Unificado de Parcelamento - Documentação Técnica

## Visão Geral

O sistema de parcelamento foi refatorado para usar **apenas a tabela `transactions`**, eliminando a duplicação de dados e simplificando o fluxo de pagamentos.

## Arquitetura

### Tabela Principal: `transactions`

Todas as parcelas são armazenadas na tabela `transactions` com os seguintes campos-chave:

- `status`: `'completed'` (despesa atual) ou `'pending'` (despesa futura)
- `due_date`: Data de vencimento da parcela
- `transaction_date`: Data em que a parcela foi efetivamente paga (NULL para pendentes)
- `is_installment`: `true` para indicar que é uma parcela
- `installment_number`: Número da parcela atual (ex: 2 em "2/3")
- `total_installments`: Total de parcelas (ex: 3 em "2/3")
- `purchase_date`: Data original da compra
- `payment_method`: Sempre `'credit_card'` para parcelas
- `card_id`: ID do cartão de crédito usado

## Fluxo de Criação de Parcelas

### Exemplo: Compra de R$ 300 em 3x

**Data da compra**: 15/Out  
**Cartão**: Fecha dia 20, vence dia 5

#### Parcelas Criadas:

1. **Parcela 1/3** - R$ 100
   - `status`: `'completed'`
   - `due_date`: `'2025-11-05'`
   - `transaction_date`: `'2025-11-05'`
   - **Aparece em**: Despesas Atuais de Novembro

2. **Parcela 2/3** - R$ 100
   - `status`: `'pending'`
   - `due_date`: `'2025-12-05'`
   - `transaction_date`: `NULL`
   - **Aparece em**: Gastos Futuros de Dezembro

3. **Parcela 3/3** - R$ 100
   - `status`: `'pending'`
   - `due_date`: `'2026-01-05'`
   - `transaction_date`: `NULL`
   - **Aparece em**: Gastos Futuros de Janeiro

## Processamento Automático

### CRON Job: `auto_complete_pending_transactions()`

Executa diariamente e automaticamente processa parcelas vencidas:

```sql
UPDATE transactions
SET 
  status = 'completed',
  transaction_date = CURRENT_DATE,
  updated_at = now()
WHERE status = 'pending'
  AND due_date <= CURRENT_DATE
```

**Resultado**:
- No dia 05/Nov: Parcela 2/3 muda para `'completed'` → aparece em Despesas Atuais
- No dia 05/Dez: Parcela 3/3 muda para `'completed'` → aparece em Despesas Atuais

### Trigger: `handle_card_available_on_transaction`

Quando uma parcela é marcada como `'completed'`:
- Deduz o valor do limite disponível do cartão
- Adiciona ao saldo devedor do cartão

## Queries de Visualização

### Despesas Atuais
```typescript
.from('transactions')
.eq('status', 'completed')
.eq('type', 'expense')
```

### Despesas Futuras (Parcelas Pendentes)
```typescript
.from('transactions')
.eq('status', 'pending')
.eq('payment_method', 'credit_card')
.eq('is_installment', true)
.order('due_date', { ascending: true })
```

## Componentes Atualizados

### 1. TransactionForm.tsx
- Cria todas as parcelas de uma vez na tabela `transactions`
- Primeira parcela: `status = 'completed'`
- Demais parcelas: `status = 'pending'`

### 2. MonthlyExpensesView.tsx
- Mostra parcelas com `status = 'completed'`
- Exibe indicador visual: `Parcela 1/3`

### 3. FutureExpensesView.tsx
- Mostra parcelas com `status = 'pending'`
- Exibe indicador visual: `Parcela 2/3`
- **NÃO mostra botão de pagamento** (processamento automático)

### 4. useFutureExpensePayments.tsx
- `processInstallmentAutomatically()`: Atualiza `status` de `'pending'` para `'completed'`
- `isExpensePaid()`: Verifica `status` da transação

## Indicadores Visuais

### Badge de Parcela
```tsx
{transaction.is_installment && (
  <Badge variant="outline" className="bg-primary/10 text-primary">
    Parcela {transaction.installment_number}/{transaction.total_installments}
  </Badge>
)}
```

## Migração de Dados Legados

### Tabela `future_expense_payments`
- **Status**: Deprecated para parcelas
- **Uso atual**: Apenas gastos recorrentes legados
- **Plano futuro**: Migrar dados históricos e remover tabela

### Funções RPC Depreciadas
- `process_installment_payment` → Substituída por atualização direta na tabela
- `process_future_expense_payment` (para parcelas) → Não mais necessária

## Benefícios da Arquitetura

### ✅ Simplicidade
- **1 tabela** ao invés de múltiplas fontes de dados
- Lógica unificada para todos os tipos de transação

### ✅ Automação
- CRON processa parcelas sem intervenção manual
- Reduz erros humanos

### ✅ Performance
- Menos JOINs necessários
- Queries mais rápidas e diretas

### ✅ Manutenibilidade
- 80% menos código para manter
- Fluxo mais claro e previsível

### ✅ Consistência
- Estado único da verdade
- Sem duplicação de dados

## Fluxo de Testes

### Cenário 1: Criação de Parcelas
1. Criar transação parcelada (3x)
2. Verificar que primeira parcela está em Despesas Atuais
3. Verificar que demais parcelas estão em Gastos Futuros
4. Confirmar que limite do cartão foi deduzido apenas pela primeira parcela

### Cenário 2: Processamento Automático
1. Ajustar `due_date` de uma parcela para hoje
2. Executar CRON manualmente ou aguardar execução automática
3. Verificar que parcela mudou para `'completed'`
4. Confirmar que aparece em Despesas Atuais
5. Verificar que limite do cartão foi atualizado

### Cenário 3: Validação de Integridade
1. Verificar que não há parcelas duplicadas
2. Confirmar que soma de todas as parcelas = valor total da compra
3. Validar que indicadores de parcela (1/3, 2/3, 3/3) estão corretos

## Monitoramento

### Métricas Importantes
- Número de parcelas pendentes
- Parcelas processadas diariamente pelo CRON
- Erros no processamento automático
- Tempo de execução do CRON job

### Logs a Observar
```sql
-- Parcelas que falharam ao processar
SELECT * FROM transactions 
WHERE status = 'pending' 
  AND due_date < CURRENT_DATE

-- Histórico de processamento
SELECT COUNT(*), DATE(updated_at) 
FROM transactions 
WHERE status = 'completed' 
  AND is_installment = true
GROUP BY DATE(updated_at)
ORDER BY DATE(updated_at) DESC
```

## Troubleshooting

### Problema: Parcela não aparece em Despesas Futuras
**Solução**: Verificar se `status = 'pending'` e `due_date` está no futuro

### Problema: Parcela não foi processada automaticamente
**Solução**: 
1. Verificar se CRON está ativo
2. Checar logs da função `auto_complete_pending_transactions()`
3. Validar que `due_date <= CURRENT_DATE`

### Problema: Duplicação de parcelas
**Solução**: Verificar se há lógica duplicada criando parcelas em múltiplos lugares

## Referências Técnicas

- **Arquivo Principal**: `src/components/financial/TransactionForm.tsx`
- **Hook**: `src/hooks/useFutureExpensePayments.tsx`
- **Visualização**: `src/components/financial/FutureExpensesView.tsx`
- **Função SQL**: `supabase/migrations/*_update_auto_complete_pending_transactions.sql`
