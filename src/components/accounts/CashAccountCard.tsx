import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Banknote } from "lucide-react";
import { useCurrencyConverter, type CurrencyCode } from "@/hooks/useCurrencyConverter";
import { useLanguage, type Language } from "@/hooks/useLanguage";

interface CashAccountCardProps {
  cashAccounts: Array<{
    id: string;
    balance: number;
    currency: CurrencyCode;
  }>;
  className?: string;
}

export const CashAccountCard = ({ cashAccounts, className }: CashAccountCardProps) => {
  const { formatCurrency, convertCurrency } = useCurrencyConverter();
  const { t, language } = useLanguage();

  // Get display currency based on language
  const getDisplayCurrency = (): CurrencyCode => {
    switch (language) {
      case 'en':
        return 'USD';
      case 'es':
        return 'EUR';
      default:
        return 'BRL';
    }
  };

  // Get currency symbol only (without duplicating currency codes)
  const getCurrencySymbol = (currency: CurrencyCode): string => {
    switch (currency) {
      case 'BRL':
        return 'R$';
      case 'USD':
        return '$';
      case 'EUR':
        return '€';
      default:
        return currency;
    }
  };

  const displayCurrency = getDisplayCurrency();

  // Group accounts by currency and sum balances to avoid duplicates
  const groupedAccounts = cashAccounts.reduce((acc, account) => {
    const existing = acc.find(item => item.currency === account.currency);
    if (existing) {
      existing.balance += account.balance;
    } else {
      acc.push({
        id: account.id,
        currency: account.currency,
        balance: account.balance
      });
    }
    return acc;
  }, [] as Array<{ id: string; currency: CurrencyCode; balance: number; }>);

  // Find the main cash account based on user's language preference
  const mainAccount = groupedAccounts.find(acc => acc.currency === displayCurrency) || 
                     groupedAccounts.find(acc => acc.currency === 'BRL') || 
                     groupedAccounts[0];
  const otherAccounts = groupedAccounts.filter(acc => acc.currency !== mainAccount?.currency);

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
            {formatCurrency(0, displayCurrency)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {t('cashBalance')}
          </p>
        </CardContent>
      </Card>
    );
  }

  // Convert balance to display currency
  const convertedBalance = convertCurrency(mainAccount.balance, mainAccount.currency, displayCurrency);
  const isMainNegative = convertedBalance < 0;

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
            {formatCurrency(convertedBalance, displayCurrency)}
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
                <span className="text-muted-foreground">{getCurrencySymbol(account.currency)}</span>
                <span className={account.balance < 0 ? "text-destructive" : "text-foreground"}>
                  {Math.abs(account.balance).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};