import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useRealtimeTable } from '@/hooks/useRealtimeManager';

export interface FinancialNotification {
  id: string;
  user_id: string;
  notification_type: string;
  title: string;
  message: string;
  metadata: {
    previous_rate?: number;
    current_rate?: number;
    variation?: string;
    total_affected_value?: number;
    monthly_impact?: string;
    affected_investments?: Array<{
      id: string;
      name: string;
      type: string;
      value: number;
    }>;
    [key: string]: any;
  };
  is_read: boolean;
  urgency: 'low' | 'medium' | 'high';
  created_at: string;
}

export const useFinancialNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<FinancialNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    if (!user?.id) {
      setNotifications([]);
      setUnreadCount(0);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('user_financial_notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (fetchError) {
        console.error('Error fetching financial notifications:', fetchError);
        setError('Erro ao buscar notificações financeiras');
        return;
      }

      const typedData = (data || []) as FinancialNotification[];
      setNotifications(typedData);
      setUnreadCount(typedData.filter(n => !n.is_read).length);
    } catch (err) {
      console.error('Error in useFinancialNotifications:', err);
      setError('Erro inesperado ao buscar notificações');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  const markAsRead = useCallback(async (notificationId: string) => {
    if (!user?.id) return;

    try {
      const { error: updateError } = await supabase
        .from('user_financial_notifications')
        .update({ is_read: true, updated_at: new Date().toISOString() })
        .eq('id', notificationId)
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Error marking notification as read:', updateError);
        return;
      }

      // Update local state
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  }, [user?.id]);

  const markAllAsRead = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { error: updateError } = await supabase
        .from('user_financial_notifications')
        .update({ is_read: true, updated_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (updateError) {
        console.error('Error marking all notifications as read:', updateError);
        return;
      }

      // Update local state
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  }, [user?.id]);

  const deleteNotification = useCallback(async (notificationId: string) => {
    if (!user?.id) return;

    try {
      const { error: deleteError } = await supabase
        .from('user_financial_notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', user.id);

      if (deleteError) {
        console.error('Error deleting notification:', deleteError);
        return;
      }

      // Update local state
      setNotifications(prev => {
        const notification = prev.find(n => n.id === notificationId);
        if (notification && !notification.is_read) {
          setUnreadCount(c => Math.max(0, c - 1));
        }
        return prev.filter(n => n.id !== notificationId);
      });
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  }, [user?.id]);

  const getUnreadNotifications = useCallback(() => {
    return notifications.filter(n => !n.is_read);
  }, [notifications]);

  const getSelicNotifications = useCallback(() => {
    return notifications.filter(n => n.notification_type === 'selic_change');
  }, [notifications]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('financial-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_financial_notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('New financial notification:', payload);
          const newNotification = payload.new as FinancialNotification;
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    getUnreadNotifications,
    getSelicNotifications,
    refetch: fetchNotifications,
  };
};
