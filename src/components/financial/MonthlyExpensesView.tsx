import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { usePartnerNames } from "@/hooks/usePartnerNames";
import { useCouple } from "@/hooks/useCouple";
import { useLanguage } from "@/hooks/useLanguage";
import { format } from "date-fns";
import { ptBR, enUS, es } from "date-fns/locale";
import { FutureExpensesView } from "./FutureExpensesView";
import { Download, FileText } from "lucide-react";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Transaction {
  id: string;
  type: "income" | "expense";
  amount: number;
  description: string;
  category_id: string;
  account_id?: string;
  subcategory?: string;
  transaction_date: string; // para cartão, representa o vencimento
  payment_method: string;
  card_id?: string;
  user_id: string;
  owner_user?: string;
  is_installment?: boolean;
  total_installments?: number | null;
  installment_number?: number | null;
  categories?: {
    name: string;
  };
  cards?: {
    name: string;
    owner_user?: string;
    due_date?: number;
  };
  accounts?: {
    name: string;
  };
}

interface MonthlyExpensesViewProps {
  viewMode: "both" | "user1" | "user2";
}

const normalizeCategory = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

const EXPENSE_CATEGORY_TRANSLATIONS: Record<string, Record<string, string>> = {
  'en': {
    'pagamento de cartao de credito': 'Credit Card Payment',
    'transferencia': 'Transfer',
    'alimentacao': 'Food',
    'transporte': 'Transportation',
    'saude': 'Health',
    'educacao': 'Education',
    'entretenimento': 'Entertainment',
    'moradia': 'Housing',
    'vestuario': 'Clothing',
    'utilidades': 'Utilities',
    'compras': 'Shopping',
    'viagem': 'Travel',
    'aposentadoria': 'Retirement',
    'combustivel': 'Fuel',
    'conta basica': 'Basic Bills',
    'contas basicas': 'Basic Bills',
    'presente ou doacao': 'Gift or Donation',
    'reembolso': 'Refund',
  },
  'es': {
    'pagamento de cartao de credito': 'Pago de Tarjeta de Crédito',
    'transferencia': 'Transferencia',
    'alimentacao': 'Alimentación',
    'transporte': 'Transporte',
    'saude': 'Salud',
    'educacao': 'Educación',
    'entretenimento': 'Entretenimiento',
    'moradia': 'Vivienda',
    'vestuario': 'Ropa',
    'utilidades': 'Servicios',
    'compras': 'Compras',
    'viagem': 'Viaje',
    'aposentadoria': 'Jubilación',
    'combustivel': 'Combustible',
    'conta basica': 'Cuenta Básica',
    'contas basicas': 'Cuentas Básicas',
    'reembolso': 'Reembolso',
  }
};

const translateCategoryName = (name: string, lang: 'pt' | 'en' | 'es') => {
  if (lang === 'pt') return name;
  
  const key = normalizeCategory(name);
  const translations = EXPENSE_CATEGORY_TRANSLATIONS[lang];
  return translations?.[key] ?? name;
};

export const MonthlyExpensesView = ({ viewMode }: MonthlyExpensesViewProps) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "yyyy-MM"));
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [categoryOptions, setCategoryOptions] = useState<{ key: string; name: string; ids: string[] }[]>([]);
  const { toast } = useToast();
  const { user } = useAuth();
  const { names } = usePartnerNames();
  const { isPartOfCouple, couple } = useCouple();
  const { t, language } = useLanguage();

  useEffect(() => {
    fetchTransactions();
    fetchCategories();
  }, [selectedMonth, selectedCategory, viewMode]);

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
      toast({
        title: "Erro",
        description: "Não foi possível carregar as categorias",
        variant: "destructive",
      });
    }
  };

  const fetchTransactions = async () => {
    try {
      const startDate = `${selectedMonth}-01`;
      const endDate = `${selectedMonth}-31`;

      // Check if user is part of a couple to include partner's transactions
      const { data: coupleData } = await supabase
        .from("user_couples")
        .select("user1_id, user2_id")
        .or(`user1_id.eq.${user?.id},user2_id.eq.${user?.id}`)
        .eq("status", "active")
        .maybeSingle();

      let userIds = [user?.id];
      if (coupleData) {
        // Include both users' transactions
        userIds = [coupleData.user1_id, coupleData.user2_id];
      }

      let query = supabase
        .from('transactions')
        .select(`
          *,
          categories(name),
          cards(name, owner_user, due_date),
          accounts(name)
        `)
        .in('user_id', userIds)
        .gte('transaction_date', startDate)
        .lte('transaction_date', endDate)
        .eq('type', 'expense')
        .order('transaction_date', { ascending: false });

if (selectedCategory !== "all") {
        const opt = categoryOptions.find(o => o.key === selectedCategory);
        if (opt && opt.ids.length) {
          query = query.in('category_id', opt.ids);
        }
      }

      const { data, error } = await query;

      if (error) throw error;
      
      let filteredData = data || [];
      
      // Apply user filter based on viewMode
      if (viewMode !== "both" && isPartOfCouple) {
        filteredData = filteredData.filter(transaction => {
          const ownerUser = transaction.owner_user || 'user1';
          return ownerUser === viewMode;
        });
      }
      
      setTransactions(filteredData);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível carregar as transações",
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getLocale = () => {
    switch (language) {
      case 'en': return enUS;
      case 'es': return es;
      default: return ptBR;
    }
  };

  const formatDate = (dateString: string): string => {
    // Parse the date string manually to avoid timezone issues
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return format(date, "dd/MM/yyyy", { locale: getLocale() });
  };

  const getPaymentMethodText = (method: string) => {
    switch (method) {
      case 'cash': return t('transactionForm.cash');
      case 'credit_card': return t('transactionForm.creditCard');
      case 'debit_card': return t('transactionForm.debitCard');
      case 'payment_transfer': return t('transactionForm.paymentTransfer');
      case 'deposit': return t('transactionForm.deposit');
      case 'transfer': return t('transactionForm.receivedTransfer');
      case 'account_transfer': return t('transactionForm.accountTransfer');
      case 'account_investment': return t('transactionForm.accountInvestmentTransfer');
      default: return method;
    }
  };

  const getUserName = (ownerUser: string) => {
    if (!isPartOfCouple) return names.currentUserName;
    
    switch (ownerUser) {
      case 'user1':
        return names.user1Name;
      case 'user2':
        return names.user2Name;
      default:
        return 'Usuário';
    }
  };
  
  const getCardOwnerName = (ownerUser?: string) => {
    if (!ownerUser) return undefined;
    if (!isPartOfCouple) return names.currentUserName;
    return ownerUser === 'user1' ? names.user1Name : ownerUser === 'user2' ? names.user2Name : ownerUser;
  };

  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const exportToCSV = () => {
    if (transactions.length === 0) {
      toast({
        title: "Aviso",
        description: "Não há transações para exportar",
        variant: "destructive",
      });
      return;
    }

    const headers = [
      'Data',
      'Descrição',
      'Categoria',
      'Subcategoria',
      'Realizado por',
      'Pagamento',
      'Conta/Cartão',
      'Valor'
    ];

    const csvData = transactions.map(transaction => [
      formatDate(transaction.transaction_date),
      transaction.description,
      translateCategoryName(transaction.categories?.name || 'N/A', language as 'pt' | 'en' | 'es'),
      transaction.subcategory || '',
      getUserName(transaction.owner_user || 'user1'),
      getPaymentMethodText(transaction.payment_method),
      transaction.cards?.name || transaction.accounts?.name || '',
      formatCurrency(transaction.amount)
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    const [year, month] = selectedMonth.split('-').map(Number);
    const monthDate = new Date(year, month - 1, 1);
    const monthLabel = format(monthDate, "MMMM-yyyy", { locale: getLocale() });
    const categoryLabel = selectedCategory === 'all' ? 'todas-categorias' : selectedCategory;
    
    link.setAttribute('href', url);
    link.setAttribute('download', `gastos-${monthLabel}-${categoryLabel}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Sucesso",
      description: "Arquivo CSV exportado com sucesso",
    });
  };

  const exportToPDF = () => {
    if (transactions.length === 0) {
      toast({
        title: "Aviso",
        description: "Não há transações para exportar",
        variant: "destructive",
      });
      return;
    }

    const doc = new jsPDF();
    
    // Título
    doc.setFontSize(16);
    doc.text('Relatório de Gastos Mensais', 14, 20);
    
    // Informações do período
    const [year, month] = selectedMonth.split('-').map(Number);
    const monthDate = new Date(year, month - 1, 1);
    const labelFormat = language === 'en' ? "MMMM yyyy" : language === 'es' ? "MMMM 'de' yyyy" : "MMMM 'de' yyyy";
    const monthLabel = format(monthDate, labelFormat, { locale: getLocale() });
    const categoryLabel = selectedCategory === 'all' ? t('monthlyExpenses.allCategories') : 
      translateCategoryName(categoryOptions.find(opt => opt.key === selectedCategory)?.name || selectedCategory, language as 'pt' | 'en' | 'es');
    
    doc.setFontSize(12);
    doc.text(`Período: ${monthLabel}`, 14, 30);
    doc.text(`Categoria: ${categoryLabel}`, 14, 38);
    doc.text(`Total de Gastos: ${formatCurrency(totalExpenses)}`, 14, 46);
    
    // Tabela
    const tableData = transactions.map(transaction => [
      formatDate(transaction.transaction_date),
      transaction.description.length > 25 ? transaction.description.substring(0, 25) + '...' : transaction.description,
      translateCategoryName(transaction.categories?.name || 'N/A', language as 'pt' | 'en' | 'es'),
      getUserName(transaction.owner_user || 'user1'),
      getPaymentMethodText(transaction.payment_method),
      formatCurrency(transaction.amount)
    ]);

    autoTable(doc, {
      head: [['Data', 'Descrição', 'Categoria', 'Usuário', 'Pagamento', 'Valor']],
      body: tableData,
      startY: 55,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [66, 66, 66] },
    });

    const fileName = `gastos-${format(monthDate, "MMMM-yyyy", { locale: getLocale() })}-${categoryLabel.replace(/\s+/g, '-')}.pdf`;
    doc.save(fileName);

    toast({
      title: "Sucesso",
      description: "Arquivo PDF exportado com sucesso",
    });
  };

  return (
    <Tabs defaultValue="current" className="space-y-6">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="current">{t('monthlyExpenses.currentExpenses')}</TabsTrigger>
        <TabsTrigger value="future">{t('monthlyExpenses.futureExpenses')}</TabsTrigger>
      </TabsList>

      <TabsContent value="current">
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">{t('monthlyExpenses.title')}</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <Label>{t('monthlyExpenses.month')}</Label>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('monthlyExpenses.selectMonth')} />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => {
                      const date = new Date();
                      date.setMonth(date.getMonth() - i);
                      const value = format(date, "yyyy-MM");
                      const labelFormat = language === 'en' ? "MMMM yyyy" : language === 'es' ? "MMMM 'de' yyyy" : "MMMM 'de' yyyy";
                      const label = format(date, labelFormat, { locale: getLocale() });
                      return (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>{t('monthlyExpenses.category')}</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('monthlyExpenses.allCategories')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('monthlyExpenses.allCategories')}</SelectItem>
                    {categoryOptions.map((opt) => (
                      <SelectItem key={opt.key} value={opt.key}>
                        {translateCategoryName(opt.name, language as 'pt' | 'en' | 'es')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="p-4 bg-red-50 dark:bg-red-950 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">{t('monthlyExpenses.totalExpenses')}</p>
                <p className="text-2xl font-bold text-red-700 dark:text-red-300">
                  {formatCurrency(totalExpenses)}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-md font-semibold">{t('monthlyExpenses.periodTransactions')}</h4>
              {transactions.length > 0 && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exportToCSV}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    CSV
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exportToPDF}
                    className="flex items-center gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    PDF
                  </Button>
                </div>
              )}
            </div>
            
            {transactions.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                {t('monthlyExpenses.noTransactions')}
              </p>
            ) : (
              <div className="space-y-4">
                {transactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`inline-block w-2 h-2 rounded-full ${
                          transaction.type === 'income' ? 'bg-green-500' : 'bg-red-500'
                        }`} />
                        <span className="font-medium">{transaction.description}</span>
                        {transaction.is_installment && transaction.installment_number && transaction.total_installments ? (
                          <Badge variant="outline" className="ml-2">
                            {transaction.installment_number}/{transaction.total_installments}
                          </Badge>
                        ) : null}
                      </div>
                      
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>
                          <span className="font-medium text-primary">
                            {t('monthlyExpenses.performedBy')}: {getUserName(transaction.owner_user || 'user1')}
                          </span>
                        </p>
                        <p>{t('monthlyExpenses.category')}: {translateCategoryName(transaction.categories?.name || 'N/A', language as 'pt' | 'en' | 'es')}</p>
                        {transaction.subcategory && (
                          <p>{t('monthlyExpenses.subcategory')}: {transaction.subcategory}</p>
                        )}
                        <p>{t('monthlyExpenses.payment')}: {getPaymentMethodText(transaction.payment_method)}</p>
                        {transaction.payment_method !== 'dinheiro' && transaction.account_id && transaction.accounts?.name && (
                          <p>{t('monthlyExpenses.bankAccount')}: {transaction.accounts.name}</p>
                        )}
                        {transaction.cards?.name && (
                          <p>{t('monthlyExpenses.card')}: {transaction.cards.name}</p>
                        )}
                        {transaction.cards?.owner_user && (
                          <p>{t('monthlyExpenses.cardOwner')}: {getCardOwnerName(transaction.cards.owner_user)}</p>
                        )}
                        <p>{transaction.payment_method === 'credit_card' ? t('monthlyExpenses.dueDate') : t('monthlyExpenses.date')}: {formatDate(transaction.transaction_date)}</p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className={`text-lg font-semibold ${
                        transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="future">
        <FutureExpensesView viewMode={viewMode} />
      </TabsContent>
    </Tabs>
  );
};