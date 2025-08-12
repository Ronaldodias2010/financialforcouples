import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface RealtimeConfig {
  userId: string;
  onTransactionChange?: () => void;
  onAccountChange?: () => void;
  onCoupleChange?: () => void;
  onProfileChange?: (currency: string) => void;
  debounceMs?: number;
}

/**
 * Hook otimizado para real-time que reduz drasticamente o número de queries
 * Consolida múltiplos listeners em um único canal com filtros específicos
 */
export const useOptimizedRealtime = ({
  userId,
  onTransactionChange,
  onAccountChange,
  onCoupleChange,
  onProfileChange,
  debounceMs = 3000
}: RealtimeConfig) => {
  const timersRef = useRef<{ [key: string]: NodeJS.Timeout }>({});
  const lastExecutionRef = useRef<{ [key: string]: number }>({});

  const debouncedExecute = useCallback((key: string, fn: () => void) => {
    const now = Date.now();
    const lastExecution = lastExecutionRef.current[key] || 0;
    
    // Rate limiting: não executar se a última execução foi há menos de 1 segundo
    if (now - lastExecution < 1000) {
      return;
    }
    
    clearTimeout(timersRef.current[key]);
    timersRef.current[key] = setTimeout(() => {
      lastExecutionRef.current[key] = Date.now();
      fn();
    }, debounceMs);
  }, [debounceMs]);

  useEffect(() => {
    if (!userId) return;

    // Canal único e otimizado por usuário
    const channel = supabase
      .channel(`optimized_user_${userId}`, {
        config: {
          broadcast: { self: false },
          presence: { key: userId }
        }
      })
      // Profile changes - apenas para o usuário atual
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          if (payload.new?.preferred_currency && onProfileChange) {
            onProfileChange(payload.new.preferred_currency);
          }
        }
      )
      // Transaction changes - apenas do usuário
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
          filter: `user_id=eq.${userId}`
        },
        () => {
          if (onTransactionChange) {
            debouncedExecute('transactions', onTransactionChange);
          }
        }
      )
      // Account changes - apenas do usuário  
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'accounts',
          filter: `user_id=eq.${userId}`
        },
        () => {
          if (onAccountChange) {
            debouncedExecute('accounts', onAccountChange);
          }
        }
      )
      // Couple changes - apenas relevantes ao usuário
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_couples'
        },
        (payload) => {
          const data = payload.new || payload.old;
          if (data && typeof data === 'object' && 'user1_id' in data && 'user2_id' in data) {
            const typedData = data as { user1_id: string; user2_id: string };
            if (typedData.user1_id === userId || typedData.user2_id === userId) {
              if (onCoupleChange) {
                debouncedExecute('couple', onCoupleChange);
              }
            }
          }
        }
      )
      .subscribe((status) => {
        console.log(`📡 Optimized realtime: ${status}`);
      });

    return () => {
      // Limpar todos os timers
      Object.values(timersRef.current).forEach(clearTimeout);
      timersRef.current = {};
      lastExecutionRef.current = {};
      
      supabase.removeChannel(channel);
      console.log('🧹 Optimized realtime cleaned up');
    };
  }, [userId, onTransactionChange, onAccountChange, onCoupleChange, onProfileChange, debouncedExecute]);

  // Cleanup function para uso manual
  const cleanup = useCallback(() => {
    Object.values(timersRef.current).forEach(clearTimeout);
    timersRef.current = {};
    lastExecutionRef.current = {};
  }, []);

  return { cleanup };
};