import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { usePartnerNames } from "@/hooks/usePartnerNames";
import { useCouple } from "@/hooks/useCouple";
import { format } from "date-fns";
import { ptBR, enUS } from "date-fns/locale";
import { useLanguage } from "@/hooks/useLanguage";


interface Transaction {
  id: string;
  type: "income" | "expense";
  amount: number;
  description: string;
  category_id: string;
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
  }, [user, selectedMonth, selectedCategory, viewMode]);

const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name')
        .eq('category_type', 'income')
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
        if (!map.has(key)) map.set(key, { key, name: translateCategoryName(it.name, language as 'pt' | 'en'), ids: [it.id] });
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
          cards(name)
        `)
        .in('user_id', userIds)
        .eq('type', 'income')
        .gte('transaction_date', startDate)
        .lte('transaction_date', endDate)
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
        description: "Não foi possível carregar as receitas",
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

  const formatDate = (dateString: string): string => {
    return format(new Date(dateString), "dd/MM/yyyy", { locale: ptBR });
  };

  const getPaymentMethodText = (method: string) => {
    switch (method) {
      case 'cash': return t('transactionForm.cash');
      case 'bank_transfer': return t('transactionForm.transfer');
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

  return (
    <div className="space-y-6">
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
        </div>

        <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg mb-6">
          <p className="text-sm text-green-600 dark:text-green-400">{t('monthlyIncome.totalIncome')}</p>
          <p className="text-2xl font-bold text-green-700 dark:text-green-300">
            {formatCurrency(totalIncome)}
          </p>
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
                    {isPartOfCouple && (
                      <p>
                        <span className="font-medium text-primary">
                          {t('monthlyIncome.receivedBy')}: {getUserName(transaction.owner_user || 'user1')}
                        </span>
                      </p>
                    )}
                    <p>{t('monthlyIncome.categoryLabel')}: {translateCategoryName(transaction.categories?.name || 'N/A', language as 'pt' | 'en')}</p>
                    {transaction.subcategory && (
                      <p>{t('monthlyIncome.subcategoryLabel')}: {transaction.subcategory}</p>
                    )}
                    <p>{t('monthlyIncome.receiptMethod')}: {getPaymentMethodText(transaction.payment_method)}</p>
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
    </div>
  );
};