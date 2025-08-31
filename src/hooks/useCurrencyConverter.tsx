import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type CurrencyCode = 'BRL' | 'USD' | 'EUR';

interface ExchangeRates {
  BRL: number;
  USD: number;
  EUR: number;
}

interface CurrencyInfo {
  code: CurrencyCode;
  symbol: string;
  name: string;
}

export const CURRENCY_INFO: Record<CurrencyCode, CurrencyInfo> = {
  BRL: { code: 'BRL', symbol: 'R$', name: 'Real' },
  USD: { code: 'USD', symbol: '$', name: 'Dólar' },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro' }
};

export const useCurrencyConverter = () => {
const [exchangeRates, setExchangeRates] = useState<ExchangeRates>({
  BRL: 1,
  USD: 0.1843, // Fallback: 1 BRL -> 0.1843 USD
  EUR: 0.1572  // Fallback: 1 BRL -> 0.1572 EUR
});
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchExchangeRates = async () => {
    try {
      setLoading(true);
      
      // Fetch centralized exchange rates from Supabase
      const { data, error } = await supabase
        .from('exchange_rates')
        .select('base_currency, target_currency, rate')
        .eq('base_currency', 'BRL');
      
      if (error) {
        console.error('Error fetching exchange rates from Supabase:', error);
        throw error;
      }
      
      if (data && data.length > 0) {
const rates: ExchangeRates = { BRL: 1, USD: 0.1843, EUR: 0.1572 };

data.forEach((row) => {
  const rate = Number(row.rate); // Already BRL -> target currency
  if (row.target_currency === 'USD') {
    rates.USD = rate;
  } else if (row.target_currency === 'EUR') {
    rates.EUR = rate;
  }
});
        
        console.log('[FX] Using exchange rates (BRL->currency):', rates);
        setExchangeRates(rates);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('Error fetching exchange rates:', error);
      // Keep using fallback rates
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExchangeRates();
    
    // Update rates every hour
    const interval = setInterval(fetchExchangeRates, 60 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const convertCurrency = (
    amount: number,
    fromCurrency: CurrencyCode,
    toCurrency: CurrencyCode
  ): number => {
    if (fromCurrency === toCurrency) return amount;
    
    // Convert to BRL first (base currency)
    let amountInBRL: number;
    if (fromCurrency === 'BRL') {
      amountInBRL = amount;
    } else {
      amountInBRL = amount / exchangeRates[fromCurrency];
    }
    
    // Convert from BRL to target currency
    let result: number;
    if (toCurrency === 'BRL') {
      result = amountInBRL;
    } else {
      result = amountInBRL * exchangeRates[toCurrency];
    }
    
    // Apply consistent rounding to 2 decimal places
    return Math.round(result * 100) / 100;
  };

  const formatCurrency = (amount: number, currency: CurrencyCode): string => {
    const currencyInfo = CURRENCY_INFO[currency];
    
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const getCurrencySymbol = (currency: CurrencyCode): string => {
    return CURRENCY_INFO[currency].symbol;
  };

  return {
    exchangeRates,
    loading,
    lastUpdated,
    convertCurrency,
    formatCurrency,
    getCurrencySymbol,
    refreshRates: fetchExchangeRates,
    CURRENCY_INFO
  };
};
