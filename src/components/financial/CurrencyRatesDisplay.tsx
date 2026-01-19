import { useCurrencyConverter } from "@/hooks/useCurrencyConverter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign, Euro, PoundSterling, RefreshCw, TrendingUp } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { useEffect } from "react";

export const CurrencyRatesDisplay = () => {
  const { exchangeRates, loading, lastUpdated, refreshRates } = useCurrencyConverter();
  const { t, language } = useLanguage();

  useEffect(() => {
    if (!lastUpdated || (Date.now() - lastUpdated.getTime()) > 6 * 60 * 60 * 1000) {
      refreshRates();
    }
  }, [lastUpdated, refreshRates]);

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

  // Get rate date from exchange rates if available
  const rateDate = exchangeRates?.USD ? 
    (exchangeRates as any).rate_date || lastUpdated?.toLocaleDateString() : 
    null;

  return (
    <Card className="p-4 bg-card/50 border-border/30">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-foreground">
            {language === 'pt' ? 'Cotações' : language === 'es' ? 'Cotizaciones' : 'Exchange Rates'}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => refreshRates()}
          disabled={loading}
          className="h-7 w-7 p-0"
        >
          <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <div className="space-y-2">
        {currencyData.map((currency, index) => {
          const IconComponent = currency.icon;
          return (
            <div key={index} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <IconComponent className={`h-4 w-4 ${currency.color}`} />
                <span className="text-muted-foreground">{currency.label}</span>
              </div>
              <span className="font-medium text-foreground">{currency.value}</span>
            </div>
          );
        })}
      </div>

      <div className="mt-3 pt-2 border-t border-border/30">
        <p className="text-xs text-muted-foreground text-center">
          {lastUpdated && (
            <>
              {language === 'pt' ? 'Atualizado às' : language === 'es' ? 'Actualizado a las' : 'Updated at'} {formatTime(lastUpdated)}
              {rateDate && (
                <span className="block mt-0.5 text-primary/70">
                  {language === 'pt' ? 'Cotação de' : language === 'es' ? 'Cotización de' : 'Rate from'} {rateDate}
                </span>
              )}
            </>
          )}
        </p>
      </div>
    </Card>
  );
};