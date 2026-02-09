import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { useRealtimeTable } from '@/hooks/useRealtimeManager';

export interface ManualFutureIncome {
  id: string;
  user_id: string;
  description: string;
  amount: number;
  due_date: string;
  category_id?: string;
  subcategory_id?: string;
  account_id?: string;
  payment_method: string;
  notes?: string;
  is_received: boolean;
  received_at?: string;
  transaction_id?: string;
  owner_user: string;
  is_overdue: boolean;
  days_overdue: number;
  received_late: boolean;
  created_at: string;
  updated_at: string;
  category?: {
    name: string;
    color: string;
    icon?: string;
  };
  subcategory?: {
    name: string;
    name_en: string | null;
    name_es: string | null;
  };
  account?: {
    name: string;
  };
}

export const useManualFutureIncomes = (viewMode: 'individual' | 'couple') => {
  const [futureIncomes, setFutureIncomes] = useState<ManualFutureIncome[]>([]);
  const [overdueIncomes, setOverdueIncomes] = useState<ManualFutureIncome[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();
  const { t } = useLanguage();

  const fetchFutureIncomes = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Check if user is part of a couple
      const { data: coupleData } = await supabase
        .from('user_couples')
        .select('user1_id, user2_id')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .eq('status', 'active')
        .maybeSingle();

      let userIds = [user.id];
      if (viewMode === 'couple' && coupleData) {
        userIds = [coupleData.user1_id, coupleData.user2_id];
      }

      // Fetch incomes
      const { data: incomesData, error: incomesError } = await supabase
        .from('manual_future_incomes')
        .select('*')
        .in('user_id', userIds)
        .eq('is_received', false)
        .order('due_date', { ascending: true });

      if (incomesError) throw incomesError;

      // Fetch categories
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('id, name, color, icon')
        .in('user_id', userIds)
        .eq('category_type', 'income');

      // Fetch subcategories
      const { data: subcategoriesData } = await supabase
        .from('subcategories')
        .select('id, name, name_en, name_es')
        .in('user_id', userIds)
        .is('deleted_at', null);

      // Fetch accounts
      const { data: accountsData } = await supabase
        .from('accounts')
        .select('id, name')
        .in('user_id', userIds);

      // Create maps for quick lookup
      const categoryMap = new Map(
        (categoriesData || []).map(cat => [cat.id, cat])
      );
      const subcategoryMap = new Map(
        (subcategoriesData || []).map(sub => [sub.id, sub])
      );
      const accountMap = new Map(
        (accountsData || []).map(acc => [acc.id, acc])
      );

      // Combine data
      const incomes = (incomesData || []).map(income => ({
        ...income,
        category: income.category_id ? categoryMap.get(income.category_id) : undefined,
        subcategory: income.subcategory_id ? subcategoryMap.get(income.subcategory_id) : undefined,
        account: income.account_id ? accountMap.get(income.account_id) : undefined,
      }));

      // Separate overdue from future
      const today = new Date().toISOString().split('T')[0];
      const overdue = incomes.filter(income => income.due_date < today && income.is_overdue);
      const future = incomes.filter(income => income.due_date >= today || !income.is_overdue);

      setFutureIncomes(future);
      setOverdueIncomes(overdue);
    } catch (error: any) {
      console.error('Error fetching future incomes:', error);
      toast({
        title: t('errors.fetchError'),
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const addFutureIncome = async (income: Omit<ManualFutureIncome, 'id' | 'created_at' | 'updated_at' | 'is_received' | 'received_at' | 'transaction_id' | 'is_overdue' | 'days_overdue' | 'received_late'>) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('manual_future_incomes')
        .insert([{
          ...income,
          user_id: user.id,
        }]);

      if (error) throw error;

      toast({
        title: t('futureIncomes.addSuccess'),
        description: t('futureIncomes.addSuccessDescription'),
      });

      await fetchFutureIncomes();
    } catch (error: any) {
      console.error('Error adding future income:', error);
      toast({
        title: t('errors.addError'),
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const receiveFutureIncome = async (
    incomeId: string,
    receiptDate: string,
    accountId?: string,
    paymentMethod?: string
  ): Promise<void> => {
    if (!user) return;

    try {
      const { error } = await supabase.rpc('process_future_income_receipt', {
        p_user_id: user.id,
        p_income_id: incomeId,
        p_receipt_date: receiptDate,
        p_account_id: accountId,
        p_payment_method: paymentMethod,
      });

      if (error) throw error;

      toast({
        title: t('futureIncomes.receiveSuccess'),
        description: t('futureIncomes.receiveSuccessDescription'),
      });

      await fetchFutureIncomes();
    } catch (error: any) {
      console.error('Error receiving future income:', error);
      toast({
        title: t('errors.receiveError'),
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const deleteFutureIncome = async (incomeId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('manual_future_incomes')
        .delete()
        .eq('id', incomeId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: t('futureIncomes.deleteSuccess'),
        description: t('futureIncomes.deleteSuccessDescription'),
      });

      await fetchFutureIncomes();
    } catch (error: any) {
      console.error('Error deleting future income:', error);
      toast({
        title: t('errors.deleteError'),
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const getDueStatus = (dueDate: string) => {
    const today = new Date().toISOString().split('T')[0];
    const due = new Date(dueDate).toISOString().split('T')[0];
    
    if (due < today) return 'overdue';
    if (due === today) return 'today';
    return 'future';
  };

  useEffect(() => {
    fetchFutureIncomes();
  }, [user, viewMode]);

  // Use centralized realtime manager
  useRealtimeTable('manual_future_incomes', () => {
    fetchFutureIncomes();
  }, !!user);

  return {
    futureIncomes,
    overdueIncomes,
    loading,
    addFutureIncome,
    receiveFutureIncome,
    deleteFutureIncome,
    getDueStatus,
    refreshIncomes: fetchFutureIncomes,
  };
};
