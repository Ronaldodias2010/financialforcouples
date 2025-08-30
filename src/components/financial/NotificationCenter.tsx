import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, Check, CheckCheck, ExternalLink } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const NotificationCenter = () => {
  const { notifications, loading, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Central de Notificações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-muted rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const getPromotionTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'transfer_bonus': 'Bônus Transferência',
      'buy_miles': 'Compra de Milhas',
      'route_discount': 'Desconto em Rota',
      'double_points': 'Pontos em Dobro',
      'status_match': 'Equivalência Status'
    };
    return labels[type] || type;
  };

  const getPromotionTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'transfer_bonus': 'bg-blue-500/10 text-blue-700 border-blue-200',
      'buy_miles': 'bg-green-500/10 text-green-700 border-green-200',
      'route_discount': 'bg-purple-500/10 text-purple-700 border-purple-200',
      'double_points': 'bg-orange-500/10 text-orange-700 border-orange-200',
      'status_match': 'bg-pink-500/10 text-pink-700 border-pink-200'
    };
    return colors[type] || 'bg-gray-500/10 text-gray-700 border-gray-200';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Central de Notificações
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount}
              </Badge>
            )}
          </CardTitle>
          {unreadCount > 0 && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={markAllAsRead}
              className="flex items-center gap-2"
            >
              <CheckCheck className="h-4 w-4" />
              Marcar todas como lidas
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {notifications.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma notificação ainda</p>
            <p className="text-sm">Você será notificado sobre novas promoções elegíveis</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 rounded-lg border transition-all ${
                  notification.is_read 
                    ? 'bg-background border-border' 
                    : 'bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium text-sm">
                        {notification.promotion?.airline_name}
                      </h4>
                      {notification.promotion && (
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${getPromotionTypeColor(notification.promotion.promotion_type)}`}
                        >
                          {getPromotionTypeLabel(notification.promotion.promotion_type)}
                        </Badge>
                      )}
                      {!notification.is_read && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full" />
                      )}
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-2">
                      {notification.message}
                    </p>
                    
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(notification.created_at), {
                        addSuffix: true,
                        locale: ptBR
                      })}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {!notification.is_read && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => markAsRead(notification.id)}
                        className="h-8 w-8 p-0"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};