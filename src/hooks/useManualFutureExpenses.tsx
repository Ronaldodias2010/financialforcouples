import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';

export interface ManualFutureExpense {
  id: string;
  user_id: string;
  description: string;
  amount: number;
  due_date: string;
  category_id?: string;
  payment_method: string;
  notes?: string;
  is_paid: boolean;
  paid_at?: string;
  transaction_id?: string;
  owner_user: string;
  created_at: string;
  updated_at: string;
  category?: {
    id: string;
    name: string;
    color: string;
  };
}

interface PayManualExpenseParams {
  expenseId: string;
  paymentDate?: string;
  accountId?: string;
  cardId?: string;
  paymentMethod?: string;
}

export const useManualFutureExpenses = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchManualFutureExpenses = async (): Promise<ManualFutureExpense[]> => {
    if (!user) return [];

    try {
      // Fetch expenses first
      const { data: expensesData, error: expensesError } = await supabase
        .from('manual_future_expenses')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_paid', false)
        .order('due_date', { ascending: true });

      if (expensesError) {
        console.error('Error fetching manual future expenses:', expensesError);
        return [];
      }

      // Fetch categories separately
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('id, name, color')
        .eq('user_id', user.id);

      if (categoriesError) {
        console.error('Error fetching categories:', categoriesError);
      }

      // Combine data
      const categoryMap = new Map(
        (categoriesData || []).map(cat => [cat.id, cat])
      );

      return (expensesData || []).map(expense => ({
        ...expense,
        category: expense.category_id ? categoryMap.get(expense.category_id) : undefined
      }));
    } catch (error) {
      console.error('Error fetching manual future expenses:', error);
      return [];
    }
  };

  const payManualExpense = async (params: PayManualExpenseParams) => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado",
        variant: "destructive",
      });
      return null;
    }

    setIsLoading(true);
    
    try {
      // First, get the expense details
      const { data: expense, error: expenseError } = await supabase
        .from('manual_future_expenses')
        .select('*')
        .eq('id', params.expenseId)
        .eq('user_id', user.id)
        .single();

      if (expenseError || !expense) {
        console.error('Error fetching expense:', expenseError);
        toast({
          title: "Erro",
          description: "Gasto futuro não encontrado",
          variant: "destructive",
        });
        return null;
      }

      if (expense.is_paid) {
        toast({
          title: "Erro",
          description: "Este gasto já foi pago",
          variant: "destructive",
        });
        return null;
      }

      // Create transaction
      const { data: transaction, error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          type: 'expense',
          amount: expense.amount,
          description: expense.description,
          transaction_date: params.paymentDate || new Date().toISOString().split('T')[0],
          category_id: expense.category_id,
          account_id: params.accountId,
          card_id: params.cardId,
          payment_method: params.paymentMethod || expense.payment_method,
          owner_user: expense.owner_user
        })
        .select()
        .single();

      if (transactionError) {
        console.error('Error creating transaction:', transactionError);
        toast({
          title: "Erro",
          description: "Erro ao criar transação",
          variant: "destructive",
        });
        return null;
      }

      // Mark expense as paid
      const { error: updateError } = await supabase
        .from('manual_future_expenses')
        .update({
          is_paid: true,
          paid_at: new Date().toISOString(),
          transaction_id: transaction.id
        })
        .eq('id', params.expenseId);

      if (updateError) {
        console.error('Error updating expense:', updateError);
        toast({
          title: "Erro",
          description: "Erro ao marcar gasto como pago",
          variant: "destructive",
        });
        return null;
      }

      // Create future expense payment record for consistency
      await supabase
        .from('future_expense_payments')
        .insert({
          user_id: user.id,
          original_due_date: expense.due_date,
          payment_date: params.paymentDate || new Date().toISOString().split('T')[0],
          amount: expense.amount,
          description: expense.description,
          category_id: expense.category_id,
          payment_method: params.paymentMethod || expense.payment_method,
          account_id: params.accountId,
          card_id: params.cardId,
          transaction_id: transaction.id,
          owner_user: expense.owner_user,
          expense_source_type: 'manual_future',
          card_payment_info: {
            manualFutureExpenseId: expense.id,
            expenseDescription: expense.description
          }
        });

      toast({
        title: "Pagamento processado",
        description: "Gasto futuro foi pago e adicionado às despesas mensais",
        variant: "default",
      });

      return transaction;
    } catch (error) {
      console.error('Error paying manual expense:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao processar pagamento",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteManualExpense = async (expenseId: string) => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado",
        variant: "destructive",
      });
      return false;
    }

    try {
      const { error } = await supabase
        .from('manual_future_expenses')
        .delete()
        .eq('id', expenseId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting expense:', error);
        toast({
          title: "Erro",
          description: "Erro ao excluir gasto futuro",
          variant: "destructive",
        });
        return false;
      }

      toast({
        title: "Sucesso",
        description: "Gasto futuro excluído com sucesso",
        variant: "default",
      });

      return true;
    } catch (error) {
      console.error('Error deleting expense:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao excluir gasto futuro",
        variant: "destructive",
      });
      return false;
    }
  };

  // Função para calcular o status de vencimento de um gasto
  const getDueStatus = (dueDate: string): 'future' | 'today' | 'overdue' => {
    const today = new Date();
    const due = new Date(dueDate);
    const todayStr = today.toISOString().split('T')[0];
    const dueDateStr = due.toISOString().split('T')[0];
    
    if (dueDateStr < todayStr) {
      return 'overdue';
    } else if (dueDateStr === todayStr) {
      return 'today';
    } else {
      return 'future';
    }
  };

  // Função para obter gastos vencidos
  const getOverdueExpenses = async (): Promise<ManualFutureExpense[]> => {
    const allExpenses = await fetchManualFutureExpenses();
    return allExpenses.filter(expense => getDueStatus(expense.due_date) === 'overdue');
  };

  return {
    fetchManualFutureExpenses,
    payManualExpense,
    deleteManualExpense,
    getDueStatus,
    getOverdueExpenses,
    isLoading,
  };
};