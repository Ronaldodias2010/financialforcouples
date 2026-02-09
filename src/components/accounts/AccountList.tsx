import { useEffect, useState } from "react";
import { useRealtimeTable } from '@/hooks/useRealtimeManager';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";
import { Wallet, Trash2, AlertTriangle, Edit, Shield } from "lucide-react";
import { toast } from "sonner";
import { AccountEditForm } from "./AccountEditForm";
import { AccountDeactivationDialog } from "./AccountDeactivationDialog";

interface AccountData {
  id: string;
  name: string;
  account_type: string;
  account_model: string | null;
  balance: number;
  currency: string;
  overdraft_limit: number;
  is_active: boolean;
}

interface AccountListProps {
  refreshTrigger: number;
}

export const AccountList = ({ refreshTrigger }: AccountListProps) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [accounts, setAccounts] = useState<AccountData[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [deactivatingAccountId, setDeactivatingAccountId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchAccounts();
    }
  }, [user, refreshTrigger]);

  const fetchAccounts = async () => {
    try {
      const { data, error } = await supabase
        .from("accounts")
        .select("*")
        .eq("user_id", user?.id)
        .neq("is_cash_account", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAccounts(data || []);
    } catch (error) {
      console.error("Error fetching accounts:", error);
      toast.error(t('messages.accountError') || "Erro ao carregar contas");
    } finally {
      setLoading(false);
    }
  };

  // Use centralized realtime manager
  useRealtimeTable('accounts', () => fetchAccounts(), !!user?.id);
  useRealtimeTable('transactions', () => fetchAccounts(), !!user?.id);

  const reactivateAccount = async (accountId: string) => {
    try {
      const { error } = await supabase
        .from("accounts")
        .update({ is_active: true })
        .eq("id", accountId);

      if (error) throw error;

      toast.success(t('accounts.deactivation.reactivated') || "Conta reativada com sucesso!");
      fetchAccounts();
    } catch (error) {
      console.error("Error reactivating account:", error);
      toast.error(t('accounts.deactivation.reactivateError') || "Erro ao reativar conta");
    }
  };

  const formatCurrency = (value: number, currency: string) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: currency,
    }).format(value);
  };

  const getAccountTypeLabel = (type: string) => {
    const types = {
      checking: t('accounts.types.checking') || "Conta Corrente",
      savings: t('accounts.types.savings') || "Poupança",
      investment: t('accounts.types.investment') || "Investimento",
      emergency: t('accounts.types.emergency') || "Reserva de Emergência",
      other: t('accounts.types.other') || "Outra"
    };
    return types[type as keyof typeof types] || type;
  };

  const getAccountModelLabel = (model: string | null) => {
    if (!model) return "";
    const models = {
      personal: t('accounts.models.personal') || "Pessoal",
      business: t('accounts.models.business') || "Empresarial"
    };
    return models[model as keyof typeof models] || model;
  };

  const getUsedLimit = (acc: AccountData) => {
    const limit = Number(acc.overdraft_limit || 0);
    const bal = Number(acc.balance || 0);
    // Se o saldo é positivo, limite utilizado = 0; se negativo, usado = min(limite, |saldo|)
    const used = bal >= 0 ? 0 : Math.min(limit, Math.abs(bal));
    return used;
  };

  const getRemainingLimit = (acc: AccountData) => {
    const limit = Number(acc.overdraft_limit || 0);
    const used = getUsedLimit(acc);
    return Math.max(0, limit - used);
  };

  const bankLogos: Record<string, string> = {
    nubank: "/banks/nubank.svg",
    itau: "/banks/itau.svg",
    bradesco: "/banks/bradesco.svg",
    bancodobrasil: "/banks/banco-do-brasil.svg",
    santander: "/banks/santander.svg",
    inter: "/banks/inter.svg",
    c6: "/banks/c6bank.svg",
    caixa: "/banks/caixa.svg",
    sicredi: "/banks/sicredi.png",
    bankofamerica: "/banks/bank-of-america.svg",
    mercadopago: "/lovable-uploads/b5dc9fff-ca93-4a0b-89a9-43e807cb1f7c.png",
    chase: "/banks/chase.svg",
    wellsfargo: "/banks/wells-fargo.svg",
    avenue: "/banks/avenue.svg",
    capitalone: "/banks/capital-one.svg",
  };

  const detectBankKey = (name: string): keyof typeof bankLogos | null => {
    const n = name.toLowerCase();
    if (n.includes("nubank") || n.includes("nu ") || n.includes("nuconta") || n.includes("nu conta")) return "nubank";
    if (n.includes("itaú") || n.includes("itau")) return "itau";
    if (n.includes("bradesco")) return "bradesco";
    if (n.includes("banco do brasil") || n === "bb" || n.includes("bb ")) return "bancodobrasil";
    if (n.includes("santander")) return "santander";
    if (n.includes("inter")) return "inter";
    if (n.includes("c6")) return "c6";
    if (n.includes("caixa") || n.includes("cef")) return "caixa";
    if (n.includes("sicredi")) return "sicredi";
    if (n.includes("bank of america") || n.includes("bofa")) return "bankofamerica";
    if (n.includes("mercado pago") || n.includes("mercadopago")) return "mercadopago";
    if (n.includes("chase")) return "chase";
    if (n.includes("wells fargo") || n.includes("weels fargo") || n.includes("wells")) return "wellsfargo";
    if (n.includes("avenue")) return "avenue";
    if (n.includes("capital one") || n.includes("capitalone")) return "capitalone";
    return null;
  };

  const getBankLogo = (name: string): string | null => {
    const key = detectBankKey(name);
    return key ? bankLogos[key] : null;
  };

  const tr = (key: string, def: string) => {
    const value = t(key);
    return value && value !== key ? value : def;
  };
  if (loading) {
    return <div>{t('common.loading') || "Carregando contas..."}</div>;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">{t('accounts.yourAccounts') || "Suas Contas"}</h3>
      
      {accounts.length === 0 ? (
        <Card className="p-6 text-center text-muted-foreground">
          <Wallet className="h-12 w-12 mx-auto mb-4" />
          <p>{t('accounts.noAccounts') || "Nenhuma conta cadastrada"}</p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {accounts.map((account) => (
            <Card 
              key={account.id} 
              className={`p-4 ${!account.is_active ? 'opacity-30 bg-muted/50' : ''} ${account.account_type === 'emergency' ? 'border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-50/30 to-teal-50/30 dark:from-emerald-950/10 dark:to-teal-950/10' : ''}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {(() => {
                    // Show shield icon for emergency accounts
                    if (account.account_type === 'emergency') {
                      return <Shield className="h-8 w-8 text-emerald-600" />;
                    }
                    const logo = getBankLogo(account.name);
                    return logo ? (
                      <img src={logo} alt={`${account.name} logo`} className="h-8 w-8 rounded-sm object-contain" loading="lazy" />
                    ) : (
                      <Wallet className="h-8 w-8 text-primary" />
                    );
                  })()}
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{account.name}</h4>
                      {!account.is_active && (
                        <Badge variant="secondary" className="text-xs">
                          {t('accounts.deactivation.deactivated') || "Desativada"}
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <span>{getAccountTypeLabel(account.account_type)}</span>
                      {account.account_model && (
                        account.account_model === 'personal' ? (
                          <Badge variant="successSegmentFlatLeft" className="ml-2">
                            {getAccountModelLabel(account.account_model)}
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="ml-2">
                            {getAccountModelLabel(account.account_model)}
                          </Badge>
                        )
                      )}
                    </div>
                    <p className="text-lg font-bold">
                      {account.balance < 0 ? (
                        <span className="text-destructive inline-flex items-center gap-1">
                          <AlertTriangle className="h-4 w-4" /> {formatCurrency(account.balance, account.currency)}
                        </span>
                      ) : (
                        <span className="text-primary">{formatCurrency(account.balance, account.currency)}</span>
                      )}
                    </p>
                    <p className="text-sm mt-1">
                      <span className="font-medium">{t('accounts.limitUsed')}: </span>
                      {formatCurrency(getUsedLimit(account), account.currency)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium">{t('accounts.remainingLimit')}: </span>
                      {formatCurrency(getRemainingLimit(account), account.currency)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {tr('accounts.limit', 'Limite') + ': '} {formatCurrency(account.overdraft_limit || 0, account.currency)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {account.is_active ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeactivatingAccountId(account.id)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => reactivateAccount(account.id)}
                      className="h-8 px-3 text-primary hover:text-primary"
                    >
                      {t('accounts.deactivation.reactivate') || "Reativar"}
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingAccountId(account.id)}
                    className="h-8 w-8 p-0"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      
      {editingAccountId && (
        <AccountEditForm
          account={accounts.find(acc => acc.id === editingAccountId)!}
          isOpen={!!editingAccountId}
          onClose={() => setEditingAccountId(null)}
          onSuccess={() => {
            fetchAccounts();
            setEditingAccountId(null);
          }}
        />
      )}
      
      {deactivatingAccountId && (
        <AccountDeactivationDialog
          accountId={deactivatingAccountId}
          accountName={accounts.find(acc => acc.id === deactivatingAccountId)?.name || ""}
          isOpen={!!deactivatingAccountId}
          onClose={() => setDeactivatingAccountId(null)}
          onSuccess={() => {
            fetchAccounts();
            setDeactivatingAccountId(null);
          }}
        />
      )}
    </div>
  );
};