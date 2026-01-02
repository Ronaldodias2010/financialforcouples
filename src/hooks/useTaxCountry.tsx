import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type TaxCountry = 'BR' | 'US' | 'OTHER';

interface UseTaxCountryResult {
  taxCountry: TaxCountry | null;
  isLoading: boolean;
  shouldAskCountry: boolean;
  detectedCountry: string | null;
  isDetectedUS: boolean;
  saveCountry: (country: TaxCountry) => Promise<void>;
  resetCountry: () => void;
}

export function useTaxCountry(): UseTaxCountryResult {
  const queryClient = useQueryClient();
  const [detectedCountry, setDetectedCountry] = useState<string | null>(null);
  const [isDetecting, setIsDetecting] = useState(true);
  const [forceAsk, setForceAsk] = useState(false);

  // Detect user's current country via IP or timezone
  useEffect(() => {
    const detectCountry = async () => {
      try {
        // Try IP-based detection first
        const response = await fetch('https://ipapi.co/json/', {
          signal: AbortSignal.timeout(3000)
        });
        
        if (response.ok) {
          const data = await response.json();
          setDetectedCountry(data.country_code || null);
        }
      } catch (error) {
        // Fallback to timezone-based detection
        try {
          const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
          if (timezone.startsWith('America/')) {
            const usTimezones = [
              'America/New_York', 'America/Chicago', 'America/Denver',
              'America/Los_Angeles', 'America/Phoenix', 'America/Anchorage',
              'America/Honolulu', 'America/Detroit', 'America/Indianapolis'
            ];
            if (usTimezones.some(tz => timezone.includes(tz.split('/')[1]))) {
              setDetectedCountry('US');
            } else if (timezone.includes('Sao_Paulo') || timezone.includes('Brasilia') || 
                       timezone.includes('Fortaleza') || timezone.includes('Manaus')) {
              setDetectedCountry('BR');
            }
          }
        } catch {
          // Ignore timezone detection errors
        }
      } finally {
        setIsDetecting(false);
      }
    };

    detectCountry();
  }, []);

  // Fetch saved tax country from database
  const { data: taxConfig, isLoading: isLoadingConfig } = useQuery({
    queryKey: ['tax-country-config'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('tax_report_config')
        .select('tax_country')
        .eq('user_id', user.id)
        .order('tax_year', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    }
  });

  const savedCountry = taxConfig?.tax_country as TaxCountry | null;
  const isDetectedUS = detectedCountry === 'US';

  // Determine if we should ask the user for their country
  const shouldAskCountry = useMemo(() => {
    if (forceAsk) return true;
    
    // If never responded, ask
    if (!savedCountry) return true;
    
    // If user saved Brazil but is detected in US, ask again
    if (savedCountry === 'BR' && isDetectedUS) return true;
    
    return false;
  }, [savedCountry, isDetectedUS, forceAsk]);

  // Save country mutation
  const saveMutation = useMutation({
    mutationFn: async (country: TaxCountry) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const currentYear = new Date().getFullYear();
      
      // Upsert the tax config with the selected country
      const { error } = await supabase
        .from('tax_report_config')
        .upsert({
          user_id: user.id,
          tax_year: currentYear - 1,
          tax_country: country,
          status: 'incomplete',
          progress_percentage: 0
        }, {
          onConflict: 'user_id,tax_year'
        });

      if (error) throw error;
    },
    onSuccess: () => {
      setForceAsk(false);
      queryClient.invalidateQueries({ queryKey: ['tax-country-config'] });
    }
  });

  const saveCountry = async (country: TaxCountry) => {
    await saveMutation.mutateAsync(country);
  };

  const resetCountry = () => {
    setForceAsk(true);
  };

  return {
    taxCountry: savedCountry,
    isLoading: isLoadingConfig || isDetecting,
    shouldAskCountry,
    detectedCountry,
    isDetectedUS,
    saveCountry,
    resetCountry
  };
}
