import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { PendingItem } from '@/hooks/useIncomeTaxReport';

export interface Category {
  id: string;
  name: string;
  category_type: string;
  color: string | null;
  icon: string | null;
}

export function usePendingResolver(taxYear: number) {
  const { t } = useLanguage();
  const queryClient = useQueryClient();

  // Fetch categories for the selector
  const { data: categories = [], isLoading: isLoadingCategories } = useQuery({
    queryKey: ['categories-for-resolver'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('categories')
        .select('id, name, category_type, color, icon')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .order('name');

      if (error) throw error;
      return data as Category[];
    }
  });

  // Mutation to assign category to a transaction
  const assignCategoryMutation = useMutation({
    mutationFn: async ({ transactionId, categoryId }: { transactionId: string; categoryId: string }) => {
      const { error } = await supabase
        .from('transactions')
        .update({ category_id: categoryId })
        .eq('id', transactionId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t('tax.resolver.categoryAssigned'));
      invalidateQueries();
    },
    onError: (error) => {
      console.error('Error assigning category:', error);
      toast.error(t('tax.resolver.error'));
    }
  });

  // Mutation to classify high income (assign category that determines taxable/exempt)
  const classifyIncomeMutation = useMutation({
    mutationFn: async ({ 
      transactionId, 
      categoryId, 
      classification 
    }: { 
      transactionId: string; 
      categoryId: string;
      classification: 'taxable' | 'exempt';
    }) => {
      const { error } = await supabase
        .from('transactions')
        .update({ category_id: categoryId })
        .eq('id', transactionId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t('tax.resolver.incomeClassified'));
      invalidateQueries();
    },
    onError: (error) => {
      console.error('Error classifying income:', error);
      toast.error(t('tax.resolver.error'));
    }
  });

  const invalidateQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['tax-transactions'] });
    queryClient.invalidateQueries({ queryKey: ['tax-deduction-docs'] });
  };

  // Get income-specific categories (for high_income resolution)
  const incomeCategories = categories.filter(c => c.category_type === 'income');
  const expenseCategories = categories.filter(c => c.category_type === 'expense');
  const allCategories = categories;

  // Resolve a pending item based on its type
  const resolvePending = async (item: PendingItem, resolution: {
    categoryId?: string;
    classification?: 'taxable' | 'exempt';
  }) => {
    if (!item.transactionId) {
      toast.error(t('tax.resolver.noTransaction'));
      return;
    }

    switch (item.type) {
      case 'uncategorized':
        if (resolution.categoryId) {
          await assignCategoryMutation.mutateAsync({
            transactionId: item.transactionId,
            categoryId: resolution.categoryId
          });
        }
        break;

      case 'high_income':
        if (resolution.categoryId && resolution.classification) {
          await classifyIncomeMutation.mutateAsync({
            transactionId: item.transactionId,
            categoryId: resolution.categoryId,
            classification: resolution.classification
          });
        }
        break;

      case 'missing_doc':
        // Document upload is handled by TaxDocumentUpload component
        // Just invalidate queries after upload
        invalidateQueries();
        break;

      default:
        console.warn('Unknown pending item type:', item.type);
    }
  };

  return {
    // Data
    categories: allCategories,
    incomeCategories,
    expenseCategories,
    
    // Loading states
    isLoadingCategories,
    isResolving: assignCategoryMutation.isPending || classifyIncomeMutation.isPending,
    
    // Actions
    resolvePending,
    assignCategory: assignCategoryMutation.mutateAsync,
    classifyIncome: classifyIncomeMutation.mutateAsync,
    invalidateQueries
  };
}
