import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Clock, Mail, RefreshCw, ArrowUpDown, Crown, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface InactiveUser {
  user_id: string;
  email: string;
  display_name: string | null;
  first_access_at: string | null;
  last_activity_at: string;
  days_inactive: number;
  entered_inactive_funnel_at: string | null;
  is_premium: boolean;
}

interface InactiveUsersSectionProps {
  language: 'en' | 'pt';
}

type SortOption = 'days_desc' | 'days_asc' | 'name_asc' | 'name_desc';
type FilterOption = 'all' | 'premium' | 'essential';

const text = {
  en: {
    title: 'Inactive Users',
    subtitle: 'Users with 10+ days of inactivity',
    loading: 'Loading inactive users...',
    noUsers: 'No inactive users found',
    daysInactive: 'days inactive',
    lastActivity: 'Last Activity',
    firstAccess: 'First Access',
    sendEmail: 'Send Re-engagement Email',
    refresh: 'Refresh',
    sortBy: 'Sort by',
    filterBy: 'Filter by',
    mostInactive: 'Most inactive',
    leastInactive: 'Least inactive',
    nameAZ: 'Name A-Z',
    nameZA: 'Name Z-A',
    all: 'All',
    premium: 'Premium',
    essential: 'Essential',
    emailSent: 'Re-engagement email sent',
    emailError: 'Error sending email',
    user: 'User',
    type: 'Type',
    inactiveSince: 'Inactive Since',
    never: 'Never accessed',
    refreshSuccess: 'Inactive users updated',
    refreshError: 'Error refreshing data'
  },
  pt: {
    title: 'Usuários Inativos',
    subtitle: 'Usuários com 10+ dias de inatividade',
    loading: 'Carregando usuários inativos...',
    noUsers: 'Nenhum usuário inativo encontrado',
    daysInactive: 'dias inativo',
    lastActivity: 'Última Atividade',
    firstAccess: 'Primeiro Acesso',
    sendEmail: 'Enviar Email de Reengajamento',
    refresh: 'Atualizar',
    sortBy: 'Ordenar por',
    filterBy: 'Filtrar por',
    mostInactive: 'Mais inativos',
    leastInactive: 'Menos inativos',
    nameAZ: 'Nome A-Z',
    nameZA: 'Nome Z-A',
    all: 'Todos',
    premium: 'Premium',
    essential: 'Essential',
    emailSent: 'Email de reengajamento enviado',
    emailError: 'Erro ao enviar email',
    user: 'Usuário',
    type: 'Tipo',
    inactiveSince: 'Inativo Desde',
    never: 'Nunca acessou',
    refreshSuccess: 'Usuários inativos atualizados',
    refreshError: 'Erro ao atualizar dados'
  }
};

export function InactiveUsersSection({ language }: InactiveUsersSectionProps) {
  const [users, setUsers] = useState<InactiveUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sortOption, setSortOption] = useState<SortOption>('days_desc');
  const [filterOption, setFilterOption] = useState<FilterOption>('all');
  const { toast } = useToast();
  const t = text[language];

  const sortedAndFilteredUsers = useMemo(() => {
    let filtered = [...users];
    
    // Apply filter
    if (filterOption === 'premium') {
      filtered = filtered.filter(u => u.is_premium);
    } else if (filterOption === 'essential') {
      filtered = filtered.filter(u => !u.is_premium);
    }
    
    // Apply sort
    return filtered.sort((a, b) => {
      switch (sortOption) {
        case 'days_desc':
          return b.days_inactive - a.days_inactive;
        case 'days_asc':
          return a.days_inactive - b.days_inactive;
        case 'name_asc':
          return (a.display_name || a.email).localeCompare(b.display_name || b.email);
        case 'name_desc':
          return (b.display_name || b.email).localeCompare(a.display_name || a.email);
        default:
          return 0;
      }
    });
  }, [users, sortOption, filterOption]);

  const fetchInactiveUsers = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .rpc('get_inactive_users');

      if (error) {
        console.error('Error fetching inactive users:', error);
        throw error;
      }

      setUsers(data || []);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: t.refreshError,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      
      // First, run the update function to recalculate inactive users
      const { data: updateResult, error: updateError } = await supabase
        .rpc('update_inactive_users');
      
      if (updateError) {
        console.error('Error updating inactive users:', updateError);
      }
      
      // Then fetch the updated list
      await fetchInactiveUsers();
      
      toast({
        title: t.refreshSuccess,
        description: `${updateResult || 0} usuários atualizados`,
      });
    } catch (error) {
      console.error('Error refreshing:', error);
      toast({
        title: t.refreshError,
        variant: 'destructive',
      });
    } finally {
      setRefreshing(false);
    }
  };

  const handleSendReengagementEmail = async (userId: string, email: string) => {
    try {
      // TODO: Implement re-engagement email edge function
      toast({
        title: t.emailSent,
        description: email,
      });
    } catch (error) {
      console.error('Error sending email:', error);
      toast({
        title: t.emailError,
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    fetchInactiveUsers();
  }, []);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return t.never;
    return new Date(dateStr).toLocaleDateString(language === 'pt' ? 'pt-BR' : 'en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getDaysInactiveBadgeColor = (days: number) => {
    if (days >= 30) return 'bg-red-500 text-white';
    if (days >= 20) return 'bg-orange-500 text-white';
    return 'bg-yellow-500 text-black';
  };

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
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-500" />
              {t.title} ({sortedAndFilteredUsers.length})
            </CardTitle>
            <CardDescription>{t.subtitle}</CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {t.refresh}
          </Button>
        </div>
        
        {users.length > 0 && (
          <div className="flex items-center gap-4 mt-4">
            <div className="flex items-center gap-2">
              <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
              <Select value={sortOption} onValueChange={(value: SortOption) => setSortOption(value)}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder={t.sortBy} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="days_desc">{t.mostInactive}</SelectItem>
                  <SelectItem value="days_asc">{t.leastInactive}</SelectItem>
                  <SelectItem value="name_asc">{t.nameAZ}</SelectItem>
                  <SelectItem value="name_desc">{t.nameZA}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2">
              <Select value={filterOption} onValueChange={(value: FilterOption) => setFilterOption(value)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder={t.filterBy} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t.all}</SelectItem>
                  <SelectItem value="premium">{t.premium}</SelectItem>
                  <SelectItem value="essential">{t.essential}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        {sortedAndFilteredUsers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{t.noUsers}</p>
          </div>
        ) : (
          <div className="rounded-md border">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    {t.user}
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    {t.type}
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    {t.daysInactive}
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    {t.lastActivity}
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    {t.firstAccess}
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedAndFilteredUsers.map((user) => (
                  <tr key={user.user_id} className="border-b transition-colors hover:bg-muted/50">
                    <td className="p-4 align-middle">
                      <div className="font-medium">{user.display_name || user.email.split('@')[0]}</div>
                      <div className="text-xs text-muted-foreground">{user.email}</div>
                    </td>
                    <td className="p-4 align-middle">
                      <Badge 
                        variant={user.is_premium ? "default" : "secondary"}
                        className={user.is_premium ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white" : ""}
                      >
                        {user.is_premium ? (
                          <><Crown className="h-3 w-3 mr-1" /> Premium</>
                        ) : (
                          <><User className="h-3 w-3 mr-1" /> Essential</>
                        )}
                      </Badge>
                    </td>
                    <td className="p-4 align-middle">
                      <Badge className={getDaysInactiveBadgeColor(user.days_inactive)}>
                        {user.days_inactive} {t.daysInactive}
                      </Badge>
                    </td>
                    <td className="p-4 align-middle text-sm">
                      {formatDate(user.last_activity_at)}
                    </td>
                    <td className="p-4 align-middle text-sm">
                      {formatDate(user.first_access_at)}
                    </td>
                    <td className="p-4 align-middle">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSendReengagementEmail(user.user_id, user.email)}
                      >
                        <Mail className="h-4 w-4 mr-1" />
                        Email
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
