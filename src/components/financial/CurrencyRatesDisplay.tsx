import { useCurrencyConverter } from "@/hooks/useCurrencyConverter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign, Euro, PoundSterling, RefreshCw } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

export const CurrencyRatesDisplay = () => {
  const { exchangeRates, loading, lastUpdated, refreshRates } = useCurrencyConverter();
  const { t, language } = useLanguage();

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString(language === 'pt' ? 'pt-BR' : 'en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getCurrencyData = () => {
    if (language === 'pt') {
      // PT: Show how much 1 foreign currency is worth in BRL
      return [
        {
          icon: DollarSign,
          code: 'USD',
          value: `R$ ${(1 / exchangeRates.USD).toFixed(2)}`,
          label: '1 Dólar',
          color: 'text-expense'
        },
        {
          icon: Euro,
          code: 'EUR', 
          value: `R$ ${(1 / exchangeRates.EUR).toFixed(2)}`,
          label: '1 Euro',
          color: 'text-secondary'
        }
      ];
    } else {
      // EN/ES: Show how much 1 foreign currency is worth in USD
      const eurToUsd = exchangeRates.USD / exchangeRates.EUR;

      return [
        {
          icon: DollarSign,
          code: 'BRL',
          value: `$${exchangeRates.USD.toFixed(3)}`,
          label: '1 Real',
          color: 'text-income'
        },
        {
          icon: Euro,
          code: 'EUR',
          value: `$${eurToUsd.toFixed(3)}`,
          label: '1 Euro',
          color: 'text-secondary'
        }
      ];
    }
  };

  const currencyData = getCurrencyData();

  return (
    <Card className="bg-gradient-to-r from-primary/5 to-secondary/5 border border-primary/20 max-w-2xl mx-auto">
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            {currencyData.map((currency, index) => (
              <div key={currency.code} className="flex items-center gap-2">
                {index > 0 && <div className="w-px h-4 bg-border" />}
                <currency.icon className={`h-3 w-3 ${currency.color}`} />
                <div className="text-xs">
                  <span className={`font-medium ${currency.color}`}>{currency.label}</span>
                  <span className="text-muted-foreground ml-1">{currency.value}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {lastUpdated && (
              <span className="hidden sm:inline">
                {formatTime(lastUpdated)}
              </span>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={refreshRates}
              disabled={loading}
              className="h-5 w-5 p-0"
            >
              <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
        
        <div className="text-xs text-muted-foreground mt-2 text-center">
          💱 {t('currency.updatesInfo')}
        </div>
      </CardContent>
    </Card>
  );
};