import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useCouple } from '@/hooks/useCouple';
import { useLanguage } from '@/hooks/useLanguage';
import { useRealtimeTable } from '@/hooks/useRealtimeManager';

interface PartnerNames {
  currentUserName: string;
  partnerName: string;
  user1Name: string;
  user2Name: string;
}

export const usePartnerNames = () => {
  const { user } = useAuth();
  const { couple, isPartOfCouple, getPartnerUserId } = useCouple();
  const { t } = useLanguage();
  const [names, setNames] = useState<PartnerNames>({
    currentUserName: t('dashboard.user1'),
    partnerName: t('dashboard.user2'),
    user1Name: t('dashboard.user1'),
    user2Name: t('dashboard.user2')
  });
  const [loading, setLoading] = useState(true);

  const fetchNames = useCallback(async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      // Wait for couple data to be loaded before proceeding
      // couple is undefined while loading, null when confirmed no couple
      if (couple === undefined) {
        return;
      }

      try {
        let user1Name = t('dashboard.user1');
        let user2Name = t('dashboard.user2');

        if (couple) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('user_id, display_name')
            .in('user_id', [couple.user1_id, couple.user2_id]);

          const user1Profile = profiles?.find(p => p.user_id === couple.user1_id);
          const user2Profile = profiles?.find(p => p.user_id === couple.user2_id);

          user1Name = user1Profile?.display_name?.trim() || t('dashboard.user1');
          user2Name = user2Profile?.display_name?.trim() || t('dashboard.user2');

          // Fallback: try to get name from current user's metadata
          if (user1Name === t('dashboard.user1') && user.id === couple.user1_id) {
            user1Name = user.user_metadata?.display_name ||
                       user.user_metadata?.full_name ||
                       user.user_metadata?.name ||
                       user.email?.split('@')[0] ||
                       t('dashboard.user1');
          }
          if (user2Name === t('dashboard.user2') && user.id === couple.user2_id) {
            user2Name = user.user_metadata?.display_name ||
                       user.user_metadata?.full_name ||
                       user.user_metadata?.name ||
                       user.email?.split('@')[0] ||
                       t('dashboard.user2');
          }
        } else {
          const currentUserProfile = await supabase
            .from('profiles')
            .select('display_name')
            .eq('user_id', user.id)
            .maybeSingle();

          user1Name = currentUserProfile?.data?.display_name ||
                     user.user_metadata?.display_name ||
                     user.user_metadata?.full_name ||
                     user.user_metadata?.name ||
                     user.email?.split('@')[0] ||
                     t('dashboard.user1');
        }

        setNames({
          currentUserName: couple ? 
            (user?.id === couple.user1_id ? user1Name : user2Name) : 
            user1Name,
          partnerName: couple ? 
            (user?.id === couple.user1_id ? user2Name : user1Name) : 
            t('dashboard.user2'),
          user1Name,
          user2Name
        });
      } catch (error) {
        console.error('Error fetching names:', error);
      } finally {
        setLoading(false);
      }
  }, [user?.id, couple, t]);

  useEffect(() => {
    fetchNames();
  }, [fetchNames]);

  // Use centralized realtime manager for profile changes
  useRealtimeTable('profiles', () => {
    fetchNames();
  }, isPartOfCouple && !!couple);

  return { names, loading };
};