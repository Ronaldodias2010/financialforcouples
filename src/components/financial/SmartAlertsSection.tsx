import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { useFinancialNotifications, FinancialNotification } from '@/hooks/useFinancialNotifications';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bell, Clock, Target, AlertTriangle, RefreshCw, TrendingUp, TrendingDown, CheckCircle, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface SmartAlert {
  id: string;
  type: 'expiring_miles' | 'goal_progress' | 'promotion_eligible' | 'card_inactive' | 'overdue_expenses' | 'today_expenses' | 'selic_change';
  message: string;
  urgent: boolean;
  action?: string;
  data?: any;
  notification?: FinancialNotification;
}

interface SmartAlertsSectionProps {
  userTotalMiles: number;
}

export const SmartAlertsSection = ({ userTotalMiles }: SmartAlertsSectionProps) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { notifications: financialNotifications, markAsRead, unreadCount } = useFinancialNotifications();
  const [alerts, setAlerts] = useState<SmartAlert[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSmartAlerts = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const generatedAlerts: SmartAlert[] = [];

      // Add SELIC change notifications (from user_financial_notifications)
      const unreadSelicNotifications = financialNotifications.filter(
        n => n.notification_type === 'selic_change' && !n.is_read
      );

      unreadSelicNotifications.forEach(notification => {
        const isIncrease = notification.metadata?.variation?.startsWith('+');
        generatedAlerts.push({
          id: `selic-${notification.id}`,
          type: 'selic_change',
          message: notification.title,
          urgent: notification.urgency === 'high',
          action: 'Ver Detalhes',
          data: {
            fullMessage: notification.message,
            metadata: notification.metadata,
            isIncrease
          },
          notification
        });
      });

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
  }, [user?.id, userTotalMiles, financialNotifications]);

  const getAlertIcon = (alert: SmartAlert) => {
    if (alert.type === 'selic_change') {
      return alert.data?.isIncrease ? (
        <TrendingUp className="h-4 w-4 text-green-600" />
      ) : (
        <TrendingDown className="h-4 w-4 text-red-600" />
      );
    }
    
    switch (alert.type) {
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

  const getAlertColor = (alert: SmartAlert) => {
    if (alert.type === 'selic_change') {
      return alert.data?.isIncrease 
        ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950'
        : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950';
    }
    
    if (alert.urgent) return 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950';
    
    switch (alert.type) {
      case 'goal_progress':
        return 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950';
      case 'promotion_eligible':
        return 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950';
      case 'card_inactive':
        return 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950';
      default:
        return 'border-muted bg-muted/50';
    }
  };

  const handleDismissAlert = async (alert: SmartAlert) => {
    if (alert.notification) {
      await markAsRead(alert.notification.id);
      // Remove from local alerts
      setAlerts(prev => prev.filter(a => a.id !== alert.id));
    }
  };

  const handleViewDetails = (alert: SmartAlert) => {
    if (alert.type === 'selic_change' && alert.data?.fullMessage) {
      toast({
        title: alert.message,
        description: alert.data.fullMessage,
        duration: 10000,
      });
      // Mark as read
      if (alert.notification) {
        markAsRead(alert.notification.id);
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-orange-500" />
            <CardTitle>Alertas Inteligentes</CardTitle>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {unreadCount}
              </Badge>
            )}
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
          Notificações importantes sobre suas milhas e investimentos
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
            <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-50 text-green-500" />
            <p>Nenhum alerta no momento</p>
            <p className="text-sm">Tudo organizado!</p>
          </div>
        ) : (
          alerts.map((alert) => (
            <div 
              key={alert.id} 
              className={`p-3 border rounded-lg ${getAlertColor(alert)} transition-colors`}
            >
              <div className="flex items-start gap-2">
                {getAlertIcon(alert)}
                <div className="flex-1">
                  <p className="text-sm font-medium">{alert.message}</p>
                  {alert.type === 'selic_change' && alert.data?.metadata && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Impacto mensal: {alert.data.metadata.monthly_impact}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <Badge 
                      variant={alert.urgent ? "destructive" : "secondary"} 
                      className="text-xs"
                    >
                      {alert.urgent ? 'Urgente' : 'Informativo'}
                    </Badge>
                    {alert.type === 'selic_change' && (
                      <Badge variant="outline" className="text-xs">
                        SELIC
                      </Badge>
                    )}
                    {alert.action && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-xs h-6"
                        onClick={() => handleViewDetails(alert)}
                      >
                        {alert.action}
                      </Button>
                    )}
                  </div>
                </div>
                {alert.notification && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => handleDismissAlert(alert)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};
