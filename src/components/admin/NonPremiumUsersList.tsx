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
      
      // Primeiro buscar usuários essenciais da tabela subscribers
      const { data: subscribersData, error: subscribersError } = await supabase
        .from('subscribers')
        .select('*')
        .eq('subscription_tier', 'essential');

      if (subscribersError) {
        console.error('Error fetching subscribers:', subscribersError);
        throw subscribersError;
      }

      console.log('Subscribers data:', subscribersData);

      // Depois buscar os perfis correspondentes
      const userIds = subscribersData?.map(sub => sub.user_id) || [];
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('user_id', userIds);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        throw profilesError;
      }

      console.log('Profiles data:', profilesData);

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

      console.log('Final formatted users:', formattedUsers);
      setUsers(formattedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: t.error,
        description: String(error),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleUserAccess = async (userId: string, currentSubscribed: boolean) => {
    try {
      const newSubscribed = !currentSubscribed;
      const newTier = newSubscribed ? 'premium' : 'essential';
      
      // Update profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          subscribed: newSubscribed,
          subscription_tier: newTier
        })
        .eq('user_id', userId);

      if (profileError) throw profileError;

      // Update subscribers table
      const { error: subscriberError } = await supabase
        .from('subscribers')
        .update({ 
          subscribed: newSubscribed,
          subscription_tier: newTier,
          subscription_end: newSubscribed ? new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString() : null
        })
        .eq('user_id', userId);

      if (subscriberError) throw subscriberError;

      toast({
        title: newSubscribed ? t.userGranted : t.userRevoked,
        variant: 'default',
      });

      fetchUsers(); // Refresh the list
    } catch (error) {
      console.error('Error updating user access:', error);
      toast({
        title: t.error,
        description: String(error),
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