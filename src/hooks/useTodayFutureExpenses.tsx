import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useCouple } from './useCouple';
import { useRealtimeTable } from '@/hooks/useRealtimeManager';

export interface TodayFutureExpense {
  id: string;
  description: string;
  amount: number;
  due_date: string;
  category_id?: string;
  category_name?: string;
  owner_user: string;
  user_id: string;
  source_type: 'manual' | 'recurring';
  source_id: string;
}

export const useTodayFutureExpenses = () => {
  const { user } = useAuth();
  const { isPartOfCouple, couple } = useCouple();
  const [todayExpenses, setTodayExpenses] = useState<TodayFutureExpense[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTodayExpenses = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];
      console.log('🔄 [TodayExpenses] Fetching today expenses for date:', today);

      let userIds = [user.id];
      if (isPartOfCouple && couple) {
        userIds = [couple.user1_id, couple.user2_id];
      }

      const expenses: TodayFutureExpense[] = [];

      // Fetch manual future expenses due today (only UNPAID ones)
      const { data: manualData, error: manualError } = await supabase
        .from('manual_future_expenses')
        .select(`
          *,
          category:categories(id, name)
        `)
        .in('user_id', userIds)
        .eq('is_paid', false) // ⭐ Somente não pagas
        .eq('due_date', today)
        .is('deleted_at', null);

      if (manualError) {
        console.error('❌ [TodayExpenses] Error fetching manual expenses:', manualError);
      } else {
        manualData?.forEach((item: any) => {
          expenses.push({
            id: item.id,
            description: item.description || 'Sem descrição',
            amount: item.amount || 0,
            due_date: item.due_date,
            category_id: item.category_id,
            category_name: item.category?.name || '',
            owner_user: item.owner_user || 'user1',
            user_id: item.user_id,
            source_type: 'manual',
            source_id: item.id,
          });
        });
      }

      // Fetch recurring expenses due today
      const { data: recurringData, error: recurringError } = await supabase
        .from('recurring_expenses')
        .select('*')
        .in('user_id', userIds)
        .eq('next_due_date', today)
        .eq('is_active', true)
        .eq('is_completed', false);

      if (recurringError) {
        console.error('❌ [TodayExpenses] Error fetching recurring expenses:', recurringError);
      } else {
        // Get category names for recurring expenses
        const categoryIds = recurringData?.map((r: any) => r.category_id).filter(Boolean) || [];
        let categoriesMap = new Map<string, string>();
        
        if (categoryIds.length > 0) {
          const { data: categoriesData } = await supabase
            .from('categories')
            .select('id, name')
            .in('id', categoryIds);
          
          categoriesData?.forEach((cat: any) => {
            categoriesMap.set(cat.id, cat.name);
          });
        }

        recurringData?.forEach((item: any) => {
          expenses.push({
            id: `recurring_${item.id}`,
            description: item.name || 'Sem descrição',
            amount: item.amount || 0,
            due_date: item.next_due_date,
            category_id: item.category_id,
            category_name: item.category_id ? categoriesMap.get(item.category_id) || '' : '',
            owner_user: item.owner_user || 'user1',
            user_id: item.user_id,
            source_type: 'recurring',
            source_id: item.id,
          });
        });
      }

      // Sort by amount (highest first)
      expenses.sort((a, b) => b.amount - a.amount);

      console.log('✅ [TodayExpenses] Found', expenses.length, 'unpaid expenses for today');
      setTodayExpenses(expenses);
    } catch (error) {
      console.error('❌ [TodayExpenses] Error fetching today expenses:', error);
      setTodayExpenses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodayExpenses();

    // Real-time subscription for manual future expenses
    const manualChannel = supabase
      .channel('today-future-expenses-manual')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'manual_future_expenses',
        },
        (payload) => {
          console.log('🔔 [TodayExpenses] Realtime update (manual):', payload.eventType);
          fetchTodayExpenses();
        }
      )
      .subscribe();

    // Real-time subscription for recurring expenses
    const recurringChannel = supabase
      .channel('today-future-expenses-recurring')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'recurring_expenses',
        },
        (payload) => {
          console.log('🔔 [TodayExpenses] Realtime update (recurring):', payload.eventType);
          fetchTodayExpenses();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(manualChannel);
      supabase.removeChannel(recurringChannel);
    };
  }, [user, isPartOfCouple, couple]);

  return {
    todayExpenses,
    loading,
    count: todayExpenses.length,
    totalAmount: todayExpenses.reduce((sum, expense) => sum + expense.amount, 0),
    refresh: fetchTodayExpenses,
  };
};
