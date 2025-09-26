import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, Clock, CheckCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface PaymentFailure {
  id: string;
  user_id: string;
  email: string;
  failure_date: string;
  grace_period_ends_at: string;
  status: 'failed' | 'grace_period' | 'downgraded' | 'resolved';
  failure_reason: string;
  stripe_customer_id: string;
  display_name?: string;
}

interface PaymentFailuresDashboardProps {
  language: 'en' | 'pt';
}

const text = {
  en: {
    title: 'Payment Failures Management',
    loading: 'Loading payment failures...',
    noFailures: 'No payment failures found',
    email: 'Email',
    user: 'User',
    failureDate: 'Failure Date',
    graceEnds: 'Grace Period Ends',
    status: 'Status',
    reason: 'Reason',
    actions: 'Actions',
    failed: 'Failed',
    gracePeriod: 'Grace Period',
    downgraded: 'Downgraded',
    resolved: 'Resolved',
    forceSync: 'Force Sync',
    refresh: 'Refresh'
  },
  pt: {
    title: 'Gerenciamento de Falhas de Pagamento',
    loading: 'Carregando falhas de pagamento...',
    noFailures: 'Nenhuma falha de pagamento encontrada',
    email: 'Email',
    user: 'Usuário',
    failureDate: 'Data da Falha',
    graceEnds: 'Fim do Período de Graça',
    status: 'Status',
    reason: 'Motivo',
    actions: 'Ações',
    failed: 'Falhou',
    gracePeriod: 'Período de Graça',
    downgraded: 'Rebaixado',
    resolved: 'Resolvido',
    forceSync: 'Forçar Sinc.',
    refresh: 'Atualizar'
  }
};

export function PaymentFailuresDashboard({ language }: PaymentFailuresDashboardProps) {
  const [failures, setFailures] = useState<PaymentFailure[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);
  const t = text[language];

  const fetchFailures = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('payment_failures')
        .select(`
          *,
          profiles!inner(display_name)
        `)
        .order('failure_date', { ascending: false });

      if (error) throw error;

      const enrichedData = data?.map((failure: any) => ({
        ...failure,
        display_name: failure.profiles?.display_name
      })) || [];

      setFailures(enrichedData);
    } catch (error) {
      console.error('Error fetching payment failures:', error);
      toast.error('Erro ao carregar falhas de pagamento');
    } finally {
      setLoading(false);
    }
  };

  const handleForceSync = async (customerId: string, userId: string) => {
    setSyncing(userId);
    try {
      // Force sync with Stripe to check current status
      const { error } = await supabase.functions.invoke('check-subscription', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (error) throw error;
      
      toast.success('Sincronização forçada com sucesso');
      await fetchFailures();
    } catch (error) {
      console.error('Error forcing sync:', error);
      toast.error('Erro na sincronização forçada');
    } finally {
      setSyncing(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'failed':
        return <Badge variant="destructive">{t.failed}</Badge>;
      case 'grace_period':
        return <Badge variant="secondary">{t.gracePeriod}</Badge>;
      case 'downgraded':
        return <Badge variant="outline">{t.downgraded}</Badge>;
      case 'resolved':
        return <Badge variant="default">{t.resolved}</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'failed':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'grace_period':
        return <Clock className="h-4 w-4 text-warning" />;
      case 'resolved':
        return <CheckCircle className="h-4 w-4 text-success" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const isGracePeriodExpired = (graceEndsAt: string) => {
    return new Date(graceEndsAt) < new Date();
  };

  useEffect(() => {
    fetchFailures();
    
    // Set up real-time subscription
    const subscription = supabase
      .channel('payment-failures-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payment_failures' }, fetchFailures)
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
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            {t.title}
          </div>
          <Button onClick={fetchFailures} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-1" />
            {t.refresh}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {failures.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-success mx-auto mb-4" />
            <p className="text-muted-foreground">{t.noFailures}</p>
          </div>
        ) : (
          <div className="rounded-md border">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">{t.user}</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">{t.email}</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">{t.failureDate}</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">{t.graceEnds}</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">{t.reason}</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">{t.actions}</th>
                </tr>
              </thead>
              <tbody>
                {failures.map((failure) => (
                  <tr key={failure.id} className="border-b transition-colors hover:bg-muted/50">
                    <td className="p-4 align-middle">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(failure.status)}
                        {getStatusBadge(failure.status)}
                      </div>
                    </td>
                    <td className="p-4 align-middle">
                      <div className="font-medium">
                        {failure.display_name || failure.email.split('@')[0]}
                      </div>
                    </td>
                    <td className="p-4 align-middle">
                      <div className="text-sm text-muted-foreground">{failure.email}</div>
                    </td>
                    <td className="p-4 align-middle">
                      <div className="text-sm">
                        {new Date(failure.failure_date).toLocaleDateString('pt-BR')}
                      </div>
                    </td>
                    <td className="p-4 align-middle">
                      <div className={`text-sm ${
                        isGracePeriodExpired(failure.grace_period_ends_at) 
                          ? 'text-destructive font-medium' 
                          : 'text-muted-foreground'
                      }`}>
                        {failure.grace_period_ends_at 
                          ? new Date(failure.grace_period_ends_at).toLocaleDateString('pt-BR')
                          : '-'
                        }
                        {isGracePeriodExpired(failure.grace_period_ends_at) && ' (Expirado)'}
                      </div>
                    </td>
                    <td className="p-4 align-middle">
                      <div className="text-xs text-muted-foreground max-w-[200px] truncate" title={failure.failure_reason}>
                        {failure.failure_reason || 'Não informado'}
                      </div>
                    </td>
                    <td className="p-4 align-middle">
                      <Button
                        onClick={() => handleForceSync(failure.stripe_customer_id, failure.user_id)}
                        disabled={syncing === failure.user_id}
                        variant="outline"
                        size="sm"
                      >
                        {syncing === failure.user_id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <RefreshCw className="h-3 w-3" />
                        )}
                        <span className="ml-1 text-xs">{t.forceSync}</span>
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