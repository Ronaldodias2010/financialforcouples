import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, CreditCard, AlertCircle, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { usePartnerNames } from "@/hooks/usePartnerNames";
import { useCouple } from "@/hooks/useCouple";

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

interface FutureExpensesViewProps {
  viewMode: "both" | "user1" | "user2";
}

export const FutureExpensesView = ({ viewMode }: FutureExpensesViewProps) => {
  const { user } = useAuth();
  const { names } = usePartnerNames();
  const { isPartOfCouple } = useCouple();
  const [futureExpenses, setFutureExpenses] = useState<FutureExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  useEffect(() => {
    if (user) {
      fetchFutureExpenses();
    }
  }, [user, viewMode]);

  const fetchFutureExpenses = async () => {
    if (!user) return;

    try {
      const now = new Date();
      const futureDate = new Date();
      futureDate.setMonth(futureDate.getMonth() + 6); // 6 meses no futuro

      // Check if user is part of a couple to include partner's transactions
      const { data: coupleData } = await supabase
        .from("user_couples")
        .select("user1_id, user2_id")
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .eq("status", "active")
        .maybeSingle();

      let userIds = [user.id];
      if (coupleData) {
        // Include both users' transactions
        userIds = [coupleData.user1_id, coupleData.user2_id];
      }

      // Buscar parcelas futuras
      const { data: installments, error: installmentsError } = await supabase
        .from("transactions")
        .select(`
          *,
          categories(name),
          cards(name, owner_user)
        `)
        .in("user_id", userIds)
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
          cards(name, owner_user),
          accounts(name)
        `)
        .in("user_id", userIds)
        .eq("is_active", true)
        .gte("next_due_date", now.toISOString().split('T')[0])
        .lte("next_due_date", futureDate.toISOString().split('T')[0])
        .order("next_due_date", { ascending: true });

      // Buscar vencimentos de cartões de crédito
      const { data: cards, error: cardsError } = await supabase
        .from("cards")
        .select("*")
        .in("user_id", userIds)
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
          installment_info: `${installment.installment_number}/${installment.total_installments}`,
          owner_user: installment.cards?.owner_user || installment.owner_user
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
          card_name: recur.cards?.name || recur.accounts?.name,
          owner_user: recur.cards?.owner_user || recur.owner_user
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
              card_name: card.name,
              owner_user: card.owner_user
            });
          }
        }
      }

      // Filtrar por viewMode se necessário
      let filteredExpenses = expenses;
      if (viewMode !== "both" && isPartOfCouple) {
        filteredExpenses = expenses.filter(expense => {
          const ownerUser = expense.owner_user || 'user1';
          return ownerUser === viewMode;
        });
      }

      // Ordenar por data
      filteredExpenses.sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());

      setFutureExpenses(filteredExpenses);
    } catch (error) {
      console.error("Error fetching future expenses:", error);
      toast.error("Erro ao carregar gastos futuros");
    } finally {
      setLoading(false);
    }
  };

  const calculateCardPaymentAmount = async (card: any, userId: string): Promise<number> => {
    // Para cartão de crédito, calcular: Limite Total - Limite Disponível
    if (card.card_type === 'credit') {
      const totalLimit = Number(card.credit_limit || 0);
      const availableLimit = Number(card.initial_balance || 0);
      return totalLimit - availableLimit;
    }
    
    // Para outros tipos de cartão, usar saldo atual
    return card.current_balance || 0;
  };

  const getNextDueDate = (dueDay: number): string => {
    const now = new Date();
    const currentDay = now.getDate();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    let nextDueDate: Date;
    
    // Se ainda não passou o dia de vencimento no mês atual
    if (currentDay <= dueDay) {
      nextDueDate = new Date(currentYear, currentMonth, dueDay);
    } else {
      // Se já passou, usar o próximo mês
      nextDueDate = new Date(currentYear, currentMonth + 1, dueDay);
    }
    
    // Garantir que não retorne uma data no passado
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
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString("pt-BR");
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

  const getOwnerName = (ownerUser: string) => {
    if (ownerUser === 'user1') {
      return names.user1Name;
    } else if (ownerUser === 'user2') {
      return names.user2Name;
    }
    return ownerUser;
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
                        {expense.category} {expense.card_name && `• ${expense.card_name}`} {expense.owner_user && `• ${getOwnerName(expense.owner_user)}`}
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