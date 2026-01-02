import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { 
  Receipt, 
  Calendar,
  User,
  Users,
  CheckCircle,
  AlertTriangle,
  XCircle,
  TrendingUp,
  Wallet,
  FileText,
  Home,
  AlertCircle,
  Download
} from 'lucide-react';
import { useIncomeTaxReport, TaxStatus } from '@/hooks/useIncomeTaxReport';
import { useTaxCountry } from '@/hooks/useTaxCountry';
import { TaxSummaryCards } from './TaxSummaryCards';
import { TaxIdentificationSection } from './TaxIdentificationSection';
import { TaxIncomeSection } from './TaxIncomeSection';
import { TaxDeductionsSection } from './TaxDeductionsSection';
import { TaxAssetsSection } from './TaxAssetsSection';
import { TaxPendingSection } from './TaxPendingSection';
import { TaxExportSection } from './TaxExportSection';
import { TaxCountrySelector } from './TaxCountrySelector';
import { TaxUnderConstruction } from './TaxUnderConstruction';
import { useLanguage } from '@/contexts/LanguageContext';

interface IncomeTaxDashboardProps {
  viewMode: 'both' | 'user1' | 'user2';
}

const currentYear = new Date().getFullYear();
const availableYears = [currentYear - 2, currentYear - 1, currentYear];

export function IncomeTaxDashboard({ viewMode }: IncomeTaxDashboardProps) {
  const { t } = useLanguage();
  const [taxYear, setTaxYear] = useState(currentYear - 1); // Default to previous year

  // Tax country check
  const { 
    taxCountry, 
    isLoading: isLoadingCountry, 
    shouldAskCountry, 
    isDetectedUS, 
    saveCountry, 
    resetCountry 
  } = useTaxCountry();

  const {
    declarationType,
    setDeclarationType,
    taxableIncomes,
    exemptIncomes,
    deductibleExpenses,
    taxAssets,
    pendingItems,
    summary,
    profile,
    isLoading
  } = useIncomeTaxReport({ taxYear, viewMode });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getStatusIcon = (status: TaxStatus) => {
    switch (status) {
      case 'complete':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'attention':
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case 'incomplete':
        return <XCircle className="h-5 w-5 text-red-500" />;
    }
  };

  const getStatusLabel = (status: TaxStatus) => {
    switch (status) {
      case 'complete':
        return t('tax.status.complete');
      case 'attention':
        return t('tax.status.attention');
      case 'incomplete':
        return t('tax.status.incomplete');
    }
  };

  const getStatusColor = (status: TaxStatus) => {
    switch (status) {
      case 'complete':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'attention':
        return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'incomplete':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
    }
  };

  // Loading state
  if (isLoading || isLoadingCountry) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Country selection required
  if (shouldAskCountry) {
    return (
      <TaxCountrySelector 
        onSelect={saveCountry} 
        isDetectedUS={isDetectedUS} 
      />
    );
  }

  // Non-Brazil users see under construction
  if (taxCountry && taxCountry !== 'BR') {
    return (
      <TaxUnderConstruction 
        country={taxCountry} 
        onChangeCountry={resetCountry} 
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Receipt className="h-6 w-6 text-primary" />
            {t('tax.title')}
          </h2>
          <p className="text-muted-foreground">
            {t('tax.subtitle')}
          </p>
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Year Selector */}
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Select value={taxYear.toString()} onValueChange={(v) => setTaxYear(parseInt(v))}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder={t('tax.year')} />
              </SelectTrigger>
              <SelectContent>
                {availableYears.map(year => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Declaration Type */}
          <div className="flex items-center gap-2">
            {declarationType === 'individual' ? (
              <User className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Users className="h-4 w-4 text-muted-foreground" />
            )}
            <Select 
              value={declarationType} 
              onValueChange={(v) => setDeclarationType(v as 'individual' | 'joint')}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder={t('tax.declarationType')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="individual">{t('tax.individual')}</SelectItem>
                <SelectItem value="joint">{t('tax.joint')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status Badge */}
          <Badge className={`${getStatusColor(summary.status)} flex items-center gap-1`}>
            {getStatusIcon(summary.status)}
            {getStatusLabel(summary.status)}
          </Badge>

          {/* Progress */}
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-sm font-medium">{summary.progress}%</span>
            <Progress value={summary.progress} className="w-24 h-2" />
            <span className="text-xs text-muted-foreground">{t('tax.progress')}</span>
          </div>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('tax.selectedYear')}</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{taxYear}</div>
            <p className="text-xs text-muted-foreground">{t('tax.calendarYear')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('tax.declarationType')}</CardTitle>
            {declarationType === 'individual' ? (
              <User className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Users className="h-4 w-4 text-muted-foreground" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {declarationType === 'individual' ? t('tax.individual') : t('tax.joint')}
            </div>
            <p className="text-xs text-muted-foreground">{t('tax.declarationMode')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('tax.status')}</CardTitle>
            {getStatusIcon(summary.status)}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getStatusLabel(summary.status)}</div>
            <p className="text-xs text-muted-foreground">{t('tax.statusDesc')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('tax.progressLabel')}</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.progress}%</div>
            <Progress value={summary.progress} className="h-2 mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Summary Cards (Clickable) */}
      <TaxSummaryCards 
        summary={summary}
        formatCurrency={formatCurrency}
      />

      {/* Guided Sections (Accordion) */}
      <Card>
        <CardHeader>
          <CardTitle>{t('tax.guidedSections')}</CardTitle>
          <CardDescription>{t('tax.guidedSectionsDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" className="w-full" defaultValue={['deductions']}>
            {/* Section 1: Identification */}
            <AccordionItem value="identification">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <User className="h-4 w-4 text-blue-500" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium">{t('tax.section.identification')}</div>
                    <div className="text-sm text-muted-foreground">{t('tax.section.identificationDesc')}</div>
                  </div>
                  <Badge variant="outline" className="ml-auto mr-4 bg-green-500/10 text-green-500 border-green-500/20">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    OK
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <TaxIdentificationSection 
                  profile={profile}
                  declarationType={declarationType}
                />
              </AccordionContent>
            </AccordionItem>

            {/* Section 2: Taxable Income */}
            <AccordionItem value="taxable-income">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium">{t('tax.section.taxableIncome')}</div>
                    <div className="text-sm text-muted-foreground">
                      {formatCurrency(summary.taxableIncome)}
                    </div>
                  </div>
                  {taxableIncomes.length > 0 ? (
                    <Badge variant="outline" className="ml-auto mr-4 bg-green-500/10 text-green-500 border-green-500/20">
                      {taxableIncomes.length} {t('tax.items')}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="ml-auto mr-4 bg-amber-500/10 text-amber-500 border-amber-500/20">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {t('tax.noData')}
                    </Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <TaxIncomeSection 
                  incomes={taxableIncomes}
                  type="taxable"
                  formatCurrency={formatCurrency}
                />
              </AccordionContent>
            </AccordionItem>

            {/* Section 3: Exempt Income */}
            <AccordionItem value="exempt-income">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/10">
                    <Wallet className="h-4 w-4 text-purple-500" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium">{t('tax.section.exemptIncome')}</div>
                    <div className="text-sm text-muted-foreground">
                      {formatCurrency(summary.exemptIncome)}
                    </div>
                  </div>
                  {exemptIncomes.length > 0 ? (
                    <Badge variant="outline" className="ml-auto mr-4 bg-green-500/10 text-green-500 border-green-500/20">
                      {exemptIncomes.length} {t('tax.items')}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="ml-auto mr-4 bg-muted text-muted-foreground">
                      {t('tax.noData')}
                    </Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <TaxIncomeSection 
                  incomes={exemptIncomes}
                  type="exempt"
                  formatCurrency={formatCurrency}
                />
              </AccordionContent>
            </AccordionItem>

            {/* Section 4: Deductible Expenses (PRIORITY) */}
            <AccordionItem value="deductions">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/10">
                    <Receipt className="h-4 w-4 text-amber-500" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium flex items-center gap-2">
                      {t('tax.section.deductions')}
                      <Badge className="bg-amber-500 text-white text-xs">⭐ {t('tax.priority')}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatCurrency(summary.deductibleExpenses)}
                    </div>
                  </div>
                  {deductibleExpenses.some(e => e.status !== 'ok') ? (
                    <Badge variant="outline" className="ml-auto mr-4 bg-amber-500/10 text-amber-500 border-amber-500/20">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      {t('tax.attentionNeeded')}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="ml-auto mr-4 bg-green-500/10 text-green-500 border-green-500/20">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      OK
                    </Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <TaxDeductionsSection 
                  deductions={deductibleExpenses}
                  formatCurrency={formatCurrency}
                />
              </AccordionContent>
            </AccordionItem>

            {/* Section 5: Assets and Debts */}
            <AccordionItem value="assets">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-indigo-500/10">
                    <Home className="h-4 w-4 text-indigo-500" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium">{t('tax.section.assets')}</div>
                    <div className="text-sm text-muted-foreground">
                      {taxAssets.length} {t('tax.items')} • {formatCurrency(summary.totalAssets)}
                    </div>
                  </div>
                  <Badge variant="outline" className="ml-auto mr-4 bg-green-500/10 text-green-500 border-green-500/20">
                    {taxAssets.length} {t('tax.registered')}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <TaxAssetsSection 
                  assets={taxAssets}
                  formatCurrency={formatCurrency}
                />
              </AccordionContent>
            </AccordionItem>

            {/* Section 6: Pending Items */}
            {pendingItems.length > 0 && (
              <AccordionItem value="pending">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-red-500/10">
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium">{t('tax.section.pending')}</div>
                      <div className="text-sm text-muted-foreground">
                        {pendingItems.length} {t('tax.itemsPending')}
                      </div>
                    </div>
                    <Badge variant="outline" className="ml-auto mr-4 bg-red-500/10 text-red-500 border-red-500/20">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {pendingItems.length} {t('tax.pending')}
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <TaxPendingSection 
                    items={pendingItems}
                    formatCurrency={formatCurrency}
                  />
                </AccordionContent>
              </AccordionItem>
            )}
          </Accordion>
        </CardContent>
      </Card>

      {/* Export Section */}
      <TaxExportSection 
        taxYear={taxYear}
        summary={summary}
        taxableIncomes={taxableIncomes}
        exemptIncomes={exemptIncomes}
        deductibleExpenses={deductibleExpenses}
        taxAssets={taxAssets}
      />
    </div>
  );
}
