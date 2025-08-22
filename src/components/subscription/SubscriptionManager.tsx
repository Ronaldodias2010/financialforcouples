import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, XCircle, RefreshCw, TrendingUp } from "lucide-react";
import { toast } from "sonner";

interface SubscriptionManagerProps {
  subscriptionId?: string;
  currentPlan?: {
    name: string;
    amount: number;
    interval: string;
    currency: string;
  };
  isCancelled?: boolean;
  onUpdate: () => void;
}

export const SubscriptionManager = ({ 
  subscriptionId, 
  currentPlan, 
  isCancelled = false,
  onUpdate 
}: SubscriptionManagerProps) => {
  const { session } = useAuth();
  const { createCheckoutSession } = useSubscription();
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>("");

  const plans = [
    {
      id: "basic",
      name: "Básico",
      priceId: "price_basic_monthly", // Replace with actual Stripe price ID
      amount: 999,
      interval: "month"
    },
    {
      id: "premium", 
      name: "Premium",
      priceId: "price_premium_monthly", // Replace with actual Stripe price ID
      amount: 1999,
      interval: "month"
    },
    {
      id: "enterprise",
      name: "Enterprise", 
      priceId: "price_enterprise_monthly", // Replace with actual Stripe price ID
      amount: 4999,
      interval: "month"
    }
  ];

  const handleCancelSubscription = async () => {
    if (!session || !subscriptionId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-subscription', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: { 
          action: 'cancel_subscription',
          subscriptionId 
        }
      });

      if (error) throw error;

      toast.success('Assinatura será cancelada no final do período atual');
      onUpdate();
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      toast.error('Erro ao cancelar assinatura');
    } finally {
      setLoading(false);
    }
  };

  const handleReactivateSubscription = async () => {
    if (!session || !subscriptionId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-subscription', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: { 
          action: 'reactivate_subscription',
          subscriptionId 
        }
      });

      if (error) throw error;

      toast.success('Assinatura reativada com sucesso!');
      onUpdate();
    } catch (error) {
      console.error('Error reactivating subscription:', error);
      toast.error('Erro ao reativar assinatura');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePlan = async () => {
    if (!session || !subscriptionId || !selectedPlan) return;

    const plan = plans.find(p => p.id === selectedPlan);
    if (!plan) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-subscription', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: { 
          action: 'change_plan',
          subscriptionId,
          priceId: plan.priceId
        }
      });

      if (error) throw error;

      toast.success('Plano alterado com sucesso!');
      onUpdate();
    } catch (error) {
      console.error('Error changing plan:', error);
      toast.error('Erro ao alterar plano');
    } finally {
      setLoading(false);
    }
  };

  const formatMoney = (amount: number, currency: string = 'BRL') => {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: currency.toUpperCase() 
    }).format(amount / 100);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Gerenciar Assinatura
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {currentPlan && (
          <div className="p-4 border rounded-lg bg-muted/50">
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold">Plano {currentPlan.name}</div>
              <div className="flex items-center gap-2">
                <Badge variant={isCancelled ? "outline" : "default"}>
                  {isCancelled ? "Cancelando" : "Ativo"}
                </Badge>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              {formatMoney(currentPlan.amount, currentPlan.currency)} / {
                currentPlan.interval === 'year' ? 'ano' : 'mês'
              }
            </div>
          </div>
        )}

        {/* Plan Change Section */}
        <div className="space-y-3">
          <h4 className="font-medium">Alterar Plano</h4>
          <Select value={selectedPlan} onValueChange={setSelectedPlan}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione um novo plano" />
            </SelectTrigger>
            <SelectContent>
              {plans.map((plan) => (
                <SelectItem key={plan.id} value={plan.id}>
                  {plan.name} - {formatMoney(plan.amount)} / {plan.interval === 'year' ? 'ano' : 'mês'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button
            onClick={handleChangePlan}
            disabled={loading || !selectedPlan}
            variant="default"
            className="w-full"
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            {loading ? 'Alterando...' : 'Alterar Plano'}
          </Button>
        </div>

        {/* Subscription Actions */}
        <div className="space-y-2">
          {!isCancelled ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="w-full text-destructive hover:bg-destructive/10 border-destructive" disabled={loading}>
                  <XCircle className="h-4 w-4 mr-2" />
                  Cancelar Assinatura
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Cancelar Assinatura</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tem certeza que deseja cancelar sua assinatura? Você continuará tendo acesso até o final do período atual.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Manter Assinatura</AlertDialogCancel>
                  <AlertDialogAction onClick={handleCancelSubscription}>
                    Sim, Cancelar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : (
            <Button
              onClick={handleReactivateSubscription}
              disabled={loading}
              variant="default"
              className="w-full"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              {loading ? 'Reativando...' : 'Reativar Assinatura'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};