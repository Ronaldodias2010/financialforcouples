import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bell, Clock, Target, AlertTriangle, RefreshCw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface SmartAlert {
  id: string;
  type: 'expiring_miles' | 'goal_progress' | 'promotion_eligible' | 'card_inactive' | 'overdue_expenses' | 'today_expenses';
  message: string;
  urgent: boolean;
  action?: string;
  data?: any;
}

interface SmartAlertsSectionProps {
  userTotalMiles: number;
}

export const SmartAlertsSection = ({ userTotalMiles }: SmartAlertsSectionProps) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [alerts, setAlerts] = useState<SmartAlert[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSmartAlerts = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const generatedAlerts: SmartAlert[] = [];

      // Check for goals progress
      const { data: goals } = await supabase
        .from('mileage_goals')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_completed', false);

      if (goals) {
        goals.forEach(goal => {
          const progress = (goal.current_miles / goal.target_miles) * 100;
          if (progress >= 80) {
            generatedAlerts.push({
              id: `goal-${goal.id}`,
              type: 'goal_progress',
              message: `Meta "${goal.name}" está ${Math.round(progress)}% concluída!`,
              urgent: progress >= 95,
              action: 'Ver Meta',
              data: { goalId: goal.id, progress }
            });
          }
        });
      }

      // Check for inactive cards with mileage rules
      const { data: inactiveRules } = await supabase
        .from('card_mileage_rules')
        .select('*, cards!inner(*)')
        .eq('user_id', user.id)
        .eq('is_active', false);

      if (inactiveRules && inactiveRules.length > 0) {
        generatedAlerts.push({
          id: 'inactive-cards',
          type: 'card_inactive',
          message: `${inactiveRules.length} regra(s) de milhas inativa(s). Ative para acumular milhas.`,
          urgent: true,
          action: 'Ver Regras'
        });
      }

      // Check for promotion eligibility
      const { data: promotions } = await supabase
        .from('airline_promotions')
        .select('*')
        .eq('is_active', true)
        .gte('end_date', new Date().toISOString().split('T')[0]);

      if (promotions) {
        const eligiblePromotions = promotions.filter(promo => 
          !promo.miles_required || userTotalMiles >= promo.miles_required
        );

        // Check if user was already notified about these promotions
        const { data: notifications } = await supabase
          .from('user_promotion_notifications')
          .select('promotion_id')
          .eq('user_id', user.id)
          .in('promotion_id', eligiblePromotions.map(p => p.id));

        const notNotifiedPromotions = eligiblePromotions.filter(promo =>
          !notifications?.some(notif => notif.promotion_id === promo.id)
        );

        if (notNotifiedPromotions.length > 0) {
          generatedAlerts.push({
            id: 'new-promotions',
            type: 'promotion_eligible',
            message: `${notNotifiedPromotions.length} nova(s) promoção(ões) disponível(is) para você!`,
            urgent: false,
            action: 'Ver Promoções',
            data: { count: notNotifiedPromotions.length }
          });
        }
      }

      // Check for overdue future expenses
      const { data: manualExpenses } = await supabase
        .from('manual_future_expenses')
        .select('id, description, due_date, amount')
        .eq('user_id', user.id)
        .eq('is_paid', false)
        .lt('due_date', new Date().toISOString().split('T')[0]);

      if (manualExpenses && manualExpenses.length > 0) {
        const totalOverdue = manualExpenses.reduce((sum, expense) => sum + expense.amount, 0);
        generatedAlerts.push({
          id: 'overdue-expenses',
          type: 'card_inactive',
          message: `${manualExpenses.length} gasto(s) vencido(s) no valor de R$ ${totalOverdue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
          urgent: true,
          action: 'Ver Gastos Vencidos',
          data: { count: manualExpenses.length, total: totalOverdue }
        });
      }

      // Check for expenses due today
      const { data: todayExpenses } = await supabase
        .from('manual_future_expenses')
        .select('id, description, due_date, amount')
        .eq('user_id', user.id)
        .eq('is_paid', false)
        .eq('due_date', new Date().toISOString().split('T')[0]);

      if (todayExpenses && todayExpenses.length > 0) {
        const totalToday = todayExpenses.reduce((sum, expense) => sum + expense.amount, 0);
        generatedAlerts.push({
          id: 'today-expenses',
          type: 'expiring_miles',
          message: `${todayExpenses.length} gasto(s) vencem hoje no valor de R$ ${totalToday.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
          urgent: false,
          action: 'Ver Gastos de Hoje',
          data: { count: todayExpenses.length, total: totalToday }
        });
      }

      // Miles expiring soon (simulated - would need actual expiration tracking)
      if (userTotalMiles > 10000) {
        // This would be replaced with real expiration date tracking
        const expiringMiles = Math.floor(userTotalMiles * 0.1);
        if (expiringMiles > 1000) {
          generatedAlerts.push({
            id: 'expiring-miles',
            type: 'expiring_miles',
            message: `${expiringMiles.toLocaleString()} milhas expiram em 30 dias`,
            urgent: true,
            action: 'Ver Detalhes'
          });
        }
      }

      setAlerts(generatedAlerts);
    } catch (error) {
      console.error('Error loading smart alerts:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar alertas inteligentes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSmartAlerts();
  }, [user?.id, userTotalMiles]);

  const getAlertIcon = (type: SmartAlert['type']) => {
    switch (type) {
      case 'expiring_miles':
        return <Clock className="h-4 w-4" />;
      case 'goal_progress':
        return <Target className="h-4 w-4" />;
      case 'promotion_eligible':
        return <Bell className="h-4 w-4" />;
      case 'card_inactive':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getAlertColor = (type: SmartAlert['type'], urgent: boolean) => {
    if (urgent) return 'border-red-200 bg-red-50';
    switch (type) {
      case 'goal_progress':
        return 'border-green-200 bg-green-50';
      case 'promotion_eligible':
        return 'border-blue-200 bg-blue-50';
      case 'card_inactive':
        return 'border-yellow-200 bg-yellow-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-orange-500" />
            <CardTitle>Alertas Inteligentes</CardTitle>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadSmartAlerts}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        <CardDescription>
          Notificações importantes sobre suas milhas
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="p-3 border rounded-lg animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : alerts.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Nenhum alerta no momento</p>
            <p className="text-sm">Suas milhas estão organizadas!</p>
          </div>
        ) : (
          alerts.map((alert) => (
            <div 
              key={alert.id} 
              className={`p-3 border rounded-lg ${getAlertColor(alert.type, alert.urgent)}`}
            >
              <div className="flex items-start gap-2">
                {getAlertIcon(alert.type)}
                <div className="flex-1">
                  <p className="text-sm font-medium">{alert.message}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant={alert.urgent ? "destructive" : "secondary"} className="text-xs">
                      {alert.urgent ? 'Urgente' : 'Informativo'}
                    </Badge>
                    {alert.action && (
                      <Button variant="outline" size="sm" className="text-xs h-6">
                        {alert.action}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};