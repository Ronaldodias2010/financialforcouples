import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Wallet, Plus } from "lucide-react";

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
    balance: "",
    currency: "BRL"
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("accounts")
        .insert({
          user_id: user.id,
          owner_user: "user1",
          name: accountData.name,
          account_type: accountData.account_type as "checking" | "savings" | "investment",
          balance: parseFloat(accountData.balance) || 0,
          currency: accountData.currency as "BRL" | "USD" | "EUR"
        });

      if (error) throw error;

      toast.success(t('messages.accountAdded') || "Conta adicionada com sucesso!");
      setAccountData({
        name: "",
        account_type: "",
        balance: "",
        currency: "BRL"
      });
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
            <Label htmlFor="name">Nome da Conta</Label>
            <Input
              id="name"
              value={accountData.name}
              onChange={(e) => setAccountData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Ex: Conta Corrente Principal"
              required
            />
          </div>

          <div>
            <Label htmlFor="account_type">Tipo da Conta</Label>
            <Select 
              value={accountData.account_type} 
              onValueChange={(value) => setAccountData(prev => ({ ...prev, account_type: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="checking">Conta Corrente</SelectItem>
                <SelectItem value="savings">Poupança</SelectItem>
                <SelectItem value="investment">Investimento</SelectItem>
                
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="balance">Saldo Atual</Label>
            <Input
              id="balance"
              type="number"
              step="0.01"
              value={accountData.balance}
              onChange={(e) => setAccountData(prev => ({ ...prev, balance: e.target.value }))}
              placeholder="0.00"
              required
            />
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

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Adicionando..." : "Adicionar Conta"}
          </Button>
        </form>
      </div>
    </Card>
  );
};