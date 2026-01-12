import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Wallet, 
  Building2, 
  CreditCard, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Banknote
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { AccountBreakdown } from '@/hooks/useFinancialPosition';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';

interface FinancialPositionCardsProps {
  cashAvailable: number;
  totalDebt: number;
  netPosition: number;
  assetsCash: number;
  assetsBank: number;
  liabilitiesCreditLimit: number;
  accountsBreakdown?: AccountBreakdown[];
}

export function FinancialPositionCards({
  cashAvailable,
  totalDebt,
  netPosition,
  assetsCash,
  assetsBank,
  liabilitiesCreditLimit,
  accountsBreakdown = []
}: FinancialPositionCardsProps) {
  const { t, language } = useLanguage();
  const [isBreakdownOpen, setIsBreakdownOpen] = React.useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getPositionLabel = () => {
    if (language === 'en') {
      return netPosition >= 0 ? 'Positive position' : 'Negative position';
    } else if (language === 'es') {
      return netPosition >= 0 ? 'Posición positiva' : 'Posición negativa';
    }
    return netPosition >= 0 ? 'Posição positiva' : 'Posição negativa';
  };

  const cashAccounts = accountsBreakdown.filter(a => a.category === 'cash');
  const bankAccounts = accountsBreakdown.filter(a => a.category === 'bank');
  const creditAccounts = accountsBreakdown.filter(a => a.category === 'credit_limit');

  return (
    <div className="space-y-4">
      {/* Main Position Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Cash Available Card */}
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === 'en' ? 'Available Cash' : language === 'es' ? 'Efectivo Disponible' : 'Dinheiro Disponível'}
            </CardTitle>
            <Banknote className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(cashAvailable)}
            </div>
            <p className="text-xs text-muted-foreground">
              {language === 'en' ? 'Cash + Bank' : language === 'es' ? 'Efectivo + Banco' : 'Dinheiro + Banco'}
            </p>
          </CardContent>
        </Card>

        {/* Total Debt Card */}
        <Card className={cn(
          "border-l-4",
          totalDebt > 0 ? "border-l-red-500" : "border-l-muted"
        )}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === 'en' ? 'Total Debt' : language === 'es' ? 'Deuda Total' : 'Dívida Total'}
            </CardTitle>
            {totalDebt > 0 ? (
              <AlertTriangle className="h-4 w-4 text-red-500" />
            ) : (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className={cn(
              "text-2xl font-bold",
              totalDebt > 0 ? "text-red-600" : "text-muted-foreground"
            )}>
              {totalDebt > 0 ? `-${formatCurrency(totalDebt)}` : formatCurrency(0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {language === 'en' ? 'Credit limit used' : language === 'es' ? 'Límite usado' : 'Limite utilizado'}
            </p>
          </CardContent>
        </Card>

        {/* Net Position Card */}
        <Card className={cn(
          "border-l-4",
          netPosition >= 0 ? "border-l-primary" : "border-l-amber-500"
        )}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === 'en' ? 'Net Position' : language === 'es' ? 'Posición Neta' : 'Posição Líquida'}
            </CardTitle>
            {netPosition >= 0 ? (
              <TrendingUp className="h-4 w-4 text-primary" />
            ) : (
              <TrendingDown className="h-4 w-4 text-amber-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className={cn(
              "text-2xl font-bold",
              netPosition >= 0 ? "text-foreground" : "text-amber-600"
            )}>
              {formatCurrency(netPosition)}
            </div>
            <p className="text-xs text-muted-foreground">
              {getPositionLabel()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Breakdown Section */}
      {accountsBreakdown.length > 0 && (
        <Collapsible open={isBreakdownOpen} onOpenChange={setIsBreakdownOpen}>
          <CollapsibleTrigger asChild>
            <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between py-3">
                <CardTitle className="text-sm font-medium">
                  {language === 'en' ? 'Breakdown by Account' : language === 'es' ? 'Desglose por Cuenta' : 'Detalhamento por Conta'}
                </CardTitle>
                <ChevronDown className={cn(
                  "h-4 w-4 transition-transform",
                  isBreakdownOpen && "rotate-180"
                )} />
              </CardHeader>
            </Card>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <Card className="mt-2">
              <CardContent className="pt-4">
                <div className="grid gap-4 md:grid-cols-3">
                  {/* Cash Accounts */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-green-600">
                      <Wallet className="h-4 w-4" />
                      {language === 'en' ? 'Cash' : language === 'es' ? 'Efectivo' : 'Dinheiro'}
                    </div>
                    {cashAccounts.length > 0 ? (
                      cashAccounts.map(account => (
                        <div key={account.accountId} className="flex justify-between text-sm pl-6">
                          <span className="text-muted-foreground truncate">{account.accountName}</span>
                          <span className="font-medium">{formatCurrency(account.balance)}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground pl-6">-</p>
                    )}
                    <div className="flex justify-between text-sm font-semibold pl-6 pt-1 border-t">
                      <span>Total</span>
                      <span className="text-green-600">{formatCurrency(assetsCash)}</span>
                    </div>
                  </div>

                  {/* Bank Accounts */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-blue-600">
                      <Building2 className="h-4 w-4" />
                      {language === 'en' ? 'Bank' : language === 'es' ? 'Banco' : 'Banco'}
                    </div>
                    {bankAccounts.length > 0 ? (
                      bankAccounts.map(account => (
                        <div key={account.accountId} className="flex justify-between text-sm pl-6">
                          <span className="text-muted-foreground truncate">{account.accountName}</span>
                          <span className="font-medium">{formatCurrency(account.balance)}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground pl-6">-</p>
                    )}
                    <div className="flex justify-between text-sm font-semibold pl-6 pt-1 border-t">
                      <span>Total</span>
                      <span className="text-blue-600">{formatCurrency(assetsBank)}</span>
                    </div>
                  </div>

                  {/* Credit Limit Used */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-red-600">
                      <CreditCard className="h-4 w-4" />
                      {language === 'en' ? 'Credit Used' : language === 'es' ? 'Crédito Usado' : 'Limite Usado'}
                    </div>
                    {creditAccounts.length > 0 ? (
                      creditAccounts.map(account => (
                        <div key={account.accountId} className="flex justify-between text-sm pl-6">
                          <span className="text-muted-foreground truncate">{account.accountName}</span>
                          <span className="font-medium text-red-600">{formatCurrency(account.balance)}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground pl-6">-</p>
                    )}
                    <div className="flex justify-between text-sm font-semibold pl-6 pt-1 border-t">
                      <span>Total</span>
                      <span className="text-red-600">-{formatCurrency(liabilitiesCreditLimit)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}
