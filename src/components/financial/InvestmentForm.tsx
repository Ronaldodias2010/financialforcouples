import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/useLanguage";

interface InvestmentGoal {
  id: string;
  name: string;
  description?: string;
  target_amount: number;
  current_amount: number;
  target_date?: string;
  currency: string;
}

interface InvestmentFormProps {
  goals: InvestmentGoal[];
  onSuccess: () => void;
  onCancel: () => void;
}

export const InvestmentForm = ({ goals, onSuccess, onCancel }: InvestmentFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    type: "",
    amount: "",
    current_value: "",
    purchase_date: new Date().toISOString().split('T')[0],
    currency: "BRL",
    is_shared: false,
    owner_user: "user1",
    broker: "",
    notes: "",
    goal_id: ""
  });

  const investmentTypes = [
    { value: "renda_fixa", label: t('investments.newInvestmentForm.types.renda_fixa') },
    { value: "renda_variavel", label: t('investments.newInvestmentForm.types.renda_variavel') },
    { value: "cripto", label: t('investments.newInvestmentForm.types.cripto') },
    { value: "fundos", label: t('investments.newInvestmentForm.types.fundos') },
    { value: "tesouro_direto", label: t('investments.newInvestmentForm.types.tesouro_direto') }
  ];

  const currencies = [
    { value: "BRL", label: "Real (BRL)" },
    { value: "USD", label: "Dólar (USD)" },
    { value: "EUR", label: "Euro (EUR)" }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.type || !formData.amount || !formData.current_value) {
      toast({
        title: t('common.error'),
        description: t('common.fillRequiredFields'),
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from("investments")
        .insert({
          user_id: user?.id,
          name: formData.name,
          type: formData.type,
          amount: parseFloat(formData.amount),
          current_value: parseFloat(formData.current_value),
          purchase_date: formData.purchase_date,
          currency: formData.currency as any,
          is_shared: formData.is_shared,
          owner_user: formData.owner_user,
          broker: formData.broker || null,
          notes: formData.notes || null,
          goal_id: formData.goal_id === "no_goal" ? null : formData.goal_id || null
        });

      if (error) throw error;

      // Se houver objetivo associado, atualizar o valor atual
      if (formData.goal_id && formData.goal_id !== "no_goal") {
        const goal = goals.find(g => g.id === formData.goal_id);
        if (goal) {
          const { error: goalError } = await supabase
            .from("investment_goals")
            .update({
              current_amount: goal.current_amount + parseFloat(formData.current_value)
            })
            .eq("id", formData.goal_id);

          if (goalError) throw goalError;
        }
      }

      onSuccess();
    } catch (error) {
      console.error("Error creating investment:", error);
      toast({
        title: t('common.error'),
        description: t('common.errorCreating'),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{t('investments.newInvestmentForm.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t('investments.newInvestmentForm.name')} *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder={t('investments.newInvestmentForm.namePlaceholder')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">{t('investments.newInvestmentForm.type')} *</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({...formData, type: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('investments.newInvestmentForm.selectType')} />
                </SelectTrigger>
                <SelectContent>
                  {investmentTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">{t('investments.newInvestmentForm.investedAmount')} *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: e.target.value})}
                placeholder="0,00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="current_value">{t('investments.newInvestmentForm.currentValue')} *</Label>
              <Input
                id="current_value"
                type="number"
                step="0.01"
                value={formData.current_value}
                onChange={(e) => setFormData({...formData, current_value: e.target.value})}
                placeholder="0,00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="purchase_date">{t('investments.newInvestmentForm.purchaseDate')}</Label>
              <Input
                id="purchase_date"
                type="date"
                value={formData.purchase_date}
                onChange={(e) => setFormData({...formData, purchase_date: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">{t('investments.newInvestmentForm.currency')}</Label>
              <Select
                value={formData.currency}
                onValueChange={(value) => setFormData({...formData, currency: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((currency) => (
                    <SelectItem key={currency.value} value={currency.value}>
                      {currency.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="broker">{t('investments.newInvestmentForm.broker')}</Label>
              <Input
                id="broker"
                value={formData.broker}
                onChange={(e) => setFormData({...formData, broker: e.target.value})}
                placeholder={t('investments.newInvestmentForm.brokerPlaceholder')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="goal">{t('investments.newInvestmentForm.goal')}</Label>
              <Select
                value={formData.goal_id}
                onValueChange={(value) => setFormData({...formData, goal_id: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('investments.newInvestmentForm.associateGoal')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no_goal">{t('investments.newInvestmentForm.noGoal')}</SelectItem>
                  {goals.map((goal) => (
                    <SelectItem key={goal.id} value={goal.id}>
                      {goal.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="is_shared"
                checked={formData.is_shared}
                onCheckedChange={(checked) => setFormData({...formData, is_shared: checked})}
              />
              <Label htmlFor="is_shared">{t('investments.newInvestmentForm.sharedInvestment')}</Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="owner">{t('investments.newInvestmentForm.owner')}</Label>
              <Select
                value={formData.owner_user}
                onValueChange={(value) => setFormData({...formData, owner_user: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user1">{t('investments.newInvestmentForm.user1')}</SelectItem>
                  <SelectItem value="user2">{t('investments.newInvestmentForm.user2')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">{t('investments.newInvestmentForm.notes')}</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder={t('investments.newInvestmentForm.notesPlaceholder')}
              />
            </div>
          </div>

          <div className="flex gap-4">
            <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
              {t('investments.newInvestmentForm.cancel')}
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? t('investments.newInvestmentForm.saving') : t('investments.newInvestmentForm.save')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};