import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";
import { Wallet, Trash2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface AccountData {
  id: string;
  name: string;
  account_type: string;
  account_model: string | null;
  balance: number;
  currency: string;
  overdraft_limit: number;
}

interface AccountListProps {
  refreshTrigger: number;
}

export const AccountList = ({ refreshTrigger }: AccountListProps) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [accounts, setAccounts] = useState<AccountData[]>([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel("accounts-listener")
      .on("postgres_changes", { event: "*", schema: "public", table: "accounts", filter: `user_id=eq.${user.id}` }, () => {
        fetchAccounts();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "transactions", filter: `user_id=eq.${user.id}` }, () => {
        fetchAccounts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const deleteAccount = async (accountId: string) => {
    try {
      const { error } = await supabase
        .from("accounts")
        .delete()
        .eq("id", accountId);

      if (error) throw error;

      toast.success(t('messages.accountDeleted') || "Conta removida com sucesso!");
      fetchAccounts();
    } catch (error) {
      console.error("Error deleting account:", error);
      toast.error(t('messages.accountDeleteError') || "Erro ao remover conta");
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
            <Card key={account.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Wallet className="h-8 w-8 text-primary" />
                  <div>
                    <h4 className="font-semibold">{account.name}</h4>
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
                      <span className="font-medium">{tr('accounts.limitUsed', 'Limite Utilizado')}: </span>
                      {formatCurrency(getUsedLimit(account), account.currency)}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">{tr('accounts.remainingLimit', 'Limite Disponível')}: </span>
                      {formatCurrency(getRemainingLimit(account), account.currency)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {tr('accounts.limit', 'Limite') + ': '} {formatCurrency(account.overdraft_limit || 0, account.currency)}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => deleteAccount(account.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};