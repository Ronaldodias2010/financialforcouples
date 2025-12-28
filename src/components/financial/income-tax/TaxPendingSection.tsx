import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  AlertCircle,
  Tag,
  TrendingUp,
  FileText,
  ArrowRight
} from 'lucide-react';
import { PendingItem } from '@/hooks/useIncomeTaxReport';
import { useLanguage } from '@/contexts/LanguageContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TaxPendingSectionProps {
  items: PendingItem[];
  formatCurrency: (value: number) => string;
}

const pendingIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  uncategorized: Tag,
  high_income: TrendingUp,
  missing_doc: FileText,
  unclassified: AlertCircle
};

const pendingColors: Record<string, { color: string; bg: string }> = {
  uncategorized: { color: 'text-amber-500', bg: 'bg-amber-500/10' },
  high_income: { color: 'text-green-500', bg: 'bg-green-500/10' },
  missing_doc: { color: 'text-red-500', bg: 'bg-red-500/10' },
  unclassified: { color: 'text-gray-500', bg: 'bg-gray-500/10' }
};

export function TaxPendingSection({ items, formatCurrency }: TaxPendingSectionProps) {
  const { t } = useLanguage();

  const getPendingLabel = (type: PendingItem['type']) => {
    switch (type) {
      case 'uncategorized':
        return t('tax.pending.uncategorized');
      case 'high_income':
        return t('tax.pending.highIncome');
      case 'missing_doc':
        return t('tax.pending.missingDoc');
      case 'unclassified':
        return t('tax.pending.unclassified');
    }
  };

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4 pt-4">
      {/* Warning Banner */}
      <Card className="bg-red-500/10 border-red-500/20">
        <CardContent className="flex items-center gap-3 py-3">
          <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
          <div>
            <p className="font-medium text-red-600">{t('tax.pending.title')}</p>
            <p className="text-sm text-muted-foreground">
              {t('tax.pending.subtitle')}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Pending Items */}
      <div className="space-y-3">
        {items.map((item, index) => {
          const Icon = pendingIcons[item.type] || AlertCircle;
          const colors = pendingColors[item.type] || pendingColors.unclassified;

          return (
            <Card key={index} className="hover:shadow-sm transition-shadow">
              <CardContent className="py-4">
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg ${colors.bg}`}>
                    <Icon className={`h-4 w-4 ${colors.color}`} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium truncate">{item.description}</h4>
                      <Badge variant="outline" className={`text-xs ${colors.bg} ${colors.color}`}>
                        {getPendingLabel(item.type)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                      {item.date && (
                        <span>{format(new Date(item.date), 'dd/MM/yyyy', { locale: ptBR })}</span>
                      )}
                      <span className="font-medium">{formatCurrency(item.amount)}</span>
                    </div>
                  </div>

                  <Button variant="default" size="sm">
                    {t('tax.pending.resolveNow')}
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Summary */}
      <Card>
        <CardContent className="py-4 text-center">
          <p className="text-sm text-muted-foreground">
            {t('tax.pending.resolveAll')}
          </p>
          <Button className="mt-3" variant="default">
            {t('tax.pending.resolveAllButton')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
