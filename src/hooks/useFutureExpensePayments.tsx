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
      // For installment payments, simply update status in transactions table
      if (params.installmentTransactionId) {
        const { data, error } = await supabase
          .from('transactions')
          .update({
            status: 'completed',
            transaction_date: params.paymentDate || new Date().toISOString().split('T')[0],
          })
          .eq('id', params.installmentTransactionId)
          .eq('user_id', user.id)
          .select()
          .single();

        if (error) {
          console.error('Error processing installment payment:', error);
          toast({
            title: "Erro ao processar pagamento",
            description: error.message,
            variant: "destructive",
          });
          return null;
        }

        toast({
          title: "Pagamento processado",
          description: "Parcela foi quitada e adicionada às despesas mensais",
          variant: "default",
        });

        return data;
      }

      // For recurring expenses, use the legacy RPC function
      const { data, error } = await supabase.rpc('process_future_expense_payment', {
        p_user_id: user.id,
        p_original_due_date: params.originalDueDate,
        p_amount: params.amount,
        p_description: params.description,
        p_recurring_expense_id: params.recurringExpenseId || null,
        p_installment_transaction_id: null,
        p_card_payment_info: null,
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

      // Mark recurring expense as no longer overdue if it was
      if (params.recurringExpenseId) {
        await supabase
          .from('recurring_expenses')
          .update({ is_overdue: false })
          .eq('id', params.recurringExpenseId);
      }

      toast({
        title: "Pagamento processado",
        description: "Despesa futura foi quitada e adicionada às despesas mensais",
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
      // Get completed installment payments from transactions
      const { data: installments, error: installmentsError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .eq('is_installment', true)
        .order('transaction_date', { ascending: false });

      if (installmentsError) {
        console.error('Error fetching installment payments:', installmentsError);
      }

      // Get legacy future_expense_payments
      const { data: legacy, error: legacyError } = await supabase
        .from('future_expense_payments')
        .select('*')
        .eq('user_id', user.id)
        .order('payment_date', { ascending: false });

      if (legacyError) {
        console.error('Error fetching legacy payments:', legacyError);
      }

      return [...(installments || []), ...(legacy || [])];
    } catch (error) {
      console.error('Error fetching payments:', error);
      return [];
    }
  };

  const isExpensePaid = async (recurringExpenseId?: string, installmentTransactionId?: string, originalDueDate?: string) => {
    if (!user || (!recurringExpenseId && !installmentTransactionId)) return false;

    try {
      // Check if installment is paid by looking at transactions table
      if (installmentTransactionId) {
        const { data, error } = await supabase
          .from('transactions')
          .select('id, status')
          .eq('id', installmentTransactionId)
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.error('Error checking installment payment status:', error);
          return false;
        }

        return data?.status === 'completed';
      }

      // Check legacy future_expense_payments for recurring expenses
      if (recurringExpenseId) {
        let query = supabase
          .from('future_expense_payments')
          .select('id')
          .eq('user_id', user.id)
          .eq('recurring_expense_id', recurringExpenseId);

        if (originalDueDate) {
          query = query.eq('original_due_date', originalDueDate);
        }

        const { data, error } = await query.limit(1);

        if (error) {
          console.error('Error checking recurring payment status:', error);
          return false;
        }

        return (data && data.length > 0);
      }

      return false;
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