import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/useLanguage";
import { useCurrencyConverter } from "@/hooks/useCurrencyConverter";

interface Investment {
  id: string;
  name: string;
  type: string;
  current_value: number;
  currency: string;
}

interface Account {
  id: string;
  name: string;
  currency: string;
}

interface InvestmentWithdrawFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const InvestmentWithdrawForm = ({ onSuccess, onCancel }: InvestmentWithdrawFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const { convertCurrency } = useCurrencyConverter();
  const [loading, setLoading] = useState(false);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [formData, setFormData] = useState({
    investment_id: "",
    amount: "",
    account_id: "",
  });

  useEffect(() => {
    if (user) {
      fetchInvestments();
      fetchAccounts();
    }
  }, [user]);

  const fetchInvestments = async () => {
    try {
      const { data, error } = await supabase
        .from("investments")
        .select("id, name, type, current_value, currency")
        .eq("user_id", user?.id)
        .gt("current_value", 0)
        .order("name");

      if (error) throw error;
      setInvestments(data || []);
    } catch (error) {
      console.error("Error fetching investments:", error);
    }
  };

  const fetchAccounts = async () => {
    try {
      const { data, error } = await supabase
        .from("accounts")
        .select("id, name, currency")
        .eq("user_id", user?.id)
        .order("name");

      if (error) throw error;
      setAccounts(data || []);
    } catch (error) {
      console.error("Error fetching accounts:", error);
    }
  };

  const selectedInvestment = investments.find(inv => inv.id === formData.investment_id);
  const selectedAccount = accounts.find(acc => acc.id === formData.account_id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.investment_id || !formData.amount || !formData.account_id) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    const withdrawAmount = parseFloat(formData.amount);
    
    if (!selectedInvestment || withdrawAmount <= 0 || withdrawAmount > selectedInvestment.current_value) {
      toast({
        title: "Erro",
        description: "Valor inválido para resgate",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Atualizar o valor do investimento
      const newInvestmentValue = selectedInvestment.current_value - withdrawAmount;
      
      const { error: investmentError } = await supabase
        .from("investments")
        .update({
          current_value: newInvestmentValue
        })
        .eq("id", formData.investment_id);

      if (investmentError) throw investmentError;

      // Converter valor para a moeda da conta se necessário
      const accountAmount = selectedAccount && selectedInvestment.currency !== selectedAccount.currency 
        ? convertCurrency(withdrawAmount, selectedInvestment.currency as any, selectedAccount.currency as any)
        : withdrawAmount;

      // Criar transação de receita na conta
      const { error: transactionError } = await supabase
        .from("transactions")
        .insert({
          user_id: user?.id,
          type: "income" as any,
          amount: accountAmount,
          description: `Resgate: ${selectedInvestment.name}`,
          account_id: formData.account_id,
          currency: (selectedAccount?.currency || selectedInvestment.currency) as any,
          transaction_date: new Date().toISOString().split('T')[0],
          payment_method: "resgate_investimento"
        });

      if (transactionError) throw transactionError;

      toast({
        title: "Sucesso",
        description: "Resgate realizado com sucesso!",
      });

      onSuccess();
    } catch (error) {
      console.error("Error processing withdrawal:", error);
      toast({
        title: "Erro",
        description: "Erro ao processar resgate",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{t('investments.withdraw')}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="investment">{t('investments.selectInvestment')} *</Label>
              <Select
                value={formData.investment_id}
                onValueChange={(value) => setFormData({...formData, investment_id: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('investments.selectInvestmentPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {investments.map((investment) => (
                    <SelectItem key={investment.id} value={investment.id}>
                      {investment.name} - {investment.current_value.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: investment.currency
                      })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">{t('investments.withdrawAmount')} *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                max={selectedInvestment?.current_value || undefined}
                value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: e.target.value})}
                placeholder={t('investments.withdrawAmountPlaceholder')}
              />
              {selectedInvestment && (
                <p className="text-sm text-muted-foreground">
                  {t('investments.maxAvailable')}: {selectedInvestment.current_value.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: selectedInvestment.currency
                  })}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="account">{t('investments.targetAccount')} *</Label>
              <Select
                value={formData.account_id}
                onValueChange={(value) => setFormData({...formData, account_id: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('investments.selectAccountPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name} ({account.currency})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-4">
            <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
              {t('investments.cancel')}
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? t('investments.processing') : t('investments.confirmWithdraw')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};