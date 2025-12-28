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
import { ptBR, enUS, es } from 'date-fns/locale';
import { useCashFlowHistory, PeriodType, ViewMode, getDateRangeForPeriod } from '@/hooks/useCashFlowHistory';
import { CashFlowChart } from './CashFlowChart';
import { CashFlowTable } from './CashFlowTable';
import { ConsolidatedExpensesView } from './ConsolidatedExpensesView';
import { ConsolidatedRevenuesView } from './ConsolidatedRevenuesView';
import { ExportCashFlowDialog } from './ExportCashFlowDialog';
import { IncomeTaxDashboard } from './income-tax';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface CashFlowDashboardProps {
  viewMode: ViewMode;
  onViewModeChange?: (mode: ViewMode) => void;
}

export function CashFlowDashboard({ viewMode, onViewModeChange }: CashFlowDashboardProps) {
  const { t, language } = useLanguage();
  const [periodType, setPeriodType] = useState<PeriodType>('monthly');
  const [customStartDate, setCustomStartDate] = useState<Date>(subMonths(new Date(), 1));
  const [customEndDate, setCustomEndDate] = useState<Date>(new Date());
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedMovementType, setSelectedMovementType] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [showExportDialog, setShowExportDialog] = useState(false);

  const getDateLocale = () => {
    switch (language) {
      case 'en': return enUS;
      case 'es': return es;
      default: return ptBR;
    }
  };

  const dateLocale = getDateLocale();

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

  const formatDateRange = () => {
    if (language === 'en') {
      return `${format(dateRange.start, "MMMM dd", { locale: enUS })} - ${format(dateRange.end, "MMMM dd, yyyy", { locale: enUS })}`;
    } else if (language === 'es') {
      return `${format(dateRange.start, "dd 'de' MMMM", { locale: es })} - ${format(dateRange.end, "dd 'de' MMMM 'de' yyyy", { locale: es })}`;
    }
    return `${format(dateRange.start, "dd 'de' MMMM", { locale: ptBR })} - ${format(dateRange.end, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}`;
  };

  return (
    <div className="space-y-6">
      {/* Header with Period Selection */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{t('cashFlow.title')}</h2>
          <p className="text-muted-foreground">
            {formatDateRange()}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select value={periodType} onValueChange={(v) => setPeriodType(v as PeriodType)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder={t('cashFlow.period.placeholder')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">{t('cashFlow.period.monthly')}</SelectItem>
              <SelectItem value="quarterly">{t('cashFlow.period.quarterly')}</SelectItem>
              <SelectItem value="yearly">{t('cashFlow.period.yearly')}</SelectItem>
              <SelectItem value="custom">{t('cashFlow.period.custom')}</SelectItem>
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
                    locale={dateLocale}
                  />
                </PopoverContent>
              </Popover>
              <span className="text-muted-foreground">{t('cashFlow.until')}</span>
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
                    locale={dateLocale}
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
            {t('cashFlow.export')}
          </Button>
        </div>
      </div>

      {/* No Data State */}
      {!hasData && !isLoading && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t('cashFlow.noData.title')}</h3>
            <p className="text-muted-foreground text-center max-w-md mb-4">
              {t('cashFlow.noData.description')}
            </p>
            <Button onClick={() => populateHistory()} disabled={isPopulating}>
              {isPopulating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  {t('cashFlow.importing')}
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  {t('cashFlow.importTransactions')}
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
              <CardTitle className="text-sm font-medium">{t('cashFlow.initialBalance')}</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(summary.initial_balance)}</div>
              <p className="text-xs text-muted-foreground">
                {t('cashFlow.periodStart')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('cashFlow.inflows')}</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(summary.total_income)}</div>
              <p className="text-xs text-muted-foreground">
                {summary.income_count} {t('cashFlow.transactions')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('cashFlow.outflows')}</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{formatCurrency(summary.total_expense)}</div>
              <p className="text-xs text-muted-foreground">
                {summary.expense_count} {t('cashFlow.transactions')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('cashFlow.result')}</CardTitle>
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
                {summary.net_result >= 0 ? t('cashFlow.surplus') : t('cashFlow.deficit')} {t('cashFlow.inPeriod')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('cashFlow.finalBalance')}</CardTitle>
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
                {summary.transaction_count} {t('cashFlow.movements')}
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
            <span className="hidden sm:inline">{t('cashFlow.tabs.overview')}</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <List className="h-4 w-4" />
            <span className="hidden sm:inline">{t('cashFlow.tabs.history')}</span>
          </TabsTrigger>
          <TabsTrigger value="expenses" className="gap-2">
            <TrendingDown className="h-4 w-4" />
            <span className="hidden sm:inline">{t('cashFlow.tabs.expenses')}</span>
          </TabsTrigger>
          <TabsTrigger value="revenues" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">{t('cashFlow.tabs.revenues')}</span>
          </TabsTrigger>
          <TabsTrigger value="incomeTax" className="gap-2">
            <Receipt className="h-4 w-4" />
            <span className="hidden sm:inline">{t('cashFlow.tabs.incomeTax')}</span>
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
