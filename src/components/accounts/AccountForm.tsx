import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Minus } from "lucide-react";

interface AccountFormProps {
  onAccountAdded: () => void;
}

export const AccountForm = ({ onAccountAdded }: AccountFormProps) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [accountData, setAccountData] = useState({
    name: "",
    account_type: "",
    account_model: "personal",
    balance: "",
    overdraft_limit: "",
    currency: "BRL"
  });
  const [isNegative, setIsNegative] = useState(false);

  const formatCurrency = (value: number, currency: string) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency,
    }).format(value);
  };

  const tr = (key: string, def: string) => {
    const value = t(key);
    return value && value !== key ? value : def;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const signedBalance = (parseFloat(accountData.balance) || 0) * (isNegative ? -1 : 1);
      const { error } = await supabase
        .from("accounts")
        .insert({
          user_id: user.id,
          owner_user: "user1",
          name: accountData.name,
          account_type: accountData.account_type as "checking" | "savings" | "investment",
          account_model: 'personal' as "personal",
          balance: signedBalance,
          overdraft_limit: parseFloat(accountData.overdraft_limit) || 0,
          currency: accountData.currency as "BRL" | "USD" | "EUR"
        });

      if (error) throw error;

      toast.success(t('messages.accountAdded') || "Conta adicionada com sucesso!");
      setAccountData({
        name: "",
        account_type: "",
        account_model: "personal",
        balance: "",
        overdraft_limit: "",
        currency: "BRL"
      });
      setIsNegative(false);
      onAccountAdded();
    } catch (error) {
      console.error("Error adding account:", error);
      toast.error(t('messages.accountError') || "Erro ao adicionar conta");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Plus className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">{t('accounts.add')}</h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">{t('accounts.name') || 'Nome da Conta'}</Label>
            <Input
              id="name"
              value={accountData.name}
              onChange={(e) => setAccountData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Ex: Conta Corrente Principal"
              required
            />
          </div>

          <div>
            <Label htmlFor="account_type">{t('accounts.type') || 'Tipo da Conta'}</Label>
            <Select 
              value={accountData.account_type} 
              onValueChange={(value) => setAccountData(prev => ({ ...prev, account_type: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('accounts.selectType') || 'Selecione o tipo'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="checking">{t('accounts.types.checking') || 'Conta Corrente'}</SelectItem>
                <SelectItem value="savings">{t('accounts.types.savings') || 'Poupança'}</SelectItem>
                <SelectItem value="investment">{t('accounts.types.investment') || 'Investimento'}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="account_model">Modelo da Conta</Label>
            <div className="mt-2 inline-flex">
              <Badge variant="successSegmentFlatLeft" className="px-3 py-1">
                {t('accounts.models.personal') || 'Pessoal'}
              </Badge>
            </div>
          </div>

          <div>
            <Label htmlFor="overdraft_limit">Limite</Label>
            <Input
              id="overdraft_limit"
              type="number"
              step="0.01"
              value={accountData.overdraft_limit}
              onChange={(e) => setAccountData(prev => ({ ...prev, overdraft_limit: e.target.value }))}
              placeholder="0.00"
            />
          </div>

          <div>
            <Label htmlFor="balance">{tr('accounts.availableBalance', 'Saldo Disponível')}</Label>
            <Input
              id="balance"
              type="number"
              step="0.01"
              value={accountData.balance}
              onChange={(e) => setAccountData(prev => ({ ...prev, balance: e.target.value }))}
              placeholder="0.00"
              required
              className={isNegative ? "text-destructive" : undefined}
            />
            <div className="mt-2 flex gap-2">
              <Button type="button" size="sm" variant={!isNegative ? "default" : "outline"} onClick={() => setIsNegative(false)}>
                <Plus className="h-4 w-4 mr-1" />
                {tr('accounts.positive', 'Positivo')}
              </Button>
              <Button type="button" size="sm" variant={isNegative ? "default" : "outline"} onClick={() => setIsNegative(true)}>
                <Minus className="h-4 w-4 mr-1" />
                {tr('accounts.negative', 'Negativo')}
              </Button>
            </div>
          </div>

          <div>
            <Label htmlFor="currency">Moeda</Label>
            <Select 
              value={accountData.currency} 
              onValueChange={(value) => setAccountData(prev => ({ ...prev, currency: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BRL">Real (BRL)</SelectItem>
                <SelectItem value="USD">Dólar (USD)</SelectItem>
                <SelectItem value="EUR">Euro (EUR)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md bg-muted/30 p-3 text-sm">
            <span className="font-medium">{tr('accounts.limitUsed', 'Limite Utilizado')}: </span>
            {(() => {
              const limit = parseFloat(accountData.overdraft_limit) || 0;
              const signed = (parseFloat(accountData.balance) || 0) * (isNegative ? -1 : 1);
              const used = signed < 0 ? Math.min(limit, Math.abs(signed)) : 0;
              return formatCurrency(used, accountData.currency);
            })()}
          </div>

          <Button type="submit" className="w-full mt-2" disabled={loading}>
            {loading ? (t('accounts.adding') || "Adicionando...") : (t('accounts.addAccount') || "Adicionar Conta")}
          </Button>
        </form>
      </div>
    </Card>
  );
};