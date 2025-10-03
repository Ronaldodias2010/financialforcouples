# Guia de Migração: Sistema de Parcelamento Legado → Unificado

## Visão Geral da Mudança

Este guia documenta a migração do sistema de parcelamento que usava a tabela `future_expense_payments` para o novo sistema unificado que usa apenas a tabela `transactions`.

## O Que Mudou?

### Antes (Sistema Legado)
```
Parcela criada → Inserida em future_expense_payments
                ↓
Usuário clica "Pagar" → RPC process_future_expense_payment
                ↓
Cria transaction + Atualiza future_expense_payments
```

### Depois (Sistema Unificado)
```
Parcela criada → Inserida diretamente em transactions (status='pending')
                ↓
CRON diário → auto_complete_pending_transactions()
                ↓
Atualiza status='completed' automaticamente
```

## Passos da Migração

### Fase 1: ✅ Atualização da Função SQL
**Status**: Concluído

- Atualizada função `auto_complete_pending_transactions()`
- Agora processa parcelas de cartão automaticamente

### Fase 2: ✅ Refatoração do TransactionForm
**Status**: Concluído

- Todas as parcelas são inseridas em `transactions`
- Primeira parcela: `status = 'completed'`
- Demais parcelas: `status = 'pending'` com `due_date`

### Fase 3: ✅ Atualização das Queries de Visualização
**Status**: Concluído

**FutureExpensesView.tsx**:
- Busca parcelas de `transactions` com `status = 'pending'`
- Exclui completamente `future_expense_payments` de parcelas

**MonthlyExpensesView.tsx**:
- Busca parcelas de `transactions` com `status = 'completed'`
- Mostra indicador visual de parcela

### Fase 4: ✅ Refatoração dos Hooks
**Status**: Concluído

**useFutureExpensePayments.tsx**:
- `processInstallmentAutomatically()`: Atualiza diretamente `transactions`
- `isExpensePaid()`: Verifica `status` em `transactions`
- `getFutureExpensePayments()`: Busca de ambas as tabelas (compatibilidade)

### Fase 5: ✅ Indicadores Visuais
**Status**: Concluído

- Badge de parcela em MonthlyExpensesView: `Parcela 1/3`
- Badge de parcela em FutureExpensesView: `Parcela 2/3`
- Estilo consistente usando `bg-primary/10`

## Dados Legados

### Tratamento de `future_expense_payments`

#### Parcelas Antigas (Antes da Migração)
```typescript
// Query que busca dados legados
const { data: legacyPayments } = await supabase
  .from('future_expense_payments')
  .select('*')
  .is('installment_transaction_id', null) // Apenas gastos recorrentes
  .not('expense_source_type', 'in', '("installment")')
```

**Estratégia**:
1. Parcelas novas: Criadas apenas em `transactions`
2. Parcelas antigas: Ainda visíveis via `future_expense_payments` (compatibilidade)
3. Processamento: Funciona para ambos os tipos

### Plano de Depreciação da Tabela

#### Opção 1: Migração Completa de Dados (Recomendado)
```sql
-- Script de migração (executar com cuidado)
INSERT INTO transactions (
  user_id, type, status, amount, description, 
  due_date, transaction_date, payment_method, 
  card_id, is_installment, installment_number, 
  total_installments, owner_user, created_at
)
SELECT 
  user_id, 
  'expense' as type,
  'completed' as status,
  amount,
  description,
  original_due_date as due_date,
  payment_date as transaction_date,
  payment_method,
  card_id,
  true as is_installment,
  (card_payment_info->>'installment_number')::integer as installment_number,
  (card_payment_info->>'total_installments')::integer as total_installments,
  owner_user,
  created_at
FROM future_expense_payments
WHERE expense_source_type = 'installment'
  AND transaction_id IS NULL;
```

#### Opção 2: Soft Delete (Menos Invasivo)
- Marcar tabela como deprecated
- Manter apenas para histórico
- Não criar novos registros

## Impacto nos Usuários

### Funcionalidades Mantidas
✅ Visualização de parcelas futuras  
✅ Processamento automático de parcelas  
✅ Histórico de pagamentos  
✅ Indicadores visuais (1/3, 2/3, 3/3)  
✅ Filtros por categoria/usuário  

### Funcionalidades Removidas
❌ Pagamento manual de parcelas de cartão (agora automático)  
❌ Botão "Pagar" para parcelas (processamento automático)  

### Melhorias para Usuários
✨ Parcelas processadas automaticamente  
✨ Menos cliques necessários  
✨ Sincronização automática com limite do cartão  
✨ Interface mais limpa e consistente  

## Validação Pós-Migração

### Checklist de Testes

#### 1. Criação de Parcelas
- [ ] Criar compra parcelada (3x)
- [ ] Verificar que primeira parcela aparece em Despesas Atuais
- [ ] Confirmar que demais parcelas aparecem em Gastos Futuros
- [ ] Validar indicadores de parcela (1/3, 2/3, 3/3)

#### 2. Processamento Automático
- [ ] Aguardar vencimento de uma parcela
- [ ] Confirmar que CRON processou automaticamente
- [ ] Verificar que parcela moveu para Despesas Atuais
- [ ] Validar que limite do cartão foi atualizado

#### 3. Integridade de Dados
- [ ] Verificar que não há parcelas duplicadas
- [ ] Confirmar que todas as parcelas têm `due_date`
- [ ] Validar que `total_installments` está correto
- [ ] Checar que primeira parcela sempre tem `status = 'completed'`

#### 4. Compatibilidade com Dados Legados
- [ ] Parcelas antigas ainda aparecem corretamente
- [ ] Processamento funciona para ambos os tipos
- [ ] Não há quebras em queries existentes

## Rollback de Emergência

### Se algo der errado:

```sql
-- 1. Reverter função CRON (usar versão anterior)
CREATE OR REPLACE FUNCTION auto_complete_pending_transactions()
-- ... versão anterior da função

-- 2. Desativar processamento automático temporariamente
-- Comentar chamada do CRON ou marcar função como inactive

-- 3. Recriar parcelas em future_expense_payments se necessário
-- (Apenas se dados foram perdidos)
```

### Contato de Suporte
- Revisar logs em `supabase/migrations/`
- Verificar console de erros do Supabase
- Consultar documentação em `docs/INSTALLMENT_SYSTEM.md`

## Timeline de Migração

| Data | Fase | Status |
|------|------|--------|
| 2025-01-03 | Fase 1: Atualização SQL | ✅ Concluído |
| 2025-01-03 | Fase 2: Refatoração TransactionForm | ✅ Concluído |
| 2025-01-03 | Fase 3: Atualização Views | ✅ Concluído |
| 2025-01-03 | Fase 4: Refatoração Hooks | ✅ Concluído |
| 2025-01-03 | Fase 5: Indicadores Visuais | ✅ Concluído |
| 2025-01-XX | Fase 6: Testes em Produção | ⏳ Pendente |
| 2025-01-XX | Fase 7: Migração de Dados Legados | ⏳ Pendente |
| 2025-01-XX | Fase 8: Depreciação `future_expense_payments` | ⏳ Pendente |

## Próximos Passos

1. **Monitorar em produção** por 30 dias
2. **Coletar feedback** dos usuários
3. **Executar migração de dados legados** (se necessário)
4. **Depreciar tabela** `future_expense_payments` oficialmente
5. **Atualizar documentação** final

---

**Última atualização**: 2025-01-03  
**Versão**: 1.0  
**Responsável**: Equipe de Desenvolvimento
