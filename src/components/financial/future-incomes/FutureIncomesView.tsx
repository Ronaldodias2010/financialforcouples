import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Calendar, DollarSign, Trash2, CheckCircle, Clock } from 'lucide-react';
import { useManualFutureIncomes } from '@/hooks/useManualFutureIncomes';
import { AddFutureIncomeModal } from './AddFutureIncomeModal';
import { ReceiveFutureIncomeModal } from './ReceiveFutureIncomeModal';
import { useLanguage } from '@/contexts/LanguageContext';
import { parseLocalDate, formatLocalDate } from '@/utils/date';
import { TodayIncomesAlert } from './TodayIncomesAlert';
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

interface FutureIncomesViewProps {
  viewMode: 'individual' | 'couple';
}

export const FutureIncomesView = ({ viewMode }: FutureIncomesViewProps) => {
  const { t } = useLanguage();
  const {
    futureIncomes,
    loading,
    addFutureIncome,
    receiveFutureIncome,
    deleteFutureIncome,
    getDueStatus,
  } = useManualFutureIncomes(viewMode);

  const [addModalOpen, setAddModalOpen] = useState(false);
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

  // Group incomes by month
  const groupedIncomes = futureIncomes.reduce((acc, income) => {
    const monthYear = parseLocalDate(income.due_date).toLocaleDateString('pt-BR', { 
      year: 'numeric', 
      month: 'long' 
    });
    if (!acc[monthYear]) {
      acc[monthYear] = [];
    }
    acc[monthYear].push(income);
    return acc;
  }, {} as Record<string, typeof futureIncomes>);

  const totalFutureIncomes = futureIncomes.reduce((sum, income) => sum + income.amount, 0);

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
      {/* Today's Incomes Alert */}
      <TodayIncomesAlert viewMode={viewMode} />
      
      <Card className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-semibold">{t('futureIncomes.title')}</h3>
            <p className="text-sm text-muted-foreground">{t('futureIncomes.subtitle')}</p>
          </div>
          <Button onClick={() => setAddModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {t('futureIncomes.addNew')}
          </Button>
        </div>

        <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 p-4 rounded-lg mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
              <span className="text-sm font-medium text-muted-foreground">
                {t('futureIncomes.totalExpected')}
              </span>
            </div>
            <span className="text-2xl font-bold text-green-600 dark:text-green-400">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              }).format(totalFutureIncomes)}
            </span>
          </div>
        </div>

        {futureIncomes.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">{t('futureIncomes.noIncomes')}</p>
            <Button variant="outline" className="mt-4" onClick={() => setAddModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              {t('futureIncomes.addFirst')}
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedIncomes).map(([monthYear, incomes]) => (
              <div key={monthYear}>
                <h4 className="text-sm font-semibold text-muted-foreground mb-3 capitalize">
                  {monthYear}
                </h4>
                <div className="space-y-3">
                  {incomes.map((income) => {
                    const status = getDueStatus(income.due_date);
                    return (
                      <Card key={income.id} className="p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h5 className="font-medium">{income.description}</h5>
                              {status === 'today' && (
                                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {t('futureIncomes.dueToday')}
                                </Badge>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatLocalDate(income.due_date, 'dd/MM/yyyy')}
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
                            <p className="text-lg font-bold text-green-600 dark:text-green-400">
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
              </div>
            ))}
          </div>
        )}
      </Card>

      <AddFutureIncomeModal
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
        onAdd={addFutureIncome}
      />

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
