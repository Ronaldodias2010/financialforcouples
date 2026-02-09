import { useState, useEffect } from "react";
import { useRealtimeTable } from '@/hooks/useRealtimeManager';
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { usePartnerNames } from "@/hooks/usePartnerNames";
import { useCouple } from "@/hooks/useCouple";
import { format } from "date-fns";
import { ptBR, enUS } from "date-fns/locale";
import { useLanguage } from "@/hooks/useLanguage";
import { translateCategoryName as translateCategoryUtil } from "@/utils/categoryTranslation";
import { formatLocalDate, getLocaleForLanguage, getMonthDateRange } from "@/utils/date";
import { ExportUtils } from "@/components/financial/ExportUtils";
import { TransfersBetweenAccounts } from './TransfersBetweenAccounts';
import { FutureIncomesView } from './future-incomes/FutureIncomesView';
import { Calendar, Clock, ArrowLeftRight } from 'lucide-react';


interface Transaction {
  id: string;
  type: "income" | "expense";
  amount: number;
  description: string;
  category_id: string;
  account_id?: string;
  subcategory?: string;
  transaction_date: string;
  payment_method: string;
  card_id?: string;
  user_id: string;
  owner_user?: string;
  categories?: {
    name: string;
  };
  cards?: {
    name: string;
  };
  accounts?: {
    name: string;
  };
}

interface MonthlyIncomeViewProps {
  viewMode: "both" | "user1" | "user2";
}

const normalizeCategory = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
const INCOME_CATEGORY_TRANSLATIONS: Record<string, string> = {
  'comissao': 'Commission',
  'comiisao': 'Commission',
  'renda extra': 'Extra Income',
  'salario': 'Salary',
  'transferencia': 'Transfer',
};
const translateCategoryName = (name: string, lang: 'pt' | 'en') => {
  if (lang === 'en') {
    const key = normalizeCategory(name);
    return INCOME_CATEGORY_TRANSLATIONS[key] ?? name;
  }
  return name;
};

export const MonthlyIncomeView = ({ viewMode }: MonthlyIncomeViewProps) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "yyyy-MM"));
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>("all");
  const [categoryOptions, setCategoryOptions] = useState<{ key: string; name: string; ids: string[] }[]>([]);
  const [subcategoryOptions, setSubcategoryOptions] = useState<{ id: string; name: string }[]>([]);
  const { toast } = useToast();
  const { user } = useAuth();
  const { names } = usePartnerNames();
  const { isPartOfCouple, couple } = useCouple();
  const { t, language } = useLanguage();

  useEffect(() => {
    fetchTransactions();
    fetchCategories();
  }, [selectedMonth, selectedCategory, selectedSubcategory, viewMode, language]);

  // Auto-refresh when selectedMonth changes to current month
  useEffect(() => {
    const currentMonth = format(new Date(), "yyyy-MM");
    if (selectedMonth === currentMonth) {
      fetchTransactions();
    }
  }, [selectedMonth]);

  // Fetch subcategories when category changes
  useEffect(() => {
    if (selectedCategory !== 'all') {
      const opt = categoryOptions.find(o => o.key === selectedCategory);
      if (opt && opt.ids.length) {
        fetchSubcategories(opt.ids);
      } else {
        setSubcategoryOptions([]);
      }
    } else {
      setSubcategoryOptions([]);
    }
    setSelectedSubcategory('all');
  }, [selectedCategory, categoryOptions]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('monthly-income-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'transactions' },
        () => {
          setTimeout(fetchTransactions, 100);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, selectedMonth, selectedCategory, selectedSubcategory, viewMode]);

  const fetchSubcategories = async (categoryIds: string[]) => {
    if (!categoryIds.length) {
      setSubcategoryOptions([]);
      return;
    }

    try {
      const { data } = await supabase
        .from('subcategories')
        .select('id, name, name_en, name_es')
        .in('category_id', categoryIds)
        .is('deleted_at', null)
        .order('name');

      // Deduplicate by normalized name
      const unique = new Map<string, { id: string; name: string }>();
      (data || []).forEach(sub => {
        const key = sub.name.toLowerCase();
        if (!unique.has(key)) {
          const localizedName = language === 'en' ? sub.name_en : 
                               language === 'es' ? sub.name_es : sub.name;
          unique.set(key, { id: sub.id, name: localizedName || sub.name });
        }
      });

      setSubcategoryOptions(Array.from(unique.values()));
    } catch (error) {
      console.error('Error fetching subcategories:', error);
      setSubcategoryOptions([]);
    }
  };

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
        .eq('category_type', 'income')
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
        if (!map.has(key)) map.set(key, { key, name: translateCategoryUtil(it.name, language), ids: [it.id] });
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
    // Clear current transactions to prevent stale data
    setTransactions([]);
    
    try {
      const { startDate, endDate } = getMonthDateRange(selectedMonth);

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
          cards(name),
          accounts(name)
        `)
        .in('user_id', userIds)
        .eq('type', 'income')
        .not('payment_method', 'eq', 'account_transfer')
        .gte('transaction_date', startDate)
        .lte('transaction_date', endDate)
        .order('transaction_date', { ascending: false });

      if (selectedCategory !== "all") {
        const opt = categoryOptions.find(o => o.key === selectedCategory);
        if (opt && opt.ids.length) {
          query = query.in('category_id', opt.ids);
        }
      }

      // Filter by subcategory if selected
      if (selectedSubcategory !== "all") {
        query = query.eq('subcategory_id', selectedSubcategory);
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
      console.error("Error loading income transactions:", error);
      // Only show error toast for actual database/network errors
      if (error?.code && error.code !== 'PGRST116') {
        toast({
          title: "Erro",
          description: "Não foi possível carregar as receitas",
          variant: "destructive",
        });
      }
    }
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string): string => {
    return formatLocalDate(dateString, "dd/MM/yyyy", language as 'pt' | 'en' | 'es');
  };

  const getPaymentMethodText = (method: string) => {
    switch (method) {
      case 'cash': return t('transactionForm.cash');
      case 'deposit': return t('transactionForm.deposit');
      case 'transfer': return t('transactionForm.receivedTransfer');
      case 'account_transfer': return t('transactionForm.accountTransfer');
      case 'account_investment': return t('transactionForm.accountInvestmentTransfer');
      case 'debit_card': return t('transactionForm.debitCard');
      case 'credit_card': return t('transactionForm.creditCard');
      case 'payment_transfer': return t('transactionForm.paymentTransfer');
      case 'bank_transfer': return t('transactionForm.transfer'); // legacy mapping
      case 'pix': return 'PIX';
      case 'check': return t('transactionForm.check');
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

  const totalIncome = transactions.reduce((sum, t) => sum + t.amount, 0);

  const getExportTitle = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const monthDate = new Date(year, month - 1, 1);
    const locale = language === 'en' ? enUS : ptBR;
    const monthLabel = format(monthDate, "MMMM-yyyy", { locale });
    const categoryLabel = selectedCategory === 'all' ? 'todas-categorias' : selectedCategory;
    return `receitas-${monthLabel}-${categoryLabel}`;
  };

  return (
    <div className="space-y-6">
      <Card className="p-4 bg-gradient-to-r from-primary/5 to-primary/10">
        <Tabs defaultValue="current" className="w-full">
          <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 gap-2 h-auto p-2 bg-background/80 backdrop-blur">
            <TabsTrigger 
              value="current" 
              className="flex items-center gap-2 py-3 text-xs sm:text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">{t('futureIncomes.currentIncomes')}</span>
              <span className="sm:hidden">Atuais</span>
            </TabsTrigger>
            <TabsTrigger 
              value="future" 
              className="flex items-center gap-2 py-3 text-xs sm:text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline">{t('futureIncomes.futureIncomes')}</span>
              <span className="sm:hidden">Futuras</span>
            </TabsTrigger>
            <TabsTrigger 
              value="transfers" 
              className="flex items-center gap-2 py-3 text-xs sm:text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <ArrowLeftRight className="h-4 w-4" />
              <span className="hidden sm:inline">{t('futureIncomes.transfers')}</span>
              <span className="sm:hidden">Transf.</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="current" className="mt-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">{t('nav.monthlyIncome')}</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <Label>{t('monthlyIncome.monthLabel')}</Label>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger>
                <SelectValue placeholder={t('monthlyIncome.selectMonth')} />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => {
                  const date = new Date();
                  date.setMonth(date.getMonth() - i);
                  const value = format(date, "yyyy-MM");
                  const locale = language === 'en' ? enUS : ptBR;
                  const label = format(
                    date,
                    language === 'en' ? "MMMM yyyy" : "MMMM 'de' yyyy",
                    { locale }
                  );
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
            <Label>{t('monthlyIncome.categoryLabel')}</Label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder={t('monthlyIncome.allCategories')} />
              </SelectTrigger>
              <SelectContent>
<SelectItem value="all">{t('monthlyIncome.allCategories')}</SelectItem>
                {categoryOptions.map((opt) => (
                  <SelectItem key={opt.key} value={opt.key}>
                    {opt.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Subcategory filter - only show when category is selected */}
          {selectedCategory !== 'all' && subcategoryOptions.length > 0 && (
            <div>
              <Label>{t('monthlyIncome.subcategoryLabel')}</Label>
              <Select value={selectedSubcategory} onValueChange={setSelectedSubcategory}>
                <SelectTrigger>
                  <SelectValue placeholder={t('monthlyIncome.allSubcategories')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('monthlyIncome.allSubcategories')}</SelectItem>
                  {subcategoryOptions.map((sub) => (
                    <SelectItem key={sub.id} value={sub.id}>
                      {sub.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg flex-1">
            <p className="text-sm text-green-600 dark:text-green-400">{t('monthlyIncome.totalIncome')}</p>
            <p className="text-2xl font-bold text-green-700 dark:text-green-300">
              {formatCurrency(totalIncome)}
            </p>
          </div>
          
          {transactions.length > 0 && (
            <ExportUtils
              data={transactions}
              filename={getExportTitle()}
              headers={[
                t('monthlyIncome.date'),
                t('monthlyIncome.description'),
                t('monthlyIncome.categoryLabel'),
                t('monthlyIncome.subcategoryLabel'),
                t('monthlyIncome.receivedBy'),
                t('monthlyIncome.receiptMethod'),
                t('monthlyIncome.receivedAccount'),
                t('monthlyIncome.amount')
              ]}
              tableHeaders={[
                t('monthlyIncome.date'),
                t('monthlyIncome.description'),
                t('monthlyIncome.categoryLabel'),
                t('monthlyIncome.receivedBy'),
                t('monthlyIncome.receiptMethod'),
                t('monthlyIncome.amount')
              ]}
              title={t('monthlyIncome.pdfTitle')}
              additionalInfo={[
                { label: t('monthlyIncome.pdfPeriod'), value: selectedMonth },
                { label: t('monthlyIncome.pdfTotalIncome'), value: formatCurrency(totalIncome) }
              ]}
               formatRowForCSV={(transaction) => [
                formatDate(transaction.transaction_date),
                transaction.description,
                translateCategoryUtil(transaction.categories?.name || 'N/A', language),
                (transaction as any).subcategory || '',
                getUserName(transaction.owner_user || 'user1'),
                getPaymentMethodText(transaction.payment_method),
                transaction.accounts?.name || '',
                formatCurrency(transaction.amount)
              ]}
              formatRowForPDF={(transaction) => [
                formatDate(transaction.transaction_date),
                transaction.description.length > 25 ? transaction.description.substring(0, 25) + '...' : transaction.description,
                translateCategoryUtil(transaction.categories?.name || 'N/A', language),
                getUserName(transaction.owner_user || 'user1'),
                getPaymentMethodText(transaction.payment_method),
                formatCurrency(transaction.amount)
              ]}
            />
          )}
        </div>
      </Card>

      <Card className="p-6">
        <h4 className="text-md font-semibold mb-4">{t('monthlyIncome.periodIncome')}</h4>
        {transactions.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            {t('monthlyIncome.noneFound')}
          </p>
        ) : (
          <div className="space-y-4">
            {transactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
                    <span className="font-medium">{transaction.description}</span>
                  </div>
                  
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>
                      <span className="font-medium text-primary">
                        {t('monthlyIncome.receivedBy')}: {getUserName(transaction.owner_user || 'user1')}
                      </span>
                    </p>
                    <p>{t('monthlyIncome.categoryLabel')}: {translateCategoryUtil(transaction.categories?.name || 'N/A', language)}</p>
                    {transaction.subcategory && (
                      <p>{t('monthlyIncome.subcategoryLabel')}: {transaction.subcategory}</p>
                    )}
                    <p>{t('monthlyIncome.receiptMethod')}: {getPaymentMethodText(transaction.payment_method)}</p>
                    {transaction.payment_method !== 'dinheiro' && transaction.account_id && transaction.accounts?.name && (
                      <p>{t('monthlyIncome.receivedAccount')}: {transaction.accounts.name}</p>
                    )}
                    <p>{t('monthlyIncome.date')}: {formatDate(transaction.transaction_date)}</p>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="text-lg font-semibold text-green-600">
                    +{formatCurrency(transaction.amount)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
        </TabsContent>

          <TabsContent value="future">
          <FutureIncomesView viewMode={viewMode === 'both' ? 'couple' : 'individual'} />
        </TabsContent>

        <TabsContent value="transfers">
          <TransfersBetweenAccounts viewMode={viewMode} />
        </TabsContent>
      </Tabs>
    </Card>
    </div>
  );
};