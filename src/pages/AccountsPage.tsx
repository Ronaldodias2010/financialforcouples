import { useEffect, useMemo, useState } from "react";
import { AccountForm } from "@/components/accounts/AccountForm";
import { AccountList } from "@/components/accounts/AccountList";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/useLanguage";
import { ArrowLeft, CreditCard } from "lucide-react";
import { FinancialCard } from "@/components/financial/FinancialCard";
import { supabase } from "@/integrations/supabase/client";
import { usePartnerNames } from "@/hooks/usePartnerNames";
import { useCurrencyConverter, type CurrencyCode } from "@/hooks/useCurrencyConverter";

interface AccountsPageProps {
  onBack: () => void;
}

interface CardRow {
  owner_user: "user1" | "user2" | null;
  currency: CurrencyCode | null;
  current_balance: number | null;
  initial_balance: number | null;
}

export const AccountsPage = ({ onBack }: AccountsPageProps) => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { t } = useLanguage();
  const { names } = usePartnerNames();
  const { convertCurrency } = useCurrencyConverter();

  const [viewMode, setViewMode] = useState<"both" | "user1" | "user2">("both");
  const [cardsData, setCardsData] = useState<CardRow[]>([]);
  const displayCurrency: CurrencyCode = "BRL";

  useEffect(() => {
    const fetchCards = async () => {
      const { data, error } = await supabase
        .from("cards")
        .select("owner_user, currency, current_balance, initial_balance");
      if (!error && data) {
        setCardsData(
          data.map((c) => ({
            owner_user: (c as any).owner_user ?? "user1",
            currency: ((c as any).currency as CurrencyCode) ?? "BRL",
            current_balance: Number((c as any).current_balance ?? 0),
            initial_balance: Number((c as any).initial_balance ?? 0),
          }))
        );
      }
    };
    fetchCards();
  }, [refreshTrigger]);

  const totalSaldoMaisLimite = useMemo(() => {
    const filtered = viewMode === "both"
      ? cardsData
      : cardsData.filter((c) => (c.owner_user ?? "user1") === viewMode);

    return filtered.reduce((sum, c) => {
      const from = (c.currency ?? "BRL") as CurrencyCode;
      const saldo = convertCurrency(c.current_balance ?? 0, from, displayCurrency);
      const limite = convertCurrency(c.initial_balance ?? 0, from, displayCurrency);
      return sum + saldo + limite;
    }, 0);
  }, [cardsData, viewMode, convertCurrency]);

  const handleAccountAdded = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const getUserLabel = (which: "user1" | "user2") =>
    which === "user1" ? (names.user1Name || t("dashboard.user1")) : (names.user2Name || t("dashboard.user2"));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('back')}
        </Button>
        <h1 className="text-3xl font-bold">{t('accounts.manage')}</h1>
      </div>

      {/* View selector + summary card (Saldo + Limite dos Cartões) */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{t('dashboard.viewMode')}:</span>
          <div className="flex gap-2">
            <Button variant={viewMode === 'both' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('both')}>
              {t('dashboard.both')}
            </Button>
            <Button variant={viewMode === 'user1' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('user1')}>
              {getUserLabel('user1')}
            </Button>
            <Button variant={viewMode === 'user2' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('user2')}>
              {getUserLabel('user2')}
            </Button>
          </div>
        </div>
        <FinancialCard
          title="Saldo + Limite (Cartões)"
          amount={totalSaldoMaisLimite}
          currency={displayCurrency}
          icon={CreditCard}
          type="balance"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <AccountForm onAccountAdded={handleAccountAdded} />
        <AccountList refreshTrigger={refreshTrigger} />
      </div>
    </div>
  );
};