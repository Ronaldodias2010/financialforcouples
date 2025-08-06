import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Users, Crown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface UserData {
  email: string;
  display_name: string;
  subscribed: boolean;
  subscription_tier: string;
  user_id: string;
}

interface NonPremiumUsersListProps {
  language: 'en' | 'pt';
}

const text = {
  en: {
    title: 'Essential Users List',
    loading: 'Loading users...',
    noUsers: 'No essential users found',
    essential: 'Essential',
    premium: 'Premium',
    grantAccess: 'Grant Premium Access',
    revokeAccess: 'Revoke Access',
    userGranted: 'Premium access granted successfully',
    userRevoked: 'Premium access revoked successfully',
    error: 'Error updating user access'
  },
  pt: {
    title: 'Lista de Usuários Essential',
    loading: 'Carregando usuários...',
    noUsers: 'Nenhum usuário essencial encontrado',
    essential: 'Essencial',
    premium: 'Premium',
    grantAccess: 'Conceder Acesso Premium',
    revokeAccess: 'Revogar Acesso',
    userGranted: 'Acesso premium concedido com sucesso',
    userRevoked: 'Acesso premium revogado com sucesso',
    error: 'Erro ao atualizar acesso do usuário'
  }
};

export function NonPremiumUsersList({ language }: NonPremiumUsersListProps) {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const t = text[language];

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      console.log('🔍 Fetching essential users...');
      
      // Primeiro buscar usuários essenciais da tabela subscribers
      const { data: subscribersData, error: subscribersError } = await supabase
        .from('subscribers')
        .select('*')
        .eq('subscription_tier', 'essential');

      if (subscribersError) {
        console.error('❌ Error fetching subscribers:', subscribersError);
        throw subscribersError;
      }

      console.log('📊 Subscribers data from DB:', subscribersData);
      console.log('📊 Subscribers count:', subscribersData?.length || 0);

      if (!subscribersData || subscribersData.length === 0) {
        console.log('⚠️ No essential subscribers found. Trying to fetch all subscribers to debug...');
        
        // Debug: buscar todos os subscribers para ver o que tem
        const { data: allSubs } = await supabase.from('subscribers').select('*');
        console.log('🔍 All subscribers for debug:', allSubs);
        
        setUsers([]);
        return;
      }

      // Depois buscar os perfis correspondentes
      const userIds = subscribersData?.map(sub => sub.user_id) || [];
      console.log('👥 User IDs to fetch profiles for:', userIds);
      
      let profilesData: any[] = [];
      
      if (userIds.length > 0) {
        const { data: fetchedProfiles, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, display_name')
          .in('user_id', userIds);

        if (profilesError) {
          console.error('❌ Error fetching profiles:', profilesError);
          // Don't throw, just continue without profiles
          console.log('⚠️ Continuing without profiles data...');
        } else {
          profilesData = fetchedProfiles || [];
        }
      }

      console.log('👤 Profiles data:', profilesData);

      // Combinar os dados
      const formattedUsers = subscribersData?.map(subscriber => {
        const profile = profilesData?.find(p => p.user_id === subscriber.user_id);
        return {
          user_id: subscriber.user_id,
          display_name: profile?.display_name || 'N/A',
          email: subscriber.email || 'N/A',
          subscribed: subscriber.subscribed || false,
          subscription_tier: subscriber.subscription_tier || 'essential'
        };
      }) || [];

      console.log('✅ Final formatted users:', formattedUsers);
      setUsers(formattedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      
      // Extract proper error message
      let errorMessage = 'Erro ao carregar usuários';
      if (error && typeof error === 'object') {
        errorMessage = (error as any).message || (error as any).details || JSON.stringify(error);
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      toast({
        title: t.error,
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleUserAccess = async (userId: string, currentSubscribed: boolean) => {
    try {
      console.log('🔄 Toggling user access:', { userId, currentSubscribed });
      
      const newSubscribed = !currentSubscribed;
      const newTier = newSubscribed ? 'premium' : 'essential';
      
      console.log('📝 Update values:', { newSubscribed, newTier });
      
      // Update profiles table
      console.log('📝 Updating profiles table...');
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          subscribed: newSubscribed,
          subscription_tier: newTier
        })
        .eq('user_id', userId);

      if (profileError) {
        console.error('❌ Profile update error:', profileError);
        throw profileError;
      }
      console.log('✅ Profiles table updated');

      // Update subscribers table
      console.log('📝 Updating subscribers table...');
      const { error: subscriberError } = await supabase
        .from('subscribers')
        .update({ 
          subscribed: newSubscribed,
          subscription_tier: newTier,
          subscription_end: newSubscribed ? new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString() : null
        })
        .eq('user_id', userId);

      if (subscriberError) {
        console.error('❌ Subscriber update error:', subscriberError);
        throw subscriberError;
      }
      console.log('✅ Subscribers table updated');

      toast({
        title: newSubscribed ? t.userGranted : t.userRevoked,
        variant: 'default',
      });

      console.log('🔄 Refreshing user list...');
      fetchUsers(); // Refresh the list
    } catch (error) {
      console.error('❌ Error updating user access:', error);
      
      // Extract proper error message
      let errorMessage = 'Erro desconhecido';
      if (error && typeof error === 'object') {
        errorMessage = (error as any).message || (error as any).details || JSON.stringify(error);
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      toast({
        title: t.error,
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">{t.loading}</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          {t.title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {users.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">{t.noUsers}</p>
        ) : (
          <div className="space-y-4">
            {users.map((user) => (
              <div key={user.user_id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{user.display_name}</h3>
                    <Badge variant={user.subscribed ? "default" : "secondary"}>
                      {user.subscribed ? (
                        <div className="flex items-center gap-1">
                          <Crown className="h-3 w-3" />
                          {t.premium}
                        </div>
                      ) : (
                        t.essential
                      )}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
                <Button
                  variant={user.subscribed ? "outline" : "default"}
                  size="sm"
                  onClick={() => toggleUserAccess(user.user_id, user.subscribed)}
                >
                  {user.subscribed ? t.revokeAccess : t.grantAccess}
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}