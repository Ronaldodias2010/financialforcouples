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
  RefreshCw,
  Crown,
  Zap,
  Target,
  Award,
  Calendar,
  BarChart3,
  ChevronLeft,
  ChevronRight
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
  topUser?: UsageData;
  avgTokensPerUser: number;
  usersNearLimit: number;
}

interface MonthlyData {
  user_id: string;
  user_email: string;
  display_name: string;
  monthly_requests: number;
  monthly_tokens: number;
  monthly_cost: number;
  subscription_tier: string;
  days_active: number;
}

interface MonthlyMetrics {
  totalUsers: number;
  totalRequests: number;
  totalTokens: number;
  totalCost: number;
  uniqueUsers: number;
  daysWithActivity: number;
  avgDailyRequests: number;
  avgDailyTokens: number;
  avgDailyCost: number;
  topUser?: MonthlyData;
  previousMonthGrowth: {
    requests: number;
    tokens: number;
    cost: number;
    users: number;
  };
}

export const AIControlSection = () => {
  const { language } = useLanguage();
  const [usageData, setUsageData] = useState<UsageData[]>([]);
  const [limits, setLimits] = useState<UsageLimits[]>([]);
  const [metrics, setMetrics] = useState<UsageMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Monthly data states
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [monthlyMetrics, setMonthlyMetrics] = useState<MonthlyMetrics | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1; // getMonth() returns 0-11, so +1 for 1-12
    return `${year}-${String(month).padStart(2, '0')}`;
  });
  const [monthlyLoading, setMonthlyLoading] = useState(false);

  const translations = {
    pt: {
      title: 'Controle da PrIscA',
      overview: 'Visão Geral',
      users: 'Usuários',
      limits: 'Limites',
      monthlyReports: 'Relatórios Mensais',
      totalUsers: 'Total de Usuários',
      totalRequests: 'Requisições Hoje',
      totalTokens: 'Total de Tokens Hoje',
      dailyCost: 'Custo Diário Estimado',
      premiumUsers: 'Usuários Premium',
      essentialUsers: 'Usuários Essential',
      topUser: 'Maior Consumidor Hoje',
      avgTokens: 'Média de Tokens/Usuário',
      usersNearLimit: 'Usuários Próximos do Limite',
      noTopUser: 'Nenhum usuário ativo',
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
      errorSaving: 'Erro ao salvar limites',
      // Monthly translations
      monthlyTokens: 'Tokens do Mês',
      monthlyRequests: 'Requisições do Mês',
      monthlyCost: 'Custo Mensal',
      uniqueUsers: 'Usuários Únicos',
      daysActive: 'Dias com Atividade',
      avgDaily: 'Média Diária',
      topUserMonth: 'Maior Consumidor do Mês',
      previousMonth: 'Mês Anterior',
      currentMonth: 'Mês Atual',
      growth: 'Crescimento',
      decline: 'Queda',
      stable: 'Estável',
      noDataMonth: 'Nenhum dado encontrado para este mês',
      selectMonth: 'Selecionar Mês',
      monthYear: 'Mês/Ano',
      daysActiveInMonth: 'dias ativos'
    },
    en: {
      title: 'PrIscA Control',
      overview: 'Overview',
      users: 'Users',
      limits: 'Limits',
      monthlyReports: 'Monthly Reports',
      totalUsers: 'Total Users',
      totalRequests: 'Requests Today',
      totalTokens: 'Total Tokens Today',
      dailyCost: 'Daily Estimated Cost',
      premiumUsers: 'Premium Users',
      essentialUsers: 'Essential Users',
      topUser: 'Top Consumer Today',
      avgTokens: 'Average Tokens/User',
      usersNearLimit: 'Users Near Limit',
      noTopUser: 'No active user',
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
      errorSaving: 'Error saving limits',
      // Monthly translations
      monthlyTokens: 'Monthly Tokens',
      monthlyRequests: 'Monthly Requests',
      monthlyCost: 'Monthly Cost',
      uniqueUsers: 'Unique Users',
      daysActive: 'Active Days',
      avgDaily: 'Daily Average',
      topUserMonth: 'Top Consumer of Month',
      previousMonth: 'Previous Month',
      currentMonth: 'Current Month',
      growth: 'Growth',
      decline: 'Decline',
      stable: 'Stable',
      noDataMonth: 'No data found for this month',
      selectMonth: 'Select Month',
      monthYear: 'Month/Year',
      daysActiveInMonth: 'active days'
    },
    es: {
      title: 'Control de PrIscA',
      overview: 'Resumen',
      users: 'Usuarios',
      limits: 'Límites',
      monthlyReports: 'Informes Mensuales',
      totalUsers: 'Total de Usuarios',
      totalRequests: 'Solicitudes Hoy',
      totalTokens: 'Total de Tokens Hoy',
      dailyCost: 'Costo Diario Estimado',
      premiumUsers: 'Usuarios Premium',
      essentialUsers: 'Usuarios Essential',
      topUser: 'Mayor Consumidor Hoy',
      avgTokens: 'Promedio Tokens/Usuario',
      usersNearLimit: 'Usuarios Cerca del Límite',
      noTopUser: 'Ningún usuario activo',
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
      errorSaving: 'Error al guardar límites',
      // Monthly translations
      monthlyTokens: 'Tokens del Mes',
      monthlyRequests: 'Solicitudes del Mes',
      monthlyCost: 'Costo Mensual',
      uniqueUsers: 'Usuarios Únicos',
      daysActive: 'Días Activos',
      avgDaily: 'Promedio Diario',
      topUserMonth: 'Mayor Consumidor del Mes',
      previousMonth: 'Mes Anterior',
      currentMonth: 'Mes Actual',
      growth: 'Crecimiento',
      decline: 'Decline',
      stable: 'Estable',
      noDataMonth: 'No se encontraron datos para este mes',
      selectMonth: 'Seleccionar Mes',
      monthYear: 'Mes/Año',
      daysActiveInMonth: 'días activos'
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
      
      // Calculate additional metrics
      const topUser = processedUsage.length > 0 ? processedUsage[0] : undefined;
      const avgTokensPerUser = processedUsage.length > 0 ? Math.round(totalTokens / processedUsage.length) : 0;
      
      // Count users near their limits (>80% of any limit)
      const usersNearLimit = processedUsage.filter(user => {
        const userLimit = (limitsData || []).find(l => l.subscription_tier === user.subscription_tier);
        if (!userLimit) return false;
        
        const requestsPercent = getUsagePercentage(user.requests_count, userLimit.daily_requests_limit);
        const tokensPercent = getUsagePercentage(user.tokens_used, userLimit.daily_tokens_limit);
        const costPercent = getUsagePercentage(Number(user.estimated_cost_brl), userLimit.daily_cost_limit_brl);
        
        return requestsPercent > 80 || tokensPercent > 80 || costPercent > 80;
      }).length;

      setUsageData(processedUsage);
      setLimits(limitsData || []);
      setMetrics({
        totalUsers: processedUsage.length,
        totalRequests,
        totalTokens,
        totalCost,
        premiumUsers,
        essentialUsers,
        topUser,
        avgTokensPerUser,
        usersNearLimit
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

  const loadMonthlyData = async (monthYear: string) => {
    try {
      setMonthlyLoading(true);
      
      // Parse year and month
      const [year, month] = monthYear.split('-');
      const startDate = `${year}-${month.padStart(2, '0')}-01`;
      const endDate = new Date(parseInt(year), parseInt(month), 0).toISOString().split('T')[0];
      
      // Get monthly data aggregated by user
      const { data: monthlyUsage, error: monthlyError } = await supabase
        .from('ai_usage_tracking')
        .select('user_id, requests_count, tokens_used, estimated_cost_brl, date')
        .gte('date', startDate)
        .lte('date', endDate);

      if (monthlyError) throw monthlyError;

      // Get previous month data for comparison
      const prevMonth = new Date(parseInt(year), parseInt(month) - 1, 1);
      const prevStartDate = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}-01`;
      const prevEndDate = new Date(prevMonth.getFullYear(), prevMonth.getMonth() + 1, 0).toISOString().split('T')[0];
      
      const { data: prevMonthUsage } = await supabase
        .from('ai_usage_tracking')
        .select('requests_count, tokens_used, estimated_cost_brl, user_id')
        .gte('date', prevStartDate)
        .lte('date', prevEndDate);

      // Aggregate data by user
      const userAggregates: { [key: string]: any } = {};
      const activeDays = new Set<string>();
      
      (monthlyUsage || []).forEach((item: any) => {
        activeDays.add(item.date);
        if (!userAggregates[item.user_id]) {
          userAggregates[item.user_id] = {
            user_id: item.user_id,
            monthly_requests: 0,
            monthly_tokens: 0,
            monthly_cost: 0,
            days_active: new Set()
          };
        }
        userAggregates[item.user_id].monthly_requests += item.requests_count;
        userAggregates[item.user_id].monthly_tokens += item.tokens_used;
        userAggregates[item.user_id].monthly_cost += Number(item.estimated_cost_brl);
        userAggregates[item.user_id].days_active.add(item.date);
      });

      // Get user profiles
      const userIds = Object.keys(userAggregates);
      let userProfiles: { [key: string]: any } = {};
      let subscriberEmails: { [key: string]: string } = {};
      
      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id, display_name, subscription_tier')
          .in('user_id', userIds);
        
        const { data: subscribersData } = await supabase
          .from('subscribers')
          .select('user_id, email')
          .in('user_id', userIds);
        
        if (profilesData) {
          userProfiles = profilesData.reduce((acc: any, profile: any) => {
            acc[profile.user_id] = profile;
            return acc;
          }, {});
        }
        
        if (subscribersData) {
          subscriberEmails = subscribersData.reduce((acc: any, sub: any) => {
            acc[sub.user_id] = sub.email;
            return acc;
          }, {});
        }
      }

      // Process monthly data
      const processedMonthlyData: MonthlyData[] = Object.values(userAggregates).map((user: any) => ({
        user_id: user.user_id,
        user_email: subscriberEmails[user.user_id] || 'N/A',
        display_name: userProfiles[user.user_id]?.display_name || 'N/A',
        monthly_requests: user.monthly_requests,
        monthly_tokens: user.monthly_tokens,
        monthly_cost: user.monthly_cost,
        subscription_tier: userProfiles[user.user_id]?.subscription_tier || 'essential',
        days_active: user.days_active.size
      })).sort((a, b) => b.monthly_tokens - a.monthly_tokens);

      // Calculate metrics
      const totalRequests = processedMonthlyData.reduce((sum, u) => sum + u.monthly_requests, 0);
      const totalTokens = processedMonthlyData.reduce((sum, u) => sum + u.monthly_tokens, 0);
      const totalCost = processedMonthlyData.reduce((sum, u) => sum + u.monthly_cost, 0);
      const daysWithActivity = activeDays.size;
      
      // Calculate previous month totals for comparison
      const prevTotalRequests = (prevMonthUsage || []).reduce((sum: number, item: any) => sum + item.requests_count, 0);
      const prevTotalTokens = (prevMonthUsage || []).reduce((sum: number, item: any) => sum + item.tokens_used, 0);
      const prevTotalCost = (prevMonthUsage || []).reduce((sum: number, item: any) => sum + Number(item.estimated_cost_brl), 0);
      const prevUniqueUsers = new Set((prevMonthUsage || []).map((item: any) => item.user_id)).size;

      const monthlyMetrics: MonthlyMetrics = {
        totalUsers: processedMonthlyData.length,
        totalRequests,
        totalTokens,
        totalCost,
        uniqueUsers: processedMonthlyData.length,
        daysWithActivity,
        avgDailyRequests: daysWithActivity > 0 ? totalRequests / daysWithActivity : 0,
        avgDailyTokens: daysWithActivity > 0 ? totalTokens / daysWithActivity : 0,
        avgDailyCost: daysWithActivity > 0 ? totalCost / daysWithActivity : 0,
        topUser: processedMonthlyData.length > 0 ? processedMonthlyData[0] : undefined,
        previousMonthGrowth: {
          requests: prevTotalRequests > 0 ? ((totalRequests - prevTotalRequests) / prevTotalRequests) * 100 : 0,
          tokens: prevTotalTokens > 0 ? ((totalTokens - prevTotalTokens) / prevTotalTokens) * 100 : 0,
          cost: prevTotalCost > 0 ? ((totalCost - prevTotalCost) / prevTotalCost) * 100 : 0,
          users: prevUniqueUsers > 0 ? ((processedMonthlyData.length - prevUniqueUsers) / prevUniqueUsers) * 100 : 0
        }
      };

      setMonthlyData(processedMonthlyData);
      setMonthlyMetrics(monthlyMetrics);

    } catch (error) {
      console.error('Error loading monthly data:', error);
      toast.error(text.errorLoading);
    } finally {
      setMonthlyLoading(false);
    }
  };

  const handleMonthChange = (direction: 'prev' | 'next') => {
    const [year, month] = selectedMonth.split('-').map(Number);
    let newDate;
    
    if (direction === 'prev') {
      newDate = new Date(year, month - 2, 1); // month - 2 porque month é 1-based e Date precisa 0-based
    } else {
      newDate = new Date(year, month, 1); // month + 0 para próximo mês
    }
    
    const newMonth = `${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonth(newMonth);
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadMonthlyData(selectedMonth);
  }, [selectedMonth]);

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
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">{text.overview}</TabsTrigger>
          <TabsTrigger value="users">{text.users}</TabsTrigger>
          <TabsTrigger value="monthly">{text.monthlyReports}</TabsTrigger>
          <TabsTrigger value="limits">{text.limits}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Cards principais em destaque */}
          {metrics && (
            <>
              {/* Card dedicado para Total de Tokens */}
              <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-lg font-bold text-primary flex items-center justify-center gap-2">
                    <Zap className="h-6 w-6" />
                    {text.totalTokens}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="text-4xl font-bold text-primary mb-2">
                    {formatNumber(metrics.totalTokens)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Consumidos por {metrics.totalUsers} usuários hoje
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Média: {formatNumber(metrics.avgTokensPerUser)} tokens/usuário
                  </div>
                </CardContent>
              </Card>

              {/* Cards de métricas principais */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                      {formatNumber(metrics.avgTokensPerUser)} tokens/usuário
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

                <Card className={metrics.usersNearLimit > 0 ? "border-destructive/50 bg-destructive/5" : ""}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{text.usersNearLimit}</CardTitle>
                    <AlertTriangle className={`h-4 w-4 ${metrics.usersNearLimit > 0 ? 'text-destructive' : 'text-muted-foreground'}`} />
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${metrics.usersNearLimit > 0 ? 'text-destructive' : ''}`}>
                      {formatNumber(metrics.usersNearLimit)}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Acima de 80% do limite
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Card do usuário que mais consumiu */}
              {metrics.topUser && (
                <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-amber-700">
                      <Award className="h-5 w-5" />
                      {text.topUser}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="font-semibold text-lg">{metrics.topUser.display_name}</div>
                        <div className="text-sm text-muted-foreground">{metrics.topUser.user_email}</div>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant={metrics.topUser.subscription_tier === 'premium' ? 'default' : 'secondary'}>
                            {metrics.topUser.subscription_tier === 'premium' ? 'Premium' : 'Essential'}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right space-y-2">
                        <div className="text-3xl font-bold text-amber-700">
                          {formatNumber(metrics.topUser.tokens_used)}
                        </div>
                        <div className="text-sm text-muted-foreground">tokens utilizados</div>
                        <div className="text-sm">
                          {formatNumber(metrics.topUser.requests_count)} requisições • {formatCurrency(Number(metrics.topUser.estimated_cost_brl))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {/* Alerta se não houver uso */}
          {usageData.length === 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{text.noUsageToday}</AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          {/* Resumo rápido */}
          {metrics && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-blue-700">{formatNumber(metrics.totalUsers)}</div>
                      <div className="text-sm text-blue-600">Usuários Ativos</div>
                    </div>
                    <Users className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-green-200 bg-green-50">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-green-700">{formatNumber(metrics.avgTokensPerUser)}</div>
                      <div className="text-sm text-green-600">Tokens/Usuário</div>
                    </div>
                    <Target className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-purple-200 bg-purple-50">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-purple-700">{formatCurrency(metrics.totalCost)}</div>
                      <div className="text-sm text-purple-600">Custo Total</div>
                    </div>
                    <DollarSign className="h-8 w-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {text.users} - Detalhamento de Uso
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {usageData.map((user) => {
                  const userLimits = limits.find(l => l.subscription_tier === user.subscription_tier);
                  const isNearLimit = userLimits && (
                    getUsagePercentage(user.requests_count, userLimits.daily_requests_limit) > 80 ||
                    getUsagePercentage(user.tokens_used, userLimits.daily_tokens_limit) > 80 ||
                    getUsagePercentage(Number(user.estimated_cost_brl), userLimits.daily_cost_limit_brl) > 80
                  );
                  
                  return (
                    <div key={user.user_id} className={`border rounded-lg p-4 transition-all ${
                      isNearLimit ? 'border-destructive/50 bg-destructive/5' : 'hover:shadow-md'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <div className="font-medium">{user.display_name}</div>
                          <div className="text-sm text-muted-foreground">{user.user_email}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={user.subscription_tier === 'premium' ? 'default' : 'secondary'}>
                            {user.subscription_tier === 'premium' ? (
                              <><Crown className="h-3 w-3 mr-1" />{text.premium}</>
                            ) : (
                              text.essential
                            )}
                          </Badge>
                          {userLimits && (isLimitReached(user.requests_count, userLimits.daily_requests_limit) ||
                            isLimitReached(user.tokens_used, userLimits.daily_tokens_limit)) && (
                            <Badge variant="destructive">{text.limitReached}</Badge>
                          )}
                          {isNearLimit && (
                            <Badge variant="outline" className="border-amber-500 text-amber-600">
                              Próximo do Limite
                            </Badge>
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

        <TabsContent value="monthly" className="space-y-6">
          {/* Month Navigation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  {text.monthlyReports}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleMonthChange('prev')}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-medium px-3">
                    {(() => {
                      const [year, month] = selectedMonth.split('-').map(Number);
                      const date = new Date(year, month - 1, 1); // month - 1 porque Date usa 0-based months
                      return date.toLocaleDateString(language === 'pt' ? 'pt-BR' : language === 'en' ? 'en-US' : 'es-ES', { 
                        year: 'numeric', 
                        month: 'long' 
                      });
                    })()}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleMonthChange('next')}
                    disabled={(() => {
                      const now = new Date();
                      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
                      return selectedMonth >= currentMonth;
                    })()}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
          </Card>

          {monthlyLoading ? (
            <Card>
              <CardContent className="flex items-center justify-center h-32">
                <RefreshCw className="h-6 w-6 animate-spin" />
              </CardContent>
            </Card>
          ) : monthlyMetrics ? (
            <>
              {/* Monthly Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-blue-100">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-blue-700">{text.monthlyTokens}</CardTitle>
                    <Zap className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-800">{formatNumber(monthlyMetrics.totalTokens)}</div>
                    <div className="text-xs text-blue-600 mt-1">
                      {text.avgDaily}: {formatNumber(Math.round(monthlyMetrics.avgDailyTokens))}
                    </div>
                    <div className="text-xs text-blue-500 mt-1">
                      {monthlyMetrics.previousMonthGrowth.tokens > 0 ? '↗' : monthlyMetrics.previousMonthGrowth.tokens < 0 ? '↘' : '→'} 
                      {Math.abs(monthlyMetrics.previousMonthGrowth.tokens).toFixed(1)}% vs {text.previousMonth}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-green-200 bg-gradient-to-r from-green-50 to-green-100">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-green-700">{text.monthlyRequests}</CardTitle>
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-800">{formatNumber(monthlyMetrics.totalRequests)}</div>
                    <div className="text-xs text-green-600 mt-1">
                      {text.avgDaily}: {formatNumber(Math.round(monthlyMetrics.avgDailyRequests))}
                    </div>
                    <div className="text-xs text-green-500 mt-1">
                      {monthlyMetrics.previousMonthGrowth.requests > 0 ? '↗' : monthlyMetrics.previousMonthGrowth.requests < 0 ? '↘' : '→'} 
                      {Math.abs(monthlyMetrics.previousMonthGrowth.requests).toFixed(1)}% vs {text.previousMonth}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-purple-100">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-purple-700">{text.monthlyCost}</CardTitle>
                    <DollarSign className="h-4 w-4 text-purple-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-purple-800">{formatCurrency(monthlyMetrics.totalCost)}</div>
                    <div className="text-xs text-purple-600 mt-1">
                      {text.avgDaily}: {formatCurrency(monthlyMetrics.avgDailyCost)}
                    </div>
                    <div className="text-xs text-purple-500 mt-1">
                      {monthlyMetrics.previousMonthGrowth.cost > 0 ? '↗' : monthlyMetrics.previousMonthGrowth.cost < 0 ? '↘' : '→'} 
                      {Math.abs(monthlyMetrics.previousMonthGrowth.cost).toFixed(1)}% vs {text.previousMonth}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-amber-100">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-amber-700">{text.uniqueUsers}</CardTitle>
                    <Users className="h-4 w-4 text-amber-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-amber-800">{formatNumber(monthlyMetrics.uniqueUsers)}</div>
                    <div className="text-xs text-amber-600 mt-1">
                      {monthlyMetrics.daysWithActivity} {text.daysActiveInMonth}
                    </div>
                    <div className="text-xs text-amber-500 mt-1">
                      {monthlyMetrics.previousMonthGrowth.users > 0 ? '↗' : monthlyMetrics.previousMonthGrowth.users < 0 ? '↘' : '→'} 
                      {Math.abs(monthlyMetrics.previousMonthGrowth.users).toFixed(1)}% vs {text.previousMonth}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Top User of the Month */}
              {monthlyMetrics.topUser && (
                <Card className="border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-emerald-700">
                      <Award className="h-5 w-5" />
                      {text.topUserMonth}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="font-semibold text-lg">{monthlyMetrics.topUser.display_name}</div>
                        <div className="text-sm text-muted-foreground">{monthlyMetrics.topUser.user_email}</div>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant={monthlyMetrics.topUser.subscription_tier === 'premium' ? 'default' : 'secondary'}>
                            {monthlyMetrics.topUser.subscription_tier === 'premium' ? 'Premium' : 'Essential'}
                          </Badge>
                          <Badge variant="outline" className="text-emerald-600 border-emerald-600">
                            {monthlyMetrics.topUser.days_active} {text.daysActiveInMonth}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right space-y-2">
                        <div className="text-3xl font-bold text-emerald-700">
                          {formatNumber(monthlyMetrics.topUser.monthly_tokens)}
                        </div>
                        <div className="text-sm text-muted-foreground">tokens no mês</div>
                        <div className="text-sm">
                          {formatNumber(monthlyMetrics.topUser.monthly_requests)} requisições • {formatCurrency(monthlyMetrics.topUser.monthly_cost)}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Monthly Users List */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Usuários do Mês - Ranking por Tokens
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {monthlyData.map((user, index) => (
                      <div key={user.user_id} className="border rounded-lg p-4 hover:shadow-md transition-all">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                              #{index + 1}
                            </div>
                            <div>
                              <div className="font-medium">{user.display_name}</div>
                              <div className="text-sm text-muted-foreground">{user.user_email}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={user.subscription_tier === 'premium' ? 'default' : 'secondary'}>
                              {user.subscription_tier === 'premium' ? (
                                <><Crown className="h-3 w-3 mr-1" />{text.premium}</>
                              ) : (
                                text.essential
                              )}
                            </Badge>
                            <Badge variant="outline">
                              {user.days_active} {text.daysActiveInMonth}
                            </Badge>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="text-center">
                            <div className="text-sm font-medium text-muted-foreground">{text.requests}</div>
                            <div className="text-xl font-bold text-green-600">{formatNumber(user.monthly_requests)}</div>
                            <div className="text-xs text-muted-foreground">
                              ~{formatNumber(Math.round(user.monthly_requests / user.days_active))} por dia ativo
                            </div>
                          </div>

                          <div className="text-center">
                            <div className="text-sm font-medium text-muted-foreground">{text.tokens}</div>
                            <div className="text-xl font-bold text-blue-600">{formatNumber(user.monthly_tokens)}</div>
                            <div className="text-xs text-muted-foreground">
                              ~{formatNumber(Math.round(user.monthly_tokens / user.days_active))} por dia ativo
                            </div>
                          </div>

                          <div className="text-center">
                            <div className="text-sm font-medium text-muted-foreground">{text.cost}</div>
                            <div className="text-xl font-bold text-purple-600">{formatCurrency(user.monthly_cost)}</div>
                            <div className="text-xs text-muted-foreground">
                              ~{formatCurrency(user.monthly_cost / user.days_active)} por dia ativo
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{text.noDataMonth}</AlertDescription>
            </Alert>
          )}
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
                            ? { ...l, daily_requests_limit: parseInt(e.target.value) }
                            : l
                        );
                        setLimits(newLimits);
                      }}
                      className="w-full mt-1 px-3 py-2 border rounded-md"
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
                            ? { ...l, daily_tokens_limit: parseInt(e.target.value) }
                            : l
                        );
                        setLimits(newLimits);
                      }}
                      className="w-full mt-1 px-3 py-2 border rounded-md"
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
                            ? { ...l, daily_cost_limit_brl: parseFloat(e.target.value) }
                            : l
                        );
                        setLimits(newLimits);
                      }}
                      className="w-full mt-1 px-3 py-2 border rounded-md"
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