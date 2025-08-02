import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { BarChart3, TrendingUp } from "lucide-react";

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
  const [expenseData, setExpenseData] = useState<ExpenseData[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyExpense[]>([]);
  const [loading, setLoading] = useState(true);

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))'];

  useEffect(() => {
    if (user) {
      fetchExpenseData();
    }
  }, [user, period]);

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
        .eq('type', 'expense')
        .gte('transaction_date', startDate.toISOString().split('T')[0])
        .lte('transaction_date', endDate.toISOString().split('T')[0]);

      if (error) throw error;

      // Process data for pie chart
      const userExpenses = transactions?.reduce((acc: Record<string, number>, transaction) => {
        const user = transaction.owner_user || 'user1';
        acc[user] = (acc[user] || 0) + transaction.amount;
        return acc;
      }, {}) || {};

      const pieData: ExpenseData[] = Object.entries(userExpenses).map(([user, amount], index) => ({
        user: user === 'user1' ? 'Usuário 1' : 'Usuário 2',
        amount: amount,
        color: COLORS[index % COLORS.length]
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
          
          const userKey = transaction.owner_user === 'user1' ? 'user1' : 'user2';
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
                  {entry.dataKey === 'user1' ? 'Usuário 1' : 'Usuário 2'}: {formatCurrency(entry.value)}
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
      <Card className="p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-muted rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </Card>
    );
  }

  const totalExpenses = expenseData.reduce((sum, item) => sum + item.amount, 0);

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">
              {t('language') === 'pt' ? 'Comparativo de Gastos' : 'Expense Comparison'}
            </h3>
          </div>
          <div className="flex gap-2">
            <Select value={period} onValueChange={(value: "current" | "last3" | "last6") => setPeriod(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current">
                  {t('language') === 'pt' ? 'Mês Atual' : 'Current Month'}
                </SelectItem>
                <SelectItem value="last3">
                  {t('language') === 'pt' ? 'Últimos 3M' : 'Last 3M'}
                </SelectItem>
                <SelectItem value="last6">
                  {t('language') === 'pt' ? 'Últimos 6M' : 'Last 6M'}
                </SelectItem>
              </SelectContent>
            </Select>
            
            {period !== "current" && (
              <Select value={chartType} onValueChange={(value: "pie" | "bar") => setChartType(value)}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pie">
                    {t('language') === 'pt' ? 'Pizza' : 'Pie'}
                  </SelectItem>
                  <SelectItem value="bar">
                    {t('language') === 'pt' ? 'Barras' : 'Bar'}
                  </SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        {expenseData.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t('language') === 'pt' ? 'Nenhum gasto encontrado no período' : 'No expenses found in this period'}</p>
            </div>
          </div>
        ) : (
          <>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                {chartType === "pie" || period === "current" ? (
                  <PieChart>
                    <Pie
                      data={expenseData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
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
                    <Bar dataKey="user1" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="user2" fill="hsl(var(--chart-2))" radius={[2, 2, 0, 0]} />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>

            <div className="flex justify-center gap-6 text-sm">
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
                {t('language') === 'pt' ? 'Total' : 'Total'}: <span className="font-semibold text-foreground">{formatCurrency(totalExpenses)}</span>
              </p>
            </div>
          </>
        )}
      </div>
    </Card>
  );
};