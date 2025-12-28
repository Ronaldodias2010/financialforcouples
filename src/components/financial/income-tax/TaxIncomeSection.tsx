import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Wallet, Info } from 'lucide-react';
import { TaxableIncome } from '@/hooks/useIncomeTaxReport';
import { useLanguage } from '@/contexts/LanguageContext';

interface TaxIncomeSectionProps {
  incomes: TaxableIncome[];
  type: 'taxable' | 'exempt';
  formatCurrency: (value: number) => string;
}

export function TaxIncomeSection({ incomes, type, formatCurrency }: TaxIncomeSectionProps) {
  const { t } = useLanguage();

  const Icon = type === 'taxable' ? TrendingUp : Wallet;
  const color = type === 'taxable' ? 'text-green-500' : 'text-purple-500';
  const bgColor = type === 'taxable' ? 'bg-green-500/10' : 'bg-purple-500/10';

  const totalAmount = incomes.reduce((sum, i) => sum + i.total, 0);

  if (incomes.length === 0) {
    return (
      <div className="pt-4">
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Icon className={`h-10 w-10 ${color} mb-3 opacity-50`} />
            <p className="text-muted-foreground text-center">
              {type === 'taxable' 
                ? t('tax.income.noTaxable')
                : t('tax.income.noExempt')
              }
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 pt-4">
      {/* Info Banner */}
      <Card className="bg-muted/50 border-dashed">
        <CardContent className="flex items-center gap-3 py-3">
          <Info className="h-4 w-4 text-muted-foreground shrink-0" />
          <p className="text-sm text-muted-foreground">
            {type === 'taxable' 
              ? t('tax.income.taxableInfo')
              : t('tax.income.exemptInfo')
            }
          </p>
        </CardContent>
      </Card>

      {/* Income Cards */}
      <div className="grid gap-3 md:grid-cols-2">
        {incomes.map((income, index) => (
          <Card key={index} className="hover:shadow-sm transition-shadow">
            <CardContent className="pt-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${bgColor}`}>
                    <Icon className={`h-4 w-4 ${color}`} />
                  </div>
                  <div>
                    <h4 className="font-medium">{income.category}</h4>
                    <p className="text-xs text-muted-foreground">
                      {income.count} {t('tax.transactions')} • {income.source}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-lg">{formatCurrency(income.total)}</div>
                  <Badge variant="outline" className="text-xs">
                    {income.owner === 'user1' ? t('tax.personA') : t('tax.personB')}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Total */}
      <Card className={bgColor}>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <span className={`font-medium ${color}`}>
              {type === 'taxable' ? t('tax.income.totalTaxable') : t('tax.income.totalExempt')}
            </span>
            <span className={`text-xl font-bold ${color}`}>
              {formatCurrency(totalAmount)}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
