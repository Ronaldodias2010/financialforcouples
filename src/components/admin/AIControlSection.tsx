import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, 
  Users, 
  DollarSign, 
  AlertTriangle,
  TrendingUp,
  Settings,
  RefreshCw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/hooks/useLanguage';
import { toast } from 'sonner';

interface UsageData {
  user_id: string;
  user_email: string;
  display_name: string;
  requests_count: number;
  tokens_used: number;
  estimated_cost_brl: number;
  subscription_tier: string;
  last_used: string;
}

interface UsageLimits {
  subscription_tier: string;
  daily_requests_limit: number;
  daily_tokens_limit: number;
  daily_cost_limit_brl: number;
}

interface UsageMetrics {
  totalUsers: number;
  totalRequests: number;
  totalTokens: number;
  totalCost: number;
  premiumUsers: number;
  essentialUsers: number;
}

export const AIControlSection = () => {
  const { language } = useLanguage();
  const [usageData, setUsageData] = useState<UsageData[]>([]);
  const [limits, setLimits] = useState<UsageLimits[]>([]);
  const [metrics, setMetrics] = useState<UsageMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const translations = {
    pt: {
      title: 'Controle de IA',
      overview: 'Visão Geral',
      users: 'Usuários',
      limits: 'Limites',
      totalUsers: 'Total de Usuários',
      totalRequests: 'Requisições Hoje',
      totalTokens: 'Tokens Consumidos',
      dailyCost: 'Custo Diário Estimado',
      premiumUsers: 'Usuários Premium',
      essentialUsers: 'Usuários Essential',
      userEmail: 'Email do Usuário',
      requests: 'Requisições',
      tokens: 'Tokens',
      cost: 'Custo (R$)',
      tier: 'Plano',
      lastUsed: 'Último Uso',
      refresh: 'Atualizar',
      noUsageToday: 'Nenhum uso de IA registrado hoje',
      premium: 'Premium',
      essential: 'Essential',
      limitReached: 'Limite Atingido',
      updateLimits: 'Atualizar Limites',
      requestsLimit: 'Limite de Requisições/dia',
      tokensLimit: 'Limite de Tokens/dia',
      costLimit: 'Limite de Custo/dia (R$)',
      save: 'Salvar',
      limitsSaved: 'Limites atualizados com sucesso!',
      errorLoading: 'Erro ao carregar dados',
      errorSaving: 'Erro ao salvar limites'
    },
    en: {
      title: 'AI Control',
      overview: 'Overview',
      users: 'Users',
      limits: 'Limits',
      totalUsers: 'Total Users',
      totalRequests: 'Requests Today',
      totalTokens: 'Tokens Consumed',
      dailyCost: 'Daily Estimated Cost',
      premiumUsers: 'Premium Users',
      essentialUsers: 'Essential Users',
      userEmail: 'User Email',
      requests: 'Requests',
      tokens: 'Tokens',
      cost: 'Cost (R$)',
      tier: 'Plan',
      lastUsed: 'Last Used',
      refresh: 'Refresh',
      noUsageToday: 'No AI usage recorded today',
      premium: 'Premium',
      essential: 'Essential',
      limitReached: 'Limit Reached',
      updateLimits: 'Update Limits',
      requestsLimit: 'Requests Limit/day',
      tokensLimit: 'Tokens Limit/day',
      costLimit: 'Cost Limit/day (R$)',
      save: 'Save',
      limitsSaved: 'Limits updated successfully!',
      errorLoading: 'Error loading data',
      errorSaving: 'Error saving limits'
    },
    es: {
      title: 'Control de IA',
      overview: 'Resumen',
      users: 'Usuarios',
      limits: 'Límites',
      totalUsers: 'Total de Usuarios',
      totalRequests: 'Solicitudes Hoy',
      totalTokens: 'Tokens Consumidos',
      dailyCost: 'Costo Diario Estimado',
      premiumUsers: 'Usuarios Premium',
      essentialUsers: 'Usuarios Essential',
      userEmail: 'Email del Usuario',
      requests: 'Solicitudes',
      tokens: 'Tokens',
      cost: 'Costo (R$)',
      tier: 'Plan',
      lastUsed: 'Último Uso',
      refresh: 'Actualizar',
      noUsageToday: 'No hay uso de IA registrado hoy',
      premium: 'Premium',
      essential: 'Essential',
      limitReached: 'Límite Alcanzado',
      updateLimits: 'Actualizar Límites',
      requestsLimit: 'Límite de Solicitudes/día',
      tokensLimit: 'Límite de Tokens/día',
      costLimit: 'Límite de Costo/día (R$)',
      save: 'Guardar',
      limitsSaved: '¡Límites actualizados correctamente!',
      errorLoading: 'Error al cargar datos',
      errorSaving: 'Error al guardar límites'
    }
  };

  const text = translations[language as keyof typeof translations] || translations.pt;

  const loadData = async () => {
    try {
      setRefreshing(true);
      
      // Load today's usage data
      const { data: usage, error: usageError } = await supabase
        .from('ai_usage_tracking')
        .select('*')
        .eq('date', new Date().toISOString().split('T')[0])
        .order('tokens_used', { ascending: false });

      if (usageError) throw usageError;

      // Get user profiles and subscriber emails for each user
      let userProfiles: { [key: string]: any } = {};
      let subscriberEmails: { [key: string]: string } = {};
      
      if (usage && usage.length > 0) {
        const userIds = usage.map((item: any) => item.user_id);
        
        // Get profiles
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id, display_name, subscription_tier')
          .in('user_id', userIds);
        
        if (profilesData) {
          userProfiles = profilesData.reduce((acc: any, profile: any) => {
            acc[profile.user_id] = profile;
            return acc;
          }, {});
        }
        
        // Get subscriber emails
        const { data: subscribersData } = await supabase
          .from('subscribers')
          .select('user_id, email')
          .in('user_id', userIds);
        
        if (subscribersData) {
          subscriberEmails = subscribersData.reduce((acc: any, sub: any) => {
            acc[sub.user_id] = sub.email;
            return acc;
          }, {});
        }
      }

      // Load limits
      const { data: limitsData, error: limitsError } = await supabase
        .from('ai_usage_limits')
        .select('*')
        .eq('is_active', true);

      if (limitsError) throw limitsError;

      // Process usage data
      const processedUsage: UsageData[] = (usage || []).map((item: any) => ({
        user_id: item.user_id,
        user_email: subscriberEmails[item.user_id] || 'N/A',
        display_name: userProfiles[item.user_id]?.display_name || 'N/A',
        requests_count: item.requests_count,
        tokens_used: item.tokens_used,
        estimated_cost_brl: item.estimated_cost_brl,
        subscription_tier: userProfiles[item.user_id]?.subscription_tier || 'essential',
        last_used: item.updated_at
      }));

      // Calculate metrics
      const totalRequests = processedUsage.reduce((sum, u) => sum + u.requests_count, 0);
      const totalTokens = processedUsage.reduce((sum, u) => sum + u.tokens_used, 0);
      const totalCost = processedUsage.reduce((sum, u) => sum + Number(u.estimated_cost_brl), 0);
      const premiumUsers = processedUsage.filter(u => u.subscription_tier === 'premium').length;
      const essentialUsers = processedUsage.filter(u => u.subscription_tier === 'essential').length;

      setUsageData(processedUsage);
      setLimits(limitsData || []);
      setMetrics({
        totalUsers: processedUsage.length,
        totalRequests,
        totalTokens,
        totalCost,
        premiumUsers,
        essentialUsers
      });

    } catch (error) {
      console.error('Error loading AI control data:', error);
      toast.error(text.errorLoading);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const updateLimits = async (tierLimits: UsageLimits) => {
    try {
      const { error } = await supabase
        .from('ai_usage_limits')
        .update({
          daily_requests_limit: tierLimits.daily_requests_limit,
          daily_tokens_limit: tierLimits.daily_tokens_limit,
          daily_cost_limit_brl: tierLimits.daily_cost_limit_brl,
          updated_at: new Date().toISOString()
        })
        .eq('subscription_tier', tierLimits.subscription_tier);

      if (error) throw error;

      toast.success(text.limitsSaved);
      await loadData();
    } catch (error) {
      console.error('Error updating limits:', error);
      toast.error(text.errorSaving);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    }).format(value);

  const formatNumber = (value: number) => 
    new Intl.NumberFormat('pt-BR').format(value);

  const getUsagePercentage = (used: number, limit: number) => {
    if (limit === 0) return 0;
    return Math.min((used / limit) * 100, 100);
  };

  const isLimitReached = (used: number, limit: number) => {
    return limit > 0 && used >= limit;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            {text.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <RefreshCw className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Activity className="h-6 w-6" />
          {text.title}
        </h2>
        <Button 
          onClick={loadData} 
          disabled={refreshing}
          variant="outline"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          {text.refresh}
        </Button>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">{text.overview}</TabsTrigger>
          <TabsTrigger value="users">{text.users}</TabsTrigger>
          <TabsTrigger value="limits">{text.limits}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {metrics && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{text.totalUsers}</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatNumber(metrics.totalUsers)}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {metrics.premiumUsers} Premium, {metrics.essentialUsers} Essential
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{text.totalRequests}</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatNumber(metrics.totalRequests)}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {formatNumber(metrics.totalTokens)} tokens
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{text.dailyCost}</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(metrics.totalCost)}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Média: {formatCurrency(metrics.totalCost / Math.max(metrics.totalUsers, 1))} / usuário
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {usageData.length === 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{text.noUsageToday}</AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{text.users} - {text.totalRequests}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {usageData.map((user) => {
                  const userLimits = limits.find(l => l.subscription_tier === user.subscription_tier);
                  return (
                    <div key={user.user_id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <div className="font-medium">{user.display_name}</div>
                          <div className="text-sm text-muted-foreground">{user.user_email}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={user.subscription_tier === 'premium' ? 'default' : 'secondary'}>
                            {user.subscription_tier === 'premium' ? text.premium : text.essential}
                          </Badge>
                          {userLimits && (isLimitReached(user.requests_count, userLimits.daily_requests_limit) ||
                            isLimitReached(user.tokens_used, userLimits.daily_tokens_limit)) && (
                            <Badge variant="destructive">{text.limitReached}</Badge>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <div className="text-sm font-medium">{text.requests}</div>
                          <div className="text-lg">{formatNumber(user.requests_count)}</div>
                          {userLimits && (
                            <Progress 
                              value={getUsagePercentage(user.requests_count, userLimits.daily_requests_limit)}
                              className="mt-1"
                            />
                          )}
                        </div>

                        <div>
                          <div className="text-sm font-medium">{text.tokens}</div>
                          <div className="text-lg">{formatNumber(user.tokens_used)}</div>
                          {userLimits && (
                            <Progress 
                              value={getUsagePercentage(user.tokens_used, userLimits.daily_tokens_limit)}
                              className="mt-1"
                            />
                          )}
                        </div>

                        <div>
                          <div className="text-sm font-medium">{text.cost}</div>
                          <div className="text-lg">{formatCurrency(Number(user.estimated_cost_brl))}</div>
                          {userLimits && (
                            <Progress 
                              value={getUsagePercentage(Number(user.estimated_cost_brl), userLimits.daily_cost_limit_brl)}
                              className="mt-1"
                            />
                          )}
                        </div>
                      </div>

                      <div className="text-xs text-muted-foreground mt-2">
                        {text.lastUsed}: {new Date(user.last_used).toLocaleString('pt-BR')}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="limits" className="space-y-4">
          {limits.map((limit) => (
            <Card key={limit.subscription_tier}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  {text.updateLimits} - {limit.subscription_tier === 'premium' ? text.premium : text.essential}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium">{text.requestsLimit}</label>
                    <input
                      type="number"
                      value={limit.daily_requests_limit}
                      onChange={(e) => {
                        const newLimits = limits.map(l => 
                          l.subscription_tier === limit.subscription_tier 
                            ? { ...l, daily_requests_limit: parseInt(e.target.value) || 0 }
                            : l
                        );
                        setLimits(newLimits);
                      }}
                      className="w-full mt-1 px-3 py-2 border border-border rounded-md"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">{text.tokensLimit}</label>
                    <input
                      type="number"
                      value={limit.daily_tokens_limit}
                      onChange={(e) => {
                        const newLimits = limits.map(l => 
                          l.subscription_tier === limit.subscription_tier 
                            ? { ...l, daily_tokens_limit: parseInt(e.target.value) || 0 }
                            : l
                        );
                        setLimits(newLimits);
                      }}
                      className="w-full mt-1 px-3 py-2 border border-border rounded-md"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">{text.costLimit}</label>
                    <input
                      type="number"
                      step="0.01"
                      value={limit.daily_cost_limit_brl}
                      onChange={(e) => {
                        const newLimits = limits.map(l => 
                          l.subscription_tier === limit.subscription_tier 
                            ? { ...l, daily_cost_limit_brl: parseFloat(e.target.value) || 0 }
                            : l
                        );
                        setLimits(newLimits);
                      }}
                      className="w-full mt-1 px-3 py-2 border border-border rounded-md"
                    />
                  </div>
                </div>

                <Button 
                  onClick={() => updateLimits(limit)}
                  className="mt-4"
                >
                  {text.save}
                </Button>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};