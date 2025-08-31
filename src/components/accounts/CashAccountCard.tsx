import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Banknote } from "lucide-react";
import { useCurrencyConverter, type CurrencyCode } from "@/hooks/useCurrencyConverter";
import { useLanguage } from "@/hooks/useLanguage";

interface CashAccountCardProps {
  balance: number;
  currency: CurrencyCode;
  className?: string;
}

export const CashAccountCard = ({ balance, currency, className }: CashAccountCardProps) => {
  const { formatCurrency } = useCurrencyConverter();
  const { t } = useLanguage();

  const isNegative = balance < 0;

  return (
    <Card className={`border-dashed border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10 ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Banknote className="h-4 w-4 text-primary" />
          {currency === 'BRL' ? t('cash') : `${t('cash')} (${currency})`}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          <span className={isNegative ? "text-destructive" : "text-foreground"}>
            {formatCurrency(balance, currency)}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {t('cashBalance')}
        </p>
      </CardContent>
    </Card>
  );
};