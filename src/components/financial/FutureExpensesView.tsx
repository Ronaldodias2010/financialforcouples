import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, CreditCard, AlertCircle, DollarSign, Download, FileText } from "lucide-react";
import { toast } from "sonner";
import { usePartnerNames } from "@/hooks/usePartnerNames";
import { useCouple } from "@/hooks/useCouple";
import { useLanguage } from "@/hooks/useLanguage";
import { format } from 'date-fns';
import { FutureExpensesCalendar } from "./FutureExpensesCalendar";
import { translateCategoryName } from '@/utils/categoryTranslation';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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
  const { t, language } = useLanguage();
  const [futureExpenses, setFutureExpenses] = useState<FutureExpense[]>([]);
  const [allFutureExpenses, setAllFutureExpenses] = useState<FutureExpense[]>([]);
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

      // Adicionar gastos recorrentes - CALCULAR TODAS AS PARCELAS FUTURAS
      recurring?.forEach(recur => {
        // Filtrar por viewMode se necessário
        const shouldInclude = viewMode === "both" || 
          (viewMode === "user1" && recur.owner_user === 'user1') ||
          (viewMode === "user2" && recur.owner_user === 'user2');
          
        if (!shouldInclude) return;

        // Calcular todas as ocorrências futuras para os próximos 12 meses
        let currentDueDate = new Date(recur.next_due_date);
        let installmentCount = 0;
        const maxInstallments = recur.contract_duration_months || 120; // Default para 10 anos se não houver duração
        
        while (currentDueDate <= futureDate && installmentCount < maxInstallments) {
          // Só adicionar se a data é no futuro ou hoje
          if (currentDueDate >= now) {
            expenses.push({
              id: `${recur.id}-installment-${installmentCount}`,
              description: recur.name,
              amount: recur.amount,
              due_date: format(currentDueDate, 'yyyy-MM-dd'),
              type: 'recurring',
              category: recur.categories?.name || 'Sem categoria',
              card_name: recur.cards?.name || recur.accounts?.name,
              owner_user: recur.cards?.owner_user || recur.owner_user
            });
          }
          
          // Calcular próxima data de vencimento
          currentDueDate = new Date(currentDueDate);
          currentDueDate.setDate(currentDueDate.getDate() + recur.frequency_days);
          installmentCount++;
        }
      });

      // Adicionar vencimentos de cartões com cálculo baseado na data de fechamento
      for (const card of cards || []) {
        if (card.due_date) {
          const paymentAmount = await calculateCardPaymentAmount(card, user.id);
          if (paymentAmount > 0) {
            const nextDueDate = getNextDueDate(card.due_date);
            expenses.push({
              id: `card-${card.id}`,
              description: `${t('transactionForm.creditCardPayment')} ${card.name}`,
              amount: paymentAmount,
              due_date: nextDueDate,
              type: 'card_payment',
              category: t('transactionForm.creditCard'),
              card_name: card.name,
              owner_user: card.owner_user
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

  const categories = Array.from(new Set(futureExpenses.map(expense => expense.category)));
  const filteredExpenses = selectedCategory === "all" 
    ? futureExpenses 
    : futureExpenses.filter(expense => expense.category === selectedCategory);

  const totalAmount = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);

  const exportToCSV = () => {
    console.log('🔽 Iniciando exportação CSV...');
    console.log('Filtered expenses:', filteredExpenses.length);
    
    if (filteredExpenses.length === 0) {
      toast.error("Não há dados para exportar");
      return;
    }

    try {
      const headers = [
        t('futureExpenses.description'),
        t('futureExpenses.amount'),
        t('futureExpenses.dueDate'),
        t('futureExpenses.category'),
        t('futureExpenses.type'),
        t('futureExpenses.owner')
      ];

      const csvData = filteredExpenses.map(expense => [
        expense.description,
        formatCurrency(expense.amount),
        formatDate(expense.due_date),
        translateCategory(expense.category),
        getTypeLabel(expense.type),
        expense.owner_user ? getOwnerName(expense.owner_user) : ''
      ]);

      const csvContent = [headers, ...csvData]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');

      // Adicionar BOM para suporte a caracteres especiais
      const BOM = '\uFEFF';
      const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      const categoryLabel = selectedCategory === "all" ? "todas-categorias" : selectedCategory.toLowerCase().replace(/\s+/g, '-');
      
      link.setAttribute('href', url);
      link.setAttribute('download', `gastos-futuros-${categoryLabel}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Limpar URL após download
      setTimeout(() => URL.revokeObjectURL(url), 100);
      
      console.log('✅ CSV exportado com sucesso');
      toast.success("Arquivo CSV exportado com sucesso");
    } catch (error) {
      console.error('❌ Erro ao exportar CSV:', error);
      toast.error("Erro ao exportar CSV");
    }
  };

  const exportToPDF = () => {
    console.log('🔽 Iniciando exportação PDF...');
    console.log('Filtered expenses:', filteredExpenses.length);
    
    if (filteredExpenses.length === 0) {
      toast.error("Não há dados para exportar");
      return;
    }

    try {
      const doc = new jsPDF();
      
      // Título
      doc.setFontSize(18);
      doc.text(t('futureExpenses.pdfTitle'), 20, 20);
      
      // Subtítulo com total
      doc.setFontSize(12);
      const categoryLabel = selectedCategory === "all" ? t('monthlyExpenses.allFilter') : translateCategory(selectedCategory);
      doc.text(`${t('futureExpenses.category')}: ${categoryLabel}`, 20, 35);
      doc.text(`${t('futureExpenses.total')}: ${formatCurrency(totalAmount)}`, 20, 45);
      
      // Tabela
      const tableColumns = [
        t('futureExpenses.description'),
        t('futureExpenses.amount'),
        t('futureExpenses.dueDate'),
        t('futureExpenses.category'),
        t('futureExpenses.type'),
        t('futureExpenses.owner')
      ];
      
      const tableRows = filteredExpenses.map(expense => [
        expense.description,
        formatCurrency(expense.amount),
        formatDate(expense.due_date),
        translateCategory(expense.category),
        getTypeLabel(expense.type),
        expense.owner_user ? getOwnerName(expense.owner_user) : ''
      ]);

      autoTable(doc, {
        head: [tableColumns],
        body: tableRows,
        startY: 55,
        styles: {
          fontSize: 8,
          cellPadding: 3,
        },
        headStyles: {
          fillColor: [66, 102, 241],
          textColor: 255,
        },
        alternateRowStyles: {
          fillColor: [245, 247, 250],
        },
      });

      const fileName = `gastos-futuros-${categoryLabel.toLowerCase().replace(/\s+/g, '-')}.pdf`;
      console.log('📁 Nome do arquivo PDF:', fileName);
      
      try {
        doc.save(fileName);
      } catch (e) {
        console.warn('doc.save falhou, tentando fallback com Blob URL...', e);
        const pdfBlob = doc.output('blob');
        const url = URL.createObjectURL(pdfBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 100);
      }
      
      console.log('✅ PDF exportado com sucesso');
      toast.success("Arquivo PDF exportado com sucesso");
    } catch (error) {
      console.error('❌ Erro ao exportar PDF:', error);
      toast.error("Erro ao exportar PDF");
    }
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
            {/* Export buttons */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={exportToCSV}
                className="flex items-center gap-2 text-xs sm:text-sm"
              >
                <Download className="h-4 w-4" />
                <span className="hidden xs:inline">CSV</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={exportToPDF}
                className="flex items-center gap-2 text-xs sm:text-sm"
              >
                <FileText className="h-4 w-4" />
                <span className="hidden xs:inline">PDF</span>
              </Button>
            </div>
            
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