import { useEffect, useMemo, useState } from "react";
import { AccountForm } from "@/components/accounts/AccountForm";
import { AccountList } from "@/components/accounts/AccountList";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/hooks/useLanguage";
import { ArrowLeft, Wallet } from "lucide-react";
import { FinancialCard } from "@/components/financial/FinancialCard";
import { supabase } from "@/integrations/supabase/client";
import { usePartnerNames } from "@/hooks/usePartnerNames";
import { useCurrencyConverter, type CurrencyCode } from "@/hooks/useCurrencyConverter";

interface AccountsPageProps {
  onBack: () => void;
}

interface AccountRow {
  id: string;
  owner_user: "user1" | "user2" | null;
  currency: CurrencyCode | null;
  balance: number | null;
  overdraft_limit: number | null;
  account_model: string | null;
  name?: string | null;
}

export const AccountsPage = ({ onBack }: AccountsPageProps) => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { t } = useLanguage();
  const { names } = usePartnerNames();
  const { convertCurrency } = useCurrencyConverter();

  const [viewMode, setViewMode] = useState<"both" | "user1" | "user2">("both");
  const [accountsData, setAccountsData] = useState<AccountRow[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const displayCurrency: CurrencyCode = "BRL";

  useEffect(() => {
    const fetchAccounts = async () => {
      const { data, error } = await supabase
        .from("accounts")
        .select("id, owner_user, currency, balance, overdraft_limit, account_model, name");
      if (!error && data) {
        setAccountsData(
          data.map((a) => ({
            id: (a as any).id as string,
            owner_user: (a as any).owner_user ?? "user1",
            currency: ((a as any).currency as CurrencyCode) ?? "BRL",
            balance: Number((a as any).balance ?? 0),
            overdraft_limit: Number((a as any).overdraft_limit ?? 0),
            account_model: (a as any).account_model ?? 'personal',
            name: (a as any).name ?? null,
          }))
        );
      }
    };
    fetchAccounts();
  }, [refreshTrigger]);

  const filteredAccounts = useMemo(() => {
    return viewMode === "both"
      ? accountsData
      : accountsData.filter((a) => (a.owner_user ?? "user1") === viewMode);
  }, [accountsData, viewMode]);

  useEffect(() => {
    if (accountsData.length && !selectedAccountId) {
      setSelectedAccountId(accountsData[0].id);
    }
  }, [accountsData, selectedAccountId]);

  useEffect(() => {
    if (filteredAccounts.length && !filteredAccounts.some(a => a.id === selectedAccountId)) {
      setSelectedAccountId(filteredAccounts[0].id);
    }
  }, [viewMode, accountsData]);

  const totalSaldoMaisLimite = useMemo(() => {
    if (!filteredAccounts.length) return 0;

    const selected = filteredAccounts.find(a => a.id === selectedAccountId) || filteredAccounts[0];

    // Saldo positivo apenas da conta selecionada
    const selBal = Number(selected.balance ?? 0);
    const selFrom = (selected.currency ?? "BRL") as CurrencyCode;
    const selectedPositive = convertCurrency(Math.max(selBal, 0), selFrom, displayCurrency);

    // Somar o limite disponível apenas das contas negativas
    const availableFromNegatives = filteredAccounts.reduce((sum, a) => {
      const limit = Number(a.overdraft_limit ?? 0);
      const bal = Number(a.balance ?? 0);
      if (bal < 0) {
        const used = Math.min(limit, Math.abs(bal));
        const remaining = Math.max(0, limit - used);
        const from = (a.currency ?? "BRL") as CurrencyCode;
        return sum + convertCurrency(remaining, from, displayCurrency);
      }
      return sum;
    }, 0);

    const total = selectedPositive + availableFromNegatives;
    return Number(total.toFixed(2));
  }, [filteredAccounts, selectedAccountId, convertCurrency]);

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

      {/* Seletor de visualização + Card de Limite disponível das Contas */}
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
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{t('transactionForm.selectAccount')}:</span>
          <Select value={selectedAccountId ?? undefined} onValueChange={(v) => setSelectedAccountId(v)}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder={t('transactionForm.selectAccountPlaceholder')} />
            </SelectTrigger>
            <SelectContent>
              {filteredAccounts.map((acc) => (
                <SelectItem key={acc.id} value={acc.id}>
                  {(acc.name || 'Conta')} — {acc.currency} {Number(acc.balance ?? 0).toFixed(2)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <FinancialCard
          title="Saldo + Limite disponível (Contas)"
          amount={totalSaldoMaisLimite}
          currency={displayCurrency}
          icon={Wallet}
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