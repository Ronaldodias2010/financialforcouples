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

  const fetchManualFutureExpenses = async (viewMode: "both" | "user1" | "user2" = "both"): Promise<ManualFutureExpense[]> => {
    if (!user) return [];

    try {
      // Check if user is part of a couple to include partner's expenses
      const { data: coupleData } = await supabase
        .from("user_couples")
        .select("user1_id, user2_id")
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .eq("status", "active")
        .maybeSingle();

      let userIds = [user.id];
      if (coupleData) {
        userIds = [coupleData.user1_id, coupleData.user2_id];
      }

      // Fetch expenses for the user and partner if applicable
      const { data: expensesData, error: expensesError } = await supabase
        .from('manual_future_expenses')
        .select('*')
        .in('user_id', userIds)
        .eq('is_paid', false)
        .order('due_date', { ascending: true });

      if (expensesError) {
        console.error('Error fetching manual future expenses:', expensesError);
        return [];
      }

      // Fetch categories for both users
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('id, name, color')
        .in('user_id', userIds);

      if (categoriesError) {
        console.error('Error fetching categories:', categoriesError);
      }

      // Combine data
      const categoryMap = new Map(
        (categoriesData || []).map(cat => [cat.id, cat])
      );

      let expenses = (expensesData || []).map(expense => ({
        ...expense,
        category: expense.category_id ? categoryMap.get(expense.category_id) : undefined
      }));

      // Apply viewMode filter
      if (viewMode !== "both" && coupleData) {
        expenses = expenses.filter(expense => {
          // Determine owner_user based on couple relationship
          const ownerUser = expense.user_id === coupleData.user1_id ? 'user1' : 'user2';
          return ownerUser === viewMode;
        });
      }

      return expenses;
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
          description: "Despesa futura não encontrada",
          variant: "destructive",
        });
        return null;
      }

      if (expense.is_paid) {
        toast({
          title: "Erro",
          description: "Esta despesa já foi paga",
          variant: "destructive",
        });
        return null;
      }

      // Calculate if payment is late
      const today = new Date();
      const dueDate = new Date(expense.due_date);
      const daysOverdue = dueDate < today ? Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;
      const isPaidLate = daysOverdue > 0;

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

      // Mark expense as paid and no longer overdue
      const { error: updateError } = await supabase
        .from('manual_future_expenses')
        .update({
          is_paid: true,
          is_overdue: false,
          paid_at: new Date().toISOString(),
          transaction_id: transaction.id
        })
        .eq('id', params.expenseId);

      if (updateError) {
        console.error('Error updating expense:', updateError);
        toast({
          title: "Erro",
          description: "Erro ao marcar despesa como paga",
          variant: "destructive",
        });
        return null;
      }

      // Create future expense payment record with overdue information
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
          paid_late: isPaidLate,
          days_overdue: daysOverdue,
          original_due_date_tracking: expense.due_date,
          expense_source_type: 'manual_future',
          card_payment_info: {
            manualFutureExpenseId: expense.id,
            expenseDescription: expense.description
          }
        });

      toast({
        title: "Pagamento processado",
        description: isPaidLate 
          ? `Despesa "${expense.description}" foi paga com ${daysOverdue} dia(s) de atraso e adicionada às despesas mensais.`
          : "Despesa futura foi paga e adicionada às despesas mensais",
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