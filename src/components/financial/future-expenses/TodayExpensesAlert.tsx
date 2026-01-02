import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CreditCard, DollarSign } from 'lucide-react';
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

  if (loading || count === 0) return null;

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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 rounded-lg">
                <AlertCircle className="h-5 w-5 text-amber-500 animate-pulse" />
              </div>
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  {t('futureExpenses.todayAlert.title')}
                  <Badge variant="secondary" className="ml-2 bg-amber-500/20 text-amber-600">
                    {count}
                  </Badge>
                </CardTitle>
                <CardDescription className="text-sm">
                  {t('futureExpenses.todayAlert.description')}
                </CardDescription>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">
                {t('futureExpenses.todayAlert.totalDue')}
              </div>
              <div className="text-2xl font-bold text-amber-600">
                {formatCurrency(totalAmount)}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {todayExpenses.map((expense) => (
            <div
              key={expense.id}
              className="flex items-center justify-between p-3 bg-background rounded-lg border hover:border-amber-500/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <CreditCard className="h-4 w-4 text-amber-500" />
                <div>
                  <div className="font-medium">{expense.description}</div>
                  <div className="text-sm text-muted-foreground">
                    {expense.category_name || t('common.noCategory')}
                    {expense.source_type === 'recurring' && (
                      <span className="ml-2 text-xs text-amber-600">
                        ({t('overdueExpenses.recurringExpense')})
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold text-amber-600">
                  {formatCurrency(expense.amount)}
                </span>
                <Button
                  size="sm"
                  onClick={() => handlePayExpense(expense)}
                  className="gap-2"
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
