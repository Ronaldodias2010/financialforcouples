import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useCurrencyConverter, type CurrencyCode } from './useCurrencyConverter';
import { format } from 'date-fns';
import { sumMonetaryArray, subtractMonetaryValues } from '@/utils/monetary';

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

      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          categories(name),
          cards(name)
        `)
        .in('user_id', userIds)
        .or(`and(is_installment.is.false,status.eq.completed,transaction_date.gte.${format(startOfMonth, 'yyyy-MM-dd')},transaction_date.lte.${format(endOfMonth, 'yyyy-MM-dd')}),and(is_installment.is.true,status.eq.pending,due_date.gte.${format(startOfMonth, 'yyyy-MM-dd')},due_date.lte.${format(endOfMonth, 'yyyy-MM-dd')})`)
        .order('transaction_date', { ascending: false });

      if (error) throw error;
      
      console.log('✅ Transactions fetched via React Query:', data?.length || 0);
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
  
  useEffect(() => {
    if (!user?.id) return;
    
    console.log('🔄 Setting up real-time subscriptions for React Query');
    
    // Profile changes - invalidate currency
    const profileChannel = supabase
      .channel('rq-profile-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          console.log('📡 Profile updated - invalidating currency');
          queryClient.invalidateQueries({ queryKey: financialQueryKeys.userCurrency(user.id) });
        }
      )
      .subscribe();

    // Transaction changes - invalidate transactions
    const transactionChannel = supabase
      .channel('rq-transaction-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions'
        },
        () => {
          console.log('📡 Transaction changed - invalidating all financial data');
          queryClient.invalidateQueries({ queryKey: ['transactions'] });
        }
      )
      .subscribe();

    // Account changes - invalidate accounts
    const accountChannel = supabase
      .channel('rq-account-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'accounts'
        },
        () => {
          console.log('📡 Account changed - invalidating accounts');
          queryClient.invalidateQueries({ queryKey: ['accounts'] });
        }
      )
      .subscribe();

    // Couple changes - invalidate couple data and refresh everything
    const coupleChannel = supabase
      .channel('rq-couple-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_couples'
        },
        (payload) => {
          const data = payload.new || payload.old;
          if (data && 'user1_id' in data && 'user2_id' in data &&
              (data.user1_id === user.id || data.user2_id === user.id)) {
            console.log('📡 Couple changed - invalidating all data');
            queryClient.invalidateQueries({ queryKey: financialQueryKeys.coupleData(user.id) });
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
            queryClient.invalidateQueries({ queryKey: ['accounts'] });
          }
        }
      )
      .subscribe();

    return () => {
      console.log('🔌 Cleaning up real-time subscriptions');
      supabase.removeChannel(profileChannel);
      supabase.removeChannel(transactionChannel);
      supabase.removeChannel(accountChannel);
      supabase.removeChannel(coupleChannel);
    };
  }, [user?.id, queryClient]);
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
    
    // Get current month range
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);
    
    const incomeValues: number[] = [];
    const expenseValues: number[] = [];

    filteredTransactions.forEach((transaction) => {
      // Skip internal transfers and investments
      if (transaction.payment_method === 'account_transfer' || transaction.payment_method === 'account_investment') {
        return;
      }

      // Skip legacy future expenses
      if (transaction.card_transaction_type === 'future_expense') {
        return;
      }

      // For installments, include only if due_date is in current month
      if (transaction.is_installment && transaction.due_date) {
        const dueDate = new Date(transaction.due_date);
        const isCurrentMonth = dueDate >= startOfMonth && dueDate <= endOfMonth;
        
        if (!isCurrentMonth) {
          return;
        }
      } else {
        // For non-installments, skip pending transactions
        if (transaction.status === 'pending') {
          return;
        }
      }

      const amountInUserCurrency = convertCurrency(
        transaction.amount,
        transaction.currency,
        userPreferredCurrency
      );

      if (transaction.type === 'income') {
        incomeValues.push(amountInUserCurrency);
      } else {
        expenseValues.push(amountInUserCurrency);
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
    
    // Get current month range
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);
    
    const user1Expenses = allTransactions
      .filter(t => {
        if (t.type !== 'expense' || 
            t.payment_method === 'account_transfer' || 
            t.payment_method === 'account_investment' ||
            t.card_transaction_type === 'future_expense' ||
            (t.owner_user || 'user1') !== 'user1') {
          return false;
        }
        
        // For installments, include if due_date is in current month
        if (t.is_installment && t.due_date) {
          const dueDate = new Date(t.due_date);
          return dueDate >= startOfMonth && dueDate <= endOfMonth;
        }
        
        // For non-installments, exclude pending
        return t.status !== 'pending';
      })
      .reduce((sum, t) => sum + convertCurrency(t.amount, t.currency, userPreferredCurrency), 0);
    
    const user2Expenses = allTransactions
      .filter(t => {
        if (t.type !== 'expense' || 
            t.payment_method === 'account_transfer' || 
            t.payment_method === 'account_investment' ||
            t.card_transaction_type === 'future_expense' ||
            (t.owner_user || 'user1') !== 'user2') {
          return false;
        }
        
        // For installments, include if due_date is in current month
        if (t.is_installment && t.due_date) {
          const dueDate = new Date(t.due_date);
          return dueDate >= startOfMonth && dueDate <= endOfMonth;
        }
        
        // For non-installments, exclude pending
        return t.status !== 'pending';
      })
      .reduce((sum, t) => sum + convertCurrency(t.amount, t.currency, userPreferredCurrency), 0);

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
    
    // Get current month range
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);
    
    const expenseOnly = filteredTransactions.filter(t => {
      // Skip transfers and investments
      if (t.type !== 'expense' || 
          t.payment_method === 'account_transfer' || 
          t.payment_method === 'account_investment' ||
          t.card_transaction_type === 'future_expense') {
        return false;
      }
      
      // Excluir transações de "Pagamento de Cartão de Crédito"
      // Garante consistência com o Fluxo de Caixa e outros componentes
      const categoryName = (t.categories?.name || '').toLowerCase();
      const isCardPayment = 
        (categoryName.includes('pagamento') && (categoryName.includes('cartão') || categoryName.includes('cartao'))) ||
        categoryName.includes('credit card payment');
      if (isCardPayment) {
        return false;
      }
      
      // For installments, include if due_date is in current month (regardless of status)
      if (t.is_installment && t.due_date) {
        const dueDate = new Date(t.due_date);
        return dueDate >= startOfMonth && dueDate <= endOfMonth;
      }
      
      // For non-installments, exclude pending transactions
      return t.status !== 'pending';
    });
    
    const expenseValues = expenseOnly.map(t => convertCurrency(t.amount, t.currency, userPreferredCurrency));
    return sumMonetaryArray(expenseValues);
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
    refreshData
  };
};
