import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Sparkles, 
  Check, 
  X, 
  TrendingUp, 
  Receipt, 
  Home,
  Banknote,
  Loader2
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { TaxSuggestion, SuggestionSection } from '@/hooks/useTaxSuggestions';

const sectionIcons: Record<SuggestionSection, React.ElementType> = {
  taxableIncome: TrendingUp,
  exemptIncome: Banknote,
  deductions: Receipt,
  assets: Home,
};

const sectionColors: Record<SuggestionSection, string> = {
  taxableIncome: 'bg-green-500/10 text-green-500',
  exemptIncome: 'bg-purple-500/10 text-purple-500',
  deductions: 'bg-amber-500/10 text-amber-500',
  assets: 'bg-indigo-500/10 text-indigo-500',
};

interface TaxSuggestionCardProps {
  suggestion: TaxSuggestion;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  isLoading?: boolean;
}

export function TaxSuggestionCard({ 
  suggestion, 
  onAccept, 
  onReject,
  isLoading 
}: TaxSuggestionCardProps) {
  const { t } = useLanguage();
  const Icon = sectionIcons[suggestion.section];
  const colorClass = sectionColors[suggestion.section];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const confidenceBadge = {
    high: { className: 'bg-green-500/10 text-green-500', labelKey: 'tax.suggestions.highConfidence' },
    medium: { className: 'bg-amber-500/10 text-amber-500', labelKey: 'tax.suggestions.mediumConfidence' },
    low: { className: 'bg-muted text-muted-foreground', labelKey: 'tax.suggestions.lowConfidence' },
  };

  const { className: confClass, labelKey: confLabel } = confidenceBadge[suggestion.confidence];

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className={`p-2 rounded-lg ${colorClass}`}>
            <Icon className="h-5 w-5" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs">
                <Sparkles className="h-3 w-3 mr-1" />
                {t('tax.suggestions.badge')}
              </Badge>
              <Badge variant="outline" className={`text-xs ${confClass}`}>
                {t(confLabel)}
              </Badge>
            </div>

            <p className="font-medium text-sm mb-1">
              {suggestion.description}
            </p>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">
                {formatCurrency(suggestion.amount)}
              </span>
              <span>
                {suggestion.transactionCount} {t('tax.transactions')}
              </span>
              <span className="capitalize">
                {suggestion.categoryName}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 shrink-0">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onReject(suggestion.id)}
              disabled={isLoading}
              className="text-muted-foreground hover:text-destructive"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <X className="h-4 w-4" />
              )}
              <span className="sr-only md:not-sr-only md:ml-2">
                {t('tax.suggestions.ignore')}
              </span>
            </Button>
            <Button
              size="sm"
              onClick={() => onAccept(suggestion.id)}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              <span className="sr-only md:not-sr-only md:ml-2">
                {t('tax.suggestions.include')}
              </span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface TaxSuggestionsBannerProps {
  count: number;
  onViewAll: () => void;
}

export function TaxSuggestionsBanner({ count, onViewAll }: TaxSuggestionsBannerProps) {
  const { t } = useLanguage();

  if (count === 0) return null;

  return (
    <Card className="border-primary/30 bg-gradient-to-r from-primary/5 to-primary/10">
      <CardContent className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-primary/10">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-medium text-sm">
              {t('tax.suggestions.bannerTitle')}
            </p>
            <p className="text-sm text-muted-foreground">
              {count} {t('tax.suggestions.bannerCount')}
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={onViewAll}>
          {t('tax.suggestions.viewAll')}
        </Button>
      </CardContent>
    </Card>
  );
}
