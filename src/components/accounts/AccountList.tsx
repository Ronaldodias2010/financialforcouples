import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";
import { Wallet, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface AccountData {
  id: string;
  name: string;
  account_type: string;
  account_model: string | null;
  balance: number;
  currency: string;
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
                    <p className="text-sm text-muted-foreground">
                      {getAccountTypeLabel(account.account_type)}
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
                    </p>
                    <p className="text-lg font-bold text-primary">
                      {formatCurrency(account.balance, account.currency)}
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