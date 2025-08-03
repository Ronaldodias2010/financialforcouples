import { useState, useEffect } from 'react';

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
    USD: 5.2, // Default fallback rates
    EUR: 5.8
  });
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchExchangeRates = async () => {
    try {
      setLoading(true);
      
      // Using a free API for exchange rates
      // In production, consider using a more reliable paid service
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/BRL');
      
      if (!response.ok) {
        throw new Error('Failed to fetch exchange rates');
      }
      
      const data = await response.json();
      
      setExchangeRates({
        BRL: 1, // Base currency
        USD: data.rates.USD || 0.19,
        EUR: data.rates.EUR || 0.17
      });
      
      setLastUpdated(new Date());
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
    if (toCurrency === 'BRL') {
      return amountInBRL;
    } else {
      return amountInBRL * exchangeRates[toCurrency];
    }
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
