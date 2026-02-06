import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Play, 
  RefreshCw, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Plane,
  Database,
  Users,
  Trash2
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PromotionCard } from './PromotionCard';

interface ScrapingJob {
  id: string;
  started_at: string;
  completed_at: string | null;
  status: string;
  pages_scraped: number;
  promotions_found: number;
  errors: unknown;
}

interface PromotionStats {
  total_promotions: number;
  active_promotions: number;
  expired_promotions: number;
  recent_promotions: number;
  total_suggestions: number;
  users_with_suggestions: number;
}

interface Promotion {
  id: string;
  programa: string;
  origem: string | null;
  destino: string;
  milhas_min: number;
  titulo: string | null;
  link: string | null;
  data_coleta: string;
  is_active: boolean;
}

export function ScraperControlSection() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isRunningScaper, setIsRunningScaper] = useState(false);
  const [isRunningMatch, setIsRunningMatch] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const [recentJobs, setRecentJobs] = useState<ScrapingJob[]>([]);
  const [stats, setStats] = useState<PromotionStats | null>(null);
  const [promotions, setPromotions] = useState<Promotion[]>([]);

  const fetchData = async () => {
    try {
      setIsLoading(true);

      // Fetch recent scraping jobs
      const { data: jobs, error: jobsError } = await supabase
        .from('scraping_jobs')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(5);

      if (jobsError) throw jobsError;
      setRecentJobs(jobs || []);

      // Fetch active promotions for cards
      const { data: promoData, error: promoError } = await supabase
        .from('scraped_promotions')
        .select('id, programa, origem, destino, milhas_min, titulo, link, data_coleta, is_active')
        .eq('is_active', true)
        .order('data_coleta', { ascending: false })
        .limit(12);

      if (promoError) throw promoError;
      setPromotions(promoData || []);

      // Fetch promotion stats
      const { count: totalPromos } = await supabase
        .from('scraped_promotions')
        .select('*', { count: 'exact', head: true });

      const { count: activePromos } = await supabase
        .from('scraped_promotions')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      const { count: expiredPromos } = await supabase
        .from('scraped_promotions')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', false);

      // Get promotions from last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const { count: recentPromos } = await supabase
        .from('scraped_promotions')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)
        .gte('data_coleta', sevenDaysAgo.toISOString());

      const { count: totalSuggestions } = await supabase
        .from('user_travel_suggestions')
        .select('*', { count: 'exact', head: true });

      // Count distinct users with suggestions
      const { data: usersData } = await supabase
        .from('user_travel_suggestions')
        .select('user_id')
        .limit(1000);

      const uniqueUsers = new Set(usersData?.map(u => u.user_id) || []).size;

      setStats({
        total_promotions: totalPromos || 0,
        active_promotions: activePromos || 0,
        expired_promotions: expiredPromos || 0,
        recent_promotions: recentPromos || 0,
        total_suggestions: totalSuggestions || 0,
        users_with_suggestions: uniqueUsers
      });
    } catch (error) {
      console.error('Error fetching scraper data:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os dados do scraper',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const cleanInvalidData = async () => {
    try {
      setIsCleaning(true);
      toast({
        title: 'Limpando dados',
        description: 'Removendo registros inválidos...',
      });

      // Delete invalid promotions via edge function
      const { data, error } = await supabase.functions.invoke('import-pdp-deals', {
        body: { action: 'clean' }
      });

      if (error) throw error;

      toast({
        title: 'Limpeza Concluída',
        description: data?.message || 'Dados inválidos removidos com sucesso',
      });

      await fetchData();
    } catch (error) {
      console.error('Error cleaning data:', error);
      toast({
        title: 'Erro na Limpeza',
        description: 'Não foi possível limpar os dados',
        variant: 'destructive'
      });
    } finally {
      setIsCleaning(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const runScraper = async () => {
    try {
      setIsRunningScaper(true);
      toast({
        title: 'Iniciando Scraper',
        description: 'Conectando ao scraper Python local via ngrok...',
      });

      // Call the import-pdp-deals function to fetch from ngrok scraper
      const ngrokUrl = 'https://unbefriended-unprecisive-selah.ngrok-free.dev/deals';
      
      const { data, error } = await supabase.functions.invoke('import-pdp-deals', {
        body: { ngrok_url: ngrokUrl }
      });

      if (error) throw error;

      const inserted = data?.inserted || 0;
      const skipped = data?.skipped || 0;
      
      toast({
        title: 'Scraper Concluído',
        description: inserted > 0 
          ? `${inserted} novas promoções importadas${skipped > 0 ? `, ${skipped} já existiam` : ''}`
          : 'Nenhuma promoção nova encontrada (todas já existem)',
      });

      // Refresh data
      await fetchData();
    } catch (error) {
      console.error('Error running scraper:', error);
      toast({
        title: 'Erro no Scraper',
        description: 'Não foi possível conectar ao scraper local. Verifique se o Python está rodando e o ngrok está ativo.',
        variant: 'destructive'
      });
    } finally {
      setIsRunningScaper(false);
    }
  };

  const runMatch = async () => {
    try {
      setIsRunningMatch(true);
      toast({
        title: 'Iniciando Match',
        description: 'Cruzando promoções com usuários...',
      });

      const { data, error } = await supabase.functions.invoke('match-user-promotions', {
        body: { manual: true }
      });

      if (error) throw error;

      toast({
        title: 'Match Concluído',
        description: `Usuários: ${data.users_processed}, Sugestões: ${data.suggestions_created}`,
      });

      // Refresh data
      await fetchData();
    } catch (error) {
      console.error('Error running match:', error);
      toast({
        title: 'Erro no Match',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive'
      });
    } finally {
      setIsRunningMatch(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default"><CheckCircle className="w-3 h-3 mr-1" />Concluído</Badge>;
      case 'running':
        return <Badge variant="secondary"><RefreshCw className="w-3 h-3 mr-1 animate-spin" />Executando</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Falhou</Badge>;
      default:
        return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" />Pendente</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plane className="h-5 w-5" />
            Controle do Scraper de Promoções
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plane className="h-5 w-5 text-primary" />
          Controle do Scraper de Promoções
        </CardTitle>
        <CardDescription>
          Gerencie a coleta automática de promoções de milhas. Execução agendada: 14h diariamente.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-muted/50 rounded-lg p-4 text-center">
              <Database className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
              <p className="text-2xl font-bold">{stats.total_promotions}</p>
              <p className="text-sm text-muted-foreground">Total Promoções</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 text-center border border-primary/20">
              <CheckCircle className="w-6 h-6 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold text-primary">{stats.active_promotions}</p>
              <p className="text-sm text-muted-foreground">Ativas</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 text-center">
              <XCircle className="w-6 h-6 mx-auto mb-2 text-destructive" />
              <p className="text-2xl font-bold text-destructive">{stats.expired_promotions}</p>
              <p className="text-sm text-muted-foreground">Vencidas</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 text-center">
              <Clock className="w-6 h-6 mx-auto mb-2 text-accent-foreground" />
              <p className="text-2xl font-bold">{stats.recent_promotions}</p>
              <p className="text-sm text-muted-foreground">Últimos 7 dias</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 text-center">
              <Plane className="w-6 h-6 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">{stats.total_suggestions}</p>
              <p className="text-sm text-muted-foreground">Sugestões</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 text-center">
              <Users className="w-6 h-6 mx-auto mb-2 text-secondary-foreground" />
              <p className="text-2xl font-bold">{stats.users_with_suggestions}</p>
              <p className="text-sm text-muted-foreground">Usuários Impactados</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <Button 
            onClick={runScraper} 
            disabled={isRunningScaper || isRunningMatch}
            className="flex-1 md:flex-none"
          >
            {isRunningScaper ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Executando Scraper...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Executar Scraper Agora
              </>
            )}
          </Button>
          
          <Button 
            variant="secondary"
            onClick={runMatch} 
            disabled={isRunningScaper || isRunningMatch}
            className="flex-1 md:flex-none"
          >
            {isRunningMatch ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Executando Match...
              </>
            ) : (
              <>
                <Users className="w-4 h-4 mr-2" />
                Executar Match de Usuários
              </>
            )}
          </Button>

          <Button 
            variant="outline" 
            onClick={fetchData}
            className="flex-1 md:flex-none"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar Dados
          </Button>

          <Button 
            variant="outline" 
            onClick={cleanInvalidData}
            disabled={isCleaning}
            className="flex-1 md:flex-none text-destructive hover:text-destructive"
          >
            {isCleaning ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Limpando...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                Limpar Inválidos
              </>
            )}
          </Button>
        </div>

        {/* Promotions Cards */}
        <div>
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <Plane className="w-4 h-4" />
            Promoções Ativas ({promotions.length})
          </h4>
          
          {promotions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="w-8 h-8 mx-auto mb-2" />
              <p>Nenhuma promoção ativa encontrada</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {promotions.map(promo => (
                <PromotionCard key={promo.id} promotion={promo} />
              ))}
            </div>
          )}
        </div>

        {/* Recent Jobs */}
        <div>
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Execuções Recentes
          </h4>
          
          {recentJobs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="w-8 h-8 mx-auto mb-2" />
              <p>Nenhuma execução registrada ainda</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentJobs.map(job => (
                <div 
                  key={job.id} 
                  className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {getStatusBadge(job.status)}
                    <div>
                      <p className="text-sm font-medium">
                        {format(new Date(job.started_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(job.started_at), { 
                          addSuffix: true, 
                          locale: ptBR 
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    <p>{job.pages_scraped} páginas</p>
                    <p className="text-muted-foreground">{job.promotions_found} promoções</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
