import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useCouple } from '@/hooks/useCouple';

interface PartnerNames {
  currentUserName: string;
  partnerName: string;
  user1Name: string;
  user2Name: string;
}

export const usePartnerNames = () => {
  const { user } = useAuth();
  const { couple, isPartOfCouple, getPartnerUserId } = useCouple();
  const [names, setNames] = useState<PartnerNames>({
    currentUserName: 'Usuário 1',
    partnerName: 'Usuário 2',
    user1Name: 'Usuário 1',
    user2Name: 'Usuário 2'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNames = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        let user1Name = 'Usuário 1';
        let user2Name = 'Usuário 2';

        // If part of couple, determine names based on couple structure
        if (isPartOfCouple && couple) {
          // Get both users' names from profiles
          const { data: profiles } = await supabase
            .from('profiles')
            .select('user_id, display_name')
            .in('user_id', [couple.user1_id, couple.user2_id]);

          // User1 is always the one who created the couple (user1_id)
          const user1Profile = profiles?.find(p => p.user_id === couple.user1_id);
          const user2Profile = profiles?.find(p => p.user_id === couple.user2_id);

          user1Name = user1Profile?.display_name || 'Usuário 1';
          user2Name = user2Profile?.display_name || 'Usuário 2';

          // If display_name is not set, try to get from auth metadata
          if (user1Name === 'Usuário 1') {
            try {
              const { data: user1Auth } = await supabase.auth.admin.getUserById(couple.user1_id);
              if (user1Auth.user) {
                user1Name = user1Auth.user.user_metadata?.display_name ||
                           user1Auth.user.user_metadata?.full_name ||
                           user1Auth.user.user_metadata?.name ||
                           user1Auth.user.email?.split('@')[0] ||
                           'Usuário 1';
              }
            } catch (error) {
              console.log('Could not fetch user1 auth data:', error);
            }
          }

          if (user2Name === 'Usuário 2') {
            try {
              const { data: user2Auth } = await supabase.auth.admin.getUserById(couple.user2_id);
              if (user2Auth.user) {
                user2Name = user2Auth.user.user_metadata?.display_name ||
                           user2Auth.user.user_metadata?.full_name ||
                           user2Auth.user.user_metadata?.name ||
                           user2Auth.user.email?.split('@')[0] ||
                           'Usuário 2';
              }
            } catch (error) {
              console.log('Could not fetch user2 auth data:', error);
            }
          }
        } else {
          // Single user - get current user name
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
                     'Usuário 1';
        }

        setNames({
          currentUserName: user?.id === couple?.user1_id ? user1Name : (user?.id === couple?.user2_id ? user2Name : user1Name),
          partnerName: user?.id === couple?.user1_id ? user2Name : user1Name,
          user1Name,
          user2Name
        });
      } catch (error) {
        console.error('Error fetching names:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNames();

    // Listen for profile changes that might affect names
    if (isPartOfCouple && couple) {
      const channel = supabase
        .channel('profile-names-changes')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'profiles',
            filter: `user_id=in.(${couple.user1_id},${couple.user2_id})`
          },
          () => {
            console.log('Profile names changed, refreshing...');
            fetchNames();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user?.id, isPartOfCouple, couple]);

  return { names, loading };
};