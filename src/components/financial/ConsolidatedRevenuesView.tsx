import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, TrendingUp, PieChart } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ConsolidatedCategory, CashFlowEntry } from '@/hooks/useCashFlowHistory';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, Legend, Tooltip } from 'recharts';

interface ConsolidatedRevenuesViewProps {
  revenues: ConsolidatedCategory[];
  entries: CashFlowEntry[];
  isLoading: boolean;
  dateRange: { start: Date; end: Date };
}

const COLORS = [
  '#22c55e', '#16a34a', '#15803d', '#166534', '#14532d',
  '#10b981', '#059669', '#047857', '#065f46', '#064e3b',
  '#34d399', '#6ee7b7', '#a7f3d0', '#d1fae5', '#ecfdf5'
];

export function ConsolidatedRevenuesView({ revenues, entries, isLoading, dateRange }: ConsolidatedRevenuesViewProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const totalRevenues = useMemo(() => 
    revenues.reduce((sum, r) => sum + r.total_amount, 0), 
    [revenues]
  );

  const chartData = useMemo(() => 
    revenues.map((revenue, index) => ({
      name: revenue.category_name,
      value: revenue.total_amount,
      color: revenue.category_color || COLORS[index % COLORS.length]
    })),
    [revenues]
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
            <CardTitle>Receitas por Categoria</CardTitle>
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

  if (revenues.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhuma receita encontrada</h3>
          <p className="text-muted-foreground text-center">
            Não há receitas registradas no período selecionado.
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
          <CardTitle className="text-sm font-medium">Total de Receitas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{formatCurrency(totalRevenues)}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {entries.length} transações em {revenues.length} categorias
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Média por Categoria</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(totalRevenues / (revenues.length || 1))}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Por categoria no período
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Maior Fonte</CardTitle>
        </CardHeader>
        <CardContent>
          {revenues[0] && (
            <>
              <div className="text-lg font-bold truncate">{revenues[0].category_name}</div>
              <div className="text-xl font-bold text-green-600">
                {formatCurrency(revenues[0].total_amount)}
              </div>
              <p className="text-xs text-muted-foreground">
                {revenues[0].percentage.toFixed(1)}% do total
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
            <TrendingUp className="h-5 w-5 text-green-500" />
            Receitas por Categoria
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {revenues.map((revenue, index) => {
                const categoryId = revenue.category_id || 'uncategorized';
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
                            style={{ backgroundColor: revenue.category_color || COLORS[index % COLORS.length] }}
                          />
                          <div className="text-left">
                            <p className="font-medium">{revenue.category_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {revenue.transaction_count} transações · Média: {formatCurrency(revenue.avg_amount)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="w-32">
                            <Progress value={revenue.percentage} className="h-2 [&>div]:bg-green-500" />
                          </div>
                          <div className="text-right min-w-[100px]">
                            <p className="font-bold text-green-600">{formatCurrency(revenue.total_amount)}</p>
                            <p className="text-xs text-muted-foreground">{revenue.percentage.toFixed(1)}%</p>
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
                                <TableCell className="text-right text-xs font-medium text-green-600">
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
