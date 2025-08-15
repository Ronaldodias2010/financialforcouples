import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar as CalendarIcon, CreditCard, AlertCircle, DollarSign } from "lucide-react";
import { format, parseISO, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";

interface FutureExpense {
  id: string;
  description: string;
  amount: number;
  due_date: string;
  type: 'installment' | 'recurring' | 'card_payment';
  category: string;
  card_name?: string;
  installment_info?: string;
  owner_user?: string;
}

interface FutureExpensesCalendarProps {
  expenses: FutureExpense[];
  getOwnerName: (ownerUser: string) => string;
}

export const FutureExpensesCalendar = ({ 
  expenses, 
  getOwnerName 
}: FutureExpensesCalendarProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [isOpen, setIsOpen] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'installment':
        return <CreditCard className="h-3 w-3" />;
      case 'recurring':
        return <CalendarIcon className="h-3 w-3" />;
      case 'card_payment':
        return <AlertCircle className="h-3 w-3" />;
      default:
        return <DollarSign className="h-3 w-3" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'installment':
        return 'Parcela';
      case 'recurring':
        return 'Recorrente';
      case 'card_payment':
        return 'Vencimento';
      default:
        return 'Outro';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'installment':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'recurring':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'card_payment':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  // Criar um mapa de datas com gastos
  const expensesByDate = expenses.reduce((acc, expense) => {
    const date = expense.due_date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(expense);
    return acc;
  }, {} as Record<string, FutureExpense[]>);

  // Datas que têm gastos
  const datesWithExpenses = Object.keys(expensesByDate).map(dateStr => parseISO(dateStr));

  // Gastos da data selecionada
  const selectedDateExpenses = selectedDate 
    ? expenses.filter(expense => isSameDay(parseISO(expense.due_date), selectedDate))
    : [];

  const totalForSelectedDate = selectedDateExpenses.reduce((sum, expense) => sum + expense.amount, 0);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <CalendarIcon className="h-4 w-4" />
          Visualizar no Calendário
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Calendário de Gastos Futuros
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Calendário */}
          <Card className="p-4">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              locale={ptBR}
              className="rounded-md border-0"
              modifiers={{
                hasExpenses: datesWithExpenses
              }}
              modifiersStyles={{
                hasExpenses: {
                  backgroundColor: 'hsl(var(--primary))',
                  color: 'hsl(var(--primary-foreground))',
                  fontWeight: 'bold'
                }
              }}
            />
            <div className="mt-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-primary"></div>
                <span>Dias com gastos</span>
              </div>
            </div>
          </Card>

          {/* Detalhes da data selecionada */}
          <Card className="p-4">
            <div className="space-y-4">
              {selectedDate ? (
                <>
                  <div className="border-b pb-3">
                    <h3 className="font-semibold text-lg">
                      {format(selectedDate, "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </h3>
                    {selectedDateExpenses.length > 0 && (
                      <p className="text-sm text-muted-foreground">
                        {selectedDateExpenses.length} gasto{selectedDateExpenses.length > 1 ? 's' : ''} • Total: {formatCurrency(totalForSelectedDate)}
                      </p>
                    )}
                  </div>

                  {selectedDateExpenses.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhum gasto nesta data</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {selectedDateExpenses.map((expense) => (
                        <div key={expense.id} className="border rounded-lg p-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-2">
                              {getTypeIcon(expense.type)}
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="font-medium text-sm truncate">{expense.description}</h4>
                                  <Badge className={`${getTypeColor(expense.type)} text-xs`}>
                                    {getTypeLabel(expense.type)}
                                  </Badge>
                                  {expense.installment_info && (
                                    <Badge variant="outline" className="text-xs">
                                      {expense.installment_info}
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {expense.category}
                                  {expense.card_name && ` • ${expense.card_name}`}
                                  {expense.owner_user && ` • ${getOwnerName(expense.owner_user)}`}
                                </p>
                              </div>
                            </div>
                            <div className="text-right ml-2">
                              <p className="font-semibold text-sm">
                                {formatCurrency(expense.amount)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Clique em uma data no calendário para ver os gastos</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};