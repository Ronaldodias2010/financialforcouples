import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, CreditCard, AlertCircle, DollarSign, CheckCircle, Receipt, Plus, Clock } from "lucide-react";
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
import { AddFutureExpenseModal } from "./AddFutureExpenseModal";
import { useFutureExpensePayments } from "@/hooks/useFutureExpensePayments";
import { useManualFutureExpenses, type ManualFutureExpense } from "@/hooks/useManualFutureExpenses";
import { useCurrencyConverter, type CurrencyCode } from "@/hooks/useCurrencyConverter";

interface FutureExpense {
  id: string;
  description: string;
  amount: number;
  due_date: string;
  type: 'installment' | 'recurring' | 'card_payment' | 'card_transaction' | 'manual_future';
  category: string;
  card_name?: string;
  installment_info?: string;
  owner_user?: string;
  recurringExpenseId?: string;
  installmentTransactionId?: string;
  cardPaymentInfo?: any;
  manualFutureExpenseId?: string;
  isPaid?: boolean;
  allowsPayment?: boolean; // Define se mostra o botão de pagar
  dueStatus?: 'future' | 'today' | 'overdue'; // Status de vencimento
  currency?: CurrencyCode; // Currency of the expense
}

interface MonthlyExpenseGroup {
  monthKey: string;
  monthLabel: string;
  expenses: FutureExpense[];
  total: number;
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
  const { fetchManualFutureExpenses, payManualExpense, getDueStatus } = useManualFutureExpenses();
  const { formatCurrency: formatCurrencyWithConverter, convertCurrency } = useCurrencyConverter();
  
  // Helper function to sum expenses with currency conversion to BRL
  const sumExpensesInBRL = (expenses: FutureExpense[]): number => {
    return expenses.reduce((sum, expense) => {
      const convertedAmount = convertCurrency(expense.amount, expense.currency || 'BRL', 'BRL');
      return sum + convertedAmount;
    }, 0);
  };
  const [futureExpenses, setFutureExpenses] = useState<FutureExpense[]>([]);
  const [allFutureExpenses, setAllFutureExpenses] = useState<FutureExpense[]>([]);
  const [monthlyGroups, setMonthlyGroups] = useState<MonthlyExpenseGroup[]>([]);
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

  const [addExpenseModal, setAddExpenseModal] = useState(false);

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

      // Buscar apenas gastos recorrentes antigos da tabela future_expense_payments
      // EXCLUIR TODOS os gastos de parcelas (installment) - agora vêm de transactions
      const { data: futurePayments, error: futurePaymentsError } = await supabase
        .from("future_expense_payments")
        .select("*")
        .in("user_id", userIds)
        .is("installment_transaction_id", null) // Excluir parcelas (installments têm transaction_id)
        .not("expense_source_type", "in", '("installment")') // Excluir por tipo também
        .gte("original_due_date", format(now, 'yyyy-MM-dd'))
        .lte("original_due_date", format(futureDate, 'yyyy-MM-dd'))
        .order("original_due_date", { ascending: true });

      if (futurePaymentsError) {
        console.error("Error fetching future payments:", futurePaymentsError);
      }

      // Buscar TODAS as parcelas pendentes (status = 'pending') da tabela transactions
      const { data: pendingInstallments, error: pendingInstallmentsError } = await supabase
        .from("transactions")
        .select(`
          *,
          categories(name),
          cards(name, owner_user)
        `)
        .in("user_id", userIds)
        .eq("status", "pending") // Apenas parcelas pendentes
        .eq("payment_method", "credit_card")
        .eq("is_installment", true)
        .gte("due_date", format(now, 'yyyy-MM-dd'))
        .lte("due_date", format(futureDate, 'yyyy-MM-dd'))
        .order("due_date", { ascending: true });

      if (pendingInstallmentsError) {
        console.error("Error fetching pending installments:", pendingInstallmentsError);
      }

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

      if (recurringError) throw recurringError;
      if (cardsError) throw cardsError;
      if (cardTransactionsError) throw cardTransactionsError;

      const expenses: FutureExpense[] = [];

      // Buscar gastos futuros manuais (já filtrados por viewMode no hook)
      const manualExpenses = await fetchManualFutureExpenses(viewMode);
      for (const manualExpense of manualExpenses) {
        // Skip paid manual expenses
        if (manualExpense.is_paid) continue;
        
        const dueStatus = getDueStatus(manualExpense.due_date);
        expenses.push({
          id: manualExpense.id,
          description: manualExpense.description,
          amount: manualExpense.amount,
          due_date: manualExpense.due_date,
          type: 'manual_future',
          category: manualExpense.category?.name || t('common.noCategory'),
          owner_user: manualExpense.owner_user,
          manualFutureExpenseId: manualExpense.id,
          isPaid: false,
          allowsPayment: true,
          dueStatus,
        });
      }

      // Processar pagamentos futuros da nova tabela (apenas gastos recorrentes legados)
      if (futurePayments) {
        for (const payment of futurePayments) {
          // Garantir que não processamos parcelas de cartão (double check)
          if (payment.installment_transaction_id || payment.expense_source_type === 'installment') {
            continue;
          }
          
          // Ignorar pagamentos de cartão (gerenciados separadamente)
          if (payment.expense_source_type === 'card_payment') {
            continue;
          }
          
          // Filtrar por viewMode
          const shouldInclude = viewMode === "both" || 
            (viewMode === "user1" && payment.owner_user === 'user1') ||
            (viewMode === "user2" && payment.owner_user === 'user2');
            
          if (!shouldInclude) continue;
          
          const isPaid = await isExpensePaid(payment.recurring_expense_id, null, payment.original_due_date);
          
          if (isPaid) continue;
          
          // Buscar nome da categoria
          let categoryName = t('common.noCategory');
          if (payment.category_id) {
            const { data: categoryData } = await supabase
              .from('categories')
              .select('name')
              .eq('id', payment.category_id)
              .maybeSingle();
            if (categoryData) {
              categoryName = categoryData.name;
            }
          }
          
          expenses.push({
            id: `legacy-${payment.id}`, // Prefixo para evitar conflito de IDs
            description: payment.description,
            amount: payment.amount,
            due_date: payment.original_due_date,
            type: 'recurring',
            category: categoryName,
            owner_user: payment.owner_user,
            recurringExpenseId: payment.recurring_expense_id,
            isPaid: false,
            allowsPayment: true,
          });
        }
      }

      // Adicionar parcelas pendentes (status = 'pending') da tabela transactions
      for (const installment of pendingInstallments || []) {
        // Filtrar por viewMode se necessário
        const ownerUser = installment.cards?.owner_user || installment.owner_user;
        const shouldInclude = viewMode === "both" || 
          (viewMode === "user1" && ownerUser === 'user1') ||
          (viewMode === "user2" && ownerUser === 'user2');
          
        if (!shouldInclude) continue;

        const installmentNumber = installment.installment_number || 1;
        const totalInstallments = installment.total_installments || 1;

        // Parcelas de cartão de crédito NÃO devem ter botão de pagamento (são processadas automaticamente)
        const allowsPayment = false;
        
        expenses.push({
          id: installment.id,
          description: installment.description,
          amount: installment.amount,
          due_date: installment.due_date, // Usar due_date ao invés de transaction_date
          type: 'installment',
          category: installment.categories?.name || t('common.noCategory'),
          card_name: installment.cards?.name,
          installment_info: `${installment.installment_number}/${installment.total_installments}`,
          owner_user: ownerUser,
          installmentTransactionId: installment.id,
          isPaid: false,
          allowsPayment, // Parcelas de cartão de crédito não podem ser pagas individualmente
          currency: installment.currency as CurrencyCode,
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
            
            // Skip paid recurring expenses
            if (!isPaid) {
              expenses.push({
                id: `${recur.id}-installment-${installmentCount}`,
                description: recur.name,
                amount: recur.amount,
                due_date: dueDate,
                type: 'recurring',
                category: recur.categories?.name || t('common.noCategory'),
                card_name: recur.cards?.name || recur.accounts?.name,
                owner_user: recur.cards?.owner_user || recur.owner_user,
                recurringExpenseId: recur.id,
                isPaid: false,
                allowsPayment: true, // Gastos recorrentes PODEM ser pagos
              });
            }
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
          // Filtrar por viewMode se necessário
          const ownerUser = cardTransaction.cards?.owner_user || cardTransaction.owner_user;
          const shouldIncludeViewMode = viewMode === "both" || 
            (viewMode === "user1" && ownerUser === 'user1') ||
            (viewMode === "user2" && ownerUser === 'user2');
            
          if (shouldIncludeViewMode) {
            expenses.push({
              id: `transaction-${cardTransaction.id}`,
              description: cardTransaction.description,
              amount: cardTransaction.amount,
              due_date: cardTransaction.transaction_date,
              type: 'card_transaction',
              category: cardTransaction.categories?.name || t('common.noCategory'),
              card_name: cardTransaction.cards?.name,
              owner_user: ownerUser,
              allowsPayment: false, // Transações do cartão NÃO podem ser pagas individualmente
            });
          }
        }
      }

      // Adicionar vencimentos de cartões com cálculo baseado na data de fechamento (COM botão de pagar)
      for (const card of cards || []) {
        // Filtrar por viewMode se necessário
        const shouldInclude = viewMode === "both" || 
          (viewMode === "user1" && card.owner_user === 'user1') ||
          (viewMode === "user2" && card.owner_user === 'user2');
          
        if (shouldInclude && card.due_date) {
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
              currency: card.currency as CurrencyCode, // Add card's currency
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

      // Ordenar por prioridade: vencidos primeiro, depois por data
      expensesForList.sort((a, b) => {
        // Primeiro, gastos vencidos
        if (a.dueStatus === 'overdue' && b.dueStatus !== 'overdue') return -1;
        if (b.dueStatus === 'overdue' && a.dueStatus !== 'overdue') return 1;
        
        // Depois, gastos de hoje
        if (a.dueStatus === 'today' && b.dueStatus === 'future') return -1;
        if (b.dueStatus === 'today' && a.dueStatus === 'future') return 1;
        
        // Por último, ordenar por data
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      });

      // Agrupar gastos por mês
      const groupedExpenses = groupExpensesByMonth(expensesForList);
      
      // Armazenar todos os conjuntos
      setFutureExpenses(expensesForList);
      setAllFutureExpenses(expensesForCalendar);
      setMonthlyGroups(groupedExpenses);
    } catch (error) {
      console.error("Error fetching future expenses:", error);
      toast.error("Erro ao carregar gastos futuros");
    } finally {
      setLoading(false);
    }
  };

  const groupExpensesByMonth = (expenses: FutureExpense[]): MonthlyExpenseGroup[] => {
    const groups: { [key: string]: FutureExpense[] } = {};
    
    expenses.forEach(expense => {
      const date = new Date(expense.due_date);
      const monthKey = format(date, 'yyyy-MM');
      
      if (!groups[monthKey]) {
        groups[monthKey] = [];
      }
      groups[monthKey].push(expense);
    });

    return Object.keys(groups)
      .sort()
      .map(monthKey => {
        const [year, month] = monthKey.split('-').map(Number);
        const date = new Date(year, month - 1, 1);
        const monthLabel = date.toLocaleDateString('pt-BR', { 
          month: 'long', 
          year: 'numeric' 
        });
        
        const expenses = groups[monthKey];
        const total = sumExpensesInBRL(expenses);
        
        return {
          monthKey,
          monthLabel: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1),
          expenses,
          total
        };
      });
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

  const formatCurrency = (value: number, currency?: CurrencyCode) => {
    if (currency && currency !== 'BRL') {
      // For non-BRL currencies, show the original currency
      return formatCurrencyWithConverter(value, currency);
    }
    // Default BRL formatting
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
  
  // Filtrar grupos mensais por categoria
  const filteredMonthlyGroups = monthlyGroups.map(group => ({
    ...group,
    expenses: selectedCategory === "all" 
      ? group.expenses 
      : group.expenses.filter(expense => expense.category === selectedCategory),
    total: selectedCategory === "all" 
      ? group.total 
      : sumExpensesInBRL(group.expenses.filter(expense => expense.category === selectedCategory))
  })).filter(group => group.expenses.length > 0);

  const totalAmount = filteredMonthlyGroups.reduce((sum, group) => sum + group.total, 0);

  const getExportTitle = () => {
    const categoryLabel = selectedCategory === "all" ? "todas-categorias" : selectedCategory.toLowerCase().replace(/\s+/g, '-');
    return `gastos-futuros-${categoryLabel}`;
  };

  // Achatar lista para exportação
  const allFilteredExpenses = filteredMonthlyGroups.flatMap(group => group.expenses);

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
          
          <Button 
            onClick={() => setAddExpenseModal(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            {t('futureExpenses.addFutureExpense')}
          </Button>
          
          {/* Actions - Responsive layout */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {/* Export Utils */}
            {allFilteredExpenses.length > 0 && (
              <ExportUtils
                data={allFilteredExpenses.map(expense => ({
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
                  const mappedExpense = allFilteredExpenses.find(exp => exp.id === item.id);
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
                  const mappedExpense = allFilteredExpenses.find(exp => exp.id === item.id);
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

        {filteredMonthlyGroups.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{t('monthlyExpenses.noFutureExpenses')}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredMonthlyGroups.map((monthGroup) => (
              <div key={monthGroup.monthKey} className="space-y-3">
                {/* Cabeçalho do Mês */}
                <div className="flex items-center justify-between bg-muted/50 rounded-lg p-4 border">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-primary" />
                    <div>
                      <h4 className="text-lg font-semibold text-foreground">
                        {monthGroup.monthLabel}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {monthGroup.expenses.length} {monthGroup.expenses.length === 1 ? t('futureExpenses.expensesSingular') : t('futureExpenses.expensesPlural')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="secondary" className="text-base px-3 py-1">
                      Total: {formatCurrency(monthGroup.total)}
                    </Badge>
                  </div>
                </div>

                {/* Gastos do Mês */}
                <div className="space-y-3 pl-4">
                  {monthGroup.expenses.map((expense) => {
              // Função para determinar classe do card baseado no status de vencimento
              const getCardClassName = (expense: FutureExpense) => {
                if (expense.dueStatus === 'overdue') {
                  return 'p-4 border-danger bg-danger/5 shadow-lg border-2 animate-pulse';
                } else if (expense.dueStatus === 'today') {
                  return 'p-4 border-warning bg-warning/5 border-2';
                } else {
                  return 'p-4';
                }
              };

              // Função para ícone de status
              const getStatusIcon = (expense: FutureExpense) => {
                if (expense.dueStatus === 'overdue') {
                  return <AlertCircle className="h-4 w-4 text-danger" />;
                } else if (expense.dueStatus === 'today') {
                  return <Clock className="h-4 w-4 text-warning" />;
                }
                return null;
              };

              // Função para badge de status
              const getStatusBadge = (expense: FutureExpense) => {
                if (expense.dueStatus === 'overdue') {
                  return (
                    <Badge className="bg-danger text-danger-foreground">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {t('futureExpenses.overdue')}
                    </Badge>
                  );
                } else if (expense.dueStatus === 'today') {
                  return (
                    <Badge className="bg-warning text-warning-foreground">
                      <Clock className="h-3 w-3 mr-1" />
                      {t('futureExpenses.dueToday')}
                    </Badge>
                  );
                }
                return null;
              };

                    return (
                      <Card key={expense.id} className={getCardClassName(expense)}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {getTypeIcon(expense.type)}
                            {getStatusIcon(expense)}
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-medium">{expense.description}</h4>
                                {getStatusBadge(expense)}
                                
                                {/* Indicador de parcela - Fase 6 */}
                                {expense.installment_info && (
                                  <Badge variant="outline" className="text-xs whitespace-nowrap bg-primary/10 text-primary border-primary/20">
                                    Parcela {expense.installment_info}
                                  </Badge>
                                )}
                                
                                <Badge className={getTypeColor(expense.type)}>
                                  {getTypeLabel(expense.type)}
                                </Badge>
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
                                {formatCurrency(expense.amount, expense.currency)}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              {expense.isPaid ? (
                                <Badge variant="default" className="bg-success text-success-foreground">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  {t('futureExpenses.paid')}
                                </Badge>
                              ) : expense.allowsPayment === false ? (
                                // Transações do cartão - apenas informativo, SEM botão
                                <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-300">
                                  <Receipt className="h-3 w-3 mr-1" />
                                  {t('futureExpenses.cardExpense')}
                                </Badge>
                              ) : (
                                // Cartões de crédito, gastos recorrentes e parcelas - COM botão
                                <Button
                                  size="sm"
                                  onClick={() => handlePayExpense(expense)}
                                  className="flex items-center gap-2"
                                  variant={expense.dueStatus === 'overdue' ? 'default' : 'default'}
                                >
                                  <Receipt className="h-4 w-4" />
                                  {expense.dueStatus === 'overdue' ? t('futureExpenses.payUrgentButton') : t('futureExpenses.payButton')}
                                </Button>
                              )}
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

      {/* Add Expense Modal */}
      <AddFutureExpenseModal
        isOpen={addExpenseModal}
        onClose={() => setAddExpenseModal(false)}
        onSuccess={handlePaymentSuccess}
      />
    </Card>
  );
};