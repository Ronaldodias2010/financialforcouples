import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';

interface SmartCardPaymentParams {
  cardId: string;
  paymentAmount: number;
  sourceAccountId: string;
  paymentDate?: string;
  notes?: string;
}

interface CardInfo {
  id: string;
  name: string;
  current_balance: number;
  initial_balance: number | null;
  minimum_payment_amount: number | null;
  due_date: number | null;
}

interface FutureExpenseInfo {
  id: string;
  amount: number;
  due_date: string;
  description: string;
}

export const useSmartCardPayments = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const getCardsWithPendingBalance = async (): Promise<CardInfo[]> => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('cards')
        .select('id, name, current_balance, initial_balance, minimum_payment_amount, due_date')
        .eq('user_id', user.id)
        .eq('card_type', 'credit')
        .gt('current_balance', 0) // Apenas cartões com saldo devedor
        .order('current_balance', { ascending: false });

      if (error) {
        console.error('Error fetching cards with pending balance:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching cards with pending balance:', error);
      return [];
    }
  };

  const findFutureExpenseForCard = async (cardId: string): Promise<FutureExpenseInfo | null> => {
    if (!user) return null;

    try {
      // Verificar em manual_future_expenses se existe gasto futuro para este cartão
      const { data: manualExpenses, error: manualError } = await supabase
        .from('manual_future_expenses')
        .select('id, amount, due_date, description')
        .eq('user_id', user.id)
        .eq('is_paid', false)
        .ilike('description', `%${cardId}%`); // Procura por gastos que mencionam o ID do cartão

      if (manualError) {
        console.error('Error searching manual future expenses:', manualError);
      }

      // Se encontrou, retorna o primeiro
      if (manualExpenses && manualExpenses.length > 0) {
        return manualExpenses[0];
      }

      // Verificar em future_expense_payments se existe pagamento futuro relacionado ao cartão
      const { data: futurePayments, error: futureError } = await supabase
        .from('future_expense_payments')
        .select('id, amount, original_due_date, description')
        .eq('user_id', user.id)
        .eq('expense_source_type', 'card_payment')
        .contains('card_payment_info', { cardId });

      if (futureError) {
        console.error('Error searching future payments:', futureError);
      }

      if (futurePayments && futurePayments.length > 0) {
        const payment = futurePayments[0];
        return {
          id: payment.id,
          amount: payment.amount,
          due_date: payment.original_due_date,
          description: payment.description
        };
      }

      return null;
    } catch (error) {
      console.error('Error finding future expense for card:', error);
      return null;
    }
  };

  const processSmartCardPayment = async (params: SmartCardPaymentParams) => {
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
      // 1. Buscar informações do cartão
      const { data: cardData, error: cardError } = await supabase
        .from('cards')
        .select('name, current_balance, minimum_payment_amount, due_date')
        .eq('id', params.cardId)
        .eq('user_id', user.id)
        .single();

      if (cardError || !cardData) {
        throw new Error('Cartão não encontrado');
      }

      // 2. Processar o pagamento usando a função existente
      const { data: paymentResult, error: paymentError } = await supabase.rpc('process_card_payment', {
        p_user_id: user.id,
        p_card_id: params.cardId,
        p_payment_amount: params.paymentAmount,
        p_payment_date: params.paymentDate || new Date().toISOString().split('T')[0],
        p_payment_method: 'account',
        p_account_id: params.sourceAccountId,
        p_notes: params.notes || null,
      });

      if (paymentError) {
        throw new Error(paymentError.message);
      }

      // 3. Verificar se existe gasto futuro relacionado e abater o valor
      const futureExpense = await findFutureExpenseForCard(params.cardId);
      if (futureExpense) {
        const newAmount = Math.max(0, futureExpense.amount - params.paymentAmount);
        
        if (newAmount === 0) {
          // Marcar como pago se o valor foi totalmente abatido
          await supabase
            .from('manual_future_expenses')
            .update({ 
              is_paid: true, 
              paid_at: new Date().toISOString(),
              amount: 0 
            })
            .eq('id', futureExpense.id);
        } else {
          // Reduzir o valor do gasto futuro
          await supabase
            .from('manual_future_expenses')
            .update({ amount: newAmount })
            .eq('id', futureExpense.id);
        }
      }

      // 4. Determinar status do cartão
      const remainingBalance = cardData.current_balance - params.paymentAmount;
      const minimumPayment = cardData.minimum_payment_amount || 0;
      let cardStatus = "Em Dia";
      
      if (remainingBalance > 0) {
        if (params.paymentAmount >= minimumPayment) {
          cardStatus = "Mínimo Pago";
        } else {
          cardStatus = "Em Dívida";
        }
      }

      // 5. Exibir resultado
      const successMessage = paymentResult && typeof paymentResult === 'object' && 'message' in paymentResult 
        ? (paymentResult as any).message 
        : "Pagamento realizado com sucesso";

      toast({
        title: "Pagamento Processado",
        description: `${successMessage}. Status do cartão: ${cardStatus}`,
        variant: "default",
      });

      return {
        success: true,
        cardStatus,
        remainingBalance,
        futureExpenseUpdated: !!futureExpense,
        paymentResult
      };

    } catch (error) {
      console.error('Error processing smart card payment:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro inesperado ao processar pagamento",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsProcessing(false);
    }
  };

  const getCardPaymentStatus = async (cardId: string) => {
    if (!user) return null;

    try {
      const { data: cardData, error } = await supabase
        .from('cards')
        .select('current_balance, minimum_payment_amount, due_date')
        .eq('id', cardId)
        .eq('user_id', user.id)
        .single();

      if (error || !cardData) return null;

      const currentBalance = cardData.current_balance || 0;
      const minimumPayment = cardData.minimum_payment_amount || 0;

      if (currentBalance === 0) {
        return { status: "Em Dia", color: "text-emerald-600" };
      }

      // Verificar se há pagamentos já feitos este mês
      const today = new Date();
      const currentMonth = today.getMonth() + 1;
      const currentYear = today.getFullYear();

      const { data: payments } = await supabase
        .from('card_payment_history')
        .select('payment_amount')
        .eq('card_id', cardId)
        .eq('user_id', user.id)
        .gte('payment_date', `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`);

      const totalPaid = payments?.reduce((sum, p) => sum + p.payment_amount, 0) || 0;

      if (totalPaid >= minimumPayment) {
        return { status: "Mínimo Pago", color: "text-amber-600" };
      } else if (currentBalance > 0) {
        return { status: "Em Dívida", color: "text-red-600" };
      }

      return { status: "Em Dia", color: "text-emerald-600" };
    } catch (error) {
      console.error('Error getting card payment status:', error);
      return null;
    }
  };

  return {
    processSmartCardPayment,
    getCardsWithPendingBalance,
    getCardPaymentStatus,
    findFutureExpenseForCard,
    isProcessing,
  };
};