import { useState, useEffect } from 'react';
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
  const [userPreferredCurrency, setUserPreferredCurrency] = useState<CurrencyCode>('BRL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserPreferredCurrency();
      fetchTransactions();
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
          console.log('Transaction changed:', payload);
          // Refresh transactions when any change occurs
          fetchTransactions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(profileChannel);
      supabase.removeChannel(transactionChannel);
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
      if (coupleData) {
        // Include both users' transactions
        userIds = [coupleData.user1_id, coupleData.user2_id];
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
      
      console.log('Transactions fetched:', data);
      setTransactions(data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
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

    console.log('Financial Summary:', { 
      totalIncome, 
      totalExpenses, 
      transactionsCount: filteredTransactions.length,
      viewMode 
    });
    
    return {
      totalIncome,
      totalExpenses,
      balance: totalIncome - totalExpenses,
      currency: userPreferredCurrency
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
      const currentSummary = getFinancialSummary();

      // Calculate percentage changes
      const incomeChange = prevTotalIncome === 0 ? 0 : 
        ((currentSummary.totalIncome - prevTotalIncome) / prevTotalIncome) * 100;
      
      const expenseChange = prevTotalExpenses === 0 ? 0 : 
        ((currentSummary.totalExpenses - prevTotalExpenses) / prevTotalExpenses) * 100;
      
      const balanceChange = prevBalance === 0 ? 0 : 
        ((currentSummary.balance - prevBalance) / Math.abs(prevBalance)) * 100;

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

  return {
    transactions,
    userPreferredCurrency,
    loading,
    getFinancialSummary,
    getFinancialComparison,
    getTransactionsByUser,
    getExpensesByUser,
    refreshData: fetchTransactions
  };
};