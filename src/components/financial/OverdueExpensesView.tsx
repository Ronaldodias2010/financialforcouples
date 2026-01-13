import { useState, useMemo, useCallback, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { usePartnerNames } from '@/hooks/usePartnerNames';
import { useCouple } from '@/hooks/useCouple';
import { useLanguage } from '@/hooks/useLanguage';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { ExportUtils } from './ExportUtils';
import { AlertCircle, Clock, Filter } from 'lucide-react';
import { PayFutureExpenseModal } from './PayFutureExpenseModal';
import { useCurrencyConverter } from '@/hooks/useCurrencyConverter';
import { parseLocalDate } from '@/utils/date';
import { Badge } from '@/components/ui/badge';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface OverdueExpense {
  id: string;
  description: string;
  amount: number;
  currency: string;
  dueDate: string;
  categoryId?: string;
  categoryName?: string;
  ownerUser: string;
  sourceType: 'manual' | 'recurring';
  sourceId: string;
  daysOverdue: number;
}

interface OverdueExpensesViewProps {
  viewMode: 'both' | 'user1' | 'user2';
}

export const OverdueExpensesView = ({ viewMode }: OverdueExpensesViewProps) => {
  const { user } = useAuth();
  const { couple, isPartOfCouple } = useCouple();
  const { names } = usePartnerNames();
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const { convertCurrency, getCurrencySymbol } = useCurrencyConverter();
  const queryClient = useQueryClient();
  
  const [selectedExpense, setSelectedExpense] = useState<OverdueExpense | null>(null);
  const [showPayModal, setShowPayModal] = useState(false);
  const [periodFilter, setPeriodFilter] = useState<'90days' | 'all'>('90days');

  // Build userIds based on couple and viewMode
  const userIds = useMemo(() => {
    if (!user) return [];
    if (couple && viewMode === 'both') {
      return [couple.user1_id, couple.user2_id];
    } else if (couple && viewMode === 'user1') {
      return [couple.user1_id];
    } else if (couple && viewMode === 'user2') {
      return [couple.user2_id];
    }
    return [user.id];
  }, [user, couple, viewMode]);

  // Fetch overdue expenses function wrapped in useCallback
  const fetchOverdueExpenses = useCallback(async (): Promise<OverdueExpense[]> => {
    if (!user || userIds.length === 0) return [];
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    // Fetch ALL overdue pending transactions (manual expenses) - busca TODAS as despesas com due_date < today
    // Não filtra por is_overdue, busca diretamente pelo due_date
    const { data: transactionsData, error: transactionsError } = await supabase
      .from('transactions')
      .select(`
        *,
        category:categories(id, name, color)
      `)
      .in('user_id', userIds)
      .eq('status', 'pending')
      .eq('type', 'expense')
      .is('card_id', null)
      .lt('due_date', todayStr)
      .order('due_date', { ascending: true });

      if (transactionsError) {
        console.error('Error fetching overdue transactions:', transactionsError);
        throw transactionsError;
      }

      // Fetch overdue recurring expenses
      const { data: recurringData, error: recurringError } = await supabase
        .from('recurring_expenses')
        .select('*')
        .in('user_id', userIds)
        .lt('next_due_date', todayStr)
        .eq('is_active', true)
        .eq('is_completed', false);

      if (recurringError) {
        console.error('Error fetching recurring overdue expenses:', recurringError);
        throw recurringError;
      }

      // Fetch overdue manual future expenses (only UNPAID ones)
      const { data: manualFutureData, error: manualFutureError } = await supabase
        .from('manual_future_expenses')
        .select('*')
        .in('user_id', userIds)
        .eq('is_paid', false) // ⭐ CRITICAL: Somente não pagas
        .lt('due_date', todayStr) // ⭐ Buscar por due_date < hoje ao invés de is_overdue
        .is('deleted_at', null);

      if (manualFutureError) {
        console.error('Error fetching manual future overdue expenses:', manualFutureError);
        throw manualFutureError;
      }

      // Get unique category IDs
      const categoryIds = new Set<string>();
      transactionsData?.forEach((item: any) => {
        if (item.category_id) categoryIds.add(item.category_id);
      });
      recurringData?.forEach((item: any) => {
        if (item.category_id) categoryIds.add(item.category_id);
      });
      manualFutureData?.forEach((item: any) => {
        if (item.category_id) categoryIds.add(item.category_id);
      });

      // Fetch categories
      const categoriesMap = new Map<string, string>();
      if (categoryIds.size > 0) {
        const { data: categoriesData } = await supabase
          .from('categories')
          .select('id, name')
          .in('id', Array.from(categoryIds));
        
        categoriesData?.forEach((cat: any) => {
          categoriesMap.set(cat.id, cat.name);
        });
      }

      // Combine and format data
      const expenses: OverdueExpense[] = [];

      // Add manual expenses from transactions
      transactionsData?.forEach((item: any) => {
        const dueDate = parseLocalDate(item.due_date);
        const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        
        expenses.push({
          id: item.id,
          description: item.description || 'Sem descrição',
          amount: item.amount || 0,
          currency: 'BRL',
          dueDate: item.due_date,
          categoryId: item.category_id,
          categoryName: item.category?.name || (item.category_id ? categoriesMap.get(item.category_id) || '' : ''),
          ownerUser: item.owner_user || 'user1',
          sourceType: 'manual',
          sourceId: item.id,
          daysOverdue,
        });
      });

      // Add recurring expenses
      recurringData?.forEach((item: any) => {
        const dueDate = new Date(item.next_due_date);
        const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        
        expenses.push({
          id: `recurring_${item.id}`,
          description: item.name || 'Sem descrição',
          amount: item.amount || 0,
          currency: 'BRL',
          dueDate: item.next_due_date,
          categoryId: item.category_id,
          categoryName: item.category_id ? categoriesMap.get(item.category_id) || '' : '',
          ownerUser: item.owner_user || 'user1',
          sourceType: 'recurring',
          sourceId: item.id,
          daysOverdue,
        });
      });

      // Add overdue manual future expenses
      // ⭐ CRITICAL: Usar o ID real (sem prefixo) para que o pagamento funcione
      manualFutureData?.forEach((item: any) => {
        const dueDate = parseLocalDate(item.due_date);
        const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        
        expenses.push({
          id: `manual_future_${item.id}`, // ID para exibição (pode ter prefixo)
          description: item.description || 'Sem descrição',
          amount: item.amount || 0,
          currency: 'BRL',
          dueDate: item.due_date,
          categoryId: item.category_id,
          categoryName: item.category_id ? categoriesMap.get(item.category_id) || '' : '',
          ownerUser: item.owner_user || 'user1',
          sourceType: 'manual',
          sourceId: item.id, // ⭐ Usar ID real SEM prefixo para o pagamento
          daysOverdue,
        });
      });

    // Sort by days overdue (most overdue first)
    expenses.sort((a, b) => b.daysOverdue - a.daysOverdue);
    
    return expenses;
  }, [user, userIds]);

  // Use React Query for caching and automatic refetching
  const { 
    data: overdueExpenses = [], 
    isLoading: loading,
    refetch 
  } = useQuery({
    queryKey: ['overdue-expenses', user?.id, viewMode, couple?.user1_id, couple?.user2_id],
    queryFn: fetchOverdueExpenses,
    enabled: !!user && userIds.length > 0,
    staleTime: 30 * 1000, // 30 seconds
    refetchOnWindowFocus: true,
  });

  // Filter expenses based on period selection
  const filteredExpenses = useMemo(() => {
    if (periodFilter === 'all') return overdueExpenses;
    return overdueExpenses.filter(expense => expense.daysOverdue <= 90);
  }, [overdueExpenses, periodFilter]);

  // Count expenses older than 90 days
  const expensesOver90Days = useMemo(() => {
    return overdueExpenses.filter(expense => expense.daysOverdue > 90);
  }, [overdueExpenses]);

  // Supabase Realtime subscription for automatic updates
  useEffect(() => {
    if (!user) return;

    console.log('🔄 [OverdueExpensesView] Setting up realtime subscription...');
    
    const channel = supabase
      .channel('overdue-expenses-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'transactions' },
        () => {
          console.log('📡 [OverdueExpensesView] Transactions changed, refetching...');
          queryClient.invalidateQueries({ queryKey: ['overdue-expenses'] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'recurring_expenses' },
        () => {
          console.log('📡 [OverdueExpensesView] Recurring expenses changed, refetching...');
          queryClient.invalidateQueries({ queryKey: ['overdue-expenses'] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'manual_future_expenses' },
        () => {
          console.log('📡 [OverdueExpensesView] Manual future expenses changed, refetching...');
          queryClient.invalidateQueries({ queryKey: ['overdue-expenses'] });
        }
      )
      .subscribe();

    return () => {
      console.log('🔄 [OverdueExpensesView] Cleaning up realtime subscription...');
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  const handlePayExpense = (expense: OverdueExpense) => {
    setSelectedExpense(expense);
    setShowPayModal(true);
  };

  const handlePaymentSuccess = () => {
    setShowPayModal(false);
    setSelectedExpense(null);
    // Refetch is handled by cache invalidation in payment hooks
    toast({
      title: t('common.success'),
      description: t('monthlyExpenses.payModal.successMessage'),
    });
  };

  const formatCurrency = (amount: number, currency: string) => {
    const convertedAmount = convertCurrency(amount, currency as any, 'BRL');
    return `${getCurrencySymbol('BRL')} ${convertedAmount.toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'pt' ? 'pt-BR' : language === 'es' ? 'es-ES' : 'en-US');
  };

  const getOverdueBadgeColor = (daysOverdue: number) => {
    if (daysOverdue <= 7) return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
    if (daysOverdue <= 30) return 'bg-orange-500/10 text-orange-600 border-orange-500/20';
    return 'bg-destructive/10 text-destructive border-destructive/20';
  };

  const getUserName = (ownerUser: string) => {
    if (!couple) return '';
    return ownerUser === 'user1' ? names.user1Name : names.user2Name;
  };

  const handleExport = async (format: 'csv' | 'pdf') => {
    // This will be called by the ExportUtils component
  };

  const formatRowForCSV = (transaction: any) => {
    const expense = overdueExpenses.find(e => e.id === transaction.id);
    if (!expense) return [];
    return [
      expense.description,
      formatCurrency(expense.amount, expense.currency),
      formatDate(expense.dueDate),
      `${expense.daysOverdue} ${t('overdueExpenses.days')}`,
      expense.categoryName || t('common.noCategory'),
      getUserName(expense.ownerUser),
    ];
  };

  const formatRowForPDF = (transaction: any) => {
    const expense = overdueExpenses.find(e => e.id === transaction.id);
    if (!expense) return [];
    return [
      expense.description,
      formatCurrency(expense.amount, expense.currency),
      formatDate(expense.dueDate),
      `${expense.daysOverdue}`,
      expense.categoryName || t('common.noCategory'),
      getUserName(expense.ownerUser),
    ];
  };

  const exportHeaders = [
    t('monthlyExpenses.description'),
    t('monthlyExpenses.amount'),
    t('monthlyExpenses.dueDate'),
    t('overdueExpenses.daysOverdue'),
    t('monthlyExpenses.category'),
    t('monthlyExpenses.performedBy'),
  ];

  // Calculate totals based on filtered expenses
  const totalOverdue = filteredExpenses.reduce((sum, exp) => {
    return sum + convertCurrency(exp.amount, exp.currency as any, 'BRL');
  }, 0);

  // Calculate total for expenses over 90 days
  const totalOver90Days = expensesOver90Days.reduce((sum, exp) => {
    return sum + convertCurrency(exp.amount, exp.currency as any, 'BRL');
  }, 0);

  // Group expenses by month (using filtered expenses)
  const groupedExpenses = filteredExpenses.reduce((acc, expense) => {
    const date = new Date(expense.dueDate);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const monthLabel = date.toLocaleDateString(language === 'pt' ? 'pt-BR' : language === 'es' ? 'es-ES' : 'en-US', {
      year: 'numeric',
      month: 'long'
    });
    
    if (!acc[monthKey]) {
      acc[monthKey] = {
        label: monthLabel,
        expenses: [],
        total: 0
      };
    }
    
    acc[monthKey].expenses.push(expense);
    acc[monthKey].total += convertCurrency(expense.amount, expense.currency as any, 'BRL');
    
    return acc;
  }, {} as Record<string, { label: string; expenses: OverdueExpense[]; total: number }>);

  // Sort months (oldest first)
  const sortedMonths = Object.keys(groupedExpenses).sort();

  const exportAdditionalInfo = [
    { label: t('monthlyExpenses.total'), value: formatCurrency(totalOverdue, 'BRL') }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">{t('monthlyExpenses.loading')}</p>
      </div>
    );
  }

  const formattedData = filteredExpenses.map(expense => ({
    id: expense.id,
    description: expense.description,
    amount: expense.amount,
    transaction_date: expense.dueDate,
    category: { name: expense.categoryName || '' },
    owner_user: expense.ownerUser,
    payment_method: '',
  }));

  return (
    <>
      <div className="space-y-4">
        {/* Filter and Summary Card */}
        <Card className="p-6">
          <div className="flex flex-col gap-4">
            {/* Period Filter */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <Filter className="h-5 w-5 text-muted-foreground" />
                <Select value={periodFilter} onValueChange={(v) => setPeriodFilter(v as '90days' | 'all')}>
                  <SelectTrigger className="w-[220px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="90days">{t('overdueExpenses.filter.90days')}</SelectItem>
                    <SelectItem value="all">{t('overdueExpenses.filter.all')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <ExportUtils
                data={formattedData}
                filename={`${t('overdueExpenses.title')}`}
                headers={exportHeaders}
                formatRowForCSV={formatRowForCSV}
                formatRowForPDF={formatRowForPDF}
                title={t('overdueExpenses.pdfTitle')}
                additionalInfo={exportAdditionalInfo}
                disabled={filteredExpenses.length === 0}
              />
            </div>

            {/* Summary Info */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-4 border-t">
              <div>
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                  {t('overdueExpenses.totalOverdue')}
                </h3>
                <p className="text-3xl font-bold text-destructive mt-2">
                  {formatCurrency(totalOverdue, 'BRL')}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {filteredExpenses.length} {t('overdueExpenses.expensesCount')}
                </p>
              </div>

              {/* Alert for expenses > 90 days when in 90days filter */}
              {periodFilter === '90days' && expensesOver90Days.length > 0 && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                  <div className="flex items-center gap-2 text-amber-600">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      {t('overdueExpenses.olderThan90')}
                    </span>
                    <Badge variant="secondary" className="bg-amber-500/20 text-amber-700">
                      {expensesOver90Days.length}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatCurrency(totalOver90Days, 'BRL')} {t('overdueExpenses.hiddenExpenses')}
                  </p>
                  <Button
                    variant="link"
                    size="sm"
                    className="p-0 h-auto text-amber-600 mt-1"
                    onClick={() => setPeriodFilter('all')}
                  >
                    {t('overdueExpenses.viewAll')}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Expenses List Grouped by Month */}
        {filteredExpenses.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">{t('overdueExpenses.noOverdueExpenses')}</p>
          </Card>
        ) : (
          <div className="space-y-6">
            {sortedMonths.map((monthKey) => {
              const group = groupedExpenses[monthKey];
              return (
                <div key={monthKey} className="space-y-3">
                  {/* Month Header */}
                  <div className="flex items-center justify-between px-2">
                    <h4 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                      {group.label}
                    </h4>
                    <span className="text-sm font-medium text-muted-foreground">
                      {formatCurrency(group.total, 'BRL')}
                    </span>
                  </div>
                  
                  {/* Month Expenses */}
                  <div className="grid gap-3">
                    {group.expenses.map((expense) => (
                      <Card key={expense.id} className="p-4 hover:shadow-md transition-shadow">
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h4 className="font-semibold text-foreground">{expense.description}</h4>
                                <p className="text-sm text-muted-foreground">
                                  {expense.categoryName || t('common.noCategory')}
                                </p>
                              </div>
                              <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getOverdueBadgeColor(expense.daysOverdue)}`}>
                                {expense.daysOverdue} {t('overdueExpenses.daysOverdue')}
                              </span>
                            </div>
                            
                            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                              <span>
                                <span className="font-medium">{t('monthlyExpenses.dueDate')}:</span>{' '}
                                {formatDate(expense.dueDate)}
                              </span>
                              {couple && (
                                <span>
                                  <span className="font-medium">{t('monthlyExpenses.performedBy')}:</span>{' '}
                                  {getUserName(expense.ownerUser)}
                                </span>
                              )}
                              <span>
                                <span className="font-medium">{t('overdueExpenses.source')}:</span>{' '}
                                {expense.sourceType === 'manual' 
                                  ? t('overdueExpenses.manualExpense')
                                  : t('overdueExpenses.recurringExpense')
                                }
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="text-2xl font-bold text-destructive">
                                {formatCurrency(expense.amount, expense.currency)}
                              </p>
                            </div>
                            <Button
                              onClick={() => handlePayExpense(expense)}
                              variant="default"
                              size="sm"
                            >
                              {t('monthlyExpenses.pay')}
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {selectedExpense && (
        <PayFutureExpenseModal
          isOpen={showPayModal}
          onClose={() => {
            setShowPayModal(false);
            setSelectedExpense(null);
          }}
          expense={{
            id: selectedExpense.sourceId,
            description: selectedExpense.description,
            amount: selectedExpense.amount,
            due_date: selectedExpense.dueDate,
            type: selectedExpense.sourceType === 'manual' ? 'manual_future' : 'recurring',
            category: selectedExpense.categoryName,
            categoryId: selectedExpense.categoryId, // ⭐ Passar categoryId para pre-selecionar
            manualFutureExpenseId: selectedExpense.sourceType === 'manual' ? selectedExpense.sourceId : undefined,
            recurringExpenseId: selectedExpense.sourceType === 'recurring' ? selectedExpense.sourceId : undefined,
          }}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
    </>
  );
};
