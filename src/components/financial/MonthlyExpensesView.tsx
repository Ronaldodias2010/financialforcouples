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
import { translateCategoryName as translateCategoryUtil } from "@/utils/categoryTranslation";
import { format } from "date-fns";
import { ptBR, enUS, es } from "date-fns/locale";
import { FutureExpensesView } from "./FutureExpensesView";
import { formatLocalDate, getLocaleForLanguage } from "@/utils/date";
import { ExportUtils } from "./ExportUtils";

interface Transaction {
  id: string;
  type: "income" | "expense";
  amount: number;
  description: string;
  category_id: string;
  account_id?: string;
  subcategory?: string;
  transaction_date: string; // para cartão, representa o vencimento
  purchase_date?: string; // data real da compra
  payment_method: string;
  card_id?: string;
  user_id: string;
  owner_user?: string;
  is_installment?: boolean;
  total_installments?: number | null;
  installment_number?: number | null;
  created_at?: string;
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
        
        // Skip "Veículo" (singular) in favor of "Veículos" (plural)
        if (key === 'veiculo' && items.some(item => normalize(item.name) === 'veiculos')) {
          continue;
        }
        
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
        .eq('type', 'expense')
        .or(`and(payment_method.neq.credit_card,transaction_date.gte.${startDate},transaction_date.lte.${endDate}),and(payment_method.eq.credit_card,purchase_date.gte.${startDate},purchase_date.lte.${endDate})`)
        .order('purchase_date', { ascending: false });

if (selectedCategory !== "all") {
        const opt = categoryOptions.find(o => o.key === selectedCategory);
        if (opt && opt.ids.length) {
          query = query.in('category_id', opt.ids);
        }
      }

      const { data, error } = await query;

      if (error) throw error;
      
      let filteredData = data || [];
      
      // Apply user filter based on viewMode using user_id mapping to couple
      if (viewMode !== "both" && couple) {
        filteredData = filteredData.filter(transaction => {
          let owner: 'user1' | 'user2' = 'user1';
          if (transaction.user_id === couple.user1_id) owner = 'user1';
          else if (transaction.user_id === couple.user2_id) owner = 'user2';
          return owner === viewMode;
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
    return formatLocalDate(dateString, "dd/MM/yyyy", language as 'pt' | 'en' | 'es');
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
                        {translateCategoryUtil(opt.name, language)}
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
              <ExportUtils
                data={transactions}
                filename={(() => {
                  const [year, month] = selectedMonth.split('-').map(Number);
                  const monthDate = new Date(year, month - 1, 1);
                  const monthLabel = format(monthDate, "MMMM-yyyy", { locale: getLocale() });
                  const categoryLabel = selectedCategory === 'all' ? 'todas-categorias' : selectedCategory;
                  return `gastos-${monthLabel}-${categoryLabel}`;
                })()}
                headers={[
                  t('monthlyExpenses.date'),
                  t('monthlyExpenses.description'), 
                  t('monthlyExpenses.category'),
                  'Subcategoria',
                  t('monthlyExpenses.performedBy'),
                  t('monthlyExpenses.payment'),
                  'Conta/Cartão',
                  t('monthlyExpenses.amount')
                ]}
                tableHeaders={[
                  t('monthlyExpenses.date'),
                  t('monthlyExpenses.description'),
                  t('monthlyExpenses.category'),
                  t('monthlyExpenses.pdfUser'),
                  t('monthlyExpenses.pdfPaymentMethod'),
                  t('monthlyExpenses.amount')
                ]}
                formatRowForCSV={(transaction) => [
                  formatDate(transaction.purchase_date || transaction.transaction_date),
                  transaction.description,
                  translateCategoryName(transaction.categories?.name || 'N/A', language as 'pt' | 'en' | 'es'),
                  '',
                  getUserName(transaction.owner_user || 'user1'),
                  getPaymentMethodText(transaction.payment_method),
                  transaction.cards?.name || transaction.accounts?.name || '',
                  formatCurrency(transaction.amount)
                ]}
                formatRowForPDF={(transaction) => [
                  formatDate(transaction.purchase_date || transaction.transaction_date),
                  transaction.description.length > 25 ? transaction.description.substring(0, 25) + '...' : transaction.description,
                  translateCategoryName(transaction.categories?.name || 'N/A', language as 'pt' | 'en' | 'es'),
                  getUserName(transaction.owner_user || 'user1'),
                  getPaymentMethodText(transaction.payment_method),
                  formatCurrency(transaction.amount)
                ]}
                title={t('monthlyExpenses.pdfTitle')}
                additionalInfo={(() => {
                  const [year, month] = selectedMonth.split('-').map(Number);
                  const monthDate = new Date(year, month - 1, 1);
                  const labelFormat = language === 'en' ? "MMMM yyyy" : language === 'es' ? "MMMM 'de' yyyy" : "MMMM 'de' yyyy";
                  const monthLabel = format(monthDate, labelFormat, { locale: getLocale() });
                  const categoryLabel = selectedCategory === 'all' ? t('monthlyExpenses.allCategories') : 
                    translateCategoryName(categoryOptions.find(opt => opt.key === selectedCategory)?.name || selectedCategory, language as 'pt' | 'en' | 'es');
                  
                  return [
                    { label: t('monthlyExpenses.pdfPeriod'), value: monthLabel },
                    { label: t('monthlyExpenses.category'), value: categoryLabel },
                    { label: t('monthlyExpenses.pdfTotalExpenses'), value: formatCurrency(totalExpenses) }
                  ];
                })()}
              />
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
                        <p>{t('monthlyExpenses.category')}: {translateCategoryUtil(transaction.categories?.name || 'N/A', language)}</p>
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
                        <p>{t('monthlyExpenses.purchaseDate')}: {formatDate(transaction.purchase_date || transaction.transaction_date)}</p>
                        {transaction.payment_method === 'credit_card' && (
                          <p>{t('monthlyExpenses.dueDate')}: {formatDate(transaction.transaction_date)}</p>
                        )}
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