import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend, Area, AreaChart } from 'recharts';
import { format, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CashFlowEntry, CashFlowSummary } from '@/hooks/useCashFlowHistory';

interface CashFlowChartProps {
  entries: CashFlowEntry[];
  summary: CashFlowSummary | null;
  dateRange: { start: Date; end: Date };
}

const COLORS = ['#22c55e', '#ef4444', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899'];

export function CashFlowChart({ entries, summary, dateRange }: CashFlowChartProps) {
  // Calculate balance evolution data
  const balanceEvolutionData = useMemo(() => {
    if (entries.length === 0) return [];

    // Group entries by date and get the last balance of each day
    const dailyBalances = new Map<string, number>();
    
    entries.forEach(entry => {
      const dateKey = entry.movement_date;
      dailyBalances.set(dateKey, entry.balance_after);
    });

    // Create data points for each day with running balance
    let lastBalance = summary?.initial_balance || 0;
    const days = eachDayOfInterval({ start: dateRange.start, end: dateRange.end });
    
    return days.map(day => {
      const dateKey = format(day, 'yyyy-MM-dd');
      if (dailyBalances.has(dateKey)) {
        lastBalance = dailyBalances.get(dateKey)!;
      }
      return {
        date: format(day, 'dd/MM', { locale: ptBR }),
        fullDate: dateKey,
        balance: lastBalance
      };
    });
  }, [entries, summary, dateRange]);

  // Calculate income vs expense by period
  const incomeVsExpenseData = useMemo(() => {
    if (entries.length === 0) return [];

    const periodData = new Map<string, { income: number; expense: number }>();
    
    entries.forEach(entry => {
      const dateKey = format(new Date(entry.movement_date), 'MM/yyyy');
      
      if (!periodData.has(dateKey)) {
        periodData.set(dateKey, { income: 0, expense: 0 });
      }
      
      const data = periodData.get(dateKey)!;
      if (entry.movement_type === 'income' || entry.movement_type === 'transfer_in') {
        data.income += entry.amount;
      } else if (entry.movement_type === 'expense' || entry.movement_type === 'transfer_out') {
        data.expense += entry.amount;
      }
    });

    return Array.from(periodData.entries()).map(([period, data]) => ({
      period,
      income: data.income,
      expense: data.expense,
      balance: data.income - data.expense
    }));
  }, [entries]);

  // Calculate distribution by payment method
  const paymentMethodData = useMemo(() => {
    if (entries.length === 0) return [];

    const methodTotals = new Map<string, number>();
    
    entries.filter(e => e.movement_type === 'expense').forEach(entry => {
      const method = entry.payment_method || 'Outro';
      const current = methodTotals.get(method) || 0;
      methodTotals.set(method, current + entry.amount);
    });

    const methodLabels: Record<string, string> = {
      'cash': 'Dinheiro',
      'pix': 'PIX',
      'credit_card': 'Cartão de Crédito',
      'debit_card': 'Cartão de Débito',
      'transfer': 'Transferência',
      'boleto': 'Boleto',
      'check': 'Cheque',
      'other': 'Outro'
    };

    return Array.from(methodTotals.entries())
      .map(([method, total], index) => ({
        name: methodLabels[method] || method,
        value: total,
        color: COLORS[index % COLORS.length]
      }))
      .sort((a, b) => b.value - a.value);
  }, [entries]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  if (entries.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Sem dados para exibir no período selecionado</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Balance Evolution Chart */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="text-lg">Evolução do Saldo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={balanceEvolutionData}>
                <defs>
                  <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  tickFormatter={formatCurrency}
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  width={80}
                />
                <ChartTooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="rounded-lg border bg-background p-2 shadow-sm">
                          <p className="text-sm font-medium">{payload[0].payload.date}</p>
                          <p className="text-sm text-primary">
                            {formatCurrency(payload[0].value as number)}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="balance"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fill="url(#balanceGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Income vs Expense Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Entradas vs Saídas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={incomeVsExpenseData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="period" 
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  tickFormatter={formatCurrency}
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  width={80}
                />
                <ChartTooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="rounded-lg border bg-background p-2 shadow-sm">
                          <p className="text-sm font-medium mb-1">{label}</p>
                          {payload.map((item, index) => (
                            <p key={index} className="text-sm" style={{ color: item.color }}>
                              {item.name}: {formatCurrency(item.value as number)}
                            </p>
                          ))}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="income" name="Entradas" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" name="Saídas" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Payment Method Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Despesas por Forma de Pagamento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            {paymentMethodData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentMethodData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={false}
                  >
                    {paymentMethodData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="rounded-lg border bg-background p-2 shadow-sm">
                            <p className="text-sm font-medium">{payload[0].name}</p>
                            <p className="text-sm">
                              {formatCurrency(payload[0].value as number)}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">Sem dados de despesas</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
