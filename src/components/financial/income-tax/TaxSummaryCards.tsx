import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  TrendingUp, 
  Wallet, 
  Receipt, 
  Home, 
  CreditCard 
} from 'lucide-react';
import { TaxReportSummary } from '@/hooks/useIncomeTaxReport';
import { useLanguage } from '@/contexts/LanguageContext';

interface TaxSummaryCardsProps {
  summary: TaxReportSummary;
  formatCurrency: (value: number) => string;
}

export function TaxSummaryCards({ summary, formatCurrency }: TaxSummaryCardsProps) {
  const { t } = useLanguage();

  const cards = [
    {
      title: t('tax.card.taxableIncome'),
      value: formatCurrency(summary.taxableIncome),
      icon: TrendingUp,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      description: t('tax.card.taxableIncomeDesc')
    },
    {
      title: t('tax.card.exemptIncome'),
      value: formatCurrency(summary.exemptIncome),
      icon: Wallet,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      description: t('tax.card.exemptIncomeDesc')
    },
    {
      title: t('tax.card.deductions'),
      value: formatCurrency(summary.deductibleExpenses),
      icon: Receipt,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
      description: t('tax.card.deductionsDesc')
    },
    {
      title: t('tax.card.assets'),
      value: formatCurrency(summary.totalAssets),
      icon: Home,
      color: 'text-indigo-500',
      bgColor: 'bg-indigo-500/10',
      description: t('tax.card.assetsDesc')
    },
    {
      title: t('tax.card.debts'),
      value: formatCurrency(summary.totalDebts),
      icon: CreditCard,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
      description: t('tax.card.debtsDesc')
    }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      {cards.map((card, index) => (
        <Card 
          key={index} 
          className="cursor-pointer hover:shadow-md transition-shadow"
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            <div className={`p-2 rounded-lg ${card.bgColor}`}>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {card.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
