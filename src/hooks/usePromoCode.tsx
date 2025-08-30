import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PromoValidation {
  valid: boolean;
  message?: string;
  discount_value?: number;
  discount_type?: string;
  stripe_price_id?: string;
}

export const usePromoCode = () => {
  const [validating, setValidating] = useState(false);

  const validatePromoCode = async (code: string, country: string = 'BR'): Promise<PromoValidation> => {
    if (!code.trim()) {
      return { valid: false, message: 'Código é obrigatório' };
    }

    setValidating(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('validate-promo-code', {
        body: { code: code.trim().toUpperCase(), country }
      });

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error validating promo code:', error);
      return { 
        valid: false, 
        message: 'Erro ao validar código. Tente novamente.' 
      };
    } finally {
      setValidating(false);
    }
  };

  return {
    validatePromoCode,
    validating
  };
};