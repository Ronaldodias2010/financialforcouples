import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LineChart, Line } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { usePartnerNames } from "@/hooks/usePartnerNames";
import { BarChart3, TrendingUp, TrendingDown } from "lucide-react";
import { format } from 'date-fns';

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

interface MonthlySpending {
  month: string;
  user1Expense: number;
  user2Expense: number;
}

export const UserExpenseChart = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [period, setPeriod] = useState<"current" | "last3" | "last6">("current");
  const [financialData, setFinancialData] = useState<FinancialData[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyExpense[]>([]);
  const [monthlySpendingData, setMonthlySpendingData] = useState<MonthlySpending[]>([]);
  const [loading, setLoading] = useState(true);
  const { names } = usePartnerNames();

  useEffect(() => {
    if (user) {
      fetchFinancialData();
      
      // Set up realtime listener for transactions
        const channel = supabase
          .channel('transaction-changes')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'transactions'
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
      console.log('UserExpenseChart: Using userIds for query:', userIds);

      const startStr = format(startDate, 'yyyy-MM-dd');
      const endStr = format(endDate, 'yyyy-MM-dd');

      // Fetch expenses - incluir despesas parceladas do cartão filtradas por due_date
      const { data: expenseTransactions, error: expenseError } = await supabase
        .from('transactions')
        .select('user_id, owner_user, amount, transaction_date, due_date, is_installment, created_at, payment_method, status')
        .in('user_id', userIds)
        .eq('type', 'expense')
        .not('payment_method', 'in', '(account_transfer,account_investment)')
        .or(`and(is_installment.is.false,status.eq.completed,transaction_date.gte.${startStr},transaction_date.lte.${endStr}),and(is_installment.is.true,due_date.gte.${startStr},due_date.lte.${endStr})`);

      if (expenseError) throw expenseError;

      // Fetch income using the same logic as MonthlyIncomeView  
      const { data: incomeTransactions, error: incomeError } = await supabase
        .from('transactions')
        .select('user_id, owner_user, amount, transaction_date')
        .in('user_id', userIds)
        .eq('type', 'income')
        .not('payment_method', 'eq', 'account_transfer')
        .gte('transaction_date', startStr)
        .lte('transaction_date', endStr);

      if (incomeError) throw incomeError;
      
      console.log('Chart expense transactions fetched:', expenseTransactions);
      console.log('Chart income transactions fetched:', incomeTransactions);

      // Process data for combined chart
      const incomeByUser = { user1: 0, user2: 0 };
      const expenseByUser = { user1: 0, user2: 0 };

      // Process income transactions
      incomeTransactions?.forEach((transaction) => {
        let owner: 'user1' | 'user2';
        if (transaction.owner_user === 'user1' || transaction.owner_user === 'user2') {
          owner = transaction.owner_user;
        } else if (coupleData) {
          owner = transaction.user_id === coupleData.user1_id ? 'user1' : 'user2';
        } else {
          owner = 'user1';
        }
        incomeByUser[owner] += Number(transaction.amount);
      });

      // Process expense transactions (incluindo parcelas de cartão)
      expenseTransactions?.forEach((transaction) => {
        let owner: 'user1' | 'user2';
        if (transaction.owner_user === 'user1' || transaction.owner_user === 'user2') {
          owner = transaction.owner_user;
        } else if (coupleData) {
          owner = transaction.user_id === coupleData.user1_id ? 'user1' : 'user2';
        } else {
          owner = 'user1';
        }
        expenseByUser[owner] += Math.abs(Number(transaction.amount));
      });

      console.log('Processed expense by user:', expenseByUser);
      console.log('Processed income by user:', incomeByUser);

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
        
        // Process income by month
        incomeTransactions?.forEach(transaction => {
          const month = new Date(transaction.transaction_date).toLocaleDateString('pt-BR', { 
            month: 'short', 
            year: '2-digit' 
          });
          
          if (!monthlyBreakdown[month]) {
            monthlyBreakdown[month] = { user1Income: 0, user1Expense: 0, user2Income: 0, user2Expense: 0 };
          }
          
          let owner: 'user1' | 'user2';
          if (transaction.owner_user === 'user1' || transaction.owner_user === 'user2') {
            owner = transaction.owner_user;
          } else if (coupleData) {
            owner = transaction.user_id === coupleData.user1_id ? 'user1' : 'user2';
          } else {
            owner = 'user1';
          }
          monthlyBreakdown[month][`${owner}Income` as keyof typeof monthlyBreakdown[string]] += Number(transaction.amount);
        });

        // Process expenses by month (incluindo parcelas)
        expenseTransactions?.forEach(transaction => {
          const dateForGrouping = transaction.is_installment ? transaction.due_date : transaction.transaction_date;
          const month = new Date(dateForGrouping).toLocaleDateString('pt-BR', { 
            month: 'short', 
            year: '2-digit' 
          });
          
          if (!monthlyBreakdown[month]) {
            monthlyBreakdown[month] = { user1Income: 0, user1Expense: 0, user2Income: 0, user2Expense: 0 };
          }
          
          let owner: 'user1' | 'user2';
          if (transaction.owner_user === 'user1' || transaction.owner_user === 'user2') {
            owner = transaction.owner_user;
          } else if (coupleData) {
            owner = transaction.user_id === coupleData.user1_id ? 'user1' : 'user2';
          } else {
            owner = 'user1';
          }

          monthlyBreakdown[month][`${owner}Expense` as keyof typeof monthlyBreakdown[string]] += Math.abs(Number(transaction.amount));
        });

        const monthlyChartData: MonthlyExpense[] = Object.entries(monthlyBreakdown).map(([month, data]) => ({
          month,
          user1: data.user1Income - data.user1Expense, // Net amount
          user2: data.user2Income - data.user2Expense  // Net amount
        }));

        // Create monthly spending data for line chart
        const monthlySpendingChartData: MonthlySpending[] = Object.entries(monthlyBreakdown).map(([month, data]) => ({
          month,
          user1Expense: data.user1Expense,
          user2Expense: data.user2Expense
        }));

        setMonthlyData(monthlyChartData);
        setMonthlySpendingData(monthlySpendingChartData);
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
          <div className="flex items-center gap-2 min-w-0">
            <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
            <h3 className="text-sm sm:text-lg font-semibold truncate">
              {t('charts.userAnalysisTitle')}
            </h3>
          </div>
                  <div className="flex gap-2">
            <Select value={period} onValueChange={(value: "current" | "last3" | "last6") => setPeriod(value)}>
              <SelectTrigger className="w-24 sm:w-32 text-xs sm:text-sm">
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

            {/* Monthly Spending Trend Line Chart - Only show for multi-month periods */}
            {period !== "current" && monthlySpendingData.length > 0 && (
              <div className="mt-6">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingDown className="h-4 w-4 text-primary" />
                  <h4 className="text-md font-medium">{t('userAnalysis.monthlySpendingTrend')}</h4>
                </div>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlySpendingData}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis dataKey="month" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip 
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
                                <p className="font-medium">{label}</p>
                                {payload.map((entry: any, index: number) => (
                                  <p key={index} style={{ color: entry.color }}>
                                    {entry.dataKey === 'user1Expense' ? names.user1Name : names.user2Name}: {formatCurrency(entry.value)}
                                  </p>
                                ))}
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="user1Expense" 
                        stroke={CHART_COLORS.expense.user1} 
                        strokeWidth={3}
                        dot={{ fill: CHART_COLORS.expense.user1, strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, stroke: CHART_COLORS.expense.user1, strokeWidth: 2 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="user2Expense" 
                        stroke={CHART_COLORS.expense.user2} 
                        strokeWidth={3}
                        dot={{ fill: CHART_COLORS.expense.user2, strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, stroke: CHART_COLORS.expense.user2, strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                
                {/* Line Chart Legend */}
                <div className="flex items-center justify-start gap-3 sm:gap-6 mt-3 text-xs sm:text-sm px-2 overflow-hidden">
                  <div className="flex items-center gap-1 sm:gap-2 min-w-0">
                    <div 
                      className="w-3 sm:w-4 h-0.5 rounded flex-shrink-0" 
                      style={{ backgroundColor: CHART_COLORS.expense.user1 }}
                    ></div>
                    <span className="truncate max-w-[120px] sm:max-w-none">{names.user1Name}</span>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2 min-w-0">
                    <div 
                      className="w-3 sm:w-4 h-0.5 rounded flex-shrink-0" 
                      style={{ backgroundColor: CHART_COLORS.expense.user2 }}
                    ></div>
                    <span className="truncate max-w-[120px] sm:max-w-none">{names.user2Name}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Legenda personalizada com cores corretas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 flex-shrink-0" />
                  <span className="font-medium">{t('userAnalysis.income')}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 ml-5 sm:ml-6">
                  <div className="flex items-center gap-1 sm:gap-2 min-w-0">
                    <div 
                      className="w-2 h-2 sm:w-3 sm:h-3 rounded-full flex-shrink-0" 
                      style={{ backgroundColor: CHART_COLORS.income.user1 }}
                    ></div>
                    <span className="truncate max-w-[150px] sm:max-w-none">{names.user1Name}</span>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2 min-w-0">
                    <div 
                      className="w-2 h-2 sm:w-3 sm:h-3 rounded-full flex-shrink-0" 
                      style={{ backgroundColor: CHART_COLORS.income.user2 }}
                    ></div>
                    <span className="truncate max-w-[150px] sm:max-w-none">{names.user2Name}</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 text-red-600 flex-shrink-0" />
                  <span className="font-medium">{t('userAnalysis.expenses')}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 ml-5 sm:ml-6">
                  <div className="flex items-center gap-1 sm:gap-2 min-w-0">
                    <div 
                      className="w-2 h-2 sm:w-3 sm:h-3 rounded-full flex-shrink-0" 
                      style={{ backgroundColor: CHART_COLORS.expense.user1 }}
                    ></div>
                    <span className="truncate max-w-[150px] sm:max-w-none">{names.user1Name}</span>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2 min-w-0">
                    <div 
                      className="w-2 h-2 sm:w-3 sm:h-3 rounded-full flex-shrink-0" 
                      style={{ backgroundColor: CHART_COLORS.expense.user2 }}
                    ></div>
                    <span className="truncate max-w-[150px] sm:max-w-none">{names.user2Name}</span>
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