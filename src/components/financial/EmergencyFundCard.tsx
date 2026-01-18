import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Lightbulb, X, Bell } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useCurrencyConverter, CurrencyCode, CURRENCY_INFO } from "@/hooks/useCurrencyConverter";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface EmergencyAccount {
  id: string;
  balance: number;
  currency: string;
  balance_brl: number; // Original balance in BRL for accurate tracking
}

interface EmergencyReminder {
  id: string;
  reminder_type: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

interface EmergencyFundCardProps {
  monthlyExpensesAverage?: number;
}

export const EmergencyFundCard = ({ 
  monthlyExpensesAverage = 0 
}: EmergencyFundCardProps) => {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const { convertCurrency, exchangeRates, refreshRates, loading: ratesLoading } = useCurrencyConverter();
  const [emergencyAccount, setEmergencyAccount] = useState<EmergencyAccount | null>(null);
  const [reminders, setReminders] = useState<EmergencyReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTips, setShowTips] = useState(true);
  const [changingCurrency, setChangingCurrency] = useState(false);

  const accountCurrency = (emergencyAccount?.currency || 'BRL') as CurrencyCode;

  // Convert monthly expenses to account currency for goal calculation
  const monthlyExpensesInAccountCurrency = accountCurrency === 'BRL' 
    ? monthlyExpensesAverage 
    : convertCurrency(monthlyExpensesAverage, 'BRL', accountCurrency);

  // Calculate goal based on 6 months of average expenses (in account currency)
  const suggestedGoal = monthlyExpensesInAccountCurrency * 6;
  const currentBalance = emergencyAccount?.balance || 0;
  const progressPercentage = suggestedGoal > 0 
    ? Math.min((currentBalance / suggestedGoal) * 100, 100) 
    : 0;

  useEffect(() => {
    if (user) {
      fetchEmergencyAccount();
      fetchReminders();
    }
  }, [user]);

  const fetchEmergencyAccount = async () => {
    try {
      // Use type assertion since 'emergency' type exists in DB but not in generated types
      const { data, error } = await (supabase
        .from("accounts")
        .select("id, balance, currency")
        .eq("user_id", user?.id)
        .eq("account_type", "emergency" as any)
        .eq("is_active", true)
        .maybeSingle() as any);

      if (error) throw error;
      
      if (data) {
        // Store original BRL balance for accurate tracking
        const balanceInBRL = data.currency === 'BRL' 
          ? data.balance 
          : convertCurrency(data.balance, data.currency as CurrencyCode, 'BRL');
        
        setEmergencyAccount({
          id: data.id,
          balance: data.balance,
          currency: data.currency,
          balance_brl: balanceInBRL
        });
      } else {
        setEmergencyAccount(null);
      }
    } catch (error) {
      console.error("Error fetching emergency account:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReminders = async () => {
    try {
      // Type assertion for table that exists but may not be in generated types
      const { data, error } = await (supabase
        .from("emergency_fund_reminders" as any)
        .select("*")
        .eq("user_id", user?.id)
        .eq("is_read", false)
        .order("created_at", { ascending: false })
        .limit(3) as any);

      if (error) throw error;
      setReminders(data || []);
    } catch (error) {
      console.error("Error fetching reminders:", error);
    }
  };

  const dismissReminder = async (reminderId: string) => {
    try {
      const { error } = await (supabase
        .from("emergency_fund_reminders" as any)
        .update({ is_read: true })
        .eq("id", reminderId) as any);

      if (error) throw error;
      setReminders(prev => prev.filter(r => r.id !== reminderId));
    } catch (error) {
      console.error("Error dismissing reminder:", error);
    }
  };

  const formatCurrency = (value: number, currency: string = "BRL") => {
    // Use appropriate locale based on currency
    const locale = currency === 'USD' ? 'en-US' : currency === 'EUR' ? 'de-DE' : 'pt-BR';
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
    }).format(value);
  };

  const handleCurrencyChange = async (newCurrency: CurrencyCode) => {
    if (!emergencyAccount || newCurrency === accountCurrency) return;
    
    setChangingCurrency(true);
    try {
      // Get the original BRL balance for accurate conversion
      const balanceInBRL = emergencyAccount.balance_brl || 
        (accountCurrency === 'BRL' ? currentBalance : convertCurrency(currentBalance, accountCurrency, 'BRL'));
      
      // Convert from BRL to new currency for display
      const newBalance = newCurrency === 'BRL' 
        ? balanceInBRL 
        : convertCurrency(balanceInBRL, 'BRL', newCurrency);
      
      const { error } = await supabase
        .from('accounts')
        .update({ 
          currency: newCurrency,
          balance: Math.round(newBalance * 100) / 100
        })
        .eq('id', emergencyAccount.id);

      if (error) throw error;

      setEmergencyAccount(prev => prev ? {
        ...prev,
        currency: newCurrency,
        balance: Math.round(newBalance * 100) / 100,
        balance_brl: balanceInBRL // Preserve original BRL balance
      } : null);

      toast.success(
        language === 'pt' 
          ? `Moeda alterada para ${CURRENCY_INFO[newCurrency].name}` 
          : `Currency changed to ${CURRENCY_INFO[newCurrency].name}`
      );
    } catch (error) {
      console.error('Error changing currency:', error);
      toast.error(
        language === 'pt' 
          ? 'Erro ao alterar moeda' 
          : 'Error changing currency'
      );
    } finally {
      setChangingCurrency(false);
    }
  };

  const getProgressColor = () => {
    if (progressPercentage >= 100) return "bg-green-500";
    if (progressPercentage >= 50) return "bg-yellow-500";
    return "bg-orange-500";
  };

  const getStatusBadge = () => {
    if (progressPercentage >= 100) {
      return (
        <Badge className="bg-green-500/20 text-green-600 border-green-500/30">
          {t('emergency.status.complete') || '✓ Meta Atingida'}
        </Badge>
      );
    }
    if (progressPercentage >= 50) {
      return (
        <Badge className="bg-yellow-500/20 text-yellow-600 border-yellow-500/30">
          {t('emergency.status.onTrack') || '🚧 Em Construção'}
        </Badge>
      );
    }
    return (
      <Badge className="bg-orange-500/20 text-orange-600 border-orange-500/30">
        {t('emergency.status.starting') || '🌱 Começando'}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card className="border-2 border-emerald-500/20 bg-gradient-to-br from-emerald-50/50 to-teal-50/50 dark:from-emerald-950/20 dark:to-teal-950/20">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/3"></div>
            <div className="h-8 bg-muted rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!emergencyAccount) {
    return (
      <Card className="border-2 border-dashed border-emerald-500/30 bg-gradient-to-br from-emerald-50/30 to-teal-50/30 dark:from-emerald-950/10 dark:to-teal-950/10">
        <CardContent className="p-6 text-center">
          <Shield className="h-12 w-12 mx-auto mb-4 text-emerald-500" />
          <h3 className="font-semibold mb-2">
            {t('emergency.noAccount.title') || 'Reserva de Emergência'}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            {t('emergency.noAccount.description') || 'Sua conta de emergência será criada automaticamente.'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-emerald-500/20 bg-gradient-to-br from-emerald-50/50 to-teal-50/50 dark:from-emerald-950/20 dark:to-teal-950/20 overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-emerald-600" />
            <CardTitle className="text-lg">
              {t('emergency.title') || 'Reserva de Emergência'}
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {/* Currency Selector */}
            <Select 
              value={accountCurrency} 
              onValueChange={(value) => handleCurrencyChange(value as CurrencyCode)}
              disabled={changingCurrency}
            >
              <SelectTrigger className="w-[90px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BRL">
                  <span className="flex items-center gap-1">
                    <span>🇧🇷</span> BRL
                  </span>
                </SelectItem>
                <SelectItem value="USD">
                  <span className="flex items-center gap-1">
                    <span>🇺🇸</span> USD
                  </span>
                </SelectItem>
                <SelectItem value="EUR">
                  <span className="flex items-center gap-1">
                    <span>🇪🇺</span> EUR
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
            {getStatusBadge()}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Current Balance */}
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">
            {t('emergency.currentBalance') || 'Saldo Atual'}
          </p>
          <p className="text-3xl font-bold text-emerald-600">
            {formatCurrency(currentBalance, emergencyAccount.currency)}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {t('emergency.progress') || 'Progresso'}
            </span>
            <span className="font-medium">
              {progressPercentage.toFixed(0)}%
            </span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${getProgressColor()}`}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          {suggestedGoal > 0 && (
            <p className="text-xs text-muted-foreground">
              {t('emergency.goalDescription') || 'Meta sugerida: 6 meses de despesas'} = {formatCurrency(suggestedGoal, emergencyAccount.currency)}
            </p>
          )}
        </div>

        {/* Reminders */}
        {reminders.length > 0 && (
          <div className="space-y-2">
            {reminders.map((reminder) => (
              <div 
                key={reminder.id}
                className="flex items-start gap-2 p-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800"
              >
                <Bell className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-800 dark:text-amber-200 flex-1">
                  {reminder.message}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0"
                  onClick={() => dismissReminder(reminder.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Educational Tips */}
        {showTips && currentBalance < suggestedGoal && (
          <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-2">
              <Lightbulb className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs font-medium text-blue-800 dark:text-blue-200 mb-1">
                  {t('emergency.tip.title') || 'Dica Financeira'}
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  {t('emergency.tip.message') || 'A reserva de emergência deve cobrir de 3 a 6 meses de despesas. Use apenas para imprevistos reais como desemprego ou emergências médicas.'}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-5 w-5 p-0"
                onClick={() => setShowTips(false)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}


        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 pt-2 border-t">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              {t('emergency.monthsCovered') || 'Meses Cobertos'}
            </p>
            <p className="text-lg font-semibold text-emerald-600">
              {monthlyExpensesInAccountCurrency > 0 
                ? (currentBalance / monthlyExpensesInAccountCurrency).toFixed(1)
                : '-'
              }
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              {t('emergency.remaining') || 'Falta para Meta'}
            </p>
            <p className="text-lg font-semibold">
              {formatCurrency(Math.max(0, suggestedGoal - currentBalance), accountCurrency)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};