import { useState, useEffect } from "react";
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
import { usePartnerNames } from "@/hooks/usePartnerNames";
import { useLanguage } from "@/hooks/useLanguage";

interface Investment {
  id: string;
  name: string;
  type: string;
  amount: number;
  current_value: number;
  purchase_date: string;
  currency: string;
  is_shared: boolean;
  owner_user: string;
  broker?: string;
  notes?: string;
  goal_id?: string;
  yield_type?: string;
  yield_value?: number;
  auto_calculate_yield?: boolean;
}

interface InvestmentGoal {
  id: string;
  name: string;
  description?: string;
  target_amount: number;
  current_amount: number;
  target_date?: string;
  currency: string;
}

interface InvestmentEditFormProps {
  investment: Investment;
  goals: InvestmentGoal[];
  onSuccess: () => void;
  onCancel: () => void;
}

export const InvestmentEditForm = ({ investment, goals, onSuccess, onCancel }: InvestmentEditFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { names } = usePartnerNames();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: investment.name,
    type: investment.type,
    amount: investment.amount.toString(),
    current_value: investment.current_value.toString(),
    purchase_date: investment.purchase_date,
    currency: investment.currency,
    is_shared: investment.is_shared,
    owner_user: investment.owner_user,
    broker: investment.broker || "",
    notes: investment.notes || "",
    goal_id: investment.goal_id || "",
    yield_type: investment.yield_type || "none",
    yield_value: investment.yield_value?.toString() || "",
    auto_calculate_yield: investment.auto_calculate_yield || false
  });

  const investmentTypes = [
    { value: "renda_fixa", label: "Renda Fixa" },
    { value: "renda_variavel", label: "Renda Variável" },
    { value: "cripto", label: "Criptomoedas" },
    { value: "fundos", label: "Fundos" },
    { value: "tesouro_direto", label: "Tesouro Direto" }
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
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from("investments")
        .update({
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
          goal_id: formData.goal_id === "no_goal" ? null : formData.goal_id || null,
          yield_type: formData.yield_type === "none" ? null : formData.yield_type,
          yield_value: formData.yield_value ? parseFloat(formData.yield_value) : 0,
          auto_calculate_yield: formData.auto_calculate_yield
        })
        .eq("id", investment.id);

      if (error) throw error;

      // If a goal was added/changed, update the goal's current_amount
      const goalId = formData.goal_id === "no_goal" ? null : formData.goal_id || null;
      if (goalId) {
        // Get all investments linked to this goal
        const { data: linkedInvestments } = await supabase
          .from("investments")
          .select("current_value, currency")
          .eq("goal_id", goalId);
        
        if (linkedInvestments) {
          // Get the goal to know its currency
          const { data: goalData } = await supabase
            .from("investment_goals")
            .select("currency")
            .eq("id", goalId)
            .single();
          
          if (goalData) {
            // Calculate total current amount from all linked investments
            const totalAmount = linkedInvestments.reduce((sum, inv) => {
              // Use simple 1:1 conversion for now, or implement proper conversion
              return sum + inv.current_value;
            }, 0);
            
            // Update the goal
            await supabase
              .from("investment_goals")
              .update({ current_amount: totalAmount })
              .eq("id", goalId);
          }
        }
      }

      // If goal was removed, update the old goal
      if (investment.goal_id && investment.goal_id !== goalId) {
        const { data: oldLinkedInvestments } = await supabase
          .from("investments")
          .select("current_value, currency")
          .eq("goal_id", investment.goal_id);
        
        if (oldLinkedInvestments) {
          const totalAmount = oldLinkedInvestments.reduce((sum, inv) => {
            return sum + inv.current_value;
          }, 0);
          
          await supabase
            .from("investment_goals")
            .update({ current_amount: totalAmount })
            .eq("id", investment.goal_id);
        }
      }

      toast({
        title: "Sucesso",
        description: "Investimento atualizado com sucesso!",
      });

      onSuccess();
    } catch (error) {
      console.error("Error updating investment:", error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar investimento",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Editar Investimento</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t('investments.name')} *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder={t('investments.namePlaceholder')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">{t('investments.type')} *</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({...formData, type: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('investments.selectTypePlaceholder')} />
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
              <Label htmlFor="amount">{t('investments.amount')} *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: e.target.value})}
                placeholder={t('investments.amountPlaceholder')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="current_value">{t('investments.currentValueField')} *</Label>
              <Input
                id="current_value"
                type="number"
                step="0.01"
                value={formData.current_value}
                onChange={(e) => setFormData({...formData, current_value: e.target.value})}
                placeholder={t('investments.amountPlaceholder')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="purchase_date">{t('investments.purchaseDate')}</Label>
              <Input
                id="purchase_date"
                type="date"
                value={formData.purchase_date}
                onChange={(e) => setFormData({...formData, purchase_date: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">{t('investments.currency')}</Label>
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
              <Label htmlFor="broker">{t('investments.broker')}</Label>
              <Input
                id="broker"
                value={formData.broker}
                onChange={(e) => setFormData({...formData, broker: e.target.value})}
                placeholder={t('investments.brokerPlaceholder')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="yield_type">Tipo de Rentabilidade</Label>
              <Select
                value={formData.yield_type}
                onValueChange={(value) => setFormData({...formData, yield_type: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo de rentabilidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  <SelectItem value="percentage">Percentual (%)</SelectItem>
                  <SelectItem value="fixed_amount">Valor Fixo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.yield_type && formData.yield_type !== "none" && (
              <div className="space-y-2">
                <Label htmlFor="yield_value">
                  {formData.yield_type === 'percentage' ? 'Percentual Mensal (%)' : 'Valor Mensal'}
                </Label>
                <Input
                  id="yield_value"
                  type="number"
                  step={formData.yield_type === 'percentage' ? '0.01' : '0.01'}
                  value={formData.yield_value}
                  onChange={(e) => setFormData({...formData, yield_value: e.target.value})}
                  placeholder={formData.yield_type === 'percentage' ? 'Ex: 1.5' : 'Ex: 100.00'}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="goal">{t('investments.goalOptional')}</Label>
              <Select
                value={formData.goal_id}
                onValueChange={(value) => setFormData({...formData, goal_id: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('investments.associateGoal')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no_goal">{t('investments.noGoal')}</SelectItem>
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
              <Label htmlFor="is_shared">{t('investments.sharedInvestment')}</Label>
            </div>

            {formData.yield_type && (
              <div className="flex items-center space-x-2">
                <Switch
                  id="auto_calculate_yield"
                  checked={formData.auto_calculate_yield}
                  onCheckedChange={(checked) => setFormData({...formData, auto_calculate_yield: checked})}
                />
                <Label htmlFor="auto_calculate_yield">Calcular rendimento automaticamente</Label>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="owner">{t('investments.owner')}</Label>
              <Select
                value={formData.owner_user}
                onValueChange={(value) => setFormData({...formData, owner_user: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user1">{names.user1Name}</SelectItem>
                  <SelectItem value="user2">{names.user2Name}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">{t('investments.notes')}</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder={t('investments.notesPlaceholder')}
              />
            </div>
          </div>

          <div className="flex gap-4">
            <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};