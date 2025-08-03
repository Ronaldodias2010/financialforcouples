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

      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          categories(name),
          cards(name)
        `)
        .eq('user_id', user?.id)
        .gte('transaction_date', startOfMonth.toISOString().split('T')[0])
        .lte('transaction_date', endOfMonth.toISOString().split('T')[0])
        .order('transaction_date', { ascending: false });

      if (error) throw error;
      
      setTransactions(data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFinancialSummary = (): FinancialSummary => {
    let totalIncome = 0;
    let totalExpenses = 0;

    transactions.forEach((transaction) => {
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

    return {
      totalIncome,
      totalExpenses,
      balance: totalIncome - totalExpenses,
      currency: userPreferredCurrency
    };
  };

  const getTransactionsByUser = (viewMode: 'both' | 'user1' | 'user2') => {
    if (viewMode === 'both') {
      return transactions;
    }
    
    return transactions.filter(transaction => 
      transaction.owner_user === viewMode || 
      (viewMode === 'user1' && transaction.owner_user === user?.email)
    );
  };

  const getExpensesByUser = (viewMode: 'both' | 'user1' | 'user2') => {
    const filteredTransactions = getTransactionsByUser(viewMode);
    
    const user1Expenses = filteredTransactions
      .filter(t => t.type === 'expense' && (t.owner_user === 'user1' || t.owner_user === user?.email))
      .reduce((sum, t) => sum + convertCurrency(t.amount, t.currency, userPreferredCurrency), 0);
    
    const user2Expenses = filteredTransactions
      .filter(t => t.type === 'expense' && t.owner_user === 'user2')
      .reduce((sum, t) => sum + convertCurrency(t.amount, t.currency, userPreferredCurrency), 0);

    return { user1Expenses, user2Expenses };
  };

  return {
    transactions,
    userPreferredCurrency,
    loading,
    getFinancialSummary,
    getTransactionsByUser,
    getExpensesByUser,
    refreshData: fetchTransactions
  };
};