import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

export const useInvalidateFinancialData = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const invalidateTransactions = async (showToast = false) => {
    await queryClient.invalidateQueries({ 
      queryKey: ['transactions'],
      refetchType: 'active'
    });
    
    if (showToast) {
      toast({
        title: "✓ Transações atualizadas",
        duration: 2000,
      });
    }
  };

  const invalidateAccounts = async (showToast = false) => {
    await queryClient.invalidateQueries({ 
      queryKey: ['accounts'],
      refetchType: 'active'
    });
    
    if (showToast) {
      toast({
        title: "✓ Contas atualizadas",
        duration: 2000,
      });
    }
  };

  const invalidateCards = async (showToast = false) => {
    await queryClient.invalidateQueries({ 
      queryKey: ['cards'],
      refetchType: 'active'
    });
    
    if (showToast) {
      toast({
        title: "✓ Cartões atualizados",
        duration: 2000,
      });
    }
  };

  const invalidateFutureIncomes = async (showToast = false) => {
    await queryClient.invalidateQueries({ 
      queryKey: ['future-incomes'],
      refetchType: 'active'
    });
    
    if (showToast) {
      toast({
        title: "✓ Receitas futuras atualizadas",
        duration: 2000,
      });
    }
  };

  const invalidateFutureExpenses = async (showToast = false) => {
    await queryClient.invalidateQueries({ 
      queryKey: ['future-expenses'],
      refetchType: 'active'
    });
    
    if (showToast) {
      toast({
        title: "✓ Despesas futuras atualizadas",
        duration: 2000,
      });
    }
  };

  const invalidateFinancialSummary = async () => {
    await queryClient.invalidateQueries({ 
      queryKey: ['financial-summary'],
      refetchType: 'active'
    });
  };

  const invalidateAll = async (showToast = false) => {
    // Invalidate all financial data queries in parallel
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['transactions'], refetchType: 'active' }),
      queryClient.invalidateQueries({ queryKey: ['accounts'], refetchType: 'active' }),
      queryClient.invalidateQueries({ queryKey: ['cards'], refetchType: 'active' }),
      queryClient.invalidateQueries({ queryKey: ['future-incomes'], refetchType: 'active' }),
      queryClient.invalidateQueries({ queryKey: ['future-expenses'], refetchType: 'active' }),
      queryClient.invalidateQueries({ queryKey: ['financial-summary'], refetchType: 'active' }),
      queryClient.invalidateQueries({ queryKey: ['investments'], refetchType: 'active' }),
    ]);

    if (showToast) {
      toast({
        title: "✓ Dashboard atualizado",
        duration: 2000,
      });
    }
  };

  return {
    invalidateTransactions,
    invalidateAccounts,
    invalidateCards,
    invalidateFutureIncomes,
    invalidateFutureExpenses,
    invalidateFinancialSummary,
    invalidateAll,
  };
};
