import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/useLanguage';

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
  const { t } = useLanguage();

  const processPayment = async (params: ProcessPaymentParams) => {
    if (!user) {
      toast({
        title: t('common.error'),
        description: t('common.userNotAuthenticated'),
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
            title: t('futureExpenses.paymentError'),
            description: error.message,
            variant: "destructive",
          });
          return null;
        }

        toast({
          title: t('futureExpenses.paymentProcessed'),
          description: t('futureExpenses.installmentPaid'),
          variant: "default",
        });

        return data;
      }

      // For recurring expenses, find the pending transaction and mark it as completed
      // First, try to find existing pending transaction
      const { data: existingTransaction, error: findError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .eq('type', 'expense')
        .eq('due_date', params.originalDueDate)
        .eq('description', params.description)
        .maybeSingle();

      if (findError) {
        console.error('Error finding transaction:', findError);
      }

      let data;
      if (existingTransaction) {
        // Update existing transaction
        const { data: updated, error: updateError } = await supabase
          .from('transactions')
          .update({
            status: 'completed',
            transaction_date: params.paymentDate || new Date().toISOString().split('T')[0],
            payment_method: params.paymentMethod || 'cash',
            account_id: params.accountId || null,
            card_id: params.cardId || null,
          })
          .eq('id', existingTransaction.id)
          .select()
          .single();

        if (updateError) throw updateError;
        data = updated;
      } else {
        // Create new transaction if none exists
        const { data: created, error: createError } = await supabase
          .from('transactions')
          .insert({
            user_id: user.id,
            type: 'expense',
            amount: params.amount,
            description: params.description,
            transaction_date: params.paymentDate || new Date().toISOString().split('T')[0],
            due_date: params.originalDueDate,
            status: 'completed',
            category_id: params.categoryId || null,
            payment_method: params.paymentMethod || 'cash',
            account_id: params.accountId || null,
            card_id: params.cardId || null,
          })
          .select()
          .single();

        if (createError) throw createError;
        data = created;
      }

      const error = null;

      if (error) {
        console.error('Error processing payment:', error);
        toast({
          title: t('futureExpenses.paymentError'),
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
        title: t('futureExpenses.paymentProcessed'),
        description: t('futureExpenses.expensePaid'),
        variant: "default",
      });

      return data;
    } catch (error) {
      console.error('Error processing payment:', error);
      toast({
        title: t('common.error'),
        description: t('futureExpenses.paymentError'),
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

      return installments || [];
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

      // Only check transactions table for recurring expenses
      if (recurringExpenseId) {
        // Recurring expenses are no longer tracked in future_expense_payments
        return false;
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
        title: t('common.error'),
        description: t('common.userNotAuthenticated'),
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
          title: t('futureExpenses.paymentError'),
          description: error.message,
          variant: "destructive",
        });
        return null;
      }

      toast({
        title: t('futureExpenses.installmentProcessed'),
        description: t('futureExpenses.installmentMoved'),
        variant: "default",
      });

      return data;
    } catch (error) {
      console.error('Error processing installment:', error);
      toast({
        title: t('common.error'),
        description: t('futureExpenses.paymentError'),
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