import { useCurrencyConverter } from "@/hooks/useCurrencyConverter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign, Euro, RefreshCw } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

export const CurrencyRatesDisplay = () => {
  const { exchangeRates, loading, lastUpdated, refreshRates } = useCurrencyConverter();
  const { t } = useLanguage();

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <Card className="bg-gradient-to-r from-primary/5 to-secondary/5 border border-primary/20">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-expense" />
              <div className="text-sm">
                <span className="font-semibold text-expense">USD</span>
                <span className="text-muted-foreground ml-1">
                  R$ {exchangeRates.USD.toFixed(4)}
                </span>
              </div>
            </div>
            
            <div className="w-px h-6 bg-border" />
            
            <div className="flex items-center gap-2">
              <Euro className="h-4 w-4 text-secondary" />
              <div className="text-sm">
                <span className="font-semibold text-secondary">EUR</span>
                <span className="text-muted-foreground ml-1">
                  R$ {exchangeRates.EUR.toFixed(4)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {lastUpdated && (
              <span>
                {formatTime(lastUpdated)}
              </span>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={refreshRates}
              disabled={loading}
              className="h-6 w-6 p-0"
            >
              <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
        
        <div className="text-xs text-muted-foreground mt-2">
          💱 Cotações atualizadas 3x ao dia
        </div>
      </CardContent>
    </Card>
  );
};