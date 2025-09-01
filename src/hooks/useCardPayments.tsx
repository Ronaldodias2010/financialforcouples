import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';

interface ProcessCardPaymentParams {
  cardId: string;
  paymentAmount: number;
  paymentDate?: string;
  paymentMethod?: string;
  accountId?: string;
  notes?: string;
}

export const useCardPayments = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const processCardPayment = async (params: ProcessCardPaymentParams) => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado",
        variant: "destructive",
      });
      return null;
    }

    setIsProcessing(true);
    
    try {
      const { data, error } = await supabase.rpc('process_card_payment', {
        p_user_id: user.id,
        p_card_id: params.cardId,
        p_payment_amount: params.paymentAmount,
        p_payment_date: params.paymentDate || new Date().toISOString().split('T')[0],
        p_payment_method: params.paymentMethod || 'cash',
        p_account_id: params.accountId || null,
        p_notes: params.notes || null,
      });

      if (error) {
        console.error('Error processing card payment:', error);
        toast({
          title: "Erro ao processar pagamento",
          description: error.message,
          variant: "destructive",
        });
        return null;
      }

      toast({
        title: "Pagamento processado",
        description: "Pagamento do cartão realizado com sucesso",
        variant: "default",
      });

      return data;
    } catch (error) {
      console.error('Error processing card payment:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao processar pagamento",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsProcessing(false);
    }
  };

  const getCardPaymentHistory = async (cardId?: string) => {
    if (!user) return [];

    try {
      let query = supabase
        .from('card_payment_history')
        .select('*')
        .eq('user_id', user.id)
        .order('payment_date', { ascending: false });

      if (cardId) {
        query = query.eq('card_id', cardId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching payment history:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching payment history:', error);
      return [];
    }
  };

  return {
    processCardPayment,
    getCardPaymentHistory,
    isProcessing,
  };
};