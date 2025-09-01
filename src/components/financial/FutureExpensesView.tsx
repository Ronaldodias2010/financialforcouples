import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, CreditCard, AlertCircle, DollarSign, CheckCircle, Receipt } from "lucide-react";
import { toast } from "sonner";
import { usePartnerNames } from "@/hooks/usePartnerNames";
import { useCouple } from "@/hooks/useCouple";
import { useLanguage } from "@/hooks/useLanguage";
import { format } from 'date-fns';
import { FutureExpensesCalendar } from "./FutureExpensesCalendar";
import { translateCategoryName } from '@/utils/categoryTranslation';
import { ExportUtils } from "@/components/financial/ExportUtils";
import { PayFutureExpenseModal } from "./PayFutureExpenseModal";
import { PayCardModal } from "./PayCardModal";
import { useFutureExpensePayments } from "@/hooks/useFutureExpensePayments";

interface FutureExpense {
  id: string;
  description: string;
  amount: number;
  due_date: string;
  type: 'installment' | 'recurring' | 'card_payment' | 'card_transaction';
  category: string;
  card_name?: string;
  installment_info?: string;
  owner_user?: string;
  recurringExpenseId?: string;
  installmentTransactionId?: string;
  cardPaymentInfo?: any;
  isPaid?: boolean;
  allowsPayment?: boolean; // Define se mostra o botão de pagar
}

interface FutureExpensesViewProps {
  viewMode: "both" | "user1" | "user2";
}

export const FutureExpensesView = ({ viewMode }: FutureExpensesViewProps) => {
  const { user } = useAuth();
  const { names } = usePartnerNames();
  const { isPartOfCouple } = useCouple();
  const { t, language } = useLanguage();
  const { isExpensePaid } = useFutureExpensePayments();
  const [futureExpenses, setFutureExpenses] = useState<FutureExpense[]>([]);
  const [allFutureExpenses, setAllFutureExpenses] = useState<FutureExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [paymentModal, setPaymentModal] = useState<{
    isOpen: boolean;
    expense: FutureExpense | null;
  }>({ isOpen: false, expense: null });

  const [cardPaymentModal, setCardPaymentModal] = useState<{
    isOpen: boolean;
    cardInfo: any;
  }>({ isOpen: false, cardInfo: null });

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
      futureDate.setMonth(futureDate.getMonth() + 12); // 12 meses no futuro para o calendário
      
      // Data limite para a lista de gastos futuros (final do próximo mês)
      const listLimitDate = new Date();
      listLimitDate.setMonth(listLimitDate.getMonth() + 1);
      listLimitDate.setDate(new Date(listLimitDate.getFullYear(), listLimitDate.getMonth() + 1, 0).getDate()); // Último dia do próximo mês

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

      // Buscar parcelas futuras da tabela future_expense_payments
      const { data: futurePayments, error: futurePaymentsError } = await supabase
        .from("future_expense_payments")
        .select("*")
        .in("user_id", userIds)
        .gte("payment_date", format(now, 'yyyy-MM-dd'))
        .lte("payment_date", format(futureDate, 'yyyy-MM-dd'))
        .order("payment_date", { ascending: true });

      if (futurePaymentsError) {
        console.error("Error fetching future payments:", futurePaymentsError);
      }

      // Buscar parcelas futuras da tabela transactions (parcelas já criadas)
      const { data: installments, error: installmentsError } = await supabase
        .from("transactions")
        .select(`
          *,
          categories(name),
          cards(name, owner_user)
        `)
        .in("user_id", userIds)
        .eq("is_installment", true)
        .gte("transaction_date", format(now, 'yyyy-MM-dd'))
        .lte("transaction_date", format(futureDate, 'yyyy-MM-dd'))
        .order("transaction_date", { ascending: true });

      // Buscar TODOS os gastos recorrentes ativos (sem filtro de data para calcular todas as parcelas)
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
        .order("next_due_date", { ascending: true });

      // Buscar vencimentos de cartões de crédito
      const { data: cards, error: cardsError } = await supabase
        .from("cards")
        .select("*")
        .in("user_id", userIds)
        .eq("card_type", "credit")
        .not("due_date", "is", null);

      // Buscar transações de cartão de crédito para futuro (apenas parcelas futuras ou compras à vista de meses futuros)
      const currentMonth = format(now, 'yyyy-MM');
      const { data: cardTransactions, error: cardTransactionsError } = await supabase
        .from("transactions")
        .select(`
          *,
          categories(name),
          cards(name, owner_user, card_type)
        `)
        .in("user_id", userIds)
        .eq("type", "expense")
        .not("card_id", "is", null)
        .eq('cards.card_type', 'credit')
        .gte("transaction_date", format(now, 'yyyy-MM-dd'))
        .lte("transaction_date", format(futureDate, 'yyyy-MM-dd'))
        .order("transaction_date", { ascending: true });

      if (installmentsError) throw installmentsError;
      if (recurringError) throw recurringError;
      if (cardsError) throw cardsError;
      if (cardTransactionsError) throw cardTransactionsError;

      const expenses: FutureExpense[] = [];

      // Processar pagamentos futuros da nova tabela
      if (futurePayments) {
        for (const payment of futurePayments) {
          const isPaid = await isExpensePaid(payment.recurring_expense_id, payment.installment_transaction_id, payment.original_due_date);
          
          // Buscar nome da categoria se tiver category_id
          let categoryName = 'Sem categoria';
          if (payment.category_id) {
            const { data: categoryData } = await supabase
              .from('categories')
              .select('name')
              .eq('id', payment.category_id)
              .single();
            if (categoryData) {
              categoryName = categoryData.name;
            }
          }
          
           expenses.push({
             id: payment.id,
             description: payment.description,
             amount: payment.amount,
             due_date: payment.payment_date,
             type: payment.expense_source_type === 'card_payment' ? 'card_payment' : 
                   payment.expense_source_type === 'installment' ? 'installment' : 
                   payment.expense_source_type === 'recurring' ? 'recurring' : 'installment',
             category: categoryName,
             owner_user: payment.owner_user,
             recurringExpenseId: payment.recurring_expense_id,
             installmentTransactionId: payment.installment_transaction_id,
             cardPaymentInfo: payment.card_payment_info,
             isPaid,
             allowsPayment: true, // Pagamentos futuros PODEM ser pagos
           });
        }
      }

      // Adicionar parcelas, mas excluir a 1ª parcela do mês atual (ela é Gasto Atual)
      for (const installment of installments || []) {
        const isPaid = await isExpensePaid(undefined, installment.id, installment.transaction_date);
        const transactionMonth = format(new Date(installment.transaction_date), 'yyyy-MM');
        const isCurrentMonth = transactionMonth === currentMonth;
        const installmentNumber = installment.installment_number || 1;
        const totalInstallments = installment.total_installments || 1;

        // Excluir compras com parcela única (1/1) de Gastos Futuros
        if (totalInstallments === 1) {
          continue;
        }

        // Se for a primeira parcela e for no mês atual, não aparece em Gastos Futuros
        if (installmentNumber === 1 && isCurrentMonth) {
          continue;
        }
        
        // Parcelas de cartão de crédito NÃO devem ter botão de pagamento
        const allowsPayment = installment.payment_method !== 'credit_card';
        
        expenses.push({
          id: installment.id,
          description: installment.description,
          amount: installment.amount,
          due_date: installment.transaction_date,
          type: 'installment',
          category: installment.categories?.name || 'Sem categoria',
          card_name: installment.cards?.name,
          installment_info: `${installment.installment_number}/${installment.total_installments}`,
          owner_user: installment.cards?.owner_user || installment.owner_user,
          installmentTransactionId: installment.id,
          isPaid,
          allowsPayment, // Parcelas de cartão de crédito não podem ser pagas individualmente
        });
      }

      // Adicionar gastos recorrentes - CALCULAR TODAS AS PARCELAS FUTURAS
      for (const recur of recurring || []) {
        // Filtrar por viewMode se necessário
        const shouldInclude = viewMode === "both" || 
          (viewMode === "user1" && recur.owner_user === 'user1') ||
          (viewMode === "user2" && recur.owner_user === 'user2');
          
        if (!shouldInclude) continue;

        // Calcular todas as ocorrências futuras para os próximos 12 meses
        let currentDueDate = new Date(recur.next_due_date);
        let installmentCount = 0;
        const maxInstallments = recur.contract_duration_months || 120; // Default para 10 anos se não houver duração
        
        while (currentDueDate <= futureDate && installmentCount < maxInstallments) {
          // Só adicionar se a data é no futuro ou hoje
          if (currentDueDate >= now) {
            const dueDate = format(currentDueDate, 'yyyy-MM-dd');
            const isPaid = await isExpensePaid(recur.id, undefined, dueDate);
            expenses.push({
              id: `${recur.id}-installment-${installmentCount}`,
              description: recur.name,
              amount: recur.amount,
              due_date: dueDate,
              type: 'recurring',
              category: recur.categories?.name || 'Sem categoria',
              card_name: recur.cards?.name || recur.accounts?.name,
              owner_user: recur.cards?.owner_user || recur.owner_user,
              recurringExpenseId: recur.id,
              isPaid,
              allowsPayment: true, // Gastos recorrentes PODEM ser pagos
            });
          }
          
          // Calcular próxima data de vencimento
          currentDueDate = new Date(currentDueDate);
          currentDueDate.setDate(currentDueDate.getDate() + recur.frequency_days);
          installmentCount++;
        }
      }

      // Filtrar transações de cartão conforme as regras:
      // - Compras à vista no mês atual: NÃO aparecem em gastos futuros
      // - Parcelas futuras (installment_number > 1): aparecem em gastos futuros
      // - Compras de meses futuros: aparecem em gastos futuros
      for (const cardTransaction of cardTransactions || []) {
        const transactionMonth = format(new Date(cardTransaction.transaction_date), 'yyyy-MM');
        const isCurrentMonth = transactionMonth === currentMonth;
        const isCreditCard = cardTransaction.cards?.card_type === 'credit';
        const isInstallment = cardTransaction.is_installment;
        const installmentNumber = cardTransaction.installment_number || 1;
        const totalInstallments = cardTransaction.total_installments || 1;
        
        // Ignorar completamente cartões de DÉBITO em Gastos Futuros (pela forma de pagamento)
        if (cardTransaction.payment_method === 'debit_card') {
          continue;
        }
        
        // Ignorar completamente cartões de DÉBITO em Gastos Futuros (pelo tipo do cartão)
        if (!isCreditCard) {
          continue;
        }
        
        // Excluir compras com parcela única (1/1) de Gastos Futuros
        if (isInstallment && totalInstallments === 1) {
          continue;
        }
        
        // Regra: Excluir compras à vista de cartão de crédito do mês atual
        if (isCurrentMonth && (!isInstallment || installmentNumber === 1)) {
          continue; // Não deve aparecer em gastos futuros
        }
        
        // Incluir apenas:
        // 1. Parcelas futuras (installment_number > 1)
        // 2. Compras de meses futuros
        const shouldInclude = !isCurrentMonth || (isInstallment && installmentNumber > 1);
        
        if (shouldInclude) {
          expenses.push({
            id: `transaction-${cardTransaction.id}`,
            description: cardTransaction.description,
            amount: cardTransaction.amount,
            due_date: cardTransaction.transaction_date,
            type: 'card_transaction',
            category: cardTransaction.categories?.name || 'Sem categoria',
            card_name: cardTransaction.cards?.name,
            owner_user: cardTransaction.cards?.owner_user || cardTransaction.owner_user,
            allowsPayment: false, // Transações do cartão NÃO podem ser pagas individualmente
          });
        }
      }

      // Adicionar vencimentos de cartões com cálculo baseado na data de fechamento (COM botão de pagar)
      for (const card of cards || []) {
        if (card.due_date) {
          const paymentAmount = await calculateCardPaymentAmount(card, user.id);
          if (paymentAmount > 0) {
            const nextDueDate = getNextDueDate(card.due_date);
            const isPaid = await isExpensePaid(undefined, undefined, nextDueDate);
            expenses.push({
              id: `card-${card.id}`,
              description: `${t('transactionForm.creditCardPayment')} ${card.name}`,
              amount: paymentAmount,
              due_date: nextDueDate,
              type: 'card_payment',
              category: t('transactionForm.creditCard'),
              card_name: card.name,
              owner_user: card.owner_user,
              cardPaymentInfo: { 
                cardId: card.id, 
                cardName: card.name,
                minimumPayment: card.minimum_payment_amount || paymentAmount * 0.15,
                allowsPartialPayment: card.allows_partial_payment
              },
              isPaid,
              allowsPayment: true, // Cartões de crédito PODEM ser pagos
            });
          }
        }
      }

      // Filtrar gastos para lista (apenas até final do próximo mês)
      // Separar gastos para lista e para calendário
      const expensesForList = expenses.filter(expense => 
        new Date(expense.due_date) <= listLimitDate
      );
      
      const expensesForCalendar = expenses; // Todos os gastos para o calendário

      // Ordenar por data
      expensesForList.sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());

      // Armazenar ambos os conjuntos
      setFutureExpenses(expensesForList);
      setAllFutureExpenses(expensesForCalendar);
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
    
    return format(nextDueDate, 'yyyy-MM-dd');
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
      case 'card_transaction':
        return <Receipt className="h-4 w-4" />;
      default:
        return <DollarSign className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'installment':
        return t('installment');
      case 'recurring':
        return t('recurring');
      case 'card_payment':
        return t('cardPayment');
      case 'card_transaction':
        return 'Gasto do Cartão';
      default:
        return t('other');
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
      case 'card_transaction':
        return 'bg-orange-100 text-orange-800';
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

  const translateCategory = (category: string) => {
    return translateCategoryName(category, language as 'pt' | 'en' | 'es');
  };

  const handlePayExpense = (expense: FutureExpense) => {
    if (expense.type === 'card_payment' && expense.cardPaymentInfo) {
      // Abrir modal específico para pagamento de cartão
      setCardPaymentModal({
        isOpen: true,
        cardInfo: {
          id: expense.cardPaymentInfo.cardId,
          name: expense.cardPaymentInfo.cardName,
          totalAmount: expense.amount,
          minimumPayment: expense.cardPaymentInfo.minimumPayment,
          allowsPartialPayment: expense.cardPaymentInfo.allowsPartialPayment,
        }
      });
    } else {
      // Abrir modal padrão para outros tipos
      setPaymentModal({ isOpen: true, expense });
    }
  };

  const handlePaymentSuccess = () => {
    // Recarregar a lista de gastos futuros
    fetchFutureExpenses();
  };

  const categories = Array.from(new Set((futureExpenses || []).map(expense => expense.category)));
  const filteredExpenses = selectedCategory === "all" 
    ? (futureExpenses || [])
    : (futureExpenses || []).filter(expense => expense.category === selectedCategory);

  const totalAmount = (filteredExpenses || []).reduce((sum, expense) => sum + (expense?.amount || 0), 0);

  const getExportTitle = () => {
    const categoryLabel = selectedCategory === "all" ? "todas-categorias" : selectedCategory.toLowerCase().replace(/\s+/g, '-');
    return `gastos-futuros-${categoryLabel}`;
  };

  if (loading) {
    return <div>{t('monthlyExpenses.loading')}</div>;
  }

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">{t('monthlyExpenses.futureExpenses')}</h3>
          </div>
          
          {/* Actions - Responsive layout */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {/* Export Utils */}
            {filteredExpenses.length > 0 && (
              <ExportUtils
                data={filteredExpenses.map(expense => ({
                  id: expense.id,
                  description: expense.description,
                  amount: expense.amount,
                  transaction_date: expense.due_date,
                  type: expense.type as any,
                  category_id: '',
                  payment_method: '',
                  user_id: '',
                  owner_user: expense.owner_user,
                  categories: { name: expense.category },
                  cards: expense.card_name ? { name: expense.card_name } : undefined,
                  accounts: undefined
                }))}
                filename={getExportTitle()}
                headers={[
                  t('futureExpenses.description'),
                  t('futureExpenses.amount'),
                  t('futureExpenses.dueDate'),
                  t('futureExpenses.category'),
                  t('futureExpenses.type'),
                  t('futureExpenses.owner')
                ]}
                title={t('futureExpenses.pdfTitle')}
                additionalInfo={[
                  { 
                    label: t('futureExpenses.category'), 
                    value: selectedCategory === "all" ? t('monthlyExpenses.allFilter') : translateCategory(selectedCategory) 
                  },
                  { label: t('futureExpenses.total'), value: formatCurrency(totalAmount) }
                ]}
                formatRowForCSV={(item) => {
                  const mappedExpense = filteredExpenses.find(exp => exp.id === item.id);
                  return [
                    item.description,
                    formatCurrency(item.amount),
                    formatDate(item.transaction_date),
                    translateCategory(mappedExpense?.category || ''),
                    getTypeLabel(mappedExpense?.type || 'other'),
                    item.owner_user ? getOwnerName(item.owner_user) : ''
                  ];
                }}
                formatRowForPDF={(item) => {
                  const mappedExpense = filteredExpenses.find(exp => exp.id === item.id);
                  return [
                    item.description,
                    formatCurrency(item.amount),
                    formatDate(item.transaction_date),
                    translateCategory(mappedExpense?.category || ''),
                    getTypeLabel(mappedExpense?.type || 'other'),
                    item.owner_user ? getOwnerName(item.owner_user) : ''
                  ];
                }}
              />
            )}
            
            {/* Calendar and total */}
            <div className="flex items-center gap-3 justify-between sm:justify-start">
            <FutureExpensesCalendar 
              expenses={allFutureExpenses} 
              getOwnerName={getOwnerName}
            />
              <Badge variant="outline" className="text-sm sm:text-lg px-2 py-1 sm:px-3 truncate max-w-[200px] sm:max-w-none">
                <span className="hidden sm:inline">{t('monthlyExpenses.totalFuture')}: </span>
                <span className="sm:hidden">{t('monthlyExpenses.total')}: </span>
                {formatCurrency(totalAmount)}
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedCategory === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory("all")}
          >
            {t('monthlyExpenses.allFilter')}
          </Button>
          {categories.map(category => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
            >
              {translateCategory(category)}
            </Button>
          ))}
        </div>

        {filteredExpenses.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{t('monthlyExpenses.noFutureExpenses')}</p>
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
                         {translateCategory(expense.category)} {expense.card_name && `• ${expense.card_name}`} {expense.owner_user && `• ${getOwnerName(expense.owner_user)}`}
                       </p>
                      <p className="text-sm text-muted-foreground">
                        {t('monthlyExpenses.dueDate')}: {formatDate(expense.due_date)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-semibold text-lg text-destructive">
                        {formatCurrency(expense.amount)}
                      </p>
                    </div>
                     <div className="flex items-center gap-2">
                       {expense.isPaid ? (
                         <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                           <CheckCircle className="h-3 w-3 mr-1" />
                           Pago
                         </Badge>
                       ) : expense.allowsPayment === false ? (
                         // Transações do cartão - apenas informativo, SEM botão
                         <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                           <Receipt className="h-3 w-3 mr-1" />
                           Gasto do Cartão
                         </Badge>
                       ) : (
                         // Cartões de crédito, gastos recorrentes e parcelas - COM botão
                         <Button
                           size="sm"
                           onClick={() => handlePayExpense(expense)}
                           className="flex items-center gap-2"
                         >
                           <Receipt className="h-4 w-4" />
                           Pagar
                         </Button>
                       )}
                     </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Payment Modals */}
      {paymentModal.expense && (
        <PayFutureExpenseModal
          isOpen={paymentModal.isOpen}
          onClose={() => setPaymentModal({ isOpen: false, expense: null })}
          expense={paymentModal.expense}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}

      {/* Card Payment Modal */}
      {cardPaymentModal.cardInfo && (
        <PayCardModal
          isOpen={cardPaymentModal.isOpen}
          onClose={() => setCardPaymentModal({ isOpen: false, cardInfo: null })}
          cardInfo={cardPaymentModal.cardInfo}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
    </Card>
  );
};