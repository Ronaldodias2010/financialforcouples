import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useCurrencyConverter, type CurrencyCode } from './useCurrencyConverter';
import { format } from 'date-fns';

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
  categories?: { name: string };
  cards?: { name: string };
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

export const useFinancialData = () => {
  const { user } = useAuth();
  const { convertCurrency } = useCurrencyConverter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [userPreferredCurrency, setUserPreferredCurrency] = useState<CurrencyCode>('BRL');
  const [loading, setLoading] = useState(true);
  const [coupleIds, setCoupleIds] = useState<{ user1_id: string; user2_id: string } | null>(null);

  useEffect(() => {
    if (user) {
      fetchUserPreferredCurrency();
      fetchTransactions();
      fetchAccounts();
    }
  }, [user]);

  // Re-fetch data when preferred currency changes
  useEffect(() => {
    if (user && userPreferredCurrency) {
      fetchTransactions();
    }
  }, [userPreferredCurrency]);

  // Listen for profile changes and real-time transaction updates
  useEffect(() => {
    if (!user) return;

    const profileChannel = supabase
      .channel('profile_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Profile updated:', payload);
          if (payload.new && payload.new.preferred_currency) {
            console.log('New currency:', payload.new.preferred_currency);
            setUserPreferredCurrency(payload.new.preferred_currency as CurrencyCode);
          }
        }
      )
      .subscribe();

  // Listen for real-time transaction changes for unified dashboard
  const transactionChannel = supabase
    .channel('transaction_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'transactions'
      },
      (payload) => {
        console.log('Real-time transaction change detected:', payload);
        // Refresh transactions when any change occurs to ensure couples see each other's data
        setTimeout(fetchTransactions, 100); // Small delay to ensure database consistency
      }
    )
    .subscribe();

  // Listen for real-time account changes to reflect balances immediately
  const accountChannel = supabase
    .channel('account_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'accounts'
      },
      (payload) => {
        console.log('Real-time account change detected:', payload);
        setTimeout(fetchAccounts, 100);
      }
    )
    .subscribe();

  // Also listen for couple relationship changes
  const coupleChannel = supabase
    .channel('couple_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'user_couples'
      },
      (payload) => {
        console.log('Couple relationship changed:', payload);
        const data = payload.new || payload.old;
        if (data && typeof data === 'object' && 'user1_id' in data && 'user2_id' in data) {
          if (data.user1_id === user.id || data.user2_id === user.id) {
            setTimeout(() => {
              fetchTransactions();
              fetchAccounts();
            }, 100);
          }
        }
      }
    )
    .subscribe();

    return () => {
      supabase.removeChannel(profileChannel);
      supabase.removeChannel(transactionChannel);
      supabase.removeChannel(accountChannel);
      supabase.removeChannel(coupleChannel);
    };
  }, [user]);

  const fetchUserPreferredCurrency = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('preferred_currency')
        .eq('user_id', user?.id)
        .single();

      if (data && data.preferred_currency) {
        setUserPreferredCurrency(data.preferred_currency as CurrencyCode);
      }
    } catch (error) {
      console.error('Error fetching user preferred currency:', error);
    }
  };

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      
      const endOfMonth = new Date();
      endOfMonth.setMonth(endOfMonth.getMonth() + 1);
      endOfMonth.setDate(0);
      endOfMonth.setHours(23, 59, 59, 999);

      // Check if user is part of a couple to include partner's transactions
      const { data: coupleData } = await supabase
        .from("user_couples")
        .select("user1_id, user2_id")
        .or(`user1_id.eq.${user?.id},user2_id.eq.${user?.id}`)
        .eq("status", "active")
        .maybeSingle();

      let userIds = [user?.id];
      let isPartOfCouple = false;
      
      if (coupleData) {
        // Include both users' transactions for shared dashboard
        userIds = [coupleData.user1_id, coupleData.user2_id];
        isPartOfCouple = true;
        setCoupleIds({ user1_id: coupleData.user1_id, user2_id: coupleData.user2_id });
        console.log('✅ User is part of a couple - fetching transactions for both users:', userIds);
      } else {
        setCoupleIds(null);
        console.log('❌ User is not part of a couple - fetching only own transactions');
      }

      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          categories(name),
          cards(name)
        `)
        .in('user_id', userIds)
        .or(`and(type.eq.income,transaction_date.gte.${format(startOfMonth, 'yyyy-MM-dd')},transaction_date.lte.${format(endOfMonth, 'yyyy-MM-dd')}),and(type.eq.expense,payment_method.neq.credit_card,transaction_date.gte.${format(startOfMonth, 'yyyy-MM-dd')},transaction_date.lte.${format(endOfMonth, 'yyyy-MM-dd')}),and(type.eq.expense,payment_method.eq.credit_card,created_at.gte.${format(startOfMonth, 'yyyy-MM-dd')},created_at.lte.${format(endOfMonth, 'yyyy-MM-dd')})`)
        .order('transaction_date', { ascending: false });

      if (error) throw error;
      
      console.log(`Transactions fetched for ${isPartOfCouple ? 'couple' : 'individual'}:`, data?.length || 0, 'transactions');
      console.log('Transaction details:', data?.map(t => ({ 
        description: t.description, 
        amount: t.amount, 
        owner: t.owner_user, 
        user_id: t.user_id,
        type: t.type 
      })));
      setTransactions(data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAccounts = async () => {
    try {
      // Determine if in a couple to fetch both users' accounts
      const { data: coupleData } = await supabase
        .from('user_couples')
        .select('user1_id, user2_id')
        .or(`user1_id.eq.${user?.id},user2_id.eq.${user?.id}`)
        .eq('status', 'active')
        .maybeSingle();

      let userIds = [user?.id];
      if (coupleData) {
        userIds = [coupleData.user1_id, coupleData.user2_id];
      }

      const { data, error } = await supabase
        .from('accounts')
        .select('id, user_id, balance, currency, account_model, owner_user, is_active, is_cash_account')
        .in('user_id', userIds)
        .eq('is_active', true);

      if (error) throw error;
      setAccounts(data || []);
      console.log('Accounts fetched:', data?.length || 0);
    } catch (error) {
      console.error('Error fetching accounts:', error);
    }
  };

  const getFinancialSummary = (viewMode: 'both' | 'user1' | 'user2' = 'both'): FinancialSummary => {
    const filteredTransactions = getTransactionsByUser(viewMode);
    let totalIncome = 0;
    let totalExpenses = 0;

    filteredTransactions.forEach((transaction) => {
      // Skip account transfers to prevent double counting
      if (transaction.payment_method === 'account_transfer') {
        return;
      }

      const amountInUserCurrency = convertCurrency(
        transaction.amount,
        transaction.currency,
        userPreferredCurrency
      );

      if (transaction.type === 'income') {
        totalIncome += amountInUserCurrency;
      } else {
        totalExpenses += amountInUserCurrency;
      }
    });

    // CORREÇÃO: NÃO incluir saldos de contas como receita na movimentação
    // Saldo das contas deve ser tratado separadamente do fluxo de receitas/despesas

    console.log('Financial Summary (MOVIMENTAÇÃO - sem saldos de contas):', {
      totalIncome,
      totalExpenses,
      transactionsCount: filteredTransactions.length,
      viewMode,
    });
    
    return {
      totalIncome,
      totalExpenses,
      balance: totalIncome - totalExpenses,
      currency: userPreferredCurrency,
    };
  };

  const getFinancialComparison = async () => {
    try {
      // Get current date for accurate month calculation
      const today = new Date();
      const currentYear = today.getFullYear();
      const currentMonth = today.getMonth();
      
      // Calculate previous month accurately, handling year transitions
      let prevYear = currentYear;
      let prevMonth = currentMonth - 1;
      
      if (prevMonth < 0) {
        prevMonth = 11; // December
        prevYear = currentYear - 1;
      }
      
      // Create precise date ranges for previous month
      const startOfPrevMonth = new Date(prevYear, prevMonth, 1, 0, 0, 0, 0);
      const endOfPrevMonth = new Date(prevYear, prevMonth + 1, 0, 23, 59, 59, 999);
      
      // Create precise date ranges for current month
      const startOfCurrentMonth = new Date(currentYear, currentMonth, 1, 0, 0, 0, 0);
      const endOfCurrentMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999);

      // Check if user is part of a couple to include partner's transactions
      const { data: coupleData } = await supabase
        .from("user_couples")
        .select("user1_id, user2_id")
        .or(`user1_id.eq.${user?.id},user2_id.eq.${user?.id}`)
        .eq("status", "active")
        .maybeSingle();

      let userIds = [user?.id];
      if (coupleData) {
        // Include both users' transactions
        userIds = [coupleData.user1_id, coupleData.user2_id];
      }

      // Fetch previous month transactions
      const { data: prevTransactions, error: prevError } = await supabase
        .from('transactions')
        .select('*')
        .in('user_id', userIds)
        .gte('transaction_date', format(startOfPrevMonth, 'yyyy-MM-dd'))
        .lte('transaction_date', format(endOfPrevMonth, 'yyyy-MM-dd'));

      if (prevError) throw prevError;

      // Fetch current month transactions (for more accurate comparison)
      const { data: currentTransactions, error: currentError } = await supabase
        .from('transactions')
        .select('*')
        .in('user_id', userIds)
        .gte('transaction_date', format(startOfCurrentMonth, 'yyyy-MM-dd'))
        .lte('transaction_date', format(endOfCurrentMonth, 'yyyy-MM-dd'));

      if (currentError) throw currentError;

      // Calculate previous month totals
      let prevTotalIncome = 0;
      let prevTotalExpenses = 0;

      (prevTransactions || []).forEach((transaction) => {
        // Skip account transfers to prevent double counting
        if (transaction.payment_method === 'account_transfer') {
          return;
        }

        const amountInUserCurrency = convertCurrency(
          transaction.amount,
          transaction.currency,
          userPreferredCurrency
        );

        if (transaction.type === 'income') {
          prevTotalIncome += amountInUserCurrency;
        } else if (transaction.type === 'expense') {
          prevTotalExpenses += amountInUserCurrency;
        }
      });

      // Calculate current month totals from fresh data
      let currentTotalIncome = 0;
      let currentTotalExpenses = 0;

      (currentTransactions || []).forEach((transaction) => {
        // Skip account transfers to prevent double counting
        if (transaction.payment_method === 'account_transfer') {
          return;
        }

        const amountInUserCurrency = convertCurrency(
          transaction.amount,
          transaction.currency,
          userPreferredCurrency
        );

        if (transaction.type === 'income') {
          currentTotalIncome += amountInUserCurrency;
        } else if (transaction.type === 'expense') {
          currentTotalExpenses += amountInUserCurrency;
        }
      });

      const prevBalance = prevTotalIncome - prevTotalExpenses;
      const currentBalance = currentTotalIncome - currentTotalExpenses;

      // Calculate percentage changes with improved logic
      const calculatePercentageChange = (current: number, previous: number): number => {
        if (previous === 0) {
          return current > 0 ? 100 : 0; // 100% increase if we had nothing before and now have something
        }
        return ((current - previous) / Math.abs(previous)) * 100;
      };

      const incomeChange = calculatePercentageChange(currentTotalIncome, prevTotalIncome);
      const expenseChange = calculatePercentageChange(currentTotalExpenses, prevTotalExpenses);
      const balanceChange = calculatePercentageChange(currentBalance, prevBalance);

      console.log(`📊 Comparação mensal calculada:
        - Receitas: ${currentTotalIncome.toFixed(2)} vs ${prevTotalIncome.toFixed(2)} (${incomeChange.toFixed(1)}%)
        - Despesas: ${currentTotalExpenses.toFixed(2)} vs ${prevTotalExpenses.toFixed(2)} (${expenseChange.toFixed(1)}%)
        - Saldo: ${currentBalance.toFixed(2)} vs ${prevBalance.toFixed(2)} (${balanceChange.toFixed(1)}%)`);

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

  const getAccountsByUser = (viewMode: 'both' | 'user1' | 'user2') => {
    if (viewMode === 'both') return accounts;
    return accounts.filter((acc) => (acc.owner_user || 'user1') === viewMode);
  };

  const getTransactionsByUser = (viewMode: 'both' | 'user1' | 'user2') => {
    if (viewMode === 'both') {
      return transactions;
    }
    
    return transactions.filter(transaction => {
      // Prefer classifying by user_id vs couple membership to avoid stale owner_user
      if (!coupleIds) {
        return true; // single user context
      }
      const ownerUser: 'user1' | 'user2' = transaction.user_id === coupleIds.user1_id ? 'user1'
        : transaction.user_id === coupleIds.user2_id ? 'user2'
        : 'user1';
      return ownerUser === viewMode;
    });
  };

  const getExpensesByUser = (viewMode: 'both' | 'user1' | 'user2') => {
    const allTransactions = viewMode === 'both' ? transactions : getTransactionsByUser(viewMode);
    
    const user1Expenses = allTransactions
      .filter(t => t.type === 'expense' && (!coupleIds || t.user_id === coupleIds.user1_id))
      .reduce((sum, t) => sum + convertCurrency(t.amount, t.currency, userPreferredCurrency), 0);
    
    const user2Expenses = allTransactions
      .filter(t => t.type === 'expense' && (coupleIds ? t.user_id === coupleIds.user2_id : false))
      .reduce((sum, t) => sum + convertCurrency(t.amount, t.currency, userPreferredCurrency), 0);

    return { user1Expenses, user2Expenses };
  };

  const refreshData = async () => {
    if (user) {
      console.log('🔄 Refreshing financial data...');
      setLoading(true);
      await fetchUserPreferredCurrency();
      await fetchTransactions();
      await fetchAccounts();
      setLoading(false);
      console.log('✅ Financial data refreshed');
    }
  };

  // Returns the sum of balances from personal accounts + cash accounts (SALDO REAL - não é receita)
  const getAccountsBalance = (viewMode: 'both' | 'user1' | 'user2' = 'both') => {
    const filteredAccounts = getAccountsByUser(viewMode).filter(
      (acc) => (acc.account_model || 'personal') === 'personal'
    );
    const accountsBalance = filteredAccounts.reduce((sum, acc) => {
      return sum + convertCurrency(
        acc.balance || 0,
        acc.currency as CurrencyCode,
        userPreferredCurrency
      );
    }, 0);
    
    // Incluir saldo da conta de dinheiro no valor disponível/real
    const cashAccounts = accounts.filter(acc => acc.is_cash_account && acc.is_active);
    const cashBalance = cashAccounts.reduce((sum, acc) => {
      const userOwnsAccount = viewMode === 'both' || (acc.owner_user || 'user1') === viewMode;
      if (userOwnsAccount) {
        return sum + convertCurrency(
          acc.balance || 0,
          acc.currency as CurrencyCode,
          userPreferredCurrency
        );
      }
      return sum;
    }, 0);
    
    return accountsBalance + cashBalance;
  };

  // Returns the sum of transaction-based incomes only (no accounts, no transfers)
  const getTransactionsIncome = (viewMode: 'both' | 'user1' | 'user2' = 'both') => {
    const filteredTransactions = getTransactionsByUser(viewMode);
    const incomeOnly = filteredTransactions.filter(t => t.type === 'income' && t.payment_method !== 'account_transfer');
    const total = incomeOnly.reduce((sum, t) => {
      return sum + convertCurrency(t.amount, t.currency, userPreferredCurrency);
    }, 0);
    console.log('💰 Income calculation excluding transfers:', { total, incomeTransactions: incomeOnly.length, viewMode });
    return total;
  };

  // Returns the sum of transaction-based expenses only (no accounts, no transfers)
  const getTransactionsExpenses = (viewMode: 'both' | 'user1' | 'user2' = 'both') => {
    const filteredTransactions = getTransactionsByUser(viewMode);
    const expenseOnly = filteredTransactions.filter(t => t.type === 'expense' && t.payment_method !== 'account_transfer');
    const total = expenseOnly.reduce((sum, t) => {
      return sum + convertCurrency(t.amount, t.currency, userPreferredCurrency);
    }, 0);
    console.log('💸 Expense calculation excluding transfers:', { total, expenseTransactions: expenseOnly.length, viewMode });
    return total;
  };

  return {
    transactions,
    userPreferredCurrency,
    loading,
    getFinancialSummary,
    getFinancialComparison,
    getTransactionsByUser,
    getExpensesByUser,
    getAccountsBalance, // Corrigido: usando getAccountsBalance em vez de getAccountsIncome
    getTransactionsIncome,
    getTransactionsExpenses,
    refreshData
  };
};