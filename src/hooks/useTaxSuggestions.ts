import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type SuggestionType = 'income' | 'deduction' | 'asset' | 'exempt';
export type SuggestionSection = 'taxableIncome' | 'exemptIncome' | 'deductions' | 'assets';
export type SuggestionConfidence = 'high' | 'medium' | 'low';

export interface TaxSuggestion {
  id: string;
  type: SuggestionType;
  section: SuggestionSection;
  categoryName: string;
  description: string;
  amount: number;
  transactionCount: number;
  confidence: SuggestionConfidence;
  sourceType: 'transactions' | 'investments' | 'recurring';
}

// Category mappings for Brazilian tax
const CATEGORY_TAX_MAPPINGS: Record<string, { section: SuggestionSection; type: SuggestionType; confidence: SuggestionConfidence }> = {
  // Health -> Deductible
  'saúde': { section: 'deductions', type: 'deduction', confidence: 'high' },
  'health': { section: 'deductions', type: 'deduction', confidence: 'high' },
  'médico': { section: 'deductions', type: 'deduction', confidence: 'high' },
  'hospital': { section: 'deductions', type: 'deduction', confidence: 'high' },
  'farmácia': { section: 'deductions', type: 'deduction', confidence: 'medium' },
  
  // Education -> Deductible
  'educação': { section: 'deductions', type: 'deduction', confidence: 'high' },
  'education': { section: 'deductions', type: 'deduction', confidence: 'high' },
  'escola': { section: 'deductions', type: 'deduction', confidence: 'high' },
  'universidade': { section: 'deductions', type: 'deduction', confidence: 'high' },
  'faculdade': { section: 'deductions', type: 'deduction', confidence: 'high' },
  'curso': { section: 'deductions', type: 'deduction', confidence: 'medium' },
  
  // Salary -> Taxable Income
  'salário': { section: 'taxableIncome', type: 'income', confidence: 'high' },
  'salary': { section: 'taxableIncome', type: 'income', confidence: 'high' },
  'freelance': { section: 'taxableIncome', type: 'income', confidence: 'high' },
  'autônomo': { section: 'taxableIncome', type: 'income', confidence: 'high' },
  'renda': { section: 'taxableIncome', type: 'income', confidence: 'medium' },
  
  // Exempt Income
  'dividendo': { section: 'exemptIncome', type: 'exempt', confidence: 'high' },
  'dividend': { section: 'exemptIncome', type: 'exempt', confidence: 'high' },
  'poupança': { section: 'exemptIncome', type: 'exempt', confidence: 'high' },
  'fgts': { section: 'exemptIncome', type: 'exempt', confidence: 'high' },
  
  // Donations -> Deductible
  'doação': { section: 'deductions', type: 'deduction', confidence: 'medium' },
  'donation': { section: 'deductions', type: 'deduction', confidence: 'medium' },
  'presente': { section: 'deductions', type: 'deduction', confidence: 'low' },
  
  // Assets
  'investimento': { section: 'assets', type: 'asset', confidence: 'high' },
  'investment': { section: 'assets', type: 'asset', confidence: 'high' },
  'veículo': { section: 'assets', type: 'asset', confidence: 'high' },
  'vehicle': { section: 'assets', type: 'asset', confidence: 'high' },
  'imóvel': { section: 'assets', type: 'asset', confidence: 'high' },
  'moradia': { section: 'assets', type: 'asset', confidence: 'medium' },
  'financiamento': { section: 'assets', type: 'asset', confidence: 'medium' },
};

interface UseTaxSuggestionsParams {
  taxYear: number;
  viewMode: 'both' | 'user1' | 'user2';
}

export function useTaxSuggestions({ taxYear, viewMode }: UseTaxSuggestionsParams) {
  const queryClient = useQueryClient();

  // Fetch transactions for the tax year
  const { data: transactions, isLoading: isLoadingTransactions } = useQuery({
    queryKey: ['tax-suggestions-transactions', taxYear, viewMode],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const startDate = `${taxYear}-01-01`;
      const endDate = `${taxYear}-12-31`;

      const { data, error } = await supabase
        .from('transactions')
        .select(`
          id,
          amount,
          type,
          category_id,
          description,
          transaction_date,
          categories (
            id,
            name
          )
        `)
        .eq('user_id', user.id)
        .gte('transaction_date', startDate)
        .lte('transaction_date', endDate)
        .is('deleted_at', null);

      if (error) throw error;
      return data || [];
    }
  });

  // Fetch accepted/rejected suggestions
  const { data: suggestionStatus, isLoading: isLoadingStatus } = useQuery({
    queryKey: ['tax-suggestions-status', taxYear],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { accepted: [], rejected: [] };

      const { data, error } = await supabase
        .from('tax_report_config')
        .select('accepted_suggestions, rejected_suggestions')
        .eq('user_id', user.id)
        .eq('tax_year', taxYear)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      
      return {
        accepted: (data?.accepted_suggestions as string[]) || [],
        rejected: (data?.rejected_suggestions as string[]) || [],
      };
    }
  });

  // Generate suggestions from transactions
  const suggestions = useMemo((): TaxSuggestion[] => {
    if (!transactions || transactions.length === 0) return [];

    const categoryTotals: Record<string, { 
      amount: number; 
      count: number; 
      categoryName: string;
      type: 'income' | 'expense';
    }> = {};

    transactions.forEach(tx => {
      const categoryName = (tx.categories as { name: string } | null)?.name || 'Sem categoria';
      const key = categoryName.toLowerCase();
      
      if (!categoryTotals[key]) {
        categoryTotals[key] = { amount: 0, count: 0, categoryName, type: tx.type };
      }
      categoryTotals[key].amount += Math.abs(tx.amount);
      categoryTotals[key].count += 1;
    });

    const generatedSuggestions: TaxSuggestion[] = [];

    Object.entries(categoryTotals).forEach(([key, data]) => {
      // Find matching tax mapping
      const matchKey = Object.keys(CATEGORY_TAX_MAPPINGS).find(mapKey => 
        key.includes(mapKey) || mapKey.includes(key)
      );

      if (matchKey) {
        const mapping = CATEGORY_TAX_MAPPINGS[matchKey];
        const suggestionId = `${mapping.section}-${key}-${taxYear}`;
        
        // Skip if already accepted or rejected
        if (suggestionStatus?.accepted.includes(suggestionId) || 
            suggestionStatus?.rejected.includes(suggestionId)) {
          return;
        }

        generatedSuggestions.push({
          id: suggestionId,
          type: mapping.type,
          section: mapping.section,
          categoryName: data.categoryName,
          description: `Identificamos ${data.count} transações em "${data.categoryName}"`,
          amount: data.amount,
          transactionCount: data.count,
          confidence: mapping.confidence,
          sourceType: 'transactions',
        });
      }
    });

    return generatedSuggestions.sort((a, b) => b.amount - a.amount);
  }, [transactions, suggestionStatus, taxYear]);

  // Accept suggestion mutation
  const acceptMutation = useMutation({
    mutationFn: async (suggestionId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const currentAccepted = suggestionStatus?.accepted || [];
      const newAccepted = [...currentAccepted, suggestionId];

      const { error } = await supabase
        .from('tax_report_config')
        .upsert({
          user_id: user.id,
          tax_year: taxYear,
          accepted_suggestions: newAccepted,
          status: 'incomplete',
        }, {
          onConflict: 'user_id,tax_year'
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tax-suggestions-status', taxYear] });
      queryClient.invalidateQueries({ queryKey: ['income-tax-report'] });
    }
  });

  // Reject suggestion mutation
  const rejectMutation = useMutation({
    mutationFn: async (suggestionId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const currentRejected = suggestionStatus?.rejected || [];
      const newRejected = [...currentRejected, suggestionId];

      const { error } = await supabase
        .from('tax_report_config')
        .upsert({
          user_id: user.id,
          tax_year: taxYear,
          rejected_suggestions: newRejected,
          status: 'incomplete',
        }, {
          onConflict: 'user_id,tax_year'
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tax-suggestions-status', taxYear] });
    }
  });

  const pendingSuggestions = suggestions.filter(s => 
    !suggestionStatus?.accepted.includes(s.id) && 
    !suggestionStatus?.rejected.includes(s.id)
  );

  return {
    suggestions,
    pendingSuggestions,
    acceptedCount: suggestionStatus?.accepted.length || 0,
    rejectedCount: suggestionStatus?.rejected.length || 0,
    isLoading: isLoadingTransactions || isLoadingStatus,
    acceptSuggestion: acceptMutation.mutateAsync,
    rejectSuggestion: rejectMutation.mutateAsync,
    isAccepting: acceptMutation.isPending,
    isRejecting: rejectMutation.isPending,
  };
}
