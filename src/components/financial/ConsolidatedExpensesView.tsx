import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, TrendingDown, PieChart } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ConsolidatedCategory, CashFlowEntry } from '@/hooks/useCashFlowHistory';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, Legend, Tooltip } from 'recharts';

interface ConsolidatedExpensesViewProps {
  expenses: ConsolidatedCategory[];
  entries: CashFlowEntry[];
  isLoading: boolean;
  dateRange: { start: Date; end: Date };
}

const COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
  '#22c55e', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6',
  '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899'
];

export function ConsolidatedExpensesView({ expenses, entries, isLoading, dateRange }: ConsolidatedExpensesViewProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const totalExpenses = useMemo(() => 
    expenses.reduce((sum, e) => sum + e.total_amount, 0), 
    [expenses]
  );

  const chartData = useMemo(() => 
    expenses.map((expense, index) => ({
      name: expense.category_name,
      value: expense.total_amount,
      color: expense.category_color || COLORS[index % COLORS.length]
    })),
    [expenses]
  );

  const entriesByCategory = useMemo(() => {
    const grouped = new Map<string, CashFlowEntry[]>();
    entries.forEach(entry => {
      const categoryId = entry.category_id || 'uncategorized';
      const existing = grouped.get(categoryId) || [];
      grouped.set(categoryId, [...existing, entry]);
    });
    return grouped;
  }, [entries]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Despesas por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Distribuição</CardTitle>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[250px] w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (expenses.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <TrendingDown className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhuma despesa encontrada</h3>
          <p className="text-muted-foreground text-center">
            Não há despesas registradas no período selecionado.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {/* Summary Cards */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Total de Despesas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{formatCurrency(totalExpenses)}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {entries.length} transações em {expenses.length} categorias
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Média por Categoria</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(totalExpenses / (expenses.length || 1))}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Por categoria no período
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Maior Categoria</CardTitle>
        </CardHeader>
        <CardContent>
          {expenses[0] && (
            <>
              <div className="text-lg font-bold truncate">{expenses[0].category_name}</div>
              <div className="text-xl font-bold text-red-600">
                {formatCurrency(expenses[0].total_amount)}
              </div>
              <p className="text-xs text-muted-foreground">
                {expenses[0].percentage.toFixed(1)}% do total
              </p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Pie Chart */}
      <Card className="md:col-span-1">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            Distribuição
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Legend 
                  layout="vertical"
                  align="right"
                  verticalAlign="middle"
                  formatter={(value, entry: any) => (
                    <span className="text-xs">{value}</span>
                  )}
                />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Categories Table with Details */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-red-500" />
            Despesas por Categoria
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {expenses.map((expense, index) => {
                const categoryId = expense.category_id || 'uncategorized';
                const isExpanded = expandedCategories.has(categoryId);
                const categoryEntries = entriesByCategory.get(categoryId) || [];

                return (
                  <Collapsible
                    key={categoryId}
                    open={isExpanded}
                    onOpenChange={() => toggleCategory(categoryId)}
                  >
                    <CollapsibleTrigger className="w-full">
                      <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3">
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          )}
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: expense.category_color || COLORS[index % COLORS.length] }}
                          />
                          <div className="text-left">
                            <p className="font-medium">{expense.category_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {expense.transaction_count} transações · Média: {formatCurrency(expense.avg_amount)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="w-32">
                            <Progress value={expense.percentage} className="h-2" />
                          </div>
                          <div className="text-right min-w-[100px]">
                            <p className="font-bold text-red-600">{formatCurrency(expense.total_amount)}</p>
                            <p className="text-xs text-muted-foreground">{expense.percentage.toFixed(1)}%</p>
                          </div>
                        </div>
                      </div>
                    </CollapsibleTrigger>
                    
                    <CollapsibleContent>
                      <div className="ml-8 mt-2 border rounded-lg overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Data</TableHead>
                              <TableHead>Descrição</TableHead>
                              <TableHead>Forma Pgto</TableHead>
                              <TableHead className="text-right">Valor</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {categoryEntries.map((entry) => (
                              <TableRow key={entry.id}>
                                <TableCell className="text-xs">
                                  {format(new Date(entry.movement_date), 'dd/MM/yyyy')}
                                </TableCell>
                                <TableCell className="text-xs max-w-[200px] truncate">
                                  {entry.description}
                                </TableCell>
                                <TableCell className="text-xs">
                                  {entry.payment_method || '-'}
                                </TableCell>
                                <TableCell className="text-right text-xs font-medium text-red-600">
                                  {formatCurrency(entry.amount)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
