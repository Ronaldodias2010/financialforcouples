import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { format, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear } from 'date-fns';

export type PeriodType = 'monthly' | 'quarterly' | 'yearly' | 'custom';
export type ViewMode = 'both' | 'user1' | 'user2';

export interface CashFlowEntry {
  id: string;
  movement_date: string;
  description: string;
  movement_type: 'income' | 'expense' | 'initial_balance' | 'adjustment' | 'transfer_in' | 'transfer_out';
  category_name: string;
  category_id: string | null;
  amount: number;
  payment_method: string | null;
  account_name: string;
  account_id: string | null;
  card_name: string | null;
  balance_after: number;
  balance_before: number;
  owner_user: string;
  is_reconciled: boolean;
  transaction_id: string | null;
  currency: string;
}

export interface CashFlowSummary {
  initial_balance: number;
  total_income: number;
  total_expense: number;
  net_result: number;
  final_balance: number;
  transaction_count: number;
  income_count: number;
  expense_count: number;
}

export interface ConsolidatedCategory {
  category_id: string | null;
  category_name: string;
  category_color: string;
  category_icon: string | null;
  total_amount: number;
  transaction_count: number;
  percentage: number;
  avg_amount: number;
  min_amount: number;
  max_amount: number;
}

interface UseCashFlowOptions {
  startDate: Date;
  endDate: Date;
  viewMode: ViewMode;
  accountId?: string | null;
  categoryId?: string | null;
  movementType?: string | null;
}

export function useCashFlowHistory(options: UseCashFlowOptions) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { startDate, endDate, viewMode, accountId, categoryId, movementType } = options;

  const startDateStr = format(startDate, 'yyyy-MM-dd');
  const endDateStr = format(endDate, 'yyyy-MM-dd');

  // Fetch cash flow history entries
  const { data: cashFlowEntries, isLoading: entriesLoading, refetch: refetchEntries } = useQuery({
    queryKey: ['cash-flow-history', user?.id, startDateStr, endDateStr, viewMode, accountId, categoryId, movementType],
    queryFn: async () => {
      if (!user?.id) return [];

      let query = supabase
        .from('cash_flow_history')
        .select(`
          id,
          movement_date,
          description,
          movement_type,
          category_name,
          category_id,
          amount,
          payment_method,
          account_name,
          account_id,
          card_name,
          balance_before,
          balance_after,
          owner_user,
          is_reconciled,
          transaction_id,
          currency
        `)
        .gte('movement_date', startDateStr)
        .lte('movement_date', endDateStr)
        .order('movement_date', { ascending: true })
        .order('created_at', { ascending: true });

      if (accountId) {
        query = query.eq('account_id', accountId);
      }

      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }

      if (movementType) {
        query = query.eq('movement_type', movementType);
      }

      if (viewMode !== 'both') {
        query = query.eq('owner_user', viewMode);
      }

      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching cash flow history:', error);
        throw error;
      }

      return data as CashFlowEntry[];
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Fetch cash flow summary
  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['cash-flow-summary', user?.id, startDateStr, endDateStr, viewMode, accountId],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase.rpc('get_cash_flow_summary', {
        p_user_id: user.id,
        p_start_date: startDateStr,
        p_end_date: endDateStr,
        p_view_mode: viewMode,
        p_account_id: accountId || null
      });

      if (error) {
        console.error('Error fetching cash flow summary:', error);
        throw error;
      }

      return data?.[0] as CashFlowSummary | null;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
  });

  // Fetch consolidated expenses
  const { data: consolidatedExpenses, isLoading: expensesLoading } = useQuery({
    queryKey: ['consolidated-expenses', user?.id, startDateStr, endDateStr, viewMode],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase.rpc('get_consolidated_expenses', {
        p_user_id: user.id,
        p_start_date: startDateStr,
        p_end_date: endDateStr,
        p_view_mode: viewMode
      });

      if (error) {
        console.error('Error fetching consolidated expenses:', error);
        throw error;
      }

      return data as ConsolidatedCategory[];
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
  });

  // Fetch consolidated revenues
  const { data: consolidatedRevenues, isLoading: revenuesLoading } = useQuery({
    queryKey: ['consolidated-revenues', user?.id, startDateStr, endDateStr, viewMode],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase.rpc('get_consolidated_revenues', {
        p_user_id: user.id,
        p_start_date: startDateStr,
        p_end_date: endDateStr,
        p_view_mode: viewMode
      });

      if (error) {
        console.error('Error fetching consolidated revenues:', error);
        throw error;
      }

      return data as ConsolidatedCategory[];
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
  });

  // Populate initial cash flow history from existing transactions
  const populateHistoryMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase.rpc('populate_initial_cash_flow_history', {
        p_user_id: user.id
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (count) => {
      toast.success(`Histórico de fluxo de caixa populado com ${count} transações`);
      queryClient.invalidateQueries({ queryKey: ['cash-flow-history'] });
      queryClient.invalidateQueries({ queryKey: ['cash-flow-summary'] });
      queryClient.invalidateQueries({ queryKey: ['consolidated-expenses'] });
      queryClient.invalidateQueries({ queryKey: ['consolidated-revenues'] });
    },
    onError: (error: any) => {
      console.error('Error populating cash flow history:', error);
      const errorMessage = error?.message || 'Erro desconhecido';
      const errorDetails = error?.details || '';
      const errorHint = error?.hint || '';
      const fullError = [errorMessage, errorDetails, errorHint].filter(Boolean).join(' - ');
      toast.error(`Erro ao popular histórico: ${fullError}`);
    }
  });

  const refreshAll = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['cash-flow-history'] });
    queryClient.invalidateQueries({ queryKey: ['cash-flow-summary'] });
    queryClient.invalidateQueries({ queryKey: ['consolidated-expenses'] });
    queryClient.invalidateQueries({ queryKey: ['consolidated-revenues'] });
  }, [queryClient]);

  return {
    // Data
    cashFlowEntries: cashFlowEntries || [],
    summary,
    consolidatedExpenses: consolidatedExpenses || [],
    consolidatedRevenues: consolidatedRevenues || [],
    
    // Loading states
    isLoading: entriesLoading || summaryLoading || expensesLoading || revenuesLoading,
    entriesLoading,
    summaryLoading,
    expensesLoading,
    revenuesLoading,

    // Actions
    populateHistory: populateHistoryMutation.mutate,
    isPopulating: populateHistoryMutation.isPending,
    refreshAll,
    refetchEntries
  };
}

// Helper function to get date range for period type
export function getDateRangeForPeriod(periodType: PeriodType, customStart?: Date, customEnd?: Date): { start: Date; end: Date } {
  const now = new Date();
  
  switch (periodType) {
    case 'monthly':
      return {
        start: startOfMonth(now),
        end: endOfMonth(now)
      };
    case 'quarterly':
      return {
        start: startOfQuarter(now),
        end: endOfQuarter(now)
      };
    case 'yearly':
      return {
        start: startOfYear(now),
        end: endOfYear(now)
      };
    case 'custom':
      return {
        start: customStart || startOfMonth(now),
        end: customEnd || endOfMonth(now)
      };
    default:
      return {
        start: startOfMonth(now),
        end: endOfMonth(now)
      };
  }
}
