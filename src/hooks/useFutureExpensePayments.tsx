import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';

interface ProcessPaymentParams {
  recurringExpenseId?: string;
  installmentTransactionId?: string;
  cardPaymentInfo?: any;
  originalDueDate: string;
  paymentDate?: string;
  amount: number;
  description: string;
  categoryId?: string;
  paymentMethod?: string;
  accountId?: string;
  cardId?: string;
}

export const useFutureExpensePayments = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const processPayment = async (params: ProcessPaymentParams) => {
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
      // Calculate days overdue if due date is in the past
      const today = new Date();
      const dueDate = new Date(params.originalDueDate);
      const daysOverdue = dueDate < today ? Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;
      const isPaidLate = daysOverdue > 0;

      const { data, error } = await supabase.rpc('process_future_expense_payment', {
        p_user_id: user.id,
        p_original_due_date: params.originalDueDate,
        p_amount: params.amount,
        p_description: params.description,
        p_recurring_expense_id: params.recurringExpenseId || null,
        p_installment_transaction_id: params.installmentTransactionId || null,
        p_card_payment_info: params.cardPaymentInfo || null,
        p_payment_date: params.paymentDate || new Date().toISOString().split('T')[0],
        p_category_id: params.categoryId || null,
        p_payment_method: params.paymentMethod || 'cash',
        p_account_id: params.accountId || null,
        p_card_id: params.cardId || null,
      });

      if (error) {
        console.error('Error processing payment:', error);
        toast({
          title: "Erro ao processar pagamento",
          description: error.message,
          variant: "destructive",
        });
        return null;
      }

      // Update payment record with overdue information if applicable
      if (isPaidLate && data) {
        await supabase
          .from('future_expense_payments')
          .update({
            paid_late: true,
            days_overdue: daysOverdue,
            original_due_date_tracking: params.originalDueDate
          })
          .eq('id', data);
      }

      // Mark recurring expense as no longer overdue if it was
      if (params.recurringExpenseId) {
        await supabase
          .from('recurring_expenses')
          .update({ is_overdue: false })
          .eq('id', params.recurringExpenseId);
      }

      toast({
        title: "Pagamento processado",
        description: isPaidLate 
          ? `Despesa paga com ${daysOverdue} dia(s) de atraso`
          : "Despesa futura foi quitada e adicionada às despesas mensais",
        variant: "default",
      });

      return data;
    } catch (error) {
      console.error('Error processing payment:', error);
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

  const getFutureExpensePayments = async () => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('future_expense_payments')
        .select('*')
        .eq('user_id', user.id)
        .order('payment_date', { ascending: false });

      if (error) {
        console.error('Error fetching payments:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching payments:', error);
      return [];
    }
  };

  const isExpensePaid = async (recurringExpenseId?: string, installmentTransactionId?: string, originalDueDate?: string) => {
    if (!user || (!recurringExpenseId && !installmentTransactionId)) return false;

    try {
      let query = supabase
        .from('future_expense_payments')
        .select('id')
        .eq('user_id', user.id);

      if (recurringExpenseId) {
        query = query.eq('recurring_expense_id', recurringExpenseId);
      }
      
      if (installmentTransactionId) {
        query = query.eq('installment_transaction_id', installmentTransactionId);
      }

      if (originalDueDate) {
        query = query.eq('original_due_date', originalDueDate);
      }

      const { data, error } = await query.limit(1);

      if (error) {
        console.error('Error checking payment status:', error);
        return false;
      }

      return (data && data.length > 0);
    } catch (error) {
      console.error('Error checking payment status:', error);
      return false;
    }
  };

  const processInstallmentAutomatically = async (transactionId: string) => {
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
      // Atualizar status da transação de 'pending' para 'completed'
      const { data, error } = await supabase
        .from('transactions')
        .update({
          status: 'completed',
          transaction_date: new Date().toISOString().split('T')[0],
        })
        .eq('id', transactionId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error processing installment:', error);
        toast({
          title: "Erro ao processar parcela",
          description: error.message,
          variant: "destructive",
        });
        return null;
      }

      toast({
        title: "Parcela processada",
        description: "A parcela foi movida para as despesas do mês",
        variant: "default",
      });

      return data;
    } catch (error) {
      console.error('Error processing installment:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao processar parcela",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    processPayment,
    getFutureExpensePayments,
    isExpensePaid,
    processInstallmentAutomatically,
    isProcessing,
  };
};