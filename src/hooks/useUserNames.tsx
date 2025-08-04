import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface UserNames {
  user1: string;
  user2: string;
}

export const useUserNames = () => {
  const { user } = useAuth();
  const [userNames, setUserNames] = useState<UserNames>({
    user1: 'Usuário 1',
    user2: 'Usuário 2'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserNames = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        // Buscar o nome do usuário atual e do segundo usuário
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('display_name, second_user_name')
          .eq('user_id', user.id)
          .single();

        let user1Name = userProfile?.display_name || 'Usuário 1';
        let user2Name = userProfile?.second_user_name || 'Usuário 2';

        setUserNames({
          user1: user1Name,
          user2: user2Name
        });
      } catch (error) {
        console.error('Error fetching user names:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserNames();
  }, [user?.id]);

  return { userNames, loading };
};