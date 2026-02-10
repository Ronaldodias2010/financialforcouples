import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useRealtimeTable } from '@/hooks/useRealtimeManager';
import { useCurrencyConverter, type CurrencyCode } from './useCurrencyConverter';
import { format } from 'date-fns';
import { sumMonetaryArray, subtractMonetaryValues } from '@/utils/monetary';
import { 
  isDashboardExpense, 
  isDashboardIncome, 
  getDashboardEffectiveAmount,
  isInternalTransfer,
  isCardPaymentTransaction,
  isCashOutflow,
  type DashboardTransaction
} from '@/utils/dashboardRules';

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  currency: CurrencyCode;
  description: string;
  transaction_date: string;
  payment_method: string;
  owner_user: string;
  user_id: string;
  category_id: string;
  card_transaction_type?: string;
  categories?: { name: string };
  cards?: { name: string };
  status?: 'pending' | 'completed' | 'cancelled';
  due_date?: string;
  is_installment?: boolean;
  purchase_date?: string;
  installment_number?: number;
  total_installments?: number;
}

interface Account {
  id: string;
  user_id: string;
  balance: number;
  currency: CurrencyCode;
  account_model?: string;
  owner_user?: string;
  is_cash_account?: boolean;
  is_active?: boolean;
}

interface FinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  currency: CurrencyCode;
}

interface CoupleData {
  user1_id: string;
  user2_id: string;
}

// ============= QUERY KEYS =============
export const financialQueryKeys = {
  userCurrency: (userId: string | undefined) => ['user-currency', userId] as const,
  coupleData: (userId: string | undefined) => ['couple-data', userId] as const,
  transactions: (userId: string | undefined, coupleIds: CoupleData | null) => 
    ['transactions', userId, coupleIds] as const,
  accounts: (userId: string | undefined, coupleIds: CoupleData | null) => 
    ['accounts', userId, coupleIds] as const,
};

// ============= INDIVIDUAL QUERIES =============

// Fetch user preferred currency
const useCurrencyQuery = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: financialQueryKeys.userCurrency(user?.id),
    queryFn: async () => {
      if (!user?.id) throw new Error('No user');
      
      const { data, error } = await supabase
        .from('profiles')
        .select('preferred_currency')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      return (data?.preferred_currency || 'BRL') as CurrencyCode;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes - currency doesn't change often
  });
};

// Fetch couple data
const useCoupleDataQuery = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: financialQueryKeys.coupleData(user?.id),
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data } = await supabase
        .from('user_couples')
        .select('user1_id, user2_id')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .eq('status', 'active')
        .maybeSingle();

      return data as CoupleData | null;
    },
    enabled: !!user?.id,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

// Fetch transactions
const useTransactionsQuery = (coupleIds: CoupleData | null) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: financialQueryKeys.transactions(user?.id, coupleIds),
    queryFn: async () => {
      if (!user?.id) return [];
      
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      
      const endOfMonth = new Date();
      endOfMonth.setMonth(endOfMonth.getMonth() + 1);
      endOfMonth.setDate(0);
      endOfMonth.setHours(23, 59, 59, 999);

      const userIds = coupleIds 
        ? [coupleIds.user1_id, coupleIds.user2_id]
        : [user.id];

      // REGRA 5 do Prompt Técnico: Dashboard mostra GASTOS REALIZADOS no mês
      // - Para não-parceladas: transaction_date no mês, status completed
      // - Para parceladas de cartão: purchase_date no mês, installment_number = 1 (compra original)
      // Isso garante que a COMPRA apareça no mês da compra, não as parcelas
      
      const startDate = format(startOfMonth, 'yyyy-MM-dd');
      const endDate = format(endOfMonth, 'yyyy-MM-dd');
      
      console.log('🔍 Dashboard Query - Date range:', startDate, 'to', endDate);
      console.log('🔍 Dashboard Query - User IDs:', userIds);
      
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          categories(name),
          cards(name)
        `)
        .in('user_id', userIds)
        .or(`and(is_installment.is.false,status.eq.completed,transaction_date.gte.${startDate},transaction_date.lte.${endDate}),and(is_installment.is.true,installment_number.eq.1,purchase_date.gte.${startDate},purchase_date.lte.${endDate})`)
        .order('transaction_date', { ascending: false });

      if (error) {
        console.error('❌ Error fetching transactions:', error);
        throw error;
      }
      
      // Debug: Log transactions by type
      const installmentTransactions = (data || []).filter(t => t.is_installment && t.installment_number === 1);
      const regularTransactions = (data || []).filter(t => !t.is_installment);
      
      console.log('✅ Transactions fetched via React Query:', data?.length || 0);
      console.log('📊 Installment transactions (1st installment):', installmentTransactions.length, installmentTransactions.map(t => ({ desc: t.description, amount: t.amount, total: t.total_installments, purchase_date: t.purchase_date })));
      console.log('📊 Regular transactions:', regularTransactions.length, regularTransactions.map(t => ({ desc: t.description, amount: t.amount, status: t.status })));
      
      return data as Transaction[] || [];
    },
    enabled: !!user?.id,
    staleTime: 0, // Always fresh
    refetchOnMount: true,
  });
};

// Fetch accounts
const useAccountsQuery = (coupleIds: CoupleData | null) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: financialQueryKeys.accounts(user?.id, coupleIds),
    queryFn: async () => {
      if (!user?.id) return [];
      
      const userIds = coupleIds 
        ? [coupleIds.user1_id, coupleIds.user2_id]
        : [user.id];

      const { data, error } = await supabase
        .from('accounts')
        .select('id, user_id, balance, currency, account_model, owner_user, is_active, is_cash_account')
        .in('user_id', userIds)
        .eq('is_active', true);

      if (error) throw error;
      
      console.log('✅ Accounts fetched via React Query:', data?.length || 0);
      return data as Account[] || [];
    },
    enabled: !!user?.id,
    staleTime: 0, // Always fresh
    refetchOnMount: true,
  });
};

// ============= REAL-TIME SUBSCRIPTIONS =============

const useFinancialRealtime = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Use centralized realtime manager instead of 4 individual channels
  useRealtimeTable('profiles', () => {
    if (user?.id) {
      queryClient.invalidateQueries({ queryKey: financialQueryKeys.userCurrency(user.id) });
    }
  }, !!user?.id);

  useRealtimeTable('transactions', () => {
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
  }, !!user?.id);

  useRealtimeTable('accounts', () => {
    queryClient.invalidateQueries({ queryKey: ['accounts'] });
  }, !!user?.id);

  useRealtimeTable('user_couples', (payload) => {
    if (!user?.id) return;
    const data = payload.new || payload.old;
    if (data && 'user1_id' in data && 'user2_id' in data &&
        (data.user1_id === user.id || data.user2_id === user.id)) {
      queryClient.invalidateQueries({ queryKey: financialQueryKeys.coupleData(user.id) });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    }
  }, !!user?.id);
};

// ============= MAIN HOOK WITH DERIVED DATA =============

export const useFinancialData = () => {
  const { convertCurrency } = useCurrencyConverter();
  const { user } = useAuth();
  
  // Setup real-time subscriptions
  useFinancialRealtime();
  
  // Fetch base data
  const { data: userPreferredCurrency = 'BRL' } = useCurrencyQuery();
  const { data: coupleIds } = useCoupleDataQuery();
  const { data: transactions = [], isLoading: transactionsLoading } = useTransactionsQuery(coupleIds || null);
  const { data: accounts = [], isLoading: accountsLoading } = useAccountsQuery(coupleIds || null);
  
  const loading = transactionsLoading || accountsLoading;

  // ============= HELPER FUNCTIONS (same logic as original) =============

  const getAccountsByUser = (viewMode: 'both' | 'user1' | 'user2') => {
    if (viewMode === 'both') return accounts;
    return accounts.filter((acc) => (acc.owner_user || 'user1') === viewMode);
  };

  const getTransactionsByUser = (viewMode: 'both' | 'user1' | 'user2') => {
    if (viewMode === 'both') {
      return transactions;
    }
    
    return transactions.filter(transaction => {
      // Use owner_user field directly - it already contains 'user1' or 'user2'
      return (transaction.owner_user || 'user1') === viewMode;
    });
  };

  const getFinancialSummary = (viewMode: 'both' | 'user1' | 'user2' = 'both'): FinancialSummary => {
    const filteredTransactions = getTransactionsByUser(viewMode);
    
    const incomeValues: number[] = [];
    const expenseValues: number[] = [];

    filteredTransactions.forEach((transaction) => {
      // Usar regras centralizadas do Dashboard
      const dashTx = transaction as DashboardTransaction;
      
      if (isDashboardIncome(dashTx)) {
        const effectiveAmount = getDashboardEffectiveAmount(dashTx);
        incomeValues.push(convertCurrency(effectiveAmount, transaction.currency, userPreferredCurrency));
      } else if (isDashboardExpense(dashTx)) {
        const effectiveAmount = getDashboardEffectiveAmount(dashTx);
        expenseValues.push(convertCurrency(effectiveAmount, transaction.currency, userPreferredCurrency));
      }
    });

    const totalIncome = sumMonetaryArray(incomeValues);
    const totalExpenses = sumMonetaryArray(expenseValues);

    return {
      totalIncome,
      totalExpenses,
      balance: subtractMonetaryValues(totalIncome, totalExpenses),
      currency: userPreferredCurrency,
    };
  };

  const getFinancialComparison = async () => {
    try {
      const today = new Date();
      const currentYear = today.getFullYear();
      const currentMonth = today.getMonth();
      
      let prevYear = currentYear;
      let prevMonth = currentMonth - 1;
      
      if (prevMonth < 0) {
        prevMonth = 11;
        prevYear = currentYear - 1;
      }
      
      const startOfPrevMonth = new Date(prevYear, prevMonth, 1, 0, 0, 0, 0);
      const endOfPrevMonth = new Date(prevYear, prevMonth + 1, 0, 23, 59, 59, 999);
      const startOfCurrentMonth = new Date(currentYear, currentMonth, 1, 0, 0, 0, 0);
      const endOfCurrentMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999);

      const userIds = coupleIds 
        ? [coupleIds.user1_id, coupleIds.user2_id]
        : [user?.id];

      const { data: prevTransactions, error: prevError } = await supabase
        .from('transactions')
        .select('*')
        .in('user_id', userIds)
        .gte('transaction_date', format(startOfPrevMonth, 'yyyy-MM-dd'))
        .lte('transaction_date', format(endOfPrevMonth, 'yyyy-MM-dd'));

      if (prevError) throw prevError;

      const { data: currentTransactions, error: currentError } = await supabase
        .from('transactions')
        .select('*')
        .in('user_id', userIds)
        .gte('transaction_date', format(startOfCurrentMonth, 'yyyy-MM-dd'))
        .lte('transaction_date', format(endOfCurrentMonth, 'yyyy-MM-dd'));

      if (currentError) throw currentError;

      const prevIncomeValues: number[] = [];
      const prevExpenseValues: number[] = [];

      (prevTransactions || []).forEach((transaction) => {
        if (transaction.payment_method === 'account_transfer' || transaction.payment_method === 'account_investment') {
          return;
        }

        // Skip pending transactions
        if (transaction.status === 'pending') {
          return;
        }

        if (transaction.card_transaction_type === 'future_expense') {
          return;
        }

        // Skip card payments - they are transfers, not expenses
        if (transaction.card_transaction_type === 'card_payment') {
          return;
        }

        const amountInUserCurrency = convertCurrency(
          transaction.amount,
          transaction.currency,
          userPreferredCurrency
        );

        if (transaction.type === 'income') {
          prevIncomeValues.push(amountInUserCurrency);
        } else if (transaction.type === 'expense') {
          prevExpenseValues.push(amountInUserCurrency);
        }
      });

      const prevTotalIncome = sumMonetaryArray(prevIncomeValues);
      const prevTotalExpenses = sumMonetaryArray(prevExpenseValues);

      const currentIncomeValues: number[] = [];
      const currentExpenseValues: number[] = [];

      (currentTransactions || []).forEach((transaction) => {
        if (transaction.payment_method === 'account_transfer' || transaction.payment_method === 'account_investment') {
          return;
        }

        // Skip pending transactions
        if (transaction.status === 'pending') {
          return;
        }

        if (transaction.card_transaction_type === 'future_expense') {
          return;
        }

        const amountInUserCurrency = convertCurrency(
          transaction.amount,
          transaction.currency,
          userPreferredCurrency
        );

        if (transaction.type === 'income') {
          currentIncomeValues.push(amountInUserCurrency);
        } else if (transaction.type === 'expense') {
          currentExpenseValues.push(amountInUserCurrency);
        }
      });

      const currentTotalIncome = sumMonetaryArray(currentIncomeValues);
      const currentTotalExpenses = sumMonetaryArray(currentExpenseValues);

      const prevBalance = subtractMonetaryValues(prevTotalIncome, prevTotalExpenses);
      const currentBalance = subtractMonetaryValues(currentTotalIncome, currentTotalExpenses);

      const calculatePercentageChange = (current: number, previous: number): number => {
        if (previous === 0) {
          return current > 0 ? 100 : 0;
        }
        return ((current - previous) / Math.abs(previous)) * 100;
      };

      const incomeChange = calculatePercentageChange(currentTotalIncome, prevTotalIncome);
      const expenseChange = calculatePercentageChange(currentTotalExpenses, prevTotalExpenses);
      const balanceChange = calculatePercentageChange(currentBalance, prevBalance);

      return {
        incomeChange: Number(incomeChange.toFixed(1)),
        expenseChange: Number(expenseChange.toFixed(1)),
        balanceChange: Number(balanceChange.toFixed(1))
      };
    } catch (error) {
      console.error('Error calculating financial comparison:', error);
      return {
        incomeChange: 0,
        expenseChange: 0,
        balanceChange: 0
      };
    }
  };

  const getExpensesByUser = (viewMode: 'both' | 'user1' | 'user2') => {
    const allTransactions = viewMode === 'both' ? transactions : getTransactionsByUser(viewMode);
    
    // Usar regras centralizadas do Dashboard
    const user1Expenses = allTransactions
      .filter(t => {
        const dashTx = t as DashboardTransaction;
        return isDashboardExpense(dashTx) && (t.owner_user || 'user1') === 'user1';
      })
      .reduce((sum, t) => {
        const dashTx = t as DashboardTransaction;
        return sum + convertCurrency(getDashboardEffectiveAmount(dashTx), t.currency, userPreferredCurrency);
      }, 0);
    
    const user2Expenses = allTransactions
      .filter(t => {
        const dashTx = t as DashboardTransaction;
        return isDashboardExpense(dashTx) && (t.owner_user || 'user1') === 'user2';
      })
      .reduce((sum, t) => {
        const dashTx = t as DashboardTransaction;
        return sum + convertCurrency(getDashboardEffectiveAmount(dashTx), t.currency, userPreferredCurrency);
      }, 0);

    return { user1Expenses, user2Expenses };
  };

  const getAccountsBalance = (viewMode: 'both' | 'user1' | 'user2' = 'both') => {
    const filteredAccounts = getAccountsByUser(viewMode).filter(
      (acc) => (acc.account_model || 'personal') === 'personal'
    );
    
    const balanceValues: number[] = [];
    
    filteredAccounts.forEach((acc) => {
      const balanceInUserCurrency = convertCurrency(
        acc.balance || 0,
        acc.currency as CurrencyCode,
        userPreferredCurrency
      );
      balanceValues.push(balanceInUserCurrency);
    });
    
    const cashAccounts = accounts.filter(acc => acc.is_cash_account && acc.is_active);
    cashAccounts.forEach((acc) => {
      const userOwnsAccount = viewMode === 'both' || (acc.owner_user || 'user1') === viewMode;
      if (userOwnsAccount) {
        const cashBalanceInUserCurrency = convertCurrency(
          acc.balance || 0,
          acc.currency as CurrencyCode,
          userPreferredCurrency
        );
        balanceValues.push(cashBalanceInUserCurrency);
      }
    });
    
    return sumMonetaryArray(balanceValues);
  };

  const getTransactionsIncome = (viewMode: 'both' | 'user1' | 'user2' = 'both') => {
    const filteredTransactions = getTransactionsByUser(viewMode);
    const incomeOnly = filteredTransactions.filter(t => t.type === 'income' && t.payment_method !== 'account_transfer');
    
    const incomeValues = incomeOnly.map(t => convertCurrency(t.amount, t.currency, userPreferredCurrency));
    return sumMonetaryArray(incomeValues);
  };

  const getTransactionsExpenses = (viewMode: 'both' | 'user1' | 'user2' = 'both') => {
    const filteredTransactions = getTransactionsByUser(viewMode);
    
    // Usar regras centralizadas do Dashboard - consumo real (exclui pagamentos de cartão)
    const expenseOnly = filteredTransactions.filter(t => isDashboardExpense(t as DashboardTransaction));
    
    const expenseValues = expenseOnly.map(t => {
      const dashTx = t as DashboardTransaction;
      const effectiveAmount = getDashboardEffectiveAmount(dashTx);
      return convertCurrency(effectiveAmount, t.currency, userPreferredCurrency);
    });
    
    return sumMonetaryArray(expenseValues);
  };

  /**
   * Calcula TODAS as saídas de caixa para o Dashboard Principal
   * INCLUI pagamentos de cartão de crédito - tudo que sai da conta
   * 
   * Usado exclusivamente no Dashboard Principal para mostrar quanto
   * REALMENTE saiu do bolso no mês.
   */
  const getTransactionsTotalOutflows = (viewMode: 'both' | 'user1' | 'user2' = 'both') => {
    const filteredTransactions = getTransactionsByUser(viewMode);
    
    // Usar isCashOutflow que INCLUI pagamentos de cartão
    const outflows = filteredTransactions.filter(t => isCashOutflow(t as DashboardTransaction));
    
    const outflowValues = outflows.map(t => {
      const dashTx = t as DashboardTransaction;
      const effectiveAmount = getDashboardEffectiveAmount(dashTx);
      return convertCurrency(effectiveAmount, t.currency, userPreferredCurrency);
    });
    
    console.log('💰 [Dashboard Principal] Total Outflows calculated:', {
      count: outflows.length,
      transactions: outflows.map(t => ({
        desc: t.description,
        amount: t.amount,
        type: t.card_transaction_type,
        method: t.payment_method
      }))
    });
    
    return sumMonetaryArray(outflowValues);
  };

  // No need for refreshData - React Query handles it automatically!
  const refreshData = async () => {
    console.log('🔄 Manual refresh called (React Query will auto-invalidate)');
  };

  return {
    transactions,
    userPreferredCurrency,
    loading,
    getFinancialSummary,
    getFinancialComparison,
    getTransactionsByUser,
    getExpensesByUser,
    getAccountsBalance,
    getTransactionsIncome,
    getTransactionsExpenses,
    getTransactionsTotalOutflows,
    refreshData
  };
};
