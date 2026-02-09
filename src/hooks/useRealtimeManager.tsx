/**
 * Centralized Realtime Channel Manager
 * 
 * Instead of each component creating its own channel (22+ channels per user),
 * this consolidates into a few shared channels that broadcast via callbacks.
 * 
 * Supabase recommends < 100 channels per connection.
 * With 10k users, individual channels per component = 220k+ channels total.
 */

import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useQueryClient } from '@tanstack/react-query';
import { debounce } from '@/utils/performance';

type TableName = string;
type ChangeHandler = (payload: any) => void;

// Singleton registry for listeners
const listeners = new Map<TableName, Set<ChangeHandler>>();
let activeChannels = new Map<string, any>();
let isInitialized = false;

function initializeChannels(userId: string) {
  if (isInitialized) return;
  isInitialized = true;

  // Channel 1: Core financial tables
  const financialChannel = supabase
    .channel('rt-financial')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions', filter: `user_id=eq.${userId}` },
      (payload) => notifyListeners('transactions', payload))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'accounts', filter: `user_id=eq.${userId}` },
      (payload) => notifyListeners('accounts', payload))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'cards', filter: `user_id=eq.${userId}` },
      (payload) => notifyListeners('cards', payload))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'categories', filter: `user_id=eq.${userId}` },
      (payload) => notifyListeners('categories', payload))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'subcategories', filter: `user_id=eq.${userId}` },
      (payload) => notifyListeners('subcategories', payload))
    .subscribe();
  activeChannels.set('rt-financial', financialChannel);

  // Channel 2: Couple, profile, subscription
  const coupleChannel = supabase
    .channel('rt-couple')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'user_couples' },
      (payload) => notifyListeners('user_couples', payload))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' },
      (payload) => notifyListeners('profiles', payload))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'subscribers' },
      (payload) => notifyListeners('subscribers', payload))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'couple_decisions' },
      (payload) => notifyListeners('couple_decisions', payload))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'couple_agreements' },
      (payload) => notifyListeners('couple_agreements', payload))
    .subscribe();
  activeChannels.set('rt-couple', coupleChannel);

  // Channel 3: Mileage & investments
  const mileageChannel = supabase
    .channel('rt-mileage')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'mileage_programs', filter: `user_id=eq.${userId}` },
      (payload) => notifyListeners('mileage_programs', payload))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'card_mileage_rules', filter: `user_id=eq.${userId}` },
      (payload) => notifyListeners('card_mileage_rules', payload))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'mileage_goals', filter: `user_id=eq.${userId}` },
      (payload) => notifyListeners('mileage_goals', payload))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'investment_goals', filter: `user_id=eq.${userId}` },
      (payload) => notifyListeners('investment_goals', payload))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'user_travel_suggestions', filter: `user_id=eq.${userId}` },
      (payload) => notifyListeners('user_travel_suggestions', payload))
    .subscribe();
  activeChannels.set('rt-mileage', mileageChannel);

  // Channel 4: Future expenses/incomes, recurring, notifications
  const futureChannel = supabase
    .channel('rt-future')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'manual_future_expenses', filter: `user_id=eq.${userId}` },
      (payload) => notifyListeners('manual_future_expenses', payload))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'manual_future_incomes', filter: `user_id=eq.${userId}` },
      (payload) => notifyListeners('manual_future_incomes', payload))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'recurring_expenses' },
      (payload) => notifyListeners('recurring_expenses', payload))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'user_financial_notifications', filter: `user_id=eq.${userId}` },
      (payload) => notifyListeners('user_financial_notifications', payload))
    .subscribe();
  activeChannels.set('rt-future', futureChannel);
}

function notifyListeners(table: TableName, payload: any) {
  const tableListeners = listeners.get(table);
  if (tableListeners) {
    tableListeners.forEach(handler => handler(payload));
  }
}

function cleanupChannels() {
  activeChannels.forEach((channel) => {
    supabase.removeChannel(channel);
  });
  activeChannels.clear();
  listeners.clear();
  isInitialized = false;
}

/**
 * Hook to subscribe to realtime changes on a specific table.
 * Uses the centralized channel manager instead of creating individual channels.
 */
export function useRealtimeTable(
  tableName: TableName,
  onChangeCallback: ChangeHandler,
  enabled = true
) {
  const callbackRef = useRef(onChangeCallback);
  callbackRef.current = onChangeCallback;

  useEffect(() => {
    if (!enabled) return;

    const handler: ChangeHandler = (payload) => callbackRef.current(payload);

    if (!listeners.has(tableName)) {
      listeners.set(tableName, new Set());
    }
    listeners.get(tableName)!.add(handler);

    return () => {
      listeners.get(tableName)?.delete(handler);
    };
  }, [tableName, enabled]);
}

/**
 * Hook to auto-invalidate React Query cache on realtime changes.
 * Drop-in replacement for individual channel subscriptions.
 */
export function useRealtimeQueryInvalidation(
  tableName: TableName,
  queryKeys: string[][],
  enabled = true
) {
  const queryClient = useQueryClient();

  const debouncedInvalidate = useCallback(
    debounce(() => {
      queryKeys.forEach(key => {
        queryClient.invalidateQueries({ queryKey: key });
      });
    }, 300),
    [queryClient, JSON.stringify(queryKeys)]
  );

  useRealtimeTable(tableName, debouncedInvalidate, enabled);
}

/**
 * Provider hook - call once at app level to initialize channels.
 */
export function useRealtimeManagerInit() {
  const { user } = useAuth();

  useEffect(() => {
    if (user?.id) {
      initializeChannels(user.id);
    }

    return () => {
      cleanupChannels();
    };
  }, [user?.id]);
}
