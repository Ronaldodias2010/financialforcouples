import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useCouple } from '@/hooks/useCouple';

interface PartnerNames {
  currentUserName: string;
  partnerName: string;
}

export const usePartnerNames = () => {
  const { user } = useAuth();
  const { couple, isPartOfCouple, getPartnerUserId } = useCouple();
  const [names, setNames] = useState<PartnerNames>({
    currentUserName: 'Usuário 1',
    partnerName: 'Usuário 2'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNames = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        // Get current user name
        const currentUserName = user.user_metadata?.display_name ||
                               user.user_metadata?.full_name ||
                               user.user_metadata?.name ||
                               user.email?.split('@')[0] ||
                               'Usuário 1';

        let partnerName = 'Usuário 2';

        // If part of couple, get partner's name
        if (isPartOfCouple && couple) {
          const partnerId = getPartnerUserId();
          if (partnerId) {
            const { data: partnerProfile } = await supabase
              .from('profiles')
              .select('display_name')
              .eq('user_id', partnerId)
              .single();

            if (partnerProfile?.display_name) {
              partnerName = partnerProfile.display_name;
            } else {
              // Try to get partner's auth metadata
              const { data: authData } = await supabase.auth.admin.getUserById(partnerId);
              if (authData.user) {
                partnerName = authData.user.user_metadata?.display_name ||
                             authData.user.user_metadata?.full_name ||
                             authData.user.user_metadata?.name ||
                             authData.user.email?.split('@')[0] ||
                             'Usuário 2';
              }
            }
          }
        }

        setNames({
          currentUserName,
          partnerName
        });
      } catch (error) {
        console.error('Error fetching names:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNames();
  }, [user?.id, isPartOfCouple, couple, getPartnerUserId]);

  return { names, loading };
};