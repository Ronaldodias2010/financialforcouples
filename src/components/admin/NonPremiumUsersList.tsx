import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface UserData {
  email: string;
  display_name: string;
  subscribed: boolean;
  subscription_tier: string;
  user_id: string;
  isCoupled?: boolean;
  partnerName?: string;
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
    error: 'Error updating user access',
    userName: 'User Name',
    email: 'Email',
    status: 'Status',
    plan: 'Plan',
    actions: 'Actions',
    active: 'Active',
    inactive: 'Inactive',
    coupled: 'Coupled'
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
    error: 'Erro ao atualizar acesso do usuário',
    userName: 'Nome de Usuário',
    email: 'Email',
    status: 'Status',
    plan: 'Plano',
    actions: 'Ações',
    active: 'Ativo',
    inactive: 'Inativo',
    coupled: 'Casal'
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

      // Combinar dados dos subscribers com profiles e buscar casais
      const usersWithNames = await Promise.all(subscribersData?.map(async (subscriber) => {
        const profile = profilesData?.find(p => p.user_id === subscriber.user_id);
        
        // Verificar se o usuário tem casal (abordagem simplificada)
        const { data: coupleData } = await supabase
          .from('user_couples')
          .select('user1_id, user2_id')
          .or(`user1_id.eq.${subscriber.user_id},user2_id.eq.${subscriber.user_id}`)
          .eq('status', 'active')
          .maybeSingle();

        let isCoupled = false;
        let partnerName = '';
        
        if (coupleData) {
          isCoupled = true;
          // Encontrar o ID do parceiro
          const partnerId = coupleData.user1_id === subscriber.user_id ? 
            coupleData.user2_id : coupleData.user1_id;
          
          // Buscar o nome do parceiro
          const { data: partnerProfile } = await supabase
            .from('profiles')
            .select('display_name')
            .eq('user_id', partnerId)
            .maybeSingle();
          
          partnerName = partnerProfile?.display_name || 'Parceiro';
        }
        
        return {
          user_id: subscriber.user_id,
          display_name: profile?.display_name || subscriber.email?.split('@')[0] || 'N/A',
          email: subscriber.email || 'N/A',
          subscribed: subscriber.subscribed || false,
          subscription_tier: subscriber.subscription_tier || 'essential',
          isCoupled,
          partnerName
        };
      }) || []);

      console.log('✅ Final formatted users:', usersWithNames);
      setUsers(usersWithNames);
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
    
    // Set up real-time subscription for subscribers table
    const subscription = supabase
      .channel('subscribers-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'subscribers' },
        () => {
          console.log('🔄 Subscribers table changed, refreshing users...');
          fetchUsers();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
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
          <p className="text-muted-foreground text-center py-8">{t.noUsers}</p>
        ) : (
          <div className="rounded-md border">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    {t.userName}
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    {t.email}
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    {t.status}
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    {t.plan}
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    {t.actions}
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.user_id} className="border-b transition-colors hover:bg-muted/50">
                    <td className="p-4 align-middle">
                      <div className="flex items-center gap-2">
                        <div className="font-medium">{user.display_name}</div>
                        {user.isCoupled && (
                          <Badge variant="outline" className="text-xs">
                            {t.coupled}
                          </Badge>
                        )}
                      </div>
                      {user.isCoupled && user.partnerName && (
                        <div className="text-xs text-muted-foreground">
                          Parceiro: {user.partnerName}
                        </div>
                      )}
                    </td>
                    <td className="p-4 align-middle">
                      <div className="text-sm">{user.email}</div>
                    </td>
                    <td className="p-4 align-middle">
                      <Badge variant={user.subscribed ? "default" : "secondary"}>
                        {user.subscribed ? t.active : t.inactive}
                      </Badge>
                    </td>
                    <td className="p-4 align-middle">
                      <Badge variant="outline">
                        {user.subscribed ? t.premium : t.essential}
                      </Badge>
                    </td>
                    <td className="p-4 align-middle">
                      <Button
                        variant={user.subscribed ? "outline" : "default"}
                        size="sm"
                        onClick={() => toggleUserAccess(user.user_id, user.subscribed)}
                      >
                        {user.subscribed ? t.revokeAccess : t.grantAccess}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}