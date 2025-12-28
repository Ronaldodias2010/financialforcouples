import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ArrowUpDown, 
  Calendar as CalendarIcon,
  Download,
  RefreshCw,
  FileText,
  PieChart,
  BarChart3,
  List,
  CheckCircle,
  AlertCircle,
  Receipt
} from 'lucide-react';
import { format, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useCashFlowHistory, PeriodType, ViewMode, getDateRangeForPeriod } from '@/hooks/useCashFlowHistory';
import { CashFlowChart } from './CashFlowChart';
import { CashFlowTable } from './CashFlowTable';
import { ConsolidatedExpensesView } from './ConsolidatedExpensesView';
import { ConsolidatedRevenuesView } from './ConsolidatedRevenuesView';
import { ExportCashFlowDialog } from './ExportCashFlowDialog';
import { IncomeTaxDashboard } from './income-tax';
import { cn } from '@/lib/utils';

interface CashFlowDashboardProps {
  viewMode: ViewMode;
  onViewModeChange?: (mode: ViewMode) => void;
}

export function CashFlowDashboard({ viewMode, onViewModeChange }: CashFlowDashboardProps) {
  const [periodType, setPeriodType] = useState<PeriodType>('monthly');
  const [customStartDate, setCustomStartDate] = useState<Date>(subMonths(new Date(), 1));
  const [customEndDate, setCustomEndDate] = useState<Date>(new Date());
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedMovementType, setSelectedMovementType] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [showExportDialog, setShowExportDialog] = useState(false);

  const dateRange = useMemo(() => {
    if (periodType === 'custom') {
      return { start: customStartDate, end: customEndDate };
    }
    return getDateRangeForPeriod(periodType);
  }, [periodType, customStartDate, customEndDate]);

  const {
    cashFlowEntries,
    summary,
    consolidatedExpenses,
    consolidatedRevenues,
    isLoading,
    populateHistory,
    isPopulating,
    refreshAll
  } = useCashFlowHistory({
    startDate: dateRange.start,
    endDate: dateRange.end,
    viewMode,
    accountId: selectedAccountId,
    categoryId: selectedCategoryId,
    movementType: selectedMovementType
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const hasData = cashFlowEntries.length > 0;

  return (
    <div className="space-y-6">
      {/* Header with Period Selection */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Fluxo de Caixa</h2>
          <p className="text-muted-foreground">
            {format(dateRange.start, "dd 'de' MMMM", { locale: ptBR })} - {format(dateRange.end, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select value={periodType} onValueChange={(v) => setPeriodType(v as PeriodType)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Mensal</SelectItem>
              <SelectItem value="quarterly">Trimestral</SelectItem>
              <SelectItem value="yearly">Anual</SelectItem>
              <SelectItem value="custom">Personalizado</SelectItem>
            </SelectContent>
          </Select>

          {periodType === 'custom' && (
            <>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(customStartDate, 'dd/MM/yyyy')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={customStartDate}
                    onSelect={(date) => date && setCustomStartDate(date)}
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
              <span className="text-muted-foreground">até</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(customEndDate, 'dd/MM/yyyy')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={customEndDate}
                    onSelect={(date) => date && setCustomEndDate(date)}
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </>
          )}

          <Button variant="outline" size="sm" onClick={refreshAll} disabled={isLoading}>
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>

          <Button variant="outline" size="sm" onClick={() => setShowExportDialog(true)} disabled={!hasData}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* No Data State */}
      {!hasData && !isLoading && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum dado no histórico</h3>
            <p className="text-muted-foreground text-center max-w-md mb-4">
              O histórico de fluxo de caixa está vazio. Clique no botão abaixo para importar suas transações existentes.
            </p>
            <Button onClick={() => populateHistory()} disabled={isPopulating}>
              {isPopulating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Importando...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Importar Transações
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      {summary && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Saldo Inicial</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(summary.initial_balance)}</div>
              <p className="text-xs text-muted-foreground">
                Início do período
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Entradas</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(summary.total_income)}</div>
              <p className="text-xs text-muted-foreground">
                {summary.income_count} transações
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Saídas</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{formatCurrency(summary.total_expense)}</div>
              <p className="text-xs text-muted-foreground">
                {summary.expense_count} transações
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resultado</CardTitle>
              <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={cn(
                "text-2xl font-bold",
                summary.net_result >= 0 ? "text-green-600" : "text-red-600"
              )}>
                {formatCurrency(summary.net_result)}
              </div>
              <p className="text-xs text-muted-foreground">
                {summary.net_result >= 0 ? 'Superávit' : 'Déficit'} no período
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Saldo Final</CardTitle>
              {summary.final_balance >= summary.initial_balance ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-amber-500" />
              )}
            </CardHeader>
            <CardContent>
              <div className={cn(
                "text-2xl font-bold",
                summary.final_balance >= 0 ? "text-foreground" : "text-red-600"
              )}>
                {formatCurrency(summary.final_balance)}
              </div>
              <p className="text-xs text-muted-foreground">
                {summary.transaction_count} movimentações
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs for different views */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
          <TabsTrigger value="overview" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Visão Geral</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <List className="h-4 w-4" />
            <span className="hidden sm:inline">Histórico</span>
          </TabsTrigger>
          <TabsTrigger value="expenses" className="gap-2">
            <TrendingDown className="h-4 w-4" />
            <span className="hidden sm:inline">Despesas</span>
          </TabsTrigger>
          <TabsTrigger value="revenues" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Receitas</span>
          </TabsTrigger>
          <TabsTrigger value="incomeTax" className="gap-2">
            <Receipt className="h-4 w-4" />
            <span className="hidden sm:inline">Imposto de Renda</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <CashFlowChart 
            entries={cashFlowEntries}
            summary={summary}
            dateRange={dateRange}
          />
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <CashFlowTable 
            entries={cashFlowEntries}
            isLoading={isLoading}
            onFilterChange={(type) => setSelectedMovementType(type)}
          />
        </TabsContent>

        <TabsContent value="expenses" className="space-y-4">
          <ConsolidatedExpensesView 
            expenses={consolidatedExpenses}
            entries={cashFlowEntries.filter(e => e.movement_type === 'expense')}
            isLoading={isLoading}
            dateRange={dateRange}
          />
        </TabsContent>

        <TabsContent value="revenues" className="space-y-4">
          <ConsolidatedRevenuesView 
            revenues={consolidatedRevenues}
            entries={cashFlowEntries.filter(e => e.movement_type === 'income')}
            isLoading={isLoading}
            dateRange={dateRange}
          />
        </TabsContent>

        <TabsContent value="incomeTax" className="space-y-4">
          <IncomeTaxDashboard viewMode={viewMode} />
        </TabsContent>
      </Tabs>

      {/* Export Dialog */}
      <ExportCashFlowDialog
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
        entries={cashFlowEntries}
        summary={summary}
        consolidatedExpenses={consolidatedExpenses}
        consolidatedRevenues={consolidatedRevenues}
        dateRange={dateRange}
      />
    </div>
  );
}
