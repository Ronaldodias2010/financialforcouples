/**
 * Regras centralizadas para o Dashboard "GASTOS REALIZADOS"
 * 
 * DEFINIÇÃO TÉCNICA:
 * - Dashboard mostra gastos realizados no mês da COMPRA, não da fatura
 * - Para compras parceladas: valor TOTAL da compra no mês da compra
 * - Exclui: transferências, aportes, pagamentos de fatura
 */

import { type CurrencyCode } from '@/hooks/useCurrencyConverter';

export interface DashboardTransaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  currency: CurrencyCode;
  description: string;
  transaction_date: string;
  payment_method: string;
  owner_user?: string;
  user_id: string;
  category_id?: string;
  card_transaction_type?: string;
  categories?: { name: string; color?: string };
  cards?: { name: string };
  status?: 'pending' | 'completed' | 'cancelled';
  due_date?: string;
  is_installment?: boolean;
  purchase_date?: string;
  installment_number?: number;
  total_installments?: number;
  card_id?: string;
}

/**
 * Verifica se uma transação é uma "Quitação Dívida Crédito"
 * (que NÃO deve entrar no Dashboard - vai para Fluxo de Caixa)
 * 
 * Detecção por múltiplos critérios:
 * 1. Nome da categoria
 * 2. Descrição da transação
 * 3. Método de pagamento específico
 * 4. Tipo de transação de cartão (card_transaction_type)
 */
export const isCardPaymentTransaction = (transaction: DashboardTransaction): boolean => {
  // Critério 1: Por nome de categoria
  const categoryName = (transaction.categories?.name || '').toLowerCase();
  const isCategoryPayment = (
    // Novo nome: Quitação Dívida Crédito
    (categoryName.includes('quitação') || categoryName.includes('quitacao')) && 
    (categoryName.includes('dívida') || categoryName.includes('divida')) ||
    categoryName.includes('credit debt settlement') ||
    categoryName.includes('liquidación deuda') ||
    // Compatibilidade com nome antigo
    (categoryName.includes('pagamento') && (categoryName.includes('cartão') || categoryName.includes('cartao'))) ||
    categoryName.includes('credit card payment') ||
    categoryName.includes('pago cartão') ||
    categoryName.includes('pago cartao')
  );
  
  // Critério 2: Por descrição da transação
  const description = (transaction.description || '').toLowerCase();
  const isDescriptionPayment = (
    // Novo nome
    description.includes('quitação dívida') ||
    description.includes('quitacao divida') ||
    description.includes('credit debt settlement') ||
    // Compatibilidade com nome antigo
    description.includes('pagamento de cartão') ||
    description.includes('pagamento de cartao') ||
    description.includes('pagamento cartão') ||
    description.includes('pagamento cartao') ||
    description.includes('credit card payment') ||
    description.includes('card payment')
  );
  
  // Critério 3: Por método de pagamento específico
  const isPaymentMethod = transaction.payment_method === 'card_payment';
  
  // Critério 4: Por tipo de transação de cartão
  const isCardPaymentType = transaction.card_transaction_type === 'card_payment';
  
  // Critério 5: Por descrição "Pagamento de Cartão (Dinheiro)" - transações duplicadas antigas
  const isDescriptionCashPayment = description.includes('pagamento de cartão (dinheiro)');
  
  return isCategoryPayment || isDescriptionPayment || isPaymentMethod || isCardPaymentType || isDescriptionCashPayment;
};

/**
 * Verifica se uma transação é uma transferência/aporte interno
 * (NÃO entra no Dashboard)
 * 
 * IMPORTANTE: Pagamentos de cartão usam account_transfer, mas NÃO são
 * transferências internas - são saídas de caixa reais.
 */
export const isInternalTransfer = (transaction: DashboardTransaction): boolean => {
  // Pagamentos de cartão usam account_transfer mas NÃO são transferências internas
  // São saídas reais de dinheiro que devem aparecer no Dashboard Principal
  if (transaction.card_transaction_type === 'card_payment') {
    return false;
  }
  
  return transaction.payment_method === 'account_transfer' || 
         transaction.payment_method === 'account_investment';
};

/**
 * Verifica se uma transação representa SAÍDA DE CAIXA
 * INCLUI pagamentos de cartão (são saídas reais de dinheiro)
 * 
 * REGRA:
 * ✅ Todas as despesas que tiram dinheiro da conta
 * ✅ Pagamentos de cartão de crédito
 * ❌ Transferências entre contas
 * ❌ Aportes em investimentos
 * ❌ Transações pending
 */
export const isCashOutflow = (transaction: DashboardTransaction): boolean => {
  if (transaction.type !== 'expense') return false;
  if (isInternalTransfer(transaction)) return false;
  if (transaction.status === 'pending') return false;
  
  // Parceladas: apenas 1ª parcela
  if (transaction.is_installment && transaction.installment_number !== 1) {
    return false;
  }
  
  return true; // INCLUI pagamentos de cartão
};

/**
 * Verifica se uma transação de DESPESA é CONSUMO REAL (impacta DRE)
 * EXCLUI pagamentos de cartão (não são consumo, são quitação de dívida)
 * 
 * REGRA:
 * ✅ Despesas do mês (cartão débito, PIX, dinheiro)
 * ✅ Compras parceladas no cartão (pela data da compra, valor total)
 * ❌ Transferências entre contas
 * ❌ Aportes em investimentos
 * ❌ Quitação de dívida do cartão (não é consumo)
 * ❌ Parcelas de compras de meses anteriores
 * ❌ Transações pending (não completadas)
 */
export const isDashboardExpense = (transaction: DashboardTransaction): boolean => {
  if (!isCashOutflow(transaction)) return false;
  
  // Excluir quitação de dívida do cartão do DRE (não é consumo)
  if (isCardPaymentTransaction(transaction)) return false;
  
  return true;
};

/**
 * Verifica se uma transação de RECEITA deve aparecer no Dashboard
 */
export const isDashboardIncome = (transaction: DashboardTransaction): boolean => {
  // Deve ser receita
  if (transaction.type !== 'income') {
    return false;
  }

  // Excluir transferências internas
  if (isInternalTransfer(transaction)) {
    return false;
  }

  // Para parceladas: apenas a 1ª parcela
  if (transaction.is_installment) {
    return transaction.installment_number === 1;
  }

  // Para não-parceladas: excluir pending
  return transaction.status !== 'pending';
};

/**
 * Obtém a data efetiva para o Dashboard
 * - Parceladas: usa purchase_date (data da compra)
 * - Não-parceladas: usa transaction_date
 */
export const getDashboardEffectiveDate = (transaction: DashboardTransaction): string => {
  if (transaction.is_installment && transaction.purchase_date) {
    return transaction.purchase_date;
  }
  return transaction.transaction_date;
};

/**
 * Calcula o valor efetivo para o Dashboard
 * - Parceladas: valor total da compra (amount * total_installments)
 * - Não-parceladas: valor normal
 */
export const getDashboardEffectiveAmount = (transaction: DashboardTransaction): number => {
  if (transaction.is_installment && transaction.installment_number === 1) {
    return transaction.amount * (transaction.total_installments || 1);
  }
  return transaction.amount;
};

/**
 * Verifica se a data efetiva da transação está dentro do mês especificado
 */
export const isInMonth = (transaction: DashboardTransaction, startDate: string, endDate: string): boolean => {
  const effectiveDate = getDashboardEffectiveDate(transaction);
  return effectiveDate >= startDate && effectiveDate <= endDate;
};

/**
 * Obtém o owner_user normalizado (default: 'user1')
 */
export const getTransactionOwner = (transaction: DashboardTransaction): 'user1' | 'user2' => {
  return (transaction.owner_user || 'user1') as 'user1' | 'user2';
};

/**
 * Filtra transações por viewMode
 */
export const filterByViewMode = (
  transactions: DashboardTransaction[], 
  viewMode: 'both' | 'user1' | 'user2'
): DashboardTransaction[] => {
  if (viewMode === 'both') {
    return transactions;
  }
  return transactions.filter(t => getTransactionOwner(t) === viewMode);
};

/**
 * Calcula TODAS as saídas de caixa (para o Dashboard Principal)
 * Inclui pagamentos de cartão - tudo que sai da conta
 */
export const calculateTotalCashOutflows = (
  transactions: DashboardTransaction[],
  convertCurrency: (amount: number, from: CurrencyCode, to: CurrencyCode) => number,
  targetCurrency: CurrencyCode
): number => {
  return transactions
    .filter(isCashOutflow)
    .reduce((sum, t) => {
      const effectiveAmount = getDashboardEffectiveAmount(t);
      return sum + convertCurrency(effectiveAmount, t.currency, targetCurrency);
    }, 0);
};

/**
 * Calcula o total de despesas REAIS (consumo, impacta DRE)
 * Exclui pagamentos de cartão - apenas consumo real
 */
export const calculateDashboardExpenses = (
  transactions: DashboardTransaction[],
  convertCurrency: (amount: number, from: CurrencyCode, to: CurrencyCode) => number,
  targetCurrency: CurrencyCode
): number => {
  return transactions
    .filter(isDashboardExpense)
    .reduce((sum, t) => {
      const effectiveAmount = getDashboardEffectiveAmount(t);
      return sum + convertCurrency(effectiveAmount, t.currency, targetCurrency);
    }, 0);
};

/**
 * Calcula o total de receitas do Dashboard para um array de transações
 */
export const calculateDashboardIncome = (
  transactions: DashboardTransaction[],
  convertCurrency: (amount: number, from: CurrencyCode, to: CurrencyCode) => number,
  targetCurrency: CurrencyCode
): number => {
  return transactions
    .filter(isDashboardIncome)
    .reduce((sum, t) => {
      const effectiveAmount = getDashboardEffectiveAmount(t);
      return sum + convertCurrency(effectiveAmount, t.currency, targetCurrency);
    }, 0);
};

/**
 * Agrupa despesas por categoria para o gráfico de pizza
 */
export interface CategoryExpense {
  categoryName: string;
  amount: number;
  color: string;
}

export const groupExpensesByCategory = (
  transactions: DashboardTransaction[],
  translateCategory: (name: string) => string
): Map<string, CategoryExpense> => {
  const categoryMap = new Map<string, CategoryExpense>();
  
  transactions
    .filter(isDashboardExpense)
    .forEach(t => {
      const originalName = t.categories?.name || 'Sem categoria';
      const categoryName = translateCategory(originalName);
      const color = t.categories?.color || '#6366f1';
      const amount = getDashboardEffectiveAmount(t);
      
      if (categoryMap.has(categoryName)) {
        categoryMap.get(categoryName)!.amount += amount;
      } else {
        categoryMap.set(categoryName, { categoryName, amount, color });
      }
    });
  
  return categoryMap;
};
