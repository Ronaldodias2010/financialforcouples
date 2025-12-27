import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Users, Trash2, ArrowUpDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface UserActivityData {
  status: 'pending' | 'active' | 'inactive';
  days_inactive: number;
  last_activity_at: string | null;
}

interface UserData {
  email: string;
  display_name: string;
  subscribed: boolean;
  subscription_tier: string;
  user_id: string;
  isCoupled?: boolean;
  partnerName?: string;
  created_at?: string;
  activity?: UserActivityData;
}

interface NonPremiumUsersListProps {
  language: 'en' | 'pt';
}

type SortOption = 'created_desc' | 'created_asc' | 'name_asc' | 'name_desc';

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
    activityStatus: 'Activity',
    plan: 'Plan',
    createdAt: 'Created At',
    actions: 'Actions',
    active: 'Active',
    inactive: 'Inactive',
    pending: 'Pending',
    coupled: 'Coupled',
    deleteUser: 'Delete User',
    deleteSuccess: 'User deleted successfully',
    deleteError: 'Error deleting user',
    sortBy: 'Sort by',
    createdNewest: 'Newest first',
    createdOldest: 'Oldest first',
    nameAZ: 'Name A-Z',
    nameZA: 'Name Z-A',
    daysInactive: 'days inactive',
    neverAccessed: 'Never accessed'
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
    activityStatus: 'Atividade',
    plan: 'Plano',
    createdAt: 'Data de Criação',
    actions: 'Ações',
    active: 'Ativo',
    inactive: 'Inativo',
    pending: 'Pendente',
    coupled: 'Casal',
    deleteUser: 'Excluir Usuário',
    deleteSuccess: 'Usuário excluído com sucesso',
    deleteError: 'Erro ao excluir usuário',
    sortBy: 'Ordenar por',
    createdNewest: 'Mais recentes',
    createdOldest: 'Mais antigos',
    nameAZ: 'Nome A-Z',
    nameZA: 'Nome Z-A',
    daysInactive: 'dias inativo',
    neverAccessed: 'Nunca acessou'
  }
};

export function NonPremiumUsersList({ language }: NonPremiumUsersListProps) {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortOption, setSortOption] = useState<SortOption>('created_desc');
  const { toast } = useToast();
  const t = text[language];

  const sortedUsers = useMemo(() => {
    return [...users].sort((a, b) => {
      switch (sortOption) {
        case 'created_desc':
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
        case 'created_asc':
          return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
        case 'name_asc':
          return (a.display_name || '').localeCompare(b.display_name || '');
        case 'name_desc':
          return (b.display_name || '').localeCompare(a.display_name || '');
        default:
          return 0;
      }
    });
  }, [users, sortOption]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      console.log('🔍 Fetching essential users...');
      
      // Primeiro buscar usuários essenciais da tabela subscribers
      const { data: subscribersData, error: subscribersError } = await supabase
        .from('subscribers')
        .select('*')
        .eq('subscription_tier', 'essential');

      // Excluir usuários com acesso manual ativo
      const { data: manualAccessUsers } = await supabase
        .from('manual_premium_access')
        .select('user_id')
        .eq('status', 'active');
      
      const manualAccessUserIds = manualAccessUsers?.map(m => m.user_id) || [];
      
      // Filtrar usuários que não têm acesso manual
      const filteredSubscribers = subscribersData?.filter(sub => 
        !manualAccessUserIds.includes(sub.user_id)
      ) || [];

      if (subscribersError) {
        console.error('❌ Error fetching subscribers:', subscribersError);
        throw subscribersError;
      }

      console.log('📊 Filtered subscribers data (excluding manual access):', filteredSubscribers);
      console.log('📊 Essential users count (excluding manual access):', filteredSubscribers?.length || 0);

      if (!filteredSubscribers || filteredSubscribers.length === 0) {
        console.log('⚠️ No essential subscribers found after filtering manual access users.');
        setUsers([]);
        return;
      }

      // Depois buscar os perfis correspondentes
      const userIds = filteredSubscribers?.map(sub => sub.user_id) || [];
      console.log('👥 User IDs to fetch profiles for:', userIds);
      
      let profilesData: any[] = [];
      
      if (userIds.length > 0) {
        const { data: fetchedProfiles, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, display_name, created_at')
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

      // Fetch activity tracking data for all users
      let activityData: any[] = [];
      if (userIds.length > 0) {
        const { data: fetchedActivity, error: activityError } = await supabase
          .from('user_activity_tracking')
          .select('user_id, status, days_inactive, last_activity_at')
          .in('user_id', userIds);

        if (activityError) {
          console.error('❌ Error fetching activity data:', activityError);
        } else {
          activityData = fetchedActivity || [];
        }
      }

      console.log('📊 Activity data:', activityData);

      // Combinar dados dos subscribers com profiles e buscar casais
      const usersWithNames = await Promise.all(filteredSubscribers?.map(async (subscriber) => {
        const profile = profilesData?.find(p => p.user_id === subscriber.user_id);
        const activity = activityData?.find(a => a.user_id === subscriber.user_id);
        
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
          partnerName,
          created_at: profile?.created_at,
          activity: activity ? {
            status: activity.status as 'pending' | 'active' | 'inactive',
            days_inactive: activity.days_inactive || 0,
            last_activity_at: activity.last_activity_at
          } : undefined
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
      const newEnd = newSubscribed ? new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString() : null;

      // Update target user - profiles
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ subscribed: newSubscribed, subscription_tier: newTier })
        .eq('user_id', userId);
      if (profileError) throw profileError;

      // Update target user - subscribers
      const { error: subscriberError } = await supabase
        .from('subscribers')
        .update({ subscribed: newSubscribed, subscription_tier: newTier, subscription_end: newEnd })
        .eq('user_id', userId);
      if (subscriberError) throw subscriberError;

      // Also update active partner (shared premium for couples)
      const { data: couple } = await supabase
        .from('user_couples')
        .select('user1_id, user2_id, status')
        .eq('status', 'active')
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
        .maybeSingle();

      if (couple) {
        const partnerId = couple.user1_id === userId ? couple.user2_id : couple.user1_id;
        if (partnerId) {
          // profiles for partner
          const { error: partnerProfileErr } = await supabase
            .from('profiles')
            .update({ subscribed: newSubscribed, subscription_tier: newTier })
            .eq('user_id', partnerId);
          if (partnerProfileErr) throw partnerProfileErr;

          // subscribers for partner
          const { error: partnerSubErr } = await supabase
            .from('subscribers')
            .update({ subscribed: newSubscribed, subscription_tier: newTier, subscription_end: newEnd })
            .eq('user_id', partnerId);
          if (partnerSubErr) throw partnerSubErr;
        }
      }

      toast({ title: newSubscribed ? t.userGranted : t.userRevoked, variant: 'default' });
      fetchUsers();
    } catch (error) {
      console.error('❌ Error updating user access:', error);
      let errorMessage = 'Erro desconhecido';
      if (error && typeof error === 'object') {
        errorMessage = (error as any).message || (error as any).details || JSON.stringify(error);
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      toast({ title: t.error, description: errorMessage, variant: 'destructive' });
    }
  };

  const deleteUser = async (userId: string, userEmail: string) => {
    try {
      console.log('🗑️ Deleting user via edge function:', { userId, userEmail });

      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      const { data, error } = await supabase.functions.invoke('admin-delete-essential-user', {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: { userId },
      });

      if (error) throw error;

      toast({ title: t.deleteSuccess, variant: 'default' });
      setUsers((prev) => prev.filter((u) => u.user_id !== userId));
    } catch (error) {
      console.error('❌ Error deleting user:', error);
      let errorMessage = 'Erro desconhecido';
      if (error && typeof error === 'object') {
        errorMessage = (error as any).message || (error as any).details || JSON.stringify(error);
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      toast({ title: t.deleteError, description: errorMessage, variant: 'destructive' });
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
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {t.title} ({users.length})
          </CardTitle>
          {users.length > 0 && (
            <div className="flex items-center gap-2">
              <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
              <Select value={sortOption} onValueChange={(value: SortOption) => setSortOption(value)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder={t.sortBy} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_desc">{t.createdNewest}</SelectItem>
                  <SelectItem value="created_asc">{t.createdOldest}</SelectItem>
                  <SelectItem value="name_asc">{t.nameAZ}</SelectItem>
                  <SelectItem value="name_desc">{t.nameZA}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
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
                    {t.activityStatus}
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    {t.plan}
                  </th>
                  <th 
                    className="h-12 px-4 text-left align-middle font-medium text-muted-foreground cursor-pointer hover:bg-muted/80 transition-colors"
                    onClick={() => setSortOption(sortOption === 'created_desc' ? 'created_asc' : 'created_desc')}
                  >
                    <div className="flex items-center gap-1">
                      {t.createdAt}
                      <ArrowUpDown className={`h-4 w-4 ${sortOption.includes('created') ? 'text-primary' : 'text-muted-foreground/50'}`} />
                    </div>
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    {t.actions}
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedUsers.map((user) => (
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
                      {user.activity ? (
                        <div className="flex flex-col gap-1">
                          <Badge 
                            variant={user.activity.status === 'active' ? 'default' : 'secondary'}
                            className={
                              user.activity.status === 'active' 
                                ? 'bg-green-500 text-white' 
                                : user.activity.status === 'inactive'
                                ? 'bg-red-500 text-white'
                                : 'bg-orange-500 text-white'
                            }
                          >
                            {user.activity.status === 'active' ? t.active : user.activity.status === 'inactive' ? t.inactive : t.pending}
                          </Badge>
                          {user.activity.status === 'inactive' && user.activity.days_inactive > 0 && (
                            <span className="text-xs text-muted-foreground">
                              {user.activity.days_inactive} {t.daysInactive}
                            </span>
                          )}
                        </div>
                      ) : (
                        <Badge className="bg-orange-500 text-white">
                          {t.pending}
                        </Badge>
                      )}
                    </td>
                    <td className="p-4 align-middle">
                      <Badge variant="outline">
                        {user.subscribed ? t.premium : t.essential}
                      </Badge>
                    </td>
                    <td className="p-4 align-middle">
                      <div className="text-sm">
                        {user.created_at && typeof user.created_at === 'string' ? new Date(user.created_at).toLocaleDateString(language === 'pt' ? 'pt-BR' : 'en-US', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        }) : 'N/A'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {user.created_at && typeof user.created_at === 'string' ? new Date(user.created_at).toLocaleTimeString(language === 'pt' ? 'pt-BR' : 'en-US', {
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : ''}
                      </div>
                    </td>
                    <td className="p-4 align-middle">
                      <Button
                        size="sm"
                        variant="default"
                        className="bg-red-500 hover:bg-red-600 text-white"
                        onClick={() => deleteUser(user.user_id, user.email)}
                      >
                        <Trash2 className="w-4 h-4" />
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