import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { usePartnerNames } from "@/hooks/usePartnerNames";
import { BarChart3, TrendingUp, TrendingDown } from "lucide-react";

// Cores para diferenciação visual
const CHART_COLORS = {
  income: {
    user1: '#10b981', // Verde para receitas do usuário 1
    user2: '#3b82f6', // Azul para receitas do usuário 2
  },
  expense: {
    user1: '#ef4444', // Vermelho para despesas do usuário 1
    user2: '#f97316', // Laranja para despesas do usuário 2
  }
};

interface FinancialData {
  category: string;
  user1: number;
  user2: number;
  user1Color: string;
  user2Color: string;
}

interface MonthlyExpense {
  month: string;
  user1: number;
  user2: number;
}

export const UserExpenseChart = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [period, setPeriod] = useState<"current" | "last3" | "last6">("current");
  const [financialData, setFinancialData] = useState<FinancialData[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const { names } = usePartnerNames();

  useEffect(() => {
    if (user) {
      fetchFinancialData();
      
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
            fetchFinancialData();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, period]);


  const fetchFinancialData = async () => {
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
          startDate.setDate(1);
          break;
        case "last6":
          startDate.setMonth(startDate.getMonth() - 6);
          startDate.setDate(1);
          break;
      }

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

      // Fetch both income and expense transactions
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('owner_user, amount, transaction_date, type')
        .in('user_id', userIds)
        .gte('transaction_date', startDate.toISOString().split('T')[0])
        .lte('transaction_date', endDate.toISOString().split('T')[0]);

      if (error) throw error;
      
      console.log('Chart transactions fetched:', transactions);

      // Process data for combined chart
      const incomeByUser = { user1: 0, user2: 0 };
      const expenseByUser = { user1: 0, user2: 0 };

      transactions?.forEach((transaction) => {
        // Normalizar owner_user: se for um email ou não for 'user1' ou 'user2', tratar como 'user1'
        let owner = transaction.owner_user || 'user1';
        if (owner !== 'user1' && owner !== 'user2') {
          owner = 'user1'; // Emails e outros valores são tratados como user1
        }

        if (transaction.type === 'income') {
          incomeByUser[owner as 'user1' | 'user2'] += transaction.amount;
        } else {
          expenseByUser[owner as 'user1' | 'user2'] += transaction.amount;
        }
      });

      const chartData: FinancialData[] = [
        {
          category: t('userAnalysis.income'),
          user1: incomeByUser.user1,
          user2: incomeByUser.user2,
          user1Color: CHART_COLORS.income.user1,
          user2Color: CHART_COLORS.income.user2
        },
        {
          category: t('userAnalysis.expenses'),
          user1: expenseByUser.user1,
          user2: expenseByUser.user2,
          user1Color: CHART_COLORS.expense.user1,
          user2Color: CHART_COLORS.expense.user2
        }
      ];

      setFinancialData(chartData);

      // Process data for monthly breakdown if needed
      if (period !== "current") {
        const monthlyBreakdown: Record<string, { user1Income: number; user1Expense: number; user2Income: number; user2Expense: number }> = {};
        
        transactions?.forEach(transaction => {
          const month = new Date(transaction.transaction_date).toLocaleDateString('pt-BR', { 
            month: 'short', 
            year: '2-digit' 
          });
          
          if (!monthlyBreakdown[month]) {
            monthlyBreakdown[month] = { user1Income: 0, user1Expense: 0, user2Income: 0, user2Expense: 0 };
          }
          
          let owner = transaction.owner_user || 'user1';
          if (owner !== 'user1' && owner !== 'user2') {
            owner = 'user1';
          }

          if (transaction.type === 'income') {
            monthlyBreakdown[month][`${owner}Income` as keyof typeof monthlyBreakdown[string]] += transaction.amount;
          } else {
            monthlyBreakdown[month][`${owner}Expense` as keyof typeof monthlyBreakdown[string]] += transaction.amount;
          }
        });

        const monthlyChartData: MonthlyExpense[] = Object.entries(monthlyBreakdown).map(([month, data]) => ({
          month,
          user1: data.user1Income - data.user1Expense, // Net amount
          user2: data.user2Income - data.user2Expense  // Net amount
        }));

        setMonthlyData(monthlyChartData);
      }
    } catch (error) {
      console.error('Erro ao buscar dados financeiros:', error);
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
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.dataKey === 'user1' ? names.user1Name : names.user2Name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const renderCustomBar = (props: any) => {
    const { payload, ...rest } = props;
    const category = payload.category;
    const isIncome = category === t('userAnalysis.income');
    
    return (
      <Bar 
        {...rest} 
        fill={isIncome ? CHART_COLORS.income.user1 : CHART_COLORS.expense.user1}
        radius={[2, 2, 0, 0]} 
      />
    );
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

  return (
    <Card className="p-6 h-full">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">
              {t('charts.userAnalysisTitle')}
            </h3>
          </div>
          <div className="flex gap-2">
            <Select value={period} onValueChange={(value: "current" | "last3" | "last6") => setPeriod(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current">{t('userAnalysis.period.current')}</SelectItem>
                <SelectItem value="last3">{t('userAnalysis.period.last3')}</SelectItem>
                <SelectItem value="last6">{t('userAnalysis.period.last6')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {financialData.length === 0 || financialData.every(item => item.user1 === 0 && item.user2 === 0) ? (
          <div className="h-48 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t('userAnalysis.noData')}</p>
            </div>
          </div>
        ) : (
          <>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                {period === "current" ? (
                  <BarChart data={financialData}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="category" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="user1" radius={[2, 2, 0, 0]}>
                      {financialData.map((entry, index) => (
                        <Cell key={`cell-user1-${index}`} fill={entry.user1Color} />
                      ))}
                    </Bar>
                    <Bar dataKey="user2" radius={[2, 2, 0, 0]}>
                      {financialData.map((entry, index) => (
                        <Cell key={`cell-user2-${index}`} fill={entry.user2Color} />
                      ))}
                    </Bar>
                  </BarChart>
                ) : (
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="user1" fill={CHART_COLORS.income.user1} radius={[2, 2, 0, 0]} />
                    <Bar dataKey="user2" fill={CHART_COLORS.income.user2} radius={[2, 2, 0, 0]} />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>

            {/* Legenda personalizada com cores corretas */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="font-medium">{t('userAnalysis.income')}</span>
                </div>
                <div className="flex items-center gap-4 ml-6">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: CHART_COLORS.income.user1 }}
                    ></div>
                     <span>{names.user1Name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: CHART_COLORS.income.user2 }}
                    ></div>
                     <span>{names.user2Name}</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-red-600" />
                  <span className="font-medium">{t('userAnalysis.expenses')}</span>
                </div>
                <div className="flex items-center gap-4 ml-6">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: CHART_COLORS.expense.user1 }}
                    ></div>
                    <span>{names.user1Name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: CHART_COLORS.expense.user2 }}
                    ></div>
                    <span>{names.user2Name}</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </Card>
  );
};