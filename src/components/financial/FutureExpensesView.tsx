import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, CreditCard, AlertCircle, DollarSign } from "lucide-react";
import { toast } from "sonner";

interface FutureExpense {
  id: string;
  description: string;
  amount: number;
  due_date: string;
  type: 'installment' | 'recurring' | 'card_payment';
  category: string;
  card_name?: string;
  installment_info?: string;
}

export const FutureExpensesView = () => {
  const { user } = useAuth();
  const [futureExpenses, setFutureExpenses] = useState<FutureExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  useEffect(() => {
    if (user) {
      fetchFutureExpenses();
    }
  }, [user]);

  const fetchFutureExpenses = async () => {
    if (!user) return;

    try {
      const now = new Date();
      const futureDate = new Date();
      futureDate.setMonth(futureDate.getMonth() + 6); // 6 meses no futuro

      // Buscar parcelas futuras
      const { data: installments, error: installmentsError } = await supabase
        .from("transactions")
        .select(`
          *,
          categories(name),
          cards(name)
        `)
        .eq("user_id", user.id)
        .eq("is_installment", true)
        .gte("transaction_date", now.toISOString().split('T')[0])
        .lte("transaction_date", futureDate.toISOString().split('T')[0])
        .order("transaction_date", { ascending: true });

      // Buscar gastos recorrentes ativos
      const { data: recurring, error: recurringError } = await supabase
        .from("recurring_expenses")
        .select(`
          *,
          categories(name),
          cards(name),
          accounts(name)
        `)
        .eq("user_id", user.id)
        .eq("is_active", true)
        .gte("next_due_date", now.toISOString().split('T')[0])
        .lte("next_due_date", futureDate.toISOString().split('T')[0])
        .order("next_due_date", { ascending: true });

      // Buscar vencimentos de cartões de crédito
      const { data: cards, error: cardsError } = await supabase
        .from("cards")
        .select("*")
        .eq("user_id", user.id)
        .eq("card_type", "credit")
        .not("due_date", "is", null);

      if (installmentsError) throw installmentsError;
      if (recurringError) throw recurringError;
      if (cardsError) throw cardsError;

      const expenses: FutureExpense[] = [];

      // Adicionar parcelas
      installments?.forEach(installment => {
        expenses.push({
          id: installment.id,
          description: installment.description,
          amount: installment.amount,
          due_date: installment.transaction_date,
          type: 'installment',
          category: installment.categories?.name || 'Sem categoria',
          card_name: installment.cards?.name,
          installment_info: `${installment.installment_number}/${installment.total_installments}`
        });
      });

      // Adicionar gastos recorrentes
      recurring?.forEach(recur => {
        expenses.push({
          id: recur.id,
          description: recur.name,
          amount: recur.amount,
          due_date: recur.next_due_date,
          type: 'recurring',
          category: recur.categories?.name || 'Sem categoria',
          card_name: recur.cards?.name || recur.accounts?.name
        });
      });

      // Adicionar vencimentos de cartões com cálculo baseado na data de fechamento
      for (const card of cards || []) {
        if (card.due_date) {
          const paymentAmount = await calculateCardPaymentAmount(card, user.id);
          if (paymentAmount > 0) {
            const nextDueDate = getNextDueDate(card.due_date);
            expenses.push({
              id: `card-${card.id}`,
              description: `Pagamento ${card.name}`,
              amount: paymentAmount,
              due_date: nextDueDate,
              type: 'card_payment',
              category: 'Cartão de Crédito',
              card_name: card.name
            });
          }
        }
      }

      // Ordenar por data
      expenses.sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());

      setFutureExpenses(expenses);
    } catch (error) {
      console.error("Error fetching future expenses:", error);
      toast.error("Erro ao carregar gastos futuros");
    } finally {
      setLoading(false);
    }
  };

  const calculateCardPaymentAmount = async (card: any, userId: string): Promise<number> => {
    // Se não tem data de fechamento, usar saldo atual
    if (!card.closing_date) {
      return card.current_balance || 0;
    }

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Determinar período de fechamento (do fechamento anterior até o próximo fechamento)
    let currentClosingDate = new Date(currentYear, currentMonth, card.closing_date);
    let previousClosingDate = new Date(currentYear, currentMonth - 1, card.closing_date);
    
    // Se ainda não passou da data de fechamento deste mês
    if (now.getDate() < card.closing_date) {
      currentClosingDate = new Date(currentYear, currentMonth, card.closing_date);
      previousClosingDate = new Date(currentYear, currentMonth - 1, card.closing_date);
    } else {
      // Já passou da data de fechamento, próximo fechamento é mês que vem
      currentClosingDate = new Date(currentYear, currentMonth + 1, card.closing_date);
      previousClosingDate = new Date(currentYear, currentMonth, card.closing_date);
    }

    try {
      // Buscar transações do cartão no período desde o último fechamento
      const { data: transactions, error } = await supabase
        .from("transactions")
        .select("amount, type")
        .eq("user_id", userId)
        .eq("card_id", card.id)
        .gte("transaction_date", previousClosingDate.toISOString().split('T')[0])
        .lt("transaction_date", currentClosingDate.toISOString().split('T')[0]);

      if (error) throw error;

      // Calcular saldo baseado nas transações do período
      const periodBalance = transactions?.reduce((total, transaction) => {
        return transaction.type === 'expense' ? total + transaction.amount : total - transaction.amount;
      }, 0) || 0;

      // Somar com saldo anterior (se existir)
      const totalBalance = (card.current_balance || 0) + periodBalance;

      return Math.max(0, totalBalance); // Não pode ser negativo
    } catch (error) {
      console.error("Error calculating card payment amount:", error);
      return card.current_balance || 0;
    }
  };

  const getNextDueDate = (dueDay: number): string => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    let nextDueDate = new Date(currentYear, currentMonth, dueDay);
    
    if (nextDueDate <= now) {
      nextDueDate = new Date(currentYear, currentMonth + 1, dueDay);
    }
    
    return nextDueDate.toISOString().split('T')[0];
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR");
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'installment':
        return <CreditCard className="h-4 w-4" />;
      case 'recurring':
        return <Calendar className="h-4 w-4" />;
      case 'card_payment':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <DollarSign className="h-4 w-4" />;
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
        return 'bg-blue-100 text-blue-800';
      case 'recurring':
        return 'bg-green-100 text-green-800';
      case 'card_payment':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const categories = Array.from(new Set(futureExpenses.map(expense => expense.category)));
  const filteredExpenses = selectedCategory === "all" 
    ? futureExpenses 
    : futureExpenses.filter(expense => expense.category === selectedCategory);

  const totalAmount = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);

  if (loading) {
    return <div>Carregando gastos futuros...</div>;
  }

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Gastos Futuros</h3>
          </div>
          <Badge variant="outline" className="text-lg px-3 py-1">
            Total: {formatCurrency(totalAmount)}
          </Badge>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedCategory === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory("all")}
          >
            Todas
          </Button>
          {categories.map(category => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </Button>
          ))}
        </div>

        {filteredExpenses.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum gasto futuro encontrado</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredExpenses.map((expense) => (
              <Card key={expense.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getTypeIcon(expense.type)}
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{expense.description}</h4>
                        <Badge className={getTypeColor(expense.type)}>
                          {getTypeLabel(expense.type)}
                        </Badge>
                        {expense.installment_info && (
                          <Badge variant="outline">{expense.installment_info}</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {expense.category} {expense.card_name && `• ${expense.card_name}`}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Vencimento: {formatDate(expense.due_date)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-lg">
                      {formatCurrency(expense.amount)}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};