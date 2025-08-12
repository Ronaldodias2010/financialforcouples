import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useCurrencyConverter, type CurrencyCode } from './useCurrencyConverter';

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  currency: CurrencyCode;
  description: string;
  transaction_date: string;
  owner_user: string;
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
  const [coupleData, setCoupleData] = useState<any>(null);
  const [lastFetch, setLastFetch] = useState<{ transactions: number; accounts: number; couple: number }>({
    transactions: 0,
    accounts: 0,
    couple: 0
  });
  
  // Cache para evitar re-consultas desnecessárias
  const cacheRef = useRef({
    couple: null as any,
    transactions: null as Transaction[],
    accounts: null as Account[],
    currency: null as CurrencyCode | null
  });

  // Otimizado: buscar dados couple uma única vez
  const fetchCoupleData = useCallback(async () => {
    if (!user?.id) return null;
    
    const now = Date.now();
    // Cache por 5 minutos
    if (cacheRef.current.couple && (now - lastFetch.couple) < 300000) {
      return cacheRef.current.couple;
    }
    
    try {
      const { data } = await supabase
        .from("user_couples")
        .select("user1_id, user2_id")
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .eq("status", "active")
        .maybeSingle();
      
      cacheRef.current.couple = data;
      setLastFetch(prev => ({ ...prev, couple: now }));
      setCoupleData(data);
      return data;
    } catch (error) {
      console.error('Error fetching couple data:', error);
      return null;
    }
  }, [user?.id]);

  useEffect(() => {
    if (user) {
      const initializeData = async () => {
        setLoading(true);
        await fetchUserPreferredCurrency();
        const couple = await fetchCoupleData();
        await Promise.all([
          fetchTransactions(couple),
          fetchAccounts(couple)
        ]);
        setLoading(false);
      };
      initializeData();
    }
  }, [user]);

  // Re-fetch data when preferred currency changes
  useEffect(() => {
    if (user && userPreferredCurrency && cacheRef.current.currency !== userPreferredCurrency) {
      cacheRef.current.currency = userPreferredCurrency;
      fetchTransactions(coupleData);
    }
  }, [userPreferredCurrency, coupleData]);

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
          // Limpar cache e refetch
          cacheRef.current.transactions = null;
          setTimeout(() => fetchTransactions(coupleData), 100);
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
          cacheRef.current.accounts = null;
          setTimeout(() => fetchAccounts(coupleData), 100);
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
            // Limpar cache do casal e refetch
            cacheRef.current.couple = null;
            setTimeout(async () => {
              const newCouple = await fetchCoupleData();
              await Promise.all([
                fetchTransactions(newCouple),
                fetchAccounts(newCouple)
              ]);
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

  const fetchTransactions = async (providedCoupleData?: any) => {
    try {
      const now = Date.now();
      // Cache por 2 minutos
      if (cacheRef.current.transactions && (now - lastFetch.transactions) < 120000) {
        return;
      }
      
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      
      const endOfMonth = new Date();
      endOfMonth.setMonth(endOfMonth.getMonth() + 1);
      endOfMonth.setDate(0);
      endOfMonth.setHours(23, 59, 59, 999);

      // Usar dados do casal fornecidos ou buscar do cache
      const currentCoupleData = providedCoupleData || coupleData || cacheRef.current.couple;

      let userIds = [user?.id];
      let isPartOfCouple = false;
      
      if (currentCoupleData) {
        userIds = [currentCoupleData.user1_id, currentCoupleData.user2_id];
        isPartOfCouple = true;
        console.log('✅ User is part of a couple - fetching transactions for both users:', userIds);
      } else {
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
        .gte('transaction_date', startOfMonth.toISOString().split('T')[0])
        .lte('transaction_date', endOfMonth.toISOString().split('T')[0])
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
      
      cacheRef.current.transactions = data || [];
      setLastFetch(prev => ({ ...prev, transactions: now }));
      setTransactions(data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const fetchAccounts = async (providedCoupleData?: any) => {
    try {
      const now = Date.now();
      // Cache por 2 minutos
      if (cacheRef.current.accounts && (now - lastFetch.accounts) < 120000) {
        return;
      }

      // Usar dados do casal fornecidos ou buscar do cache
      const currentCoupleData = providedCoupleData || coupleData || cacheRef.current.couple;

      let userIds = [user?.id];
      if (currentCoupleData) {
        userIds = [currentCoupleData.user1_id, currentCoupleData.user2_id];
      }

      const { data, error } = await supabase
        .from('accounts')
        .select('id, user_id, balance, currency, account_model, owner_user')
        .in('user_id', userIds)
        .eq('account_model', 'personal');

      if (error) throw error;
      
      cacheRef.current.accounts = data || [];
      setLastFetch(prev => ({ ...prev, accounts: now }));
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

  const getFinancialComparison = useCallback(async () => {
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

      // Usar dados do casal do cache
      const currentCoupleData = coupleData || cacheRef.current.couple;

      let userIds = [user?.id];
      if (currentCoupleData) {
        userIds = [currentCoupleData.user1_id, currentCoupleData.user2_id];
      }

      const { data: prevTransactions, error } = await supabase
        .from('transactions')
        .select('*')
        .in('user_id', userIds)
        .gte('transaction_date', startOfPrevMonth.toISOString().split('T')[0])
        .lte('transaction_date', endOfPrevMonth.toISOString().split('T')[0]);

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
  }, [transactions, coupleData, user?.id, userPreferredCurrency, convertCurrency]);

  const getAccountsByUser = (viewMode: 'both' | 'user1' | 'user2') => {
    if (viewMode === 'both') return accounts;
    return accounts.filter((acc) => (acc.owner_user || 'user1') === viewMode);
  };

  const getTransactionsByUser = (viewMode: 'both' | 'user1' | 'user2') => {
    if (viewMode === 'both') {
      return transactions;
    }
    
    return transactions.filter(transaction => {
      // Use owner_user field directly to match the view mode
      const ownerUser = transaction.owner_user || 'user1';
      return ownerUser === viewMode;
    });
  };

  const getExpensesByUser = (viewMode: 'both' | 'user1' | 'user2') => {
    const allTransactions = viewMode === 'both' ? transactions : getTransactionsByUser(viewMode);
    
    const user1Expenses = allTransactions
      .filter(t => t.type === 'expense' && (t.owner_user || 'user1') === 'user1')
      .reduce((sum, t) => sum + convertCurrency(t.amount, t.currency, userPreferredCurrency), 0);
    
    const user2Expenses = allTransactions
      .filter(t => t.type === 'expense' && (t.owner_user || 'user1') === 'user2')
      .reduce((sum, t) => sum + convertCurrency(t.amount, t.currency, userPreferredCurrency), 0);

    return { user1Expenses, user2Expenses };
  };

  const refreshData = useCallback(async () => {
    if (user) {
      console.log('🔄 Refreshing financial data...');
      setLoading(true);
      
      // Limpar todos os caches
      cacheRef.current = {
        couple: null,
        transactions: null,
        accounts: null,
        currency: null
      };
      
      await fetchUserPreferredCurrency();
      const couple = await fetchCoupleData();
      await Promise.all([
        fetchTransactions(couple),
        fetchAccounts(couple)
      ]);
      setLoading(false);
      console.log('✅ Financial data refreshed');
    }
  }, [user, fetchCoupleData]);

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
    accounts,
    userPreferredCurrency,
    loading,
    getFinancialSummary,
    getFinancialComparison,
    getTransactionsByUser,
    getExpensesByUser,
    getAccountsIncome,
    getTransactionsIncome,
    getTransactionsExpenses,
    refreshData,
    fetchCoupleData
  };
};