import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, CreditCard, AlertCircle, DollarSign, CheckCircle, Receipt, Plus, Clock } from "lucide-react";
import { toast } from "sonner";
import { usePartnerNames } from "@/hooks/usePartnerNames";
import { useCouple } from "@/hooks/useCouple";
import { useLanguage } from "@/hooks/useLanguage";
import { format } from 'date-fns';
import { parseLocalDate } from "@/utils/date";
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
  purchase_date?: string; // Data da compra para parcelas
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
  const [categoryOptions, setCategoryOptions] = useState<{ key: string; name: string; ids: string[] }[]>([]);
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
      fetchCategories();
    }
  }, [user, viewMode]);

  const fetchCategories = async () => {
    try {
      // Scope categories to the current user and partner (if any)
      const { data: coupleData } = await supabase
        .from('user_couples')
        .select('user1_id, user2_id')
        .or(`user1_id.eq.${user?.id},user2_id.eq.${user?.id}`)
        .eq('status', 'active')
        .maybeSingle();

      let userIds = [user?.id];
      if (coupleData) {
        userIds = [coupleData.user1_id, coupleData.user2_id];
      }

      const { data, error } = await supabase
        .from('categories')
        .select('id, name, user_id')
        .eq('category_type', 'expense')
        .in('user_id', userIds)
        .order('name');

      if (error) throw error;
      const items = (data || []) as { id: string; name: string }[];
      const normalize = (s: string) =>
        s
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase()
          .replace(/\s+/g, ' ')
          .trim();
      const map = new Map<string, { key: string; name: string; ids: string[] }>();
      for (const it of items) {
        const key = normalize(it.name);
        if (!map.has(key)) map.set(key, { key, name: it.name, ids: [it.id] });
        else map.get(key)!.ids.push(it.id);
      }
      setCategoryOptions(Array.from(map.values()));
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast.error("Erro ao carregar categorias");
    }
  };

  const fetchFutureExpenses = async () => {
    if (!user) return;

    try {
      const now = new Date();
      const futureDate = new Date();
      futureDate.setMonth(futureDate.getMonth() + 12); // 12 meses no futuro para o calendário
      
      // Data limite para a lista de gastos futuros (3 meses no futuro)
      const listLimitDate = new Date();
      listLimitDate.setMonth(listLimitDate.getMonth() + 3);
      listLimitDate.setDate(new Date(listLimitDate.getFullYear(), listLimitDate.getMonth() + 1, 0).getDate()); // Último dia do 3º mês

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

      // Calcular início do PRÓXIMO mês (excluir parcelas do mês atual)
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      nextMonth.setDate(1);

      // Buscar parcelas de cartão PENDING para exibição informativa (SEM botão de pagar)
      // APENAS do PRÓXIMO mês em diante (não duplicar com Gastos Atuais)
      const { data: cardTransactions, error: cardTransactionsError } = await supabase
        .from("transactions")
        .select(`
          *,
          categories(name),
          cards(name, owner_user, card_type)
        `)
        .in("user_id", userIds)
        .eq("type", "expense")
        .eq("status", "pending")
        .not("card_id", "is", null)
        .eq('cards.card_type', 'credit')
        .gte("due_date", format(nextMonth, 'yyyy-MM-dd'))
        .lte("due_date", format(futureDate, 'yyyy-MM-dd'))
        .order("due_date", { ascending: true });

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

      // REMOVIDO: Parcelas individuais não devem aparecer em Despesas Futuras
      // As parcelas de cartão de crédito são agrupadas no vencimento do cartão (ver linhas ~414-447)
      // O valor total das parcelas + compras à vista é calculado em calculateCardPaymentAmount

      // Adicionar gastos recorrentes - CALCULAR TODAS AS PARCELAS FUTURAS
      for (const recur of recurring || []) {
        // Filtrar por viewMode se necessário
        const shouldInclude = viewMode === "both" || 
          (viewMode === "user1" && recur.owner_user === 'user1') ||
          (viewMode === "user2" && recur.owner_user === 'user2');
          
        if (!shouldInclude) continue;

        // Calcular todas as ocorrências futuras para os próximos 12 meses
        let currentDueDate = parseLocalDate(recur.next_due_date);
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
          const nextDate = new Date(currentDueDate);
          nextDate.setDate(nextDate.getDate() + recur.frequency_days);
          currentDueDate = nextDate;
          installmentCount++;
        }
      }

      // Adicionar parcelas de cartão de crédito PENDING (apenas informativo, SEM botão de pagar)
      const addedTransactionIds = new Set<string>(); // Evitar duplicatas
      
      for (const cardTransaction of cardTransactions || []) {
        // Evitar duplicatas - verificar se já adicionamos esta transação
        if (addedTransactionIds.has(cardTransaction.id)) {
          console.log(`[FUTURE EXPENSES] Transação duplicada ignorada: ${cardTransaction.id}`);
          continue;
        }
        
        const isInstallment = cardTransaction.is_installment;
        const installmentNumber = cardTransaction.installment_number || 1;
        const totalInstallments = cardTransaction.total_installments || 1;
        const isCreditCard = cardTransaction.cards?.card_type === 'credit';
        
        // Ignorar cartões de débito
        if (!isCreditCard || cardTransaction.payment_method === 'debit_card') {
          continue;
        }
        
        // Filtrar por viewMode
        const ownerUser = cardTransaction.cards?.owner_user || cardTransaction.owner_user;
        const shouldIncludeViewMode = viewMode === "both" || 
          (viewMode === "user1" && ownerUser === 'user1') ||
          (viewMode === "user2" && ownerUser === 'user2');
          
        if (shouldIncludeViewMode) {
          const dueStatus = getDueStatus(cardTransaction.due_date);
          
          // Criar string de informação de parcela
          const installmentInfo = isInstallment 
            ? `${installmentNumber}/${totalInstallments}`
            : undefined;
          
          // Marcar como adicionada
          addedTransactionIds.add(cardTransaction.id);
          
          expenses.push({
            id: cardTransaction.id, // Usar ID real da transação ao invés de prefixo
            description: cardTransaction.description,
            amount: cardTransaction.amount,
            due_date: cardTransaction.due_date,
            type: 'card_transaction',
            category: cardTransaction.categories?.name || t('common.noCategory'),
            card_name: cardTransaction.cards?.name,
            owner_user: ownerUser,
            installment_info: installmentInfo,
            allowsPayment: false, // NUNCA permite pagamento direto
            dueStatus,
            currency: cardTransaction.currency || 'BRL',
            installmentTransactionId: cardTransaction.id, // Manter referência
            purchase_date: cardTransaction.purchase_date, // Data da compra
          });
          
          console.log(`[FUTURE EXPENSES] Parcela adicionada: ${cardTransaction.description} (${installmentInfo}) - ${cardTransaction.id}`);
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
        parseLocalDate(expense.due_date) <= listLimitDate
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
        return parseLocalDate(a.due_date).getTime() - parseLocalDate(b.due_date).getTime();
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
      const date = parseLocalDate(expense.due_date);
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
  
  // Função para formatar moeda com conversão em PT
  const formatCurrencyWithConversion = (value: number, currency?: CurrencyCode) => {
    const currencyCode = currency || 'BRL';
    const mainValue = formatCurrencyWithConverter(value, currencyCode);
    
    // Se for PT e moeda diferente de BRL, mostrar conversão
    if (language === 'pt' && currencyCode !== 'BRL') {
      const convertedValue = convertCurrency(value, currencyCode, 'BRL');
      const convertedFormatted = formatCurrencyWithConverter(convertedValue, 'BRL');
      return { main: mainValue, converted: convertedFormatted };
    }
    
    return { main: mainValue, converted: null };
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
          currency: expense.currency, // Add currency info
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

  // Filtrar grupos mensais por categoria usando nomes traduzidos
  const filteredMonthlyGroups = monthlyGroups.map(group => ({
    ...group,
    expenses: selectedCategory === "all" 
      ? group.expenses 
      : group.expenses.filter(expense => {
          // Find the category option that matches the selected key
          const opt = categoryOptions.find(o => o.key === selectedCategory);
          // Match by translated category name
          return opt?.name && translateCategory(expense.category) === translateCategory(opt.name);
        }),
    total: selectedCategory === "all" 
      ? group.total 
      : sumExpensesInBRL(group.expenses.filter(expense => {
          const opt = categoryOptions.find(o => o.key === selectedCategory);
          return opt?.name && translateCategory(expense.category) === translateCategory(opt.name);
        }))
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
        <div className="flex flex-col gap-4">
          {/* Linha 1: Título e Ações principais */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">{t('monthlyExpenses.futureExpenses')}</h3>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <FutureExpensesCalendar 
                expenses={allFutureExpenses} 
                getOwnerName={getOwnerName}
              />
              
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
              
              <Button 
                onClick={() => setAddExpenseModal(true)}
                className="flex items-center gap-2"
                size="sm"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">{t('futureExpenses.addFutureExpense')}</span>
                <span className="sm:hidden">Adicionar</span>
              </Button>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Label htmlFor="category-select" className="text-sm font-medium">
            {t('monthlyExpenses.category')}:
          </Label>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger id="category-select" className="w-full sm:w-[280px]">
              <SelectValue placeholder={t('monthlyExpenses.selectCategory')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('monthlyExpenses.allFilter')}</SelectItem>
              {categoryOptions.map((opt) => (
                <SelectItem key={opt.key} value={opt.key}>
                  {translateCategory(opt.name)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Total Geral - Destacado */}
        {filteredMonthlyGroups.length > 0 && (
          <Card className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border-primary/20">
            <div className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 sm:p-3 bg-primary/10 rounded-full flex-shrink-0">
                    <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-muted-foreground">
                      {t('monthlyExpenses.totalFuture')}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {selectedCategory === "all" 
                        ? t('monthlyExpenses.allFilter')
                        : translateCategory(selectedCategory)
                      }
                    </p>
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-primary break-words">
                    {formatCurrency(totalAmount)}
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {filteredMonthlyGroups.reduce((sum, g) => sum + g.expenses.length, 0)} {t('futureExpenses.expensesPlural')}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        )}

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
                        {/* Layout Mobile-First: Coluna em mobile, linha em desktop */}
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                          {/* Seção de Informações */}
                          <div className="flex items-start gap-3 flex-1">
                            <div className="flex gap-2 mt-1">
                              {getTypeIcon(expense.type)}
                              {getStatusIcon(expense)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-2">
                                <h4 className="font-medium text-sm sm:text-base">{expense.description}</h4>
                                {getStatusBadge(expense)}
                                
                                {/* Indicador de parcela - Traduzido */}
                                {expense.installment_info && (
                                  <Badge variant="outline" className="text-xs whitespace-nowrap bg-primary/10 text-primary border-primary/20">
                                    {t('installment')} {expense.installment_info}
                                  </Badge>
                                )}
                                
                                <Badge className={getTypeColor(expense.type)}>
                                  {getTypeLabel(expense.type)}
                                </Badge>
                              </div>
                              <p className="text-xs sm:text-sm text-muted-foreground">
                                {expense.card_name && `${expense.card_name}`}{expense.card_name && expense.owner_user && ` • `}{expense.owner_user && `${getOwnerName(expense.owner_user)}`}
                              </p>
                              <div className="space-y-0.5">
                                <p className="text-xs sm:text-sm text-muted-foreground">
                                  {t('monthlyExpenses.dueDate')}: {formatDate(expense.due_date)}
                                </p>
                                {expense.installment_info && expense.purchase_date && (
                                  <p className="text-xs text-muted-foreground/80">
                                    Compra: {formatDate(expense.purchase_date)}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          {/* Seção de Valor e Ação */}
                          <div className="flex items-center justify-between gap-3 lg:flex-col lg:items-end lg:gap-2">
                            <div className="text-left lg:text-right space-y-1">
                              {(() => {
                                const formatted = formatCurrencyWithConversion(expense.amount, expense.currency);
                                return (
                                  <>
                                    <p className="font-semibold text-lg sm:text-xl text-destructive">
                                      {formatted.main}
                                    </p>
                                    {formatted.converted && (
                                      <p className="text-xs sm:text-sm text-muted-foreground">
                                        ≈ {formatted.converted}
                                      </p>
                                    )}
                                  </>
                                );
                              })()}
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {expense.isPaid ? (
                                <Badge variant="default" className="bg-success text-success-foreground whitespace-nowrap">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  <span className="hidden sm:inline">{t('futureExpenses.paid')}</span>
                                  <span className="sm:hidden">✓</span>
                                </Badge>
                              ) : expense.allowsPayment === false ? (
                                // Transações do cartão - apenas informativo, SEM botão
                                <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-300 whitespace-nowrap text-xs">
                                  <Receipt className="h-3 w-3 mr-1" />
                                  <span className="hidden sm:inline">{t('futureExpenses.cardExpense')}</span>
                                  <span className="sm:hidden">Cartão</span>
                                </Badge>
                              ) : (
                                // Cartões de crédito, gastos recorrentes e parcelas - COM botão
                                <Button
                                  size="sm"
                                  onClick={() => handlePayExpense(expense)}
                                  className="flex items-center gap-1 whitespace-nowrap"
                                  variant={expense.dueStatus === 'overdue' ? 'default' : 'default'}
                                >
                                  <Receipt className="h-3 w-3 sm:h-4 sm:w-4" />
                                  <span className="hidden sm:inline">
                                    {expense.dueStatus === 'overdue' ? t('futureExpenses.payUrgentButton') : t('futureExpenses.payButton')}
                                  </span>
                                  <span className="sm:hidden">Pagar</span>
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