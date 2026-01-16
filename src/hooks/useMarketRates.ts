import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface MarketRate {
  indicator: string;
  value: number;
  previous_value: number | null;
  variation: number | null;
  unit: string;
  source: string;
  rate_date: string;
  recorded_at: string;
}

export interface MarketRates {
  selic: number | null;
  cdi: number | null;
  ipca: number | null;
  cdb_100: number | null;
  cdb_110: number | null;
  cdb_120: number | null;
  lci_lca: number | null;
  tesouro_selic: number | null;
  tesouro_ipca: number | null;
  lastUpdated: string | null;
  selicVariation: number | null;
}

const DEFAULT_RATES: MarketRates = {
  selic: null,
  cdi: null,
  ipca: null,
  cdb_100: null,
  cdb_110: null,
  cdb_120: null,
  lci_lca: null,
  tesouro_selic: null,
  tesouro_ipca: null,
  lastUpdated: null,
  selicVariation: null,
};

// Fallback rates when BCB data is not available
const FALLBACK_RATES: MarketRates = {
  selic: 14.25,
  cdi: 14.15,
  ipca: 4.5,
  cdb_100: 14.15,
  cdb_110: 15.565,
  cdb_120: 16.98,
  lci_lca: 12.735,
  tesouro_selic: 14.25,
  tesouro_ipca: 10.5,
  lastUpdated: null,
  selicVariation: null,
};

export const useMarketRates = () => {
  const [rates, setRates] = useState<MarketRates>(DEFAULT_RATES);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRates = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get the most recent rates for each indicator
      const { data, error: fetchError } = await supabase
        .from('market_rates')
        .select('*')
        .order('recorded_at', { ascending: false });

      if (fetchError) {
        console.error('Error fetching market rates:', fetchError);
        setError('Erro ao buscar taxas de mercado');
        // Use fallback rates
        setRates(FALLBACK_RATES);
        return;
      }

      if (!data || data.length === 0) {
        console.log('No market rates found, using fallback rates');
        setRates(FALLBACK_RATES);
        return;
      }

      // Group by indicator and get the most recent
      const latestRates: Record<string, MarketRate> = {};
      data.forEach(rate => {
        if (!latestRates[rate.indicator]) {
          latestRates[rate.indicator] = rate as MarketRate;
        }
      });

      const newRates: MarketRates = {
        selic: latestRates['selic']?.value ?? FALLBACK_RATES.selic,
        cdi: latestRates['cdi']?.value ?? FALLBACK_RATES.cdi,
        ipca: latestRates['ipca']?.value ?? FALLBACK_RATES.ipca,
        cdb_100: latestRates['cdb_100']?.value ?? FALLBACK_RATES.cdb_100,
        cdb_110: latestRates['cdb_110']?.value ?? FALLBACK_RATES.cdb_110,
        cdb_120: latestRates['cdb_120']?.value ?? FALLBACK_RATES.cdb_120,
        lci_lca: latestRates['lci_lca']?.value ?? FALLBACK_RATES.lci_lca,
        tesouro_selic: latestRates['tesouro_selic']?.value ?? FALLBACK_RATES.tesouro_selic,
        tesouro_ipca: latestRates['tesouro_ipca']?.value ?? FALLBACK_RATES.tesouro_ipca,
        lastUpdated: latestRates['selic']?.recorded_at ?? null,
        selicVariation: latestRates['selic']?.variation ?? null,
      };

      setRates(newRates);
    } catch (err) {
      console.error('Error in useMarketRates:', err);
      setError('Erro inesperado ao buscar taxas');
      setRates(FALLBACK_RATES);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    // Optionally call the edge function to update rates
    try {
      const { data, error } = await supabase.functions.invoke('monitor-selic-rate');
      if (error) {
        console.error('Error refreshing rates:', error);
      } else {
        console.log('Rates refreshed:', data);
      }
      // Fetch updated rates from database
      await fetchRates();
    } catch (err) {
      console.error('Error refreshing market rates:', err);
      await fetchRates();
    }
  }, [fetchRates]);

  useEffect(() => {
    fetchRates();
  }, [fetchRates]);

  return {
    rates,
    isLoading,
    error,
    refresh,
    refetch: fetchRates,
  };
};
