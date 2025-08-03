import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { BarChart3, TrendingUp, TrendingDown } from "lucide-react";

interface ExpenseData {
  user: string;
  amount: number;
  color: string;
}

interface MonthlyExpense {
  month: string;
  user1: number;
  user2: number;
}

export const UserExpenseChart = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [chartType, setChartType] = useState<"pie" | "bar">("pie");
  const [period, setPeriod] = useState<"current" | "last3" | "last6">("current");
  const [transactionType, setTransactionType] = useState<"income" | "expense">("expense");
  const [expenseData, setExpenseData] = useState<ExpenseData[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [userProfiles, setUserProfiles] = useState<{[key: string]: string}>({});

  const COLORS = {
    expense: ['hsl(var(--expense))', 'hsl(var(--primary))'],
    income: ['hsl(var(--income))', 'hsl(var(--secondary))']
  };

  useEffect(() => {
    if (user) {
      fetchUserProfiles();
      fetchExpenseData();
      
      // Set up realtime listener for transactions
      const channel = supabase
        .channel('transaction-changes')
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'transactions',
            filter: `user_id=eq.${user.id}`
          }, 
          () => {
            console.log('Transaction change detected, refreshing chart...');
            fetchExpenseData();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, period, transactionType]);

  const fetchUserProfiles = async () => {
    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('display_name, second_user_name')
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;

      console.log('Profiles fetched:', profiles);
      setUserProfiles({
        user1: profiles?.display_name || t('chart.user1'),
        user2: profiles?.second_user_name || t('chart.user2')
      });
    } catch (error) {
      console.error('Erro ao buscar perfis:', error);
      setUserProfiles({
        user1: t('chart.user1'),
        user2: t('chart.user2')
      });
    }
  };

  const fetchExpenseData = async () => {
    try {
      setLoading(true);
      
      // Calculate date range based on period
      const endDate = new Date();
      const startDate = new Date();
      
      switch (period) {
        case "current":
          startDate.setDate(1); // First day of current month
          break;
        case "last3":
          startDate.setMonth(startDate.getMonth() - 3);
          break;
        case "last6":
          startDate.setMonth(startDate.getMonth() - 6);
          break;
      }

      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('owner_user, amount, transaction_date')
        .eq('user_id', user?.id)
        .eq('type', transactionType)
        .gte('transaction_date', startDate.toISOString().split('T')[0])
        .lte('transaction_date', endDate.toISOString().split('T')[0]);

      if (error) throw error;
      
      console.log('Chart transactions fetched:', transactions);

      // Process data for pie chart
      const userExpenses = transactions?.reduce((acc: Record<string, number>, transaction) => {
        // Normalizar owner_user: se for um email ou não for 'user1' ou 'user2', tratar como 'user1'
        let user = transaction.owner_user || 'user1';
        if (user !== 'user1' && user !== 'user2') {
          user = 'user1'; // Emails e outros valores são tratados como user1
        }
        acc[user] = (acc[user] || 0) + transaction.amount;
        return acc;
      }, {}) || {};

      const pieData: ExpenseData[] = Object.entries(userExpenses).map(([user, amount], index) => ({
        user: user === 'user1' ? userProfiles.user1 || t('chart.user1') : userProfiles.user2 || t('chart.user2'),
        amount: amount,
        color: COLORS[transactionType][index % COLORS[transactionType].length]
      }));

      setExpenseData(pieData);

      // Process data for bar chart (monthly breakdown)
      if (period !== "current") {
        const monthlyExpenses: Record<string, { user1: number; user2: number }> = {};
        
        transactions?.forEach(transaction => {
          const month = new Date(transaction.transaction_date).toLocaleDateString('pt-BR', { 
            month: 'short', 
            year: '2-digit' 
          });
          
          if (!monthlyExpenses[month]) {
            monthlyExpenses[month] = { user1: 0, user2: 0 };
          }
          
          // Normalizar owner_user: se for um email ou não for 'user1' ou 'user2', tratar como 'user1'
          let userKey = transaction.owner_user || 'user1';
          if (userKey !== 'user1' && userKey !== 'user2') {
            userKey = 'user1'; // Emails e outros valores são tratados como user1
          }
          monthlyExpenses[month][userKey] += transaction.amount;
        });

        const barData: MonthlyExpense[] = Object.entries(monthlyExpenses).map(([month, amounts]) => ({
          month,
          user1: amounts.user1,
          user2: amounts.user2
        }));

        setMonthlyData(barData.sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime()));
      }

    } catch (error) {
      console.error('Error fetching expense data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          {chartType === "pie" ? (
            <>
              <p className="font-medium">{payload[0].payload.user}</p>
              <p className="text-primary">{formatCurrency(payload[0].value)}</p>
            </>
          ) : (
            <>
              <p className="font-medium">{label}</p>
              {payload.map((entry: any, index: number) => (
                <p key={index} style={{ color: entry.color }}>
                  {entry.dataKey === 'user1' ? userProfiles.user1 || t('chart.user1') : userProfiles.user2 || t('chart.user2')}: {formatCurrency(entry.value)}
                </p>
              ))}
            </>
          )}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <Card className="p-6 h-full">
        <div className="animate-pulse">
          <div className="h-4 bg-muted rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </Card>
    );
  }

  const totalExpenses = expenseData.reduce((sum, item) => sum + item.amount, 0);

  return (
    <Card className="p-6 h-full">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {transactionType === "income" ? (
              <TrendingUp className="h-5 w-5 text-income" />
            ) : (
              <TrendingDown className="h-5 w-5 text-expense" />
            )}
            <h3 className="text-lg font-semibold">
              {t('chart.userComparison')}
            </h3>
          </div>
          <div className="flex gap-2">
            <Select value={transactionType} onValueChange={(value: "income" | "expense") => setTransactionType(value)}>
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="expense">{t('chart.expenses')}</SelectItem>
                <SelectItem value="income">{t('chart.income')}</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={period} onValueChange={(value: "current" | "last3" | "last6") => setPeriod(value)}>
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current">{t('chart.currentMonth')}</SelectItem>
                <SelectItem value="last3">{t('chart.last3Months')}</SelectItem>
                <SelectItem value="last6">{t('chart.last6Months')}</SelectItem>
              </SelectContent>
            </Select>
            
            {period !== "current" && (
              <Select value={chartType} onValueChange={(value: "pie" | "bar") => setChartType(value)}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pie">{t('chart.pieChart')}</SelectItem>
                  <SelectItem value="bar">{t('chart.barChart')}</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        {expenseData.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t('chart.noData').replace('{type}', transactionType === "income" ? t('chart.receipt') : t('chart.expense'))}</p>
            </div>
          </div>
        ) : (
          <>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                {chartType === "pie" || period === "current" ? (
                  <PieChart>
                    <Pie
                      data={expenseData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="amount"
                    >
                      {expenseData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                ) : (
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="user1" fill={COLORS[transactionType][0]} radius={[2, 2, 0, 0]} />
                    <Bar dataKey="user2" fill={COLORS[transactionType][1]} radius={[2, 2, 0, 0]} />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>

            <div className="flex justify-center gap-4 text-sm">
              {expenseData.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <span>{item.user}: {formatCurrency(item.amount)}</span>
                </div>
              ))}
            </div>

            <div className="text-center pt-2 border-t">
              <p className="text-sm text-muted-foreground">
                {t('chart.total')}: <span className="font-semibold text-foreground">{formatCurrency(totalExpenses)}</span>
              </p>
            </div>
          </>
        )}
      </div>
    </Card>
  );
};