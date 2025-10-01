import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { usePartnerNames } from '@/hooks/usePartnerNames';
import { useCouple } from '@/hooks/useCouple';
import { useLanguage } from '@/hooks/useLanguage';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { ExportUtils } from './ExportUtils';
import { AlertCircle } from 'lucide-react';
import { PayFutureExpenseModal } from './PayFutureExpenseModal';
import { useCurrencyConverter } from '@/hooks/useCurrencyConverter';

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
  
  const [overdueExpenses, setOverdueExpenses] = useState<OverdueExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedExpense, setSelectedExpense] = useState<OverdueExpense | null>(null);
  const [showPayModal, setShowPayModal] = useState(false);

  useEffect(() => {
    if (user) {
      fetchOverdueExpenses();
    }
  }, [user, viewMode]);

  const fetchOverdueExpenses = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString().split('T')[0];

      let userIds = [user.id];
      if (couple && viewMode === 'both') {
        userIds = [couple.user1_id, couple.user2_id];
      } else if (couple && viewMode === 'user1') {
        userIds = [couple.user1_id];
      } else if (couple && viewMode === 'user2') {
        userIds = [couple.user2_id];
      }

      // Fetch overdue manual future expenses
      const { data: manualData, error: manualError } = await supabase
        .from('manual_future_expenses')
        .select(`
          id,
          user_id,
          description,
          amount,
          due_date,
          category_id,
          is_paid,
          owner_user,
          categories:category_id (
            name
          )
        `)
        .in('user_id', userIds)
        .lt('due_date', todayStr)
        .eq('is_paid', false);

      if (manualError) {
        console.error('Error fetching manual overdue expenses:', manualError);
        throw manualError;
      }

      // Fetch overdue recurring expenses
      const { data: recurringData, error: recurringError } = await supabase
        .from('recurring_expenses')
        .select(`
          id,
          user_id,
          name,
          amount,
          next_due_date,
          category_id,
          is_active,
          is_completed,
          owner_user,
          categories:category_id (
            name
          )
        `)
        .in('user_id', userIds)
        .lt('next_due_date', todayStr)
        .eq('is_active', true)
        .eq('is_completed', false);

      if (recurringError) {
        console.error('Error fetching recurring overdue expenses:', recurringError);
        throw recurringError;
      }

      // Combine and format data
      const expenses: OverdueExpense[] = [];

      // Add manual expenses
      manualData?.forEach((item: any) => {
        const dueDate = new Date(item.due_date);
        const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        
        expenses.push({
          id: item.id,
          description: item.description || 'Sem descrição',
          amount: item.amount || 0,
          currency: 'BRL',
          dueDate: item.due_date,
          categoryId: item.category_id,
          categoryName: item.categories?.name || '',
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
          categoryName: item.categories?.name || '',
          ownerUser: item.owner_user || 'user1',
          sourceType: 'recurring',
          sourceId: item.id,
          daysOverdue,
        });
      });

      // Sort by days overdue (most overdue first)
      expenses.sort((a, b) => b.daysOverdue - a.daysOverdue);
      
      setOverdueExpenses(expenses);
    } catch (error) {
      console.error('Error fetching overdue expenses:', error);
      toast({
        title: t('common.error'),
        description: t('common.errorLoadingData'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePayExpense = (expense: OverdueExpense) => {
    setSelectedExpense(expense);
    setShowPayModal(true);
  };

  const handlePaymentSuccess = () => {
    setShowPayModal(false);
    setSelectedExpense(null);
    fetchOverdueExpenses();
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

  const totalOverdue = overdueExpenses.reduce((sum, exp) => {
    return sum + convertCurrency(exp.amount, exp.currency as any, 'BRL');
  }, 0);

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

  const formattedData = overdueExpenses.map(expense => ({
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
        {/* Summary Card */}
        <Card className="p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
                {t('overdueExpenses.totalOverdue')}
              </h3>
              <p className="text-3xl font-bold text-destructive mt-2">
                {formatCurrency(totalOverdue, 'BRL')}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {overdueExpenses.length} {t('overdueExpenses.expensesCount')}
              </p>
            </div>
            <ExportUtils
              data={formattedData}
              filename={`${t('overdueExpenses.title')}`}
              headers={exportHeaders}
              formatRowForCSV={formatRowForCSV}
              formatRowForPDF={formatRowForPDF}
              title={t('overdueExpenses.pdfTitle')}
              additionalInfo={exportAdditionalInfo}
              disabled={overdueExpenses.length === 0}
            />
          </div>
        </Card>

        {/* Expenses List */}
        {overdueExpenses.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">{t('overdueExpenses.noOverdueExpenses')}</p>
          </Card>
        ) : (
          <div className="grid gap-4">
            {overdueExpenses.map((expense) => (
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
            recurringExpenseId: selectedExpense.sourceType === 'recurring' ? selectedExpense.sourceId : undefined,
          }}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
    </>
  );
};
