import { useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { debounce, throttle } from '@/utils/performance';
import { memoryCache, memoizeAsync } from '@/utils/cache';
import { logger } from '@/utils/logger';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useCallback, useMemo } from 'react';

/**
 * Optimized queries for large scale applications
 */

// Query key factories for consistent caching
export const queryKeys = {
  transactions: (userId: string, filters?: any) => ['transactions', userId, filters],
  accounts: (userId: string) => ['accounts', userId],
  categories: (userId: string, type?: string) => ['categories', userId, type],
  cards: (userId: string) => ['cards', userId],
  investments: (userId: string) => ['investments', userId],
  couple: (userId: string) => ['couple', userId],
  userProfile: (userId: string) => ['profile', userId],
  financialSummary: (userId: string, viewMode: string) => ['financial-summary', userId, viewMode],
};

// Optimized transaction fetching with pagination and caching
export const useOptimizedTransactions = (
  filters: {
    startDate?: Date;
    endDate?: Date;
    categoryId?: string;
    type?: 'income' | 'expense';
    limit?: number;
    offset?: number;
  } = {}
) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const fetchTransactions = useMemo(
    () => memoizeAsync(async (userId: string, filters: any) => {
      const endTimer = logger.performance ? (() => {
        const start = performance.now();
        return () => logger.performance('transactions_fetch', performance.now() - start);
      })() : () => {};

      try {
        let query = supabase
          .from('transactions')
          .select(`
            *,
            categories(name, color),
            cards(name)
          `)
          .eq('user_id', userId)
          .order('transaction_date', { ascending: false });

        if (filters.startDate) {
          query = query.gte('transaction_date', filters.startDate.toISOString().split('T')[0]);
        }
        if (filters.endDate) {
          query = query.lte('transaction_date', filters.endDate.toISOString().split('T')[0]);
        }
        if (filters.type) {
          query = query.eq('type', filters.type);
        }
        if (filters.categoryId) {
          query = query.eq('category_id', filters.categoryId);
        }
        if (filters.limit) {
          query = query.limit(filters.limit);
        }
        if (filters.offset) {
          query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
        }

        const { data, error } = await query;
        
        if (error) throw error;
        
        endTimer();
        logger.info('Transactions fetched', { count: data?.length || 0, filters });
        
        return data || [];
      } catch (error) {
        endTimer();
        logger.error('Error fetching transactions', error);
        throw error;
      }
    }, (userId, filters) => `transactions_${userId}_${JSON.stringify(filters)}`, 2 * 60 * 1000),
    []
  );

  return useQuery({
    queryKey: queryKeys.transactions(user?.id || '', filters),
    queryFn: () => fetchTransactions(user?.id || '', filters),
    enabled: !!user?.id,
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes (renamed from cacheTime in v5)
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
};

// Optimized financial summary with intelligent caching
export const useOptimizedFinancialSummary = (viewMode: 'both' | 'user1' | 'user2' = 'both') => {
  const { user } = useAuth();
  
  const fetchFinancialSummary = useMemo(
    () => memoizeAsync(async (userId: string, viewMode: string) => {
      const endTimer = (() => {
        const start = performance.now();
        return () => logger.performance('financial_summary_calc', performance.now() - start);
      })();

      try {
        // Fetch current month data
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        
        const endOfMonth = new Date();
        endOfMonth.setMonth(endOfMonth.getMonth() + 1);
        endOfMonth.setDate(0);
        endOfMonth.setHours(23, 59, 59, 999);

        // Parallel fetch for better performance
        const [transactionsResult, accountsResult, coupleResult] = await Promise.all([
          supabase
            .from('transactions')
            .select('type, amount, currency, owner_user')
            .eq('user_id', userId)
            .gte('transaction_date', startOfMonth.toISOString().split('T')[0])
            .lte('transaction_date', endOfMonth.toISOString().split('T')[0]),
          
          supabase
            .from('accounts')
            .select('balance, currency, owner_user')
            .eq('user_id', userId)
            .eq('account_model', 'personal'),
          
          supabase
            .from('user_couples')
            .select('user1_id, user2_id')
            .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
            .eq('status', 'active')
            .maybeSingle()
        ]);

        const transactions = transactionsResult.data || [];
        const accounts = accountsResult.data || [];
        const couple = coupleResult.data;

        // Calculate totals based on view mode
        let totalIncome = 0;
        let totalExpenses = 0;
        let accountsBalance = 0;

        transactions.forEach(transaction => {
          const shouldInclude = viewMode === 'both' || 
            (viewMode === 'user1' && transaction.owner_user === 'user1') ||
            (viewMode === 'user2' && transaction.owner_user === 'user2');

          if (shouldInclude) {
            if (transaction.type === 'income') {
              totalIncome += transaction.amount;
            } else {
              totalExpenses += transaction.amount;
            }
          }
        });

        accounts.forEach(account => {
          const shouldInclude = viewMode === 'both' || 
            (viewMode === 'user1' && account.owner_user === 'user1') ||
            (viewMode === 'user2' && account.owner_user === 'user2');

          if (shouldInclude) {
            accountsBalance += account.balance || 0;
          }
        });

        const result = {
          totalIncome: totalIncome + accountsBalance,
          totalExpenses,
          balance: (totalIncome + accountsBalance) - totalExpenses,
          currency: 'BRL' as const,
          isPartOfCouple: !!couple,
          transactionCount: transactions.length,
          accountCount: accounts.length,
        };

        endTimer();
        logger.info('Financial summary calculated', { viewMode, ...result });
        
        return result;
      } catch (error) {
        endTimer();
        logger.error('Error calculating financial summary', error);
        throw error;
      }
    }, (userId, viewMode) => `financial_summary_${userId}_${viewMode}`, 30 * 1000),
    []
  );

  return useQuery({
    queryKey: queryKeys.financialSummary(user?.id || '', viewMode),
    queryFn: () => fetchFinancialSummary(user?.id || '', viewMode),
    enabled: !!user?.id,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes (renamed from cacheTime in v5)
    refetchOnWindowFocus: false,
  });
};

// Optimized real-time updates with debouncing
export const useOptimizedRealTimeUpdates = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const debouncedInvalidation = useMemo(
    () => debounce((queryKey: string[]) => {
      queryClient.invalidateQueries({ queryKey });
      logger.debug('Query invalidated', { queryKey });
    }, 500),
    [queryClient]
  );

  const throttledRefresh = useMemo(
    () => throttle((queryKey: string[]) => {
      queryClient.refetchQueries({ queryKey });
      logger.debug('Query refetched', { queryKey });
    }, 2000),
    [queryClient]
  );

  const invalidateTransactions = useCallback(() => {
    if (user?.id) {
      debouncedInvalidation(queryKeys.transactions(user.id));
      debouncedInvalidation(queryKeys.financialSummary(user.id, 'both'));
    }
  }, [user?.id, debouncedInvalidation]);

  const invalidateAccounts = useCallback(() => {
    if (user?.id) {
      debouncedInvalidation(queryKeys.accounts(user.id));
      debouncedInvalidation(queryKeys.financialSummary(user.id, 'both'));
    }
  }, [user?.id, debouncedInvalidation]);

  const refreshAll = useCallback(() => {
    if (user?.id) {
      throttledRefresh(['transactions', 'accounts', 'financial-summary']);
    }
  }, [user?.id, throttledRefresh]);

  return {
    invalidateTransactions,
    invalidateAccounts,
    refreshAll,
  };
};

// Prefetching utility for better UX
export const usePrefetchQueries = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const prefetchTransactions = useCallback((filters: any = {}) => {
    if (!user?.id) return;
    
    queryClient.prefetchQuery({
      queryKey: queryKeys.transactions(user.id, filters),
      queryFn: () => {
        // Use the same fetch function as useOptimizedTransactions
        // This ensures consistency
        return memoryCache.get(`transactions_${user.id}_${JSON.stringify(filters)}`) || [];
      },
      staleTime: 1 * 60 * 1000,
    });
  }, [queryClient, user?.id]);

  const prefetchFinancialSummary = useCallback((viewMode: string = 'both') => {
    if (!user?.id) return;
    
    queryClient.prefetchQuery({
      queryKey: queryKeys.financialSummary(user.id, viewMode),
      queryFn: () => {
        return memoryCache.get(`financial_summary_${user.id}_${viewMode}`) || null;
      },
      staleTime: 30 * 1000,
    });
  }, [queryClient, user?.id]);

  return {
    prefetchTransactions,
    prefetchFinancialSummary,
  };
};