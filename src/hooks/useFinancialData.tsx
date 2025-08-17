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
        .select('id, user_id, balance, currency, account_model, owner_user')
        .in('user_id', userIds)
        .eq('account_model', 'personal');

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

    // Include balances from personal accounts as income
    const filteredAccounts = getAccountsByUser(viewMode).filter(
      (acc) => (acc.account_model || 'personal') === 'personal'
    );
    const accountsIncome = filteredAccounts.reduce((sum, acc) => {
      return sum + convertCurrency(acc.balance || 0, acc.currency as CurrencyCode, userPreferredCurrency);
    }, 0);

    const totalIncomeWithAccounts = totalIncome + accountsIncome;

    console.log('Financial Summary (with accounts):', {
      totalIncome: totalIncomeWithAccounts,
      totalExpenses,
      accountsIncome,
      transactionsCount: filteredTransactions.length,
      accountsCount: filteredAccounts.length,
      viewMode,
    });
    
    return {
      totalIncome: totalIncomeWithAccounts,
      totalExpenses,
      balance: totalIncomeWithAccounts - totalExpenses,
      currency: userPreferredCurrency,
    };
  };

  const getFinancialComparison = async () => {
    try {
      // Get previous month data
      const prevMonth = new Date();
      prevMonth.setMonth(prevMonth.getMonth() - 1);
      
      const startOfPrevMonth = new Date(prevMonth);
      startOfPrevMonth.setDate(1);
      startOfPrevMonth.setHours(0, 0, 0, 0);
      
      const endOfPrevMonth = new Date(prevMonth);
      endOfPrevMonth.setMonth(endOfPrevMonth.getMonth() + 1);
      endOfPrevMonth.setDate(0);
      endOfPrevMonth.setHours(23, 59, 59, 999);

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

      const { data: prevTransactions, error } = await supabase
        .from('transactions')
        .select('*')
        .in('user_id', userIds)
        .gte('transaction_date', format(startOfPrevMonth, 'yyyy-MM-dd'))
        .lte('transaction_date', format(endOfPrevMonth, 'yyyy-MM-dd'));

      if (error) throw error;

      // Calculate previous month totals
      let prevTotalIncome = 0;
      let prevTotalExpenses = 0;

      (prevTransactions || []).forEach((transaction) => {
        const amountInUserCurrency = convertCurrency(
          transaction.amount,
          transaction.currency,
          userPreferredCurrency
        );

        if (transaction.type === 'income') {
          prevTotalIncome += amountInUserCurrency;
        } else {
          prevTotalExpenses += amountInUserCurrency;
        }
      });

      const prevBalance = prevTotalIncome - prevTotalExpenses;

      // Compute current month totals from current transactions state (transactions only)
      const currentIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + convertCurrency(t.amount, t.currency, userPreferredCurrency), 0);

      const currentExpenses = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + convertCurrency(t.amount, t.currency, userPreferredCurrency), 0);

      const currentBalance = currentIncome - currentExpenses;

      // Calculate percentage changes
      const incomeChange = prevTotalIncome === 0 ? 0 : 
        ((currentIncome - prevTotalIncome) / prevTotalIncome) * 100;
      
      const expenseChange = prevTotalExpenses === 0 ? 0 : 
        ((currentExpenses - prevTotalExpenses) / prevTotalExpenses) * 100;
      
      const balanceChange = prevBalance === 0 ? 0 : 
        ((currentBalance - prevBalance) / Math.abs(prevBalance)) * 100;

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

  // Returns the sum of balances from personal accounts as income (converted)
  const getAccountsIncome = (viewMode: 'both' | 'user1' | 'user2' = 'both') => {
    const filteredAccounts = getAccountsByUser(viewMode).filter(
      (acc) => (acc.account_model || 'personal') === 'personal'
    );
    const accountsIncome = filteredAccounts.reduce((sum, acc) => {
      return sum + convertCurrency(
        acc.balance || 0,
        acc.currency as CurrencyCode,
        userPreferredCurrency
      );
    }, 0);
    return accountsIncome;
  };

  // Returns the sum of transaction-based incomes only (no accounts)
  const getTransactionsIncome = (viewMode: 'both' | 'user1' | 'user2' = 'both') => {
    const filteredTransactions = getTransactionsByUser(viewMode);
    const incomeOnly = filteredTransactions.filter(t => t.type === 'income');
    const total = incomeOnly.reduce((sum, t) => {
      return sum + convertCurrency(t.amount, t.currency, userPreferredCurrency);
    }, 0);
    return total;
  };

  // Returns the sum of transaction-based expenses only (no accounts)
  const getTransactionsExpenses = (viewMode: 'both' | 'user1' | 'user2' = 'both') => {
    const filteredTransactions = getTransactionsByUser(viewMode);
    const expenseOnly = filteredTransactions.filter(t => t.type === 'expense');
    const total = expenseOnly.reduce((sum, t) => {
      return sum + convertCurrency(t.amount, t.currency, userPreferredCurrency);
    }, 0);
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
    getAccountsIncome,
    getTransactionsIncome,
    getTransactionsExpenses,
    refreshData
  };
};