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
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { FutureExpensesView } from "./FutureExpensesView";

interface Transaction {
  id: string;
  type: "income" | "expense";
  amount: number;
  description: string;
  category_id: string;
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
}

interface MonthlyExpensesViewProps {
  viewMode: "both" | "user1" | "user2";
}

export const MonthlyExpensesView = ({ viewMode }: MonthlyExpensesViewProps) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "yyyy-MM"));
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [categoryOptions, setCategoryOptions] = useState<{ key: string; name: string; ids: string[] }[]>([]);
  const { toast } = useToast();
  const { user } = useAuth();
  const { names } = usePartnerNames();
  const { isPartOfCouple, couple } = useCouple();

  useEffect(() => {
    fetchTransactions();
    fetchCategories();
  }, [selectedMonth, selectedCategory, viewMode]);

const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name')
        .eq('category_type', 'expense')
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
          cards(name, owner_user, due_date)
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

  const formatDate = (dateString: string): string => {
    return format(new Date(dateString), "dd/MM/yyyy", { locale: ptBR });
  };

  const getPaymentMethodText = (method: string) => {
    switch (method) {
      case 'cash': return 'Dinheiro';
      case 'credit_card': return 'Cartão de Crédito';
      case 'debit_card': return 'Cartão de Débito';
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
        <TabsTrigger value="current">Gastos Atuais</TabsTrigger>
        <TabsTrigger value="future">Gastos Futuros</TabsTrigger>
      </TabsList>

      <TabsContent value="current">
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Gastos Mensais</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <Label>Mês</Label>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o mês" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => {
                      const date = new Date();
                      date.setMonth(date.getMonth() - i);
                      const value = format(date, "yyyy-MM");
                      const label = format(date, "MMMM 'de' yyyy", { locale: ptBR });
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
                <Label>Categoria</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as categorias" />
                  </SelectTrigger>
                  <SelectContent>
<SelectItem value="all">Todas as categorias</SelectItem>
                    {categoryOptions.map((opt) => (
                      <SelectItem key={opt.key} value={opt.key}>
                        {opt.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="p-4 bg-red-50 dark:bg-red-950 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">Total de Gastos</p>
                <p className="text-2xl font-bold text-red-700 dark:text-red-300">
                  {formatCurrency(totalExpenses)}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h4 className="text-md font-semibold mb-4">Transações do Período</h4>
            
            {transactions.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhuma transação encontrada para o período selecionado.
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
                        {isPartOfCouple && (
                          <p>
                            <span className="font-medium text-primary">
                              Realizado por: {getUserName(transaction.owner_user || 'user1')}
                            </span>
                          </p>
                        )}
                        <p>Categoria: {transaction.categories?.name || 'N/A'}</p>
                        {transaction.subcategory && (
                          <p>Subcategoria: {transaction.subcategory}</p>
                        )}
                        <p>Pagamento: {getPaymentMethodText(transaction.payment_method)}</p>
                        {transaction.cards?.name && (
                          <p>Cartão: {transaction.cards.name}</p>
                        )}
                        {transaction.cards?.owner_user && (
                          <p>Proprietário do cartão: {getCardOwnerName(transaction.cards.owner_user)}</p>
                        )}
                        <p>{transaction.payment_method === 'credit_card' ? 'Vencimento' : 'Data'}: {formatDate(transaction.transaction_date)}</p>
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
        <FutureExpensesView />
      </TabsContent>
    </Tabs>
  );
};