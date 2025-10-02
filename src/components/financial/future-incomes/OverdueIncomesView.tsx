import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Calendar, CheckCircle, Trash2 } from 'lucide-react';
import { useManualFutureIncomes } from '@/hooks/useManualFutureIncomes';
import { ReceiveFutureIncomeModal } from './ReceiveFutureIncomeModal';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface OverdueIncomesViewProps {
  viewMode: 'individual' | 'couple';
}

export const OverdueIncomesView = ({ viewMode }: OverdueIncomesViewProps) => {
  const { t } = useLanguage();
  const { overdueIncomes, loading, receiveFutureIncome, deleteFutureIncome } = useManualFutureIncomes(viewMode);
  const [receiveModalOpen, setReceiveModalOpen] = useState(false);
  const [selectedIncome, setSelectedIncome] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [incomeToDelete, setIncomeToDelete] = useState<string | null>(null);

  const handleReceiveClick = (income: any) => {
    setSelectedIncome(income);
    setReceiveModalOpen(true);
  };

  const handleDeleteClick = (incomeId: string) => {
    setIncomeToDelete(incomeId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (incomeToDelete) {
      await deleteFutureIncome(incomeToDelete);
      setDeleteDialogOpen(false);
      setIncomeToDelete(null);
    }
  };

  const totalOverdue = overdueIncomes.reduce((sum, income) => sum + income.amount, 0);

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <AlertCircle className="h-5 w-5 text-destructive" />
          <h3 className="text-lg font-semibold">{t('futureIncomes.overdueTitle')}</h3>
        </div>

        {overdueIncomes.length > 0 && (
          <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-lg mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
                <span className="text-sm font-medium text-destructive">
                  {t('futureIncomes.totalOverdue')}
                </span>
              </div>
              <span className="text-2xl font-bold text-destructive">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format(totalOverdue)}
              </span>
            </div>
          </div>
        )}

        {overdueIncomes.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <p className="text-muted-foreground">{t('futureIncomes.noOverdue')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {overdueIncomes.map((income) => {
              const daysOverdue = Math.floor(
                (new Date().getTime() - new Date(income.due_date).getTime()) / (1000 * 60 * 60 * 24)
              );
              
              return (
                <Card key={income.id} className="p-4 border-destructive/20 bg-destructive/5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h5 className="font-medium">{income.description}</h5>
                        <Badge variant="destructive">
                          {daysOverdue} {daysOverdue === 1 ? t('futureIncomes.dayOverdue') : t('futureIncomes.daysOverdue')}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {t('futureIncomes.dueDate')}: {new Date(income.due_date).toLocaleDateString()}
                        </span>
                        {income.category && (
                          <Badge variant="outline" style={{ 
                            borderColor: income.category.color,
                            color: income.category.color 
                          }}>
                            {income.category.name}
                          </Badge>
                        )}
                        {income.account && (
                          <Badge variant="outline">
                            {income.account.name}
                          </Badge>
                        )}
                      </div>
                      {income.notes && (
                        <p className="text-sm text-muted-foreground mt-2">{income.notes}</p>
                      )}
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-lg font-bold text-destructive">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(income.amount)}
                      </p>
                      <div className="flex gap-2 mt-2">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleReceiveClick(income)}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteClick(income.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </Card>

      <ReceiveFutureIncomeModal
        open={receiveModalOpen}
        onOpenChange={setReceiveModalOpen}
        income={selectedIncome}
        onReceive={receiveFutureIncome}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('futureIncomes.deleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('futureIncomes.deleteDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
