import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useRealtimeTable } from '@/hooks/useRealtimeManager';
import { useAuth } from '@/hooks/useAuth';
import { useCurrencyConverter, type CurrencyCode } from '@/hooks/useCurrencyConverter';

interface CashAccount {
  id: string;
  balance: number;
  currency: CurrencyCode;
}

export const useCashBalance = () => {
  const [cashAccounts, setCashAccounts] = useState<CashAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { convertCurrency } = useCurrencyConverter();

  const fetchCashAccounts = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('accounts')
        .select('id, balance, currency')
        .eq('user_id', user.id)
        .eq('is_cash_account', true)
        .eq('is_active', true);

      if (error) {
        console.error('Error fetching cash accounts:', error);
        return;
      }

      if (data) {
        setCashAccounts(data.map(account => ({
          id: account.id,
          balance: Number(account.balance || 0),
          currency: account.currency as CurrencyCode
        })));
      }
    } catch (error) {
      console.error('Error fetching cash accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCashAccounts();
  }, [user?.id]);

  // Use centralized realtime manager instead of individual channel
  const handleRealtimeChange = useCallback(() => {
    fetchCashAccounts();
  }, [user?.id]);

  useRealtimeTable('accounts', handleRealtimeChange, !!user?.id);

  const getCashBalance = (currency: CurrencyCode): number => {
    const account = cashAccounts.find(acc => acc.currency === currency);
    return account?.balance || 0;
  };

  const getTotalCashBalance = (targetCurrency: CurrencyCode = 'BRL'): number => {
    return cashAccounts.reduce((total, account) => {
      return total + convertCurrency(account.balance, account.currency, targetCurrency);
    }, 0);
  };

  const canSpendCash = (amount: number, currency: CurrencyCode): boolean => {
    const balance = getCashBalance(currency);
    return balance >= amount;
  };

  const getCashBalanceError = (amount: number, currency: CurrencyCode): string | null => {
    if (!canSpendCash(amount, currency)) {
      const balance = getCashBalance(currency);
      return `Saldo insuficiente em dinheiro. Disponível: ${balance.toFixed(2)} ${currency}`;
    }
    return null;
  };

  return {
    cashAccounts,
    loading,
    getCashBalance,
    getTotalCashBalance,
    canSpendCash,
    getCashBalanceError,
    refreshCashAccounts: fetchCashAccounts
  };
};