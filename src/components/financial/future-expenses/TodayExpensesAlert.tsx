import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CreditCard, DollarSign, X } from 'lucide-react';
import { useTodayFutureExpenses } from '@/hooks/useTodayFutureExpenses';
import { useLanguage } from '@/hooks/useLanguage';
import { PayFutureExpenseModal } from '../PayFutureExpenseModal';

interface TodayExpensesAlertProps {
  viewMode: 'individual' | 'couple';
}

export const TodayExpensesAlert = ({ viewMode }: TodayExpensesAlertProps) => {
  const { t } = useLanguage();
  const { todayExpenses, count, totalAmount, loading, refresh } = useTodayFutureExpenses();
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<any>(null);
  const [isDismissed, setIsDismissed] = useState(false);

  // Check localStorage for dismiss persistence per day
  useEffect(() => {
    const dismissedDate = localStorage.getItem('todayExpenses_dismissed_date');
    const today = new Date().toISOString().split('T')[0];
    if (dismissedDate === today) {
      setIsDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem('todayExpenses_dismissed_date', today);
    setIsDismissed(true);
  };

  if (loading || count === 0 || isDismissed) return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const handlePayExpense = (expense: any) => {
    setSelectedExpense(expense);
    setPayModalOpen(true);
  };

  const handleModalClose = () => {
    setPayModalOpen(false);
    setSelectedExpense(null);
  };

  const handlePaymentSuccess = () => {
    handleModalClose();
    refresh();
  };

  return (
    <>
      <Card className="border-amber-500/50 bg-amber-500/5 shadow-lg">
        <CardHeader className="pb-3">
          {/* Mobile: Stack layout, Desktop: Row layout */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Header with icon, title, and dismiss button */}
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-500/10 rounded-lg shrink-0">
                <AlertCircle className="h-5 w-5 text-amber-500 animate-pulse" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-base sm:text-lg flex items-center gap-2 flex-wrap">
                    {t('futureExpenses.todayAlert.title')}
                    <Badge variant="secondary" className="bg-amber-500/20 text-amber-600">
                      {count}
                    </Badge>
                  </CardTitle>
                  {/* Dismiss button - visible on mobile in header row */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleDismiss}
                    className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0 sm:hidden"
                    title={t('futureExpenses.todayAlert.dismiss')}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <CardDescription className="text-sm mt-1">
                  {t('futureExpenses.todayAlert.description')}
                </CardDescription>
              </div>
            </div>
            
            {/* Total and dismiss button */}
            <div className="flex items-center justify-between sm:justify-end gap-4">
              <div className="text-left sm:text-right">
                <div className="text-sm text-muted-foreground">
                  {t('futureExpenses.todayAlert.totalDue')}
                </div>
                <div className="text-xl sm:text-2xl font-bold text-amber-600">
                  {formatCurrency(totalAmount)}
                </div>
              </div>
              {/* Dismiss button - visible only on desktop */}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDismiss}
                className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0 hidden sm:flex"
                title={t('futureExpenses.todayAlert.dismiss')}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {todayExpenses.map((expense) => (
            <div
              key={expense.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 p-3 bg-background rounded-lg border hover:border-amber-500/50 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <CreditCard className="h-4 w-4 text-amber-500 shrink-0" />
                <div className="min-w-0">
                  <div className="font-medium truncate">{expense.description}</div>
                  <div className="text-sm text-muted-foreground truncate">
                    {expense.category_name || t('common.noCategory')}
                    {expense.source_type === 'recurring' && (
                      <span className="ml-2 text-xs text-amber-600">
                        ({t('overdueExpenses.recurringExpense')})
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between sm:justify-end gap-3 pl-7 sm:pl-0">
                <span className="font-semibold text-amber-600 whitespace-nowrap">
                  {formatCurrency(expense.amount)}
                </span>
                <Button
                  size="sm"
                  onClick={() => handlePayExpense(expense)}
                  className="gap-2 shrink-0"
                >
                  <DollarSign className="h-4 w-4" />
                  {t('monthlyExpenses.pay')}
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {selectedExpense && (
        <PayFutureExpenseModal
          isOpen={payModalOpen}
          onClose={handleModalClose}
          expense={{
            id: selectedExpense.source_id,
            description: selectedExpense.description,
            amount: selectedExpense.amount,
            due_date: selectedExpense.due_date,
            type: selectedExpense.source_type === 'manual' ? 'manual_future' : 'recurring',
            category: selectedExpense.category_name,
            manualFutureExpenseId: selectedExpense.source_type === 'manual' ? selectedExpense.source_id : undefined,
            recurringExpenseId: selectedExpense.source_type === 'recurring' ? selectedExpense.source_id : undefined,
          }}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
    </>
  );
};
