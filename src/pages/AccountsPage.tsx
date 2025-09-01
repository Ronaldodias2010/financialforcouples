import { useEffect, useMemo, useState } from "react";
import { AccountForm } from "@/components/accounts/AccountForm";
import { AccountList } from "@/components/accounts/AccountList";
import { Button } from "@/components/ui/button";

import { useLanguage } from "@/hooks/useLanguage";
import { ArrowLeft, Wallet, Eye } from "lucide-react";
import { FinancialCard } from "@/components/financial/FinancialCard";
import { supabase } from "@/integrations/supabase/client";
import { usePartnerNames } from "@/hooks/usePartnerNames";
import { useCurrencyConverter, type CurrencyCode } from "@/hooks/useCurrencyConverter";
import { useAuth } from "@/hooks/useAuth";
import { useCouple } from "@/hooks/useCouple";
import { CashAccountCard } from "@/components/accounts/CashAccountCard";

interface AccountsPageProps {
  onBack: () => void;
}

interface AccountRow {
  id: string;
  user_id: string;
  owner_user: "user1" | "user2" | null;
  currency: CurrencyCode | null;
  balance: number | null;
  overdraft_limit: number | null;
  account_model: string | null;
  name?: string | null;
  is_cash_account?: boolean | null;
}

export const AccountsPage = ({ onBack }: AccountsPageProps) => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { t } = useLanguage();
  const { names } = usePartnerNames();
  const { convertCurrency } = useCurrencyConverter();

  const [viewMode, setViewMode] = useState<"both" | "user1" | "user2">("both");
  const [accountsData, setAccountsData] = useState<AccountRow[]>([]);
const displayCurrency: CurrencyCode = "BRL";

const { user } = useAuth();
const { getPartnerUserId, isUserOne } = useCouple();
const partnerId = getPartnerUserId();

  useEffect(() => {
    const fetchAccounts = async () => {
      const { data, error } = await supabase
        .from("accounts")
        .select("id, user_id, owner_user, currency, balance, overdraft_limit, account_model, name, is_active, is_cash_account")
        .eq('is_active', true);
      if (!error && data) {
        setAccountsData(
          data.map((a) => ({
            id: (a as any).id as string,
user_id: (a as any).user_id as string,
owner_user: (a as any).owner_user as ("user1" | "user2" | null),
currency: ((a as any).currency as CurrencyCode) ?? "BRL",
balance: Number((a as any).balance ?? 0),
overdraft_limit: Number((a as any).overdraft_limit ?? 0),
account_model: (a as any).account_model ?? 'personal',
name: (a as any).name ?? null,
is_cash_account: (a as any).is_cash_account ?? false,
          }))
        );
      }
    };
    fetchAccounts();
  }, [refreshTrigger]);



const computeSuasContasTotal = (accounts: AccountRow[]) => {
  const total = accounts.reduce((sum, a) => {
    const bal = Number(a.balance ?? 0);
    const limit = Number(a.overdraft_limit ?? 0);
    const from = (a.currency ?? "BRL") as CurrencyCode;
    
    // For cash accounts, only use the balance (no overdraft)
    if (a.is_cash_account) {
      return sum + convertCurrency(bal, from, displayCurrency);
    }
    
    if (bal >= 0) {
      // Valor Disponível = Saldo atual + Limite do cheque especial
      return sum + convertCurrency(bal + limit, from, displayCurrency);
    } else {
      // Se saldo negativo, calcular quanto ainda tem disponível do limite
      const used = Math.min(limit, Math.abs(bal));
      const remaining = Math.max(0, limit - used);
      return sum + convertCurrency(remaining, from, displayCurrency);
    }
  }, 0);
  // Apply consistent rounding to ensure all users see same value
  return Math.round(total * 100) / 100;
};

const computeValorRealTotal = (accounts: AccountRow[]) => {
  const total = accounts.reduce((sum, a) => {
    const bal = Number(a.balance ?? 0);
    const from = (a.currency ?? "BRL") as CurrencyCode;
    return sum + convertCurrency(bal, from, displayCurrency);
  }, 0);
  // Apply consistent rounding to ensure all users see same value
  return Math.round(total * 100) / 100;
};

const currentUserTotal = useMemo(() => {
  if (!user?.id) return 0;
  const acc = accountsData.filter(a => a.user_id === user.id);
  return computeSuasContasTotal(acc);
}, [accountsData, user?.id, convertCurrency]);

const partnerTotal = useMemo(() => {
  if (!partnerId) return 0;
  const acc = accountsData.filter(a => a.user_id === partnerId);
  return computeSuasContasTotal(acc);
}, [accountsData, partnerId, convertCurrency]);

const currentUserRealTotal = useMemo(() => {
  if (!user?.id) return 0;
  const acc = accountsData.filter(a => a.user_id === user.id);
  return computeValorRealTotal(acc);
}, [accountsData, user?.id, convertCurrency]);

const partnerRealTotal = useMemo(() => {
  if (!partnerId) return 0;
  const acc = accountsData.filter(a => a.user_id === partnerId);
  return computeValorRealTotal(acc);
}, [accountsData, partnerId, convertCurrency]);

const user1Total = isUserOne() ? currentUserTotal : partnerTotal;
const user2Total = isUserOne() ? partnerTotal : currentUserTotal;

const user1RealTotal = isUserOne() ? currentUserRealTotal : partnerRealTotal;
const user2RealTotal = isUserOne() ? partnerRealTotal : currentUserRealTotal;

  const handleAccountAdded = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const getUserLabel = (which: "user1" | "user2") =>
    which === "user1" ? (names.user1Name || t("dashboard.user1")) : (names.user2Name || t("dashboard.user2"));

  // Separate cash accounts from regular accounts
  const cashAccounts = accountsData.filter(a => a.is_cash_account);
  const regularAccounts = accountsData.filter(a => !a.is_cash_account);

  // Filter cash accounts by view mode
  const getFilteredCashAccounts = () => {
    if (viewMode === 'both') return cashAccounts;
    
    if (viewMode === 'user1') {
      return cashAccounts.filter(a => {
        if (isUserOne()) return a.user_id === user?.id;
        return a.user_id === partnerId;
      });
    }
    
    if (viewMode === 'user2') {
      return cashAccounts.filter(a => {
        if (isUserOne()) return a.user_id === partnerId;
        return a.user_id === user?.id;
      });
    }
    
    return [];
  };

  const filteredCashAccounts = getFilteredCashAccounts();

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
        <div className="flex items-center gap-3">
          <Eye className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <div className="flex flex-wrap gap-2 min-w-0">
            <Button 
              variant={viewMode === 'both' ? 'default' : 'outline'} 
              size="sm" 
              onClick={() => setViewMode('both')}
              className="text-xs px-2 py-1 h-7"
            >
              {t('dashboard.both')}
            </Button>
            <Button 
              variant={viewMode === 'user1' ? 'default' : 'outline'} 
              size="sm" 
              onClick={() => setViewMode('user1')}
              className="text-xs px-2 py-1 h-7 truncate max-w-24 sm:max-w-none"
            >
              {getUserLabel('user1')}
            </Button>
            <Button 
              variant={viewMode === 'user2' ? 'default' : 'outline'} 
              size="sm" 
              onClick={() => setViewMode('user2')}
              className="text-xs px-2 py-1 h-7 truncate max-w-24 sm:max-w-none"
            >
              {getUserLabel('user2')}
            </Button>
          </div>
        </div>
{viewMode === 'both' ? (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <FinancialCard
      title={t('accounts.valorReal') || "Valor Real — Ambos"}
      amount={Math.round((user1RealTotal + user2RealTotal) * 100) / 100}
      currency={displayCurrency}
      icon={Wallet}
      type="balance"
      className={(user1RealTotal + user2RealTotal) < 0 ? "text-destructive" : ""}
    />
    <FinancialCard
      title={t('accounts.valorDisponivel') || "Valor Disponível — Ambos"}
      amount={Math.round((user1Total + user2Total) * 100) / 100}
      currency={displayCurrency}
      icon={Wallet}
      type="balance"
    />
  </div>
) : (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <FinancialCard
      title={`${t('accounts.valorReal') || "Valor Real"} — ${getUserLabel(viewMode)}`}
      amount={viewMode === 'user1' ? user1RealTotal : user2RealTotal}
      currency={displayCurrency}
      icon={Wallet}
      type="balance"
      className={(viewMode === 'user1' ? user1RealTotal : user2RealTotal) < 0 ? "text-destructive" : ""}
    />
    <FinancialCard
      title={`${t('accounts.valorDisponivel') || "Valor Disponível"} — ${getUserLabel(viewMode)}`}
      amount={viewMode === 'user1' ? user1Total : user2Total}
      currency={displayCurrency}
      icon={Wallet}
      type="balance"
    />
  </div>
)}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Column - Cash Account and Account Management */}
        <div className="space-y-6">
          {/* Cash Account Card */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              {t('cashAccount')}
            </h2>
            <CashAccountCard
              cashAccounts={filteredCashAccounts.map(account => ({
                id: account.id,
                balance: account.balance || 0,
                currency: account.currency || 'BRL'
              }))}
              className="w-full"
            />
          </div>

          {/* Account Management Section */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              {t('accounts.manage')}
            </h2>
            <AccountForm onAccountAdded={handleAccountAdded} />
          </div>
        </div>

        {/* Right Column - Account List */}
        <div className="space-y-6">
          <AccountList refreshTrigger={refreshTrigger} />
        </div>
      </div>
    </div>
  );
};