import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Banknote } from "lucide-react";
import { useCurrencyConverter, type CurrencyCode } from "@/hooks/useCurrencyConverter";
import { useLanguage } from "@/hooks/useLanguage";

interface CashAccountCardProps {
  cashAccounts: Array<{
    id: string;
    balance: number;
    currency: CurrencyCode;
  }>;
  className?: string;
}

export const CashAccountCard = ({ cashAccounts, className }: CashAccountCardProps) => {
  const { formatCurrency } = useCurrencyConverter();
  const { t } = useLanguage();

  // Find the main cash account (BRL or first one)
  const mainAccount = cashAccounts.find(acc => acc.currency === 'BRL') || cashAccounts[0];
  const otherAccounts = cashAccounts.filter(acc => acc.id !== mainAccount?.id);

  if (!mainAccount) {
    return (
      <Card className={`border-dashed border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10 ${className}`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Banknote className="h-4 w-4 text-primary" />
            {t('cash')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-muted-foreground">
            {formatCurrency(0, 'BRL')}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {t('cashBalance')}
          </p>
        </CardContent>
      </Card>
    );
  }

  const isMainNegative = mainAccount.balance < 0;

  return (
    <Card className={`border-dashed border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10 ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Banknote className="h-4 w-4 text-primary" />
          {t('cash')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Main currency balance */}
        <div className="text-2xl font-bold">
          <span className={isMainNegative ? "text-destructive" : "text-foreground"}>
            {formatCurrency(mainAccount.balance, mainAccount.currency)}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {t('cashBalance')}
        </p>
        
        {/* Other currencies if available */}
        {otherAccounts.length > 0 && (
          <div className="mt-3 space-y-1">
            {otherAccounts.map((account) => (
              <div key={account.id} className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">{account.currency}:</span>
                <span className={account.balance < 0 ? "text-destructive" : "text-foreground"}>
                  {formatCurrency(account.balance, account.currency)}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};