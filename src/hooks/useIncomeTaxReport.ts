import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfYear, endOfYear, format } from 'date-fns';

export type DeclarationType = 'individual' | 'joint';
export type TaxStatus = 'incomplete' | 'attention' | 'complete';

export interface TaxConfig {
  id: string;
  user_id: string;
  tax_year: number;
  declaration_type: DeclarationType;
  primary_declarant: string;
  dependents: Dependent[];
  status: TaxStatus;
  progress_percentage: number;
  notes?: string;
}

export interface Dependent {
  name: string;
  cpf: string;
  relationship: string;
  birthDate: string;
}

export interface TaxableIncome {
  category: string;
  categoryId?: string;
  total: number;
  count: number;
  owner: string;
  source: string;
}

export interface DeductibleExpense {
  category: string;
  categoryKey: string;
  icon: string;
  total: number;
  deductibleAmount: number;
  legalLimit?: number;
  count: number;
  status: 'ok' | 'missing_docs' | 'exceeds_limit';
  documentsCount: number;
}

export interface TaxAsset {
  id: string;
  type: string;
  description: string;
  valueAtYearStart: number;
  valueAtYearEnd: number;
  owner: string;
  irDescription?: string;
}

export interface PendingItem {
  id: string;
  type: 'uncategorized' | 'high_income' | 'missing_doc' | 'unclassified';
  description: string;
  amount: number;
  date: string;
  transactionId?: string;
}

export interface TaxReportSummary {
  taxableIncome: number;
  exemptIncome: number;
  deductibleExpenses: number;
  totalAssets: number;
  totalDebts: number;
  pendingItems: number;
  progress: number;
  status: TaxStatus;
}

// Mapeamento de categorias para classificação IR
const DEDUCTIBLE_CATEGORIES: Record<string, { key: string; icon: string; limit?: number }> = {
  'Saúde': { key: 'health', icon: '🏥', limit: undefined }, // Sem limite
  'Educação': { key: 'education', icon: '🎓', limit: 3561.50 }, // Por dependente, 2024
  'Previdência': { key: 'pension', icon: '🧾', limit: undefined }, // 12% da renda tributável
  'Família & Filhos': { key: 'dependents', icon: '👶', limit: 2275.08 }, // Por dependente
  'Pensão Alimentícia': { key: 'alimony', icon: '🧑‍⚖️', limit: undefined },
};

const TAXABLE_INCOME_CATEGORIES = [
  'Salário', 'Freelance', 'Aluguel', 'Bônus', 'Vendas', 'Serviços'
];

const EXEMPT_INCOME_CATEGORIES = [
  'Investimentos', 'Dividendos', 'Poupança', 'CDB', 'Tesouro'
];

interface UseIncomeTaxReportProps {
  taxYear: number;
  viewMode: 'both' | 'user1' | 'user2';
}

export function useIncomeTaxReport({ taxYear, viewMode }: UseIncomeTaxReportProps) {
  const [declarationType, setDeclarationType] = useState<DeclarationType>('individual');

  const startDate = startOfYear(new Date(taxYear, 0, 1));
  const endDate = endOfYear(new Date(taxYear, 0, 1));

  // Fetch tax config
  const { data: taxConfig, isLoading: isLoadingConfig } = useQuery({
    queryKey: ['tax-config', taxYear],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('tax_report_config')
        .select('*')
        .eq('user_id', user.id)
        .eq('tax_year', taxYear)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    }
  });

  // Fetch user profile
  const { data: profile } = useQuery({
    queryKey: ['profile-tax'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    }
  });

  // Fetch transactions for the year
  const { data: transactions = [], isLoading: isLoadingTransactions } = useQuery({
    queryKey: ['tax-transactions', taxYear, viewMode],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      let query = supabase
        .from('transactions')
        .select(`
          *,
          category:categories(id, name, category_type, color, icon)
        `)
        .gte('transaction_date', format(startDate, 'yyyy-MM-dd'))
        .lte('transaction_date', format(endDate, 'yyyy-MM-dd'))
        .eq('status', 'completed');

      if (viewMode !== 'both') {
        query = query.eq('owner_user', viewMode);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch investments
  const { data: investments = [] } = useQuery({
    queryKey: ['tax-investments', taxYear, viewMode],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      let query = supabase
        .from('investments')
        .select('*')
        .lte('purchase_date', format(endDate, 'yyyy-MM-dd'));

      if (viewMode !== 'both') {
        query = query.eq('owner_user', viewMode);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch accounts
  const { data: accounts = [] } = useQuery({
    queryKey: ['tax-accounts', viewMode],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      let query = supabase
        .from('accounts')
        .select('*')
        .eq('is_active', true);

      if (viewMode !== 'both') {
        query = query.eq('owner_user', viewMode);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch deduction documents
  const { data: deductionDocs = [] } = useQuery({
    queryKey: ['tax-deduction-docs', taxYear],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('tax_deduction_documents')
        .select('*')
        .eq('tax_year', taxYear);

      if (error) throw error;
      return data || [];
    }
  });

  // Calculate taxable income by category
  const taxableIncomes = useMemo((): TaxableIncome[] => {
    const incomeTransactions = transactions.filter(
      t => t.type === 'income' && t.category?.name
    );

    const grouped: Record<string, TaxableIncome> = {};

    incomeTransactions.forEach(t => {
      const categoryName = t.category?.name || 'Outros';
      const isTaxable = TAXABLE_INCOME_CATEGORIES.some(c => 
        categoryName.toLowerCase().includes(c.toLowerCase())
      );

      if (isTaxable) {
        if (!grouped[categoryName]) {
          grouped[categoryName] = {
            category: categoryName,
            categoryId: t.category_id,
            total: 0,
            count: 0,
            owner: t.owner_user || 'user1',
            source: 'Transações'
          };
        }
        grouped[categoryName].total += t.amount;
        grouped[categoryName].count += 1;
      }
    });

    return Object.values(grouped).sort((a, b) => b.total - a.total);
  }, [transactions]);

  // Calculate exempt income
  const exemptIncomes = useMemo((): TaxableIncome[] => {
    const incomeTransactions = transactions.filter(
      t => t.type === 'income' && t.category?.name
    );

    const grouped: Record<string, TaxableIncome> = {};

    incomeTransactions.forEach(t => {
      const categoryName = t.category?.name || 'Outros';
      const isExempt = EXEMPT_INCOME_CATEGORIES.some(c => 
        categoryName.toLowerCase().includes(c.toLowerCase())
      );

      if (isExempt) {
        if (!grouped[categoryName]) {
          grouped[categoryName] = {
            category: categoryName,
            categoryId: t.category_id,
            total: 0,
            count: 0,
            owner: t.owner_user || 'user1',
            source: 'Transações'
          };
        }
        grouped[categoryName].total += t.amount;
        grouped[categoryName].count += 1;
      }
    });

    return Object.values(grouped).sort((a, b) => b.total - a.total);
  }, [transactions]);

  // Calculate deductible expenses
  const deductibleExpenses = useMemo((): DeductibleExpense[] => {
    const expenseTransactions = transactions.filter(t => t.type === 'expense');

    const expenses: DeductibleExpense[] = [];

    Object.entries(DEDUCTIBLE_CATEGORIES).forEach(([categoryName, config]) => {
      const categoryTransactions = expenseTransactions.filter(
        t => t.category?.name?.toLowerCase().includes(categoryName.toLowerCase())
      );

      const total = categoryTransactions.reduce((sum, t) => sum + t.amount, 0);
      const docsCount = deductionDocs.filter(d => d.category === config.key).length;

      let status: 'ok' | 'missing_docs' | 'exceeds_limit' = 'ok';
      let deductibleAmount = total;

      if (config.limit && total > config.limit) {
        status = 'exceeds_limit';
        deductibleAmount = config.limit;
      } else if (total > 0 && docsCount === 0) {
        status = 'missing_docs';
      }

      if (total > 0 || categoryTransactions.length > 0) {
        expenses.push({
          category: categoryName,
          categoryKey: config.key,
          icon: config.icon,
          total,
          deductibleAmount,
          legalLimit: config.limit,
          count: categoryTransactions.length,
          status,
          documentsCount: docsCount
        });
      }
    });

    return expenses.sort((a, b) => b.total - a.total);
  }, [transactions, deductionDocs]);

  // Calculate assets
  const taxAssets = useMemo((): TaxAsset[] => {
    const assets: TaxAsset[] = [];

    // Add investments
    investments.forEach(inv => {
      assets.push({
        id: inv.id,
        type: 'investment',
        description: `${inv.type} - ${inv.name}`,
        valueAtYearStart: inv.amount,
        valueAtYearEnd: inv.current_value,
        owner: inv.owner_user || 'user1',
        irDescription: `${inv.type} - ${inv.name}${inv.broker ? ` (${inv.broker})` : ''}`
      });
    });

    // Add accounts with positive balance
    accounts.filter(acc => acc.balance > 0).forEach(acc => {
      assets.push({
        id: acc.id,
        type: 'bank_account',
        description: `Conta ${acc.name}`,
        valueAtYearStart: 0,
        valueAtYearEnd: acc.balance,
        owner: acc.owner_user || 'user1',
        irDescription: `Conta ${acc.account_type} - ${acc.name}`
      });
    });

    return assets;
  }, [investments, accounts]);

  // Calculate pending items
  const pendingItems = useMemo((): PendingItem[] => {
    const items: PendingItem[] = [];

    // Uncategorized transactions
    transactions
      .filter(t => !t.category_id)
      .slice(0, 10)
      .forEach(t => {
        items.push({
          id: t.id,
          type: 'uncategorized',
          description: t.description,
          amount: t.amount,
          date: t.transaction_date,
          transactionId: t.id
        });
      });

    // High income without classification
    transactions
      .filter(t => t.type === 'income' && t.amount > 5000 && !t.category_id)
      .forEach(t => {
        items.push({
          id: t.id,
          type: 'high_income',
          description: `Receita alta: ${t.description}`,
          amount: t.amount,
          date: t.transaction_date,
          transactionId: t.id
        });
      });

    // Deductible expenses without documents
    deductibleExpenses
      .filter(e => e.status === 'missing_docs')
      .forEach(e => {
        items.push({
          id: e.categoryKey,
          type: 'missing_doc',
          description: `${e.category} - comprovante pendente`,
          amount: e.total,
          date: ''
        });
      });

    return items;
  }, [transactions, deductibleExpenses]);

  // Calculate summary
  const summary = useMemo((): TaxReportSummary => {
    const totalTaxable = taxableIncomes.reduce((sum, i) => sum + i.total, 0);
    const totalExempt = exemptIncomes.reduce((sum, i) => sum + i.total, 0);
    const totalDeductible = deductibleExpenses.reduce((sum, e) => sum + e.deductibleAmount, 0);
    const totalAssetValue = taxAssets.reduce((sum, a) => sum + a.valueAtYearEnd, 0);

    // Calculate progress based on completeness
    let progress = 0;
    if (profile) progress += 20; // Identification complete
    if (taxableIncomes.length > 0) progress += 20;
    if (deductibleExpenses.length > 0) progress += 20;
    if (taxAssets.length > 0) progress += 20;
    if (pendingItems.length === 0) progress += 20;

    let status: TaxStatus = 'incomplete';
    if (progress >= 80 && pendingItems.length === 0) {
      status = 'complete';
    } else if (progress >= 40) {
      status = 'attention';
    }

    return {
      taxableIncome: totalTaxable,
      exemptIncome: totalExempt,
      deductibleExpenses: totalDeductible,
      totalAssets: totalAssetValue,
      totalDebts: 0, // TODO: Add debts calculation
      pendingItems: pendingItems.length,
      progress,
      status
    };
  }, [taxableIncomes, exemptIncomes, deductibleExpenses, taxAssets, pendingItems, profile]);

  // Save or update tax config
  const saveConfig = async (config: Partial<TaxConfig>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const configData = {
      user_id: user.id,
      tax_year: taxYear,
      declaration_type: config.declaration_type || declarationType,
      status: summary.status,
      progress_percentage: summary.progress
    };

    const { error } = await supabase
      .from('tax_report_config')
      .upsert(configData, {
        onConflict: 'user_id,tax_year'
      });

    if (error) throw error;
  };

  return {
    // Config
    taxConfig,
    declarationType,
    setDeclarationType,
    saveConfig,

    // Data
    taxableIncomes,
    exemptIncomes,
    deductibleExpenses,
    taxAssets,
    pendingItems,
    summary,
    profile,

    // Loading states
    isLoading: isLoadingConfig || isLoadingTransactions,

    // Year info
    taxYear,
    startDate,
    endDate
  };
}
