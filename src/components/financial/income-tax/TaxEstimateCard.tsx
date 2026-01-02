import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Calculator, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown,
  CheckCircle,
  ArrowRight,
  Info
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  TaxCalculationResult, 
  formatTaxCurrency, 
  getTaxBracketDescription 
} from '@/hooks/useTaxCalculation';

interface TaxEstimateCardProps {
  calculation: TaxCalculationResult;
}

export function TaxEstimateCard({ calculation }: TaxEstimateCardProps) {
  const { t } = useLanguage();
  
  const { simplified, complete, recommended, estimatedTax, savings } = calculation;
  
  const hasIncome = calculation.input.totalTaxableIncome > 0;
  
  if (!hasIncome) {
    return (
      <Card className="border-muted">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calculator className="h-5 w-5 text-muted-foreground" />
            {t('tax.estimate.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            <Calculator className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>{t('tax.estimate.noIncome')}</p>
            <p className="text-sm mt-1">{t('tax.estimate.noIncomeHint')}</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calculator className="h-5 w-5 text-primary" />
          {t('tax.estimate.title')}
        </CardTitle>
        <CardDescription>{t('tax.estimate.subtitle')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Aviso obrigatório */}
        <Alert variant="default" className="border-amber-500/30 bg-amber-500/5">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <AlertTitle className="text-amber-600">{t('tax.estimate.disclaimer.title')}</AlertTitle>
          <AlertDescription className="text-sm text-muted-foreground">
            {t('tax.estimate.disclaimer.text')}
          </AlertDescription>
        </Alert>
        
        {/* Comparação Simplificada vs Completa */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Simplificada */}
          <div 
            className={`p-4 rounded-lg border-2 transition-all ${
              recommended === 'simplified' 
                ? 'border-green-500/50 bg-green-500/5' 
                : 'border-muted bg-muted/5'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-sm">{t('tax.estimate.simplified')}</h4>
              {recommended === 'simplified' && (
                <Badge className="bg-green-500 text-white text-xs">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  {t('tax.estimate.recommended')}
                </Badge>
              )}
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('tax.estimate.discount')}</span>
                <span className="font-medium text-green-600">- {formatTaxCurrency(simplified.discount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('tax.estimate.taxBase')}</span>
                <span>{formatTaxCurrency(simplified.taxBase)}</span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between">
                <span className="font-medium">{t('tax.estimate.taxDue')}</span>
                <span className="font-bold text-lg">{formatTaxCurrency(simplified.taxDue)}</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{t('tax.estimate.effectiveRate')}</span>
                <span>{simplified.effectiveRate.toFixed(2)}%</span>
              </div>
            </div>
          </div>
          
          {/* Completa */}
          <div 
            className={`p-4 rounded-lg border-2 transition-all ${
              recommended === 'complete' 
                ? 'border-green-500/50 bg-green-500/5' 
                : 'border-muted bg-muted/5'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-sm">{t('tax.estimate.complete')}</h4>
              {recommended === 'complete' && (
                <Badge className="bg-green-500 text-white text-xs">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  {t('tax.estimate.recommended')}
                </Badge>
              )}
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('tax.estimate.deductions')}</span>
                <span className="font-medium text-green-600">- {formatTaxCurrency(complete.deductionsTotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('tax.estimate.taxBase')}</span>
                <span>{formatTaxCurrency(complete.taxBase)}</span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between">
                <span className="font-medium">{t('tax.estimate.taxDue')}</span>
                <span className="font-bold text-lg">{formatTaxCurrency(complete.taxDue)}</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{t('tax.estimate.effectiveRate')}</span>
                <span>{complete.effectiveRate.toFixed(2)}%</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Economia */}
        {savings > 0 && (
          <div className="flex items-center justify-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
            <TrendingDown className="h-4 w-4 text-green-600" />
            <span className="text-sm">
              {t('tax.estimate.savings')} <strong className="text-green-600">{formatTaxCurrency(savings)}</strong> {t('tax.estimate.withRecommended')}
            </span>
          </div>
        )}
        
        {/* Resultado Final */}
        <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-full bg-primary/10">
                {estimatedTax > 0 ? (
                  <TrendingUp className="h-5 w-5 text-primary" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-green-500" />
                )}
              </div>
              <div>
                <p className="font-medium">{t('tax.estimate.result')}</p>
                <p className="text-xs text-muted-foreground">
                  {t('tax.estimate.using')} {recommended === 'simplified' ? t('tax.estimate.simplified') : t('tax.estimate.complete')}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-primary">{formatTaxCurrency(estimatedTax)}</p>
              <p className="text-xs text-muted-foreground">
                {t('tax.estimate.bracket')}: {getTaxBracketDescription(
                  recommended === 'simplified' ? simplified.bracket.bracket : complete.bracket.bracket
                )}
              </p>
            </div>
          </div>
        </div>
        
        {/* Info adicional */}
        <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/30">
          <Info className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <p className="text-xs text-muted-foreground">
            {t('tax.estimate.info')}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
