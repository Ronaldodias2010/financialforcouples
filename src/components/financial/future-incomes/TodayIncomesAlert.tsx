import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, CheckCircle, DollarSign } from 'lucide-react';
import { useTodayFutureIncomes } from '@/hooks/useTodayFutureIncomes';
import { useLanguage } from '@/hooks/useLanguage';
import { ReceiveFutureIncomeModal } from './ReceiveFutureIncomeModal';
import { useManualFutureIncomes } from '@/hooks/useManualFutureIncomes';

interface TodayIncomesAlertProps {
  viewMode: 'individual' | 'couple';
}

export const TodayIncomesAlert = ({ viewMode }: TodayIncomesAlertProps) => {
  const { t } = useLanguage();
  const { todayIncomes, count, totalAmount, loading, refresh } = useTodayFutureIncomes();
  const { receiveFutureIncome } = useManualFutureIncomes(viewMode);
  const [receiveModalOpen, setReceiveModalOpen] = useState(false);
  const [selectedIncome, setSelectedIncome] = useState<any>(null);

  if (loading || count === 0) return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const handleConfirmIncome = (income: any) => {
    setSelectedIncome(income);
    setReceiveModalOpen(true);
  };

  const handleModalClose = () => {
    setReceiveModalOpen(false);
    setSelectedIncome(null);
    // Force immediate refresh when modal closes
    refresh();
  };

  return (
    <>
      <Card className="border-primary/50 bg-primary/5 shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Bell className="h-5 w-5 text-primary animate-pulse" />
              </div>
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  {t('futureIncomes.todayAlert.title')}
                  <Badge variant="default" className="ml-2">
                    {count}
                  </Badge>
                </CardTitle>
                <CardDescription className="text-sm">
                  {t('futureIncomes.todayAlert.description')}
                </CardDescription>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">
                {t('futureIncomes.todayAlert.totalExpected')}
              </div>
              <div className="text-2xl font-bold text-primary">
                {formatCurrency(totalAmount)}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {todayIncomes.map((income) => (
            <div
              key={income.id}
              className="flex items-center justify-between p-3 bg-background rounded-lg border hover:border-primary/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <DollarSign className="h-4 w-4 text-primary" />
                <div>
                  <div className="font-medium">{income.description}</div>
                  <div className="text-sm text-muted-foreground">
                    {formatCurrency(income.amount)}
                  </div>
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => handleConfirmIncome(income)}
                className="gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                {t('futureIncomes.todayAlert.confirmButton')}
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {selectedIncome && (
        <ReceiveFutureIncomeModal
          open={receiveModalOpen}
          onOpenChange={handleModalClose}
          income={selectedIncome}
          onReceive={receiveFutureIncome}
          onSuccess={refresh}
        />
      )}
    </>
  );
};
