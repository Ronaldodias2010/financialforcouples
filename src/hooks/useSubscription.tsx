import { useState, useEffect, createContext, useContext } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

export type SubscriptionTier = 'essential' | 'premium';

export interface SubscriptionContextType {
  subscribed: boolean;
  subscriptionTier: SubscriptionTier;
  subscriptionEnd: string | null;
  loading: boolean;
  checkSubscription: () => Promise<void>;
  hasAccess: (feature: string) => boolean;
  createCheckoutSession: (priceId?: string, promoData?: any) => Promise<void>;
  openCustomerPortal: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

const premiumFeatures = [
  'voiceInput',
  'aiMileage', 
  'aiPlanning',
  'investmentSuggestions',
  'customGoals',
  'advancedAnalytics',
  'prioritySupport',
  'aiRecommendations' // AI Recommendations should be premium only
];

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { user, session } = useAuth();
  const [subscribed, setSubscribed] = useState(false);
  const [subscriptionTier, setSubscriptionTier] = useState<SubscriptionTier>('essential');
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const checkSubscription = async () => {
    console.log('🔍 [SUBSCRIPTION] checkSubscription called', { user: user?.email, session: !!session });
    
    if (!user || !session) {
      console.log('❌ [SUBSCRIPTION] No user or session, setting loading false');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('🚀 [SUBSCRIPTION] Invoking check-subscription function');
      
      const { data, error } = await supabase.functions.invoke('check-subscription', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      console.log('📊 [SUBSCRIPTION] Function response:', { data, error });

      if (error) throw error;

      const subscribed = data.subscribed || false;
      const tier = data.subscription_tier || 'essential';
      const end = data.subscription_end || null;
      
      console.log('✅ [SUBSCRIPTION] Setting state:', { subscribed, tier, end });
      
      setSubscribed(subscribed);
      setSubscriptionTier(tier);
      setSubscriptionEnd(end);
    } catch (error) {
      console.error('❌ [SUBSCRIPTION] Error checking subscription:', error);
      setSubscribed(false);
      setSubscriptionTier('essential');
      setSubscriptionEnd(null);
    } finally {
      setLoading(false);
    }
  };

  const hasAccess = (feature: string): boolean => {
    if (!premiumFeatures.includes(feature)) return true;
    const hasValidAccess = subscriptionTier === 'premium' && subscribed;
    console.log(`🔐 [ACCESS CHECK] Feature: ${feature}, Tier: ${subscriptionTier}, Subscribed: ${subscribed}, Access: ${hasValidAccess}`);
    return hasValidAccess;
  };

  const createCheckoutSession = async (priceId?: string, promoData?: any) => {
    if (!session) throw new Error('User not authenticated');

    try {
      const requestBody: any = {};
      if (priceId) requestBody.priceId = priceId;
      if (promoData) requestBody.promoData = promoData;

      const { data, error } = await supabase.functions.invoke('create-checkout', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        ...(Object.keys(requestBody).length > 0 ? { body: requestBody } : {}),
      });

      if (error) throw error;
      if (data.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      throw error;
    }
  };

  const openCustomerPortal = async () => {
    if (!session) throw new Error('User not authenticated');

    try {
      const { data, error } = await supabase.functions.invoke('customer-portal', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      if (data.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error opening customer portal:', error);
      throw error;
    }
  };

  useEffect(() => {
    if (user) {
      checkSubscription();
    } else {
      setLoading(false);
    }
  }, [user]);

  // Force refresh for PWA to ensure couple subscription sharing works correctly
  useEffect(() => {
    const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                  (window.navigator as any).standalone || 
                  document.referrer.includes('android-app://');
    
    if (isPWA && user) {
      // Small delay to ensure authentication is complete
      const timer = setTimeout(() => {
        console.log('🔄 [PWA] Force refreshing subscription for PWA mode');
        checkSubscription();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [user]);

  const value = {
    subscribed,
    subscriptionTier,
    subscriptionEnd,
    loading,
    checkSubscription,
    hasAccess,
    createCheckoutSession,
    openCustomerPortal,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}