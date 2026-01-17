import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';
import { useInvalidateFinancialData } from './useInvalidateFinancialData';

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
  interestAmount?: number;
  categoryId?: string; // ⭐ Permite atualizar a categoria ao pagar
}

export const useManualFutureExpenses = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const { invalidateTransactions, invalidateFutureExpenses, invalidateFinancialSummary, invalidateOverdueExpenses, invalidateAccounts } = useInvalidateFinancialData();

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

      // Fetch pending transactions (new unified approach)
      // EXCLUIR parcelas de cartão - elas são exibidas separadamente como card_transaction
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('transactions')
        .select(`
          *,
          category:categories(id, name, color)
        `)
        .in('user_id', userIds)
        .eq('status', 'pending')
        .eq('type', 'expense')
        .is('card_id', null) // ⭐ Filtrar apenas despesas manuais (sem cartão)
        .order('due_date', { ascending: true });

      if (transactionsError) {
        console.error('Error fetching pending transactions:', transactionsError);
        return [];
      }

      // Map to ManualFutureExpense interface for backward compatibility
      let expenses = (transactionsData || []).map(transaction => ({
        id: transaction.id,
        user_id: transaction.user_id,
        description: transaction.description,
        amount: transaction.amount,
        due_date: transaction.due_date || transaction.transaction_date,
        category_id: transaction.category_id,
        payment_method: transaction.payment_method,
        notes: '',
        is_paid: false,
        owner_user: transaction.owner_user,
        created_at: transaction.created_at,
        updated_at: transaction.updated_at,
        category: transaction.category ? {
          id: transaction.category.id,
          name: transaction.category.name,
          color: transaction.category.color
        } : undefined
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
      // Check if user is part of a couple to allow paying partner's expenses
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

      // Get the manual future expense (allowing partner's expenses)
      // ⭐ CRITICAL: Limpar prefixo se existir (ex: "manual_future_uuid" -> "uuid")
      let cleanExpenseId = params.expenseId;
      if (cleanExpenseId.startsWith('manual_future_')) {
        cleanExpenseId = cleanExpenseId.replace('manual_future_', '');
      }
      
      console.log('🔍 [payManualExpense] Looking for expense:', cleanExpenseId, 'in userIds:', userIds);
      
      const { data: manualExpense, error: fetchError } = await supabase
        .from('manual_future_expenses')
        .select('*')
        .eq('id', cleanExpenseId)
        .in('user_id', userIds)
        .eq('is_paid', false)
        .single();

      if (fetchError || !manualExpense) {
        console.error('Error fetching manual future expense:', fetchError, 'expenseId:', cleanExpenseId);
        toast({
          title: "Erro",
          description: "Despesa futura não encontrada",
          variant: "destructive",
        });
        return null;
      }
      
      console.log('✅ [payManualExpense] Found expense:', manualExpense.description);

      // Calculate if payment is late
      const today = new Date();
      const dueDate = new Date(manualExpense.due_date);
      const daysOverdue = dueDate < today ? Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;
      const isPaidLate = daysOverdue > 0;

      // Calculate total amount with interest
      const interestAmount = params.interestAmount || 0;
      const totalAmount = manualExpense.amount + interestAmount;
      
      // Build description with interest info if applicable
      let finalDescription = manualExpense.description;
      if (interestAmount > 0) {
        finalDescription = `${manualExpense.description} (+ juros R$ ${interestAmount.toFixed(2)})`;
      }
      
      // Add overdue info to description if late
      if (isPaidLate && interestAmount === 0) {
        finalDescription = `${manualExpense.description} (pago com ${daysOverdue} dia(s) de atraso)`;
      }

      // ⭐ CRITICAL: Para despesas atrasadas ou futuras pagas
      // purchase_date = data do PAGAMENTO (para aparecer no mês correto de despesas atuais)
      // due_date = data original do vencimento (para manter histórico)
      // transaction_date = data do pagamento efetivo
      const paymentDate = params.paymentDate || new Date().toISOString().split('T')[0];
      
      // ⭐ Usar categoria do parâmetro se fornecida, senão usar a original
      const finalCategoryId = params.categoryId || manualExpense.category_id;
      
      const { data: newTransaction, error: createError } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          type: 'expense',
          amount: totalAmount,
          description: finalDescription,
          transaction_date: paymentDate, // Data do pagamento efetivo
          purchase_date: paymentDate, // ⭐ Usar data de pagamento para contabilizar no mês correto
          due_date: manualExpense.due_date, // Manter data original do vencimento para referência
          status: 'completed',
          category_id: finalCategoryId, // ⭐ Usar categoria selecionada ou original
          account_id: params.accountId,
          card_id: params.cardId,
          payment_method: params.paymentMethod || manualExpense.payment_method,
          owner_user: manualExpense.owner_user,
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating transaction:', createError);
        toast({
          title: "Erro",
          description: "Erro ao processar pagamento",
          variant: "destructive",
        });
        return null;
      }

      // ⭐ CRITICAL: Mark manual expense as paid using CLEAN ID
      // Usar o ID do registro que encontramos (manualExpense.id) para garantir consistência
      const expenseIdToUpdate = manualExpense.id;
      console.log('📝 [payManualExpense] Marking expense as paid:', expenseIdToUpdate, 'original cleanExpenseId:', cleanExpenseId);
      
      const { data: updateData, error: updateError } = await supabase
        .from('manual_future_expenses')
        .update({
          is_paid: true,
          is_overdue: false, // ⭐ Também remover flag de overdue
          paid_at: new Date().toISOString(),
          transaction_id: newTransaction.id,
          category_id: finalCategoryId, // ⭐ Atualizar categoria se foi alterada
          updated_at: new Date().toISOString()
        })
        .eq('id', expenseIdToUpdate) // ⭐ Usar ID do registro encontrado!
        .in('user_id', userIds) // ⭐ Incluir userIds para garantir RLS
        .select();

      if (updateError) {
        console.error('❌ [payManualExpense] Error updating manual expense:', updateError);
        // Don't fail the payment if this update fails
      } else if (!updateData || updateData.length === 0) {
        console.error('❌ [payManualExpense] No rows updated! Check RLS policies.');
      } else {
        console.log('✅ [payManualExpense] Successfully marked as paid:', updateData);
      }

      // ⭐ CRITICAL: Invalidate React Query cache to update dashboard immediately
      await Promise.all([
        invalidateTransactions(),
        invalidateFutureExpenses(),
        invalidateFinancialSummary(),
        invalidateOverdueExpenses(), // ⭐ Remover da aba de atrasados
        invalidateAccounts() // ⭐ Atualizar saldo das contas
      ]);

      toast({
        title: "Pagamento processado",
        description: isPaidLate 
          ? `Despesa "${manualExpense.description}" foi paga com ${daysOverdue} dia(s) de atraso.`
          : "Despesa futura foi paga e adicionada às despesas mensais",
        variant: "default",
      });

      return newTransaction;
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
      // Delete from unified transactions table
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', expenseId)
        .eq('user_id', user.id)
        .eq('status', 'pending');

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