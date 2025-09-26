import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Crown } from 'lucide-react';
import { ManualAccessBadge } from './ManualAccessBadge';

interface PremiumUserData {
  email: string;
  display_name: string;
  subscribed: boolean;
  subscription_tier: string;
  user_id: string;
  subscription_end?: string;
  isExpired?: boolean;
  isCoupled?: boolean;
  partnerName?: string;
  isManualAccess?: boolean;
  accessSource?: 'stripe' | 'manual';
}

interface PremiumUsersListProps {
  language: 'en' | 'pt';
}

const text = {
  en: {
    title: 'Premium Users',
    loading: 'Loading users...',
    noUsers: 'No premium users found',
    userName: 'User Name',
    email: 'Email',
    status: 'Status',
    plan: 'Plan',
    active: 'Active',
    inactive: 'Inactive',
    coupled: 'Coupled',
    source: 'Source'
  },
  pt: {
    title: 'Usuários Premium',
    loading: 'Carregando usuários...',
    noUsers: 'Nenhum usuário premium encontrado',
    userName: 'Nome de Usuário',
    email: 'Email',
    status: 'Status',
    plan: 'Plano',
    active: 'Ativo',
    inactive: 'Inativo',
    coupled: 'Casal',
    source: 'Origem'
  }
};

export function PremiumUsersList({ language }: PremiumUsersListProps) {
  const [users, setUsers] = useState<PremiumUserData[]>([]);
  const [loading, setLoading] = useState(true);
  const t = text[language];

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Fetch premium users (including those with expired subscriptions for admin review)
      const { data: premiumSubscribers, error } = await supabase
        .from('subscribers')
        .select('*')
        .eq('subscription_tier', 'premium');

      if (error) throw error;

      const userIds = premiumSubscribers?.map((s: any) => s.user_id) || [];
      let profiles: any[] = [];
      let manualAccessUsers: any[] = [];
      
      if (userIds.length) {
        const { data: profs } = await supabase
          .from('profiles')
          .select('user_id, display_name')
          .in('user_id', userIds);
        profiles = profs || [];

        // Check for manual premium access
        const { data: manualAccess } = await supabase
          .from('manual_premium_access')
          .select('user_id, email, status, end_date')
          .in('user_id', userIds)
          .eq('status', 'active');
        manualAccessUsers = manualAccess || [];
      }

      const enriched = await Promise.all((premiumSubscribers || []).map(async (s: any) => {
        const profile = profiles.find(p => p.user_id === s.user_id);
        const manualAccess = manualAccessUsers.find(m => m.user_id === s.user_id);
        
        // Check if subscription is actually expired
        const isExpired = s.subscription_end ? new Date(s.subscription_end) < new Date() : false;
        
        const { data: couple } = await supabase
          .from('user_couples')
          .select('user1_id, user2_id')
          .or(`user1_id.eq.${s.user_id},user2_id.eq.${s.user_id}`)
          .eq('status', 'active')
          .maybeSingle();
        let isCoupled = false;
        let partnerName = '';
        if (couple) {
          isCoupled = true;
          const partnerId = couple.user1_id === s.user_id ? couple.user2_id : couple.user1_id;
          const { data: partnerProfile } = await supabase
            .from('profiles')
            .select('display_name')
            .eq('user_id', partnerId)
            .maybeSingle();
          partnerName = partnerProfile?.display_name || 'Parceiro';
        }
        
        return {
          user_id: s.user_id,
          email: s.email,
          display_name: profile?.display_name || s.email?.split('@')[0] || 'Usuário',
          subscribed: s.subscribed && !isExpired, // Show as not subscribed if expired
          subscription_tier: s.subscription_tier,
          subscription_end: s.subscription_end,
          isExpired: isExpired,
          isCoupled,
          partnerName,
          isManualAccess: !!manualAccess,
          accessSource: manualAccess ? 'manual' : 'stripe'
        } as PremiumUserData;
      }));

      setUsers(enriched);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    const sub = supabase
      .channel('premium-users-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subscribers' }, fetchUsers)
      .subscribe();
    return () => { sub.unsubscribe(); };
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
          <Crown className="h-5 w-5" />
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
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">{t.userName}</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">{t.email}</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">{t.status}</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">{t.plan}</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">{t.source}</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.user_id} className="border-b transition-colors hover:bg-muted/50">
                    <td className="p-4 align-middle">
                      <div className="flex items-center gap-2">
                        <div className="font-medium">{u.display_name}</div>
                        {u.isCoupled && (
                          <Badge variant="outline" className="text-xs">{t.coupled}</Badge>
                        )}
                      </div>
                      {u.isCoupled && u.partnerName && (
                        <div className="text-xs text-muted-foreground">Parceiro: {u.partnerName}</div>
                      )}
                    </td>
                    <td className="p-4 align-middle">{u.email}</td>
                    <td className="p-4 align-middle">
                      <div className="flex flex-col gap-1">
                        <Badge variant={u.isExpired ? 'destructive' : u.subscribed ? 'default' : 'secondary'}>
                          {u.isExpired ? 'Expirado' : u.subscribed ? t.active : t.inactive}
                        </Badge>
                        {u.subscription_end && (
                          <span className="text-xs text-muted-foreground">
                            Expira: {new Date(u.subscription_end).toLocaleDateString('pt-BR')}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 align-middle">
                      <Badge 
                        variant={u.isManualAccess ? "secondary" : "default"}
                        className={u.isManualAccess ? "border-amber-500 bg-amber-100 text-amber-800 dark:border-amber-400 dark:bg-amber-900/30 dark:text-amber-300" : ""}
                      >
                        {u.subscription_tier}
                      </Badge>
                    </td>
                    <td className="p-4 align-middle">
                      {u.isManualAccess ? (
                        <ManualAccessBadge 
                          language={language} 
                          userId={u.user_id}
                          onViewDetails={() => {
                            // Navigate to manual access tab
                            const event = new CustomEvent('navigateToManualAccess', { 
                              detail: { userId: u.user_id } 
                            });
                            window.dispatchEvent(event);
                          }}
                        />
                      ) : (
                        <Badge variant="success">Stripe</Badge>
                      )}
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
