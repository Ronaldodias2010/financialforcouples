import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { ViewMode } from '@/hooks/useCashFlowHistory';

export interface FinancialPosition {
  cashBalance: number;
  bankBalance: number;
  creditLimitUsed: number;
  availableCash: number;
  netPosition: number;
  totalAssets: number;
  totalLiabilities: number;
}

export interface AccountBreakdown {
  accountId: string;
  accountName: string;
  accountType: string;
  isCashAccount: boolean;
  balance: number;
  isAsset: boolean;
  category: 'cash' | 'bank' | 'credit_limit' | 'other';
}

export interface CashFlowSummaryV2 {
  initial_balance: number;
  total_income: number;
  total_expense: number;
  net_result: number;
  final_balance: number;
  transaction_count: number;
  income_count: number;
  expense_count: number;
  cash_available: number;
  total_debt: number;
  net_position: number;
  assets_cash: number;
  assets_bank: number;
  liabilities_credit_limit: number;
}

interface UseFinancialPositionOptions {
  viewMode: ViewMode;
  date?: Date;
}

export function useFinancialPosition(options: UseFinancialPositionOptions) {
  const { user } = useAuth();
  const { viewMode, date } = options;
  const dateStr = date ? date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

  // Fetch financial position
  const { data: position, isLoading: positionLoading, refetch: refetchPosition } = useQuery({
    queryKey: ['financial-position', user?.id, dateStr, viewMode],
    queryFn: async (): Promise<FinancialPosition | null> => {
      if (!user?.id) return null;

      const { data, error } = await supabase.rpc('get_financial_position', {
        p_user_id: user.id,
        p_date: dateStr,
        p_view_mode: viewMode
      });

      if (error) {
        console.error('Error fetching financial position:', error);
        throw error;
      }

      const row = data?.[0];
      if (!row) return null;

      return {
        cashBalance: Number(row.cash_balance) || 0,
        bankBalance: Number(row.bank_balance) || 0,
        creditLimitUsed: Number(row.credit_limit_used) || 0,
        availableCash: Number(row.available_cash) || 0,
        netPosition: Number(row.net_position) || 0,
        totalAssets: Number(row.total_assets) || 0,
        totalLiabilities: Number(row.total_liabilities) || 0
      };
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
  });

  // Fetch accounts breakdown
  const { data: accountsBreakdown, isLoading: breakdownLoading, refetch: refetchBreakdown } = useQuery({
    queryKey: ['accounts-breakdown', user?.id, viewMode],
    queryFn: async (): Promise<AccountBreakdown[]> => {
      if (!user?.id) return [];

      const { data, error } = await supabase.rpc('get_accounts_breakdown', {
        p_user_id: user.id,
        p_view_mode: viewMode
      });

      if (error) {
        console.error('Error fetching accounts breakdown:', error);
        throw error;
      }

      return (data || []).map((row: any) => ({
        accountId: row.account_id,
        accountName: row.account_name,
        accountType: row.account_type,
        isCashAccount: row.is_cash_account,
        balance: Number(row.balance) || 0,
        isAsset: row.is_asset,
        category: row.category as 'cash' | 'bank' | 'credit_limit' | 'other'
      }));
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
  });

  const refresh = () => {
    refetchPosition();
    refetchBreakdown();
  };

  return {
    position: position || {
      cashBalance: 0,
      bankBalance: 0,
      creditLimitUsed: 0,
      availableCash: 0,
      netPosition: 0,
      totalAssets: 0,
      totalLiabilities: 0
    },
    accountsBreakdown: accountsBreakdown || [],
    isLoading: positionLoading || breakdownLoading,
    refresh
  };
}

interface UseCashFlowSummaryV2Options {
  startDate: Date;
  endDate: Date;
  viewMode: ViewMode;
  accountId?: string | null;
}

export function useCashFlowSummaryV2(options: UseCashFlowSummaryV2Options) {
  const { user } = useAuth();
  const { startDate, endDate, viewMode, accountId } = options;
  const startDateStr = startDate.toISOString().split('T')[0];
  const endDateStr = endDate.toISOString().split('T')[0];

  const { data: summary, isLoading, refetch } = useQuery({
    queryKey: ['cash-flow-summary-v2', user?.id, startDateStr, endDateStr, viewMode, accountId],
    queryFn: async (): Promise<CashFlowSummaryV2 | null> => {
      if (!user?.id) return null;

      const { data, error } = await supabase.rpc('get_cash_flow_summary_v2', {
        p_user_id: user.id,
        p_start_date: startDateStr,
        p_end_date: endDateStr,
        p_view_mode: viewMode,
        p_account_id: accountId || null
      });

      if (error) {
        console.error('Error fetching cash flow summary v2:', error);
        throw error;
      }

      const row = data?.[0];
      if (!row) return null;

      return {
        initial_balance: Number(row.initial_balance) || 0,
        total_income: Number(row.total_income) || 0,
        total_expense: Number(row.total_expense) || 0,
        net_result: Number(row.net_result) || 0,
        final_balance: Number(row.final_balance) || 0,
        transaction_count: Number(row.transaction_count) || 0,
        income_count: Number(row.income_count) || 0,
        expense_count: Number(row.expense_count) || 0,
        cash_available: Number(row.cash_available) || 0,
        total_debt: Number(row.total_debt) || 0,
        net_position: Number(row.net_position) || 0,
        assets_cash: Number(row.assets_cash) || 0,
        assets_bank: Number(row.assets_bank) || 0,
        liabilities_credit_limit: Number(row.liabilities_credit_limit) || 0
      };
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
  });

  return {
    summary,
    isLoading,
    refetch
  };
}
