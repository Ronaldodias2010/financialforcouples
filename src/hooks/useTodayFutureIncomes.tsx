import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useCouple } from './useCouple';

export interface TodayFutureIncome {
  id: string;
  description: string;
  amount: number;
  due_date: string;
  category_id?: string;
  account_id?: string;
  payment_method: string;
  owner_user: string;
  user_id: string;
}

export const useTodayFutureIncomes = () => {
  const { user } = useAuth();
  const { isPartOfCouple, couple } = useCouple();
  const [todayIncomes, setTodayIncomes] = useState<TodayFutureIncome[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTodayIncomes = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];
      console.log('🔄 [TodayIncomes] Fetching today incomes for date:', today);

      let query = supabase
        .from('manual_future_incomes')
        .select('*')
        .eq('is_received', false)
        .eq('due_date', today)
        .order('amount', { ascending: false });

      // If part of couple, include partner's incomes
      if (isPartOfCouple && couple) {
        const partnerId = couple.user1_id === user.id ? couple.user2_id : couple.user1_id;
        query = query.in('user_id', [user.id, partnerId]);
      } else {
        query = query.eq('user_id', user.id);
      }

      const { data, error } = await query;

      if (error) throw error;

      console.log('✅ [TodayIncomes] Found', data?.length || 0, 'unreceived incomes for today');
      setTodayIncomes(data || []);
    } catch (error) {
      console.error('❌ [TodayIncomes] Error fetching today incomes:', error);
      setTodayIncomes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodayIncomes();

    // Real-time subscription
    const channel = supabase
      .channel('today-future-incomes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'manual_future_incomes',
        },
        (payload) => {
          console.log('🔔 [TodayIncomes] Realtime update received:', payload.eventType);
          fetchTodayIncomes();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, isPartOfCouple, couple]);

  return {
    todayIncomes,
    loading,
    count: todayIncomes.length,
    totalAmount: todayIncomes.reduce((sum, income) => sum + income.amount, 0),
    refresh: fetchTodayIncomes,
  };
};
