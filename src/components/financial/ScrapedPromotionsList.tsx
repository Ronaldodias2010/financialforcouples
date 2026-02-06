import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, Plane, MapPin, RefreshCw, Gift, TrendingDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/useLanguage';
import { formatDistanceToNow } from 'date-fns';
import { ptBR, enUS, es } from 'date-fns/locale';

interface ScrapedPromotion {
  id: string;
  programa: string;
  origem: string | null;
  destino: string;
  milhas_min: number;
  link: string;
  titulo: string | null;
  descricao: string | null;
  data_coleta: string;
  fonte: string;
  is_active: boolean;
  created_at: string;
}

interface ScrapedPromotionsListProps {
  userTotalMiles?: number;
}

export const ScrapedPromotionsList = ({ userTotalMiles = 0 }: ScrapedPromotionsListProps) => {
  const { t, language } = useLanguage();
  const [promotions, setPromotions] = useState<ScrapedPromotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadPromotions();
  }, []);

  const loadPromotions = async () => {
    try {
      const { data, error } = await supabase
        .from('scraped_promotions')
        .select('*')
        .eq('is_active', true)
        .order('milhas_min', { ascending: true })
        .limit(20);

      if (error) throw error;
      setPromotions(data || []);
    } catch (error) {
      console.error('Error loading scraped promotions:', error);
    } finally {
      setLoading(false);
    }
  };

  const runScraper = async () => {
    setRefreshing(true);
    try {
      const { data, error } = await supabase.functions.invoke('firecrawl-promotions-scraper', {
        body: { demo: true }
      });

      if (error) throw error;

      toast({
        title: "Scraper executado",
        description: `${data.promotions_found} promoções encontradas`,
      });

      // Reload promotions
      await loadPromotions();
    } catch (error) {
      console.error('Error running scraper:', error);
      toast({
        title: "Erro",
        description: "Não foi possível executar o scraper",
        variant: "destructive"
      });
    } finally {
      setRefreshing(false);
    }
  };

  const getProgramColor = (programa: string) => {
    const colors: Record<string, string> = {
      'Smiles': 'bg-orange-500/10 text-orange-700 border-orange-200 dark:text-orange-400',
      'LATAM Pass': 'bg-red-500/10 text-red-700 border-red-200 dark:text-red-400',
      'TudoAzul': 'bg-blue-500/10 text-blue-700 border-blue-200 dark:text-blue-400',
      'Livelo': 'bg-purple-500/10 text-purple-700 border-purple-200 dark:text-purple-400',
      'Diversos': 'bg-gray-500/10 text-gray-700 border-gray-200 dark:text-gray-400',
    };
    return colors[programa] || colors['Diversos'];
  };

  const getSourceBadge = (fonte: string) => {
    if (fonte === 'passageirodeprimeira') {
      return (
        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 border-emerald-200 dark:text-emerald-400 text-[10px] px-1.5">
          PdP
        </Badge>
      );
    }
    return null;
  };

  const canRedeem = (milhas: number) => userTotalMiles >= milhas;

  const formatMiles = (miles: number) => {
    return new Intl.NumberFormat('pt-BR').format(miles);
  };

  const getLocale = () => {
    if (language === 'pt') return ptBR;
    if (language === 'es') return es;
    return enUS;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-primary" />
            Promoções de Milhas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse">
                <div className="h-40 bg-muted rounded-lg"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (promotions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-primary" />
              Promoções de Milhas
            </CardTitle>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={runScraper}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Buscar Promoções
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Plane className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p>Nenhuma promoção encontrada.</p>
            <p className="text-sm mt-2">Clique em "Buscar Promoções" para atualizar.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-primary" />
              Promoções de Milhas
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {promotions.length} promoções disponíveis
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={runScraper}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {promotions.map((promo) => (
            <Card 
              key={promo.id} 
              className={`relative overflow-hidden transition-all hover:shadow-lg ${
                canRedeem(promo.milhas_min) 
                  ? 'border-green-300 bg-green-50/30 dark:border-green-800 dark:bg-green-950/20' 
                  : ''
              }`}
            >
              {/* Program badge */}
              <div className="absolute top-3 right-3">
                <Badge 
                  variant="outline" 
                  className={getProgramColor(promo.programa)}
                >
                  {promo.programa}
                </Badge>
              </div>

              <CardContent className="pt-4 pb-4">
                {/* Title with source badge */}
                <div className="flex items-start gap-2 mb-3">
                  <h3 className="font-semibold text-sm line-clamp-2 pr-16 flex-1">
                    {promo.titulo || `${promo.programa} - ${promo.destino}`}
                  </h3>
                  {getSourceBadge(promo.fonte)}
                </div>

                {/* Route */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                  <MapPin className="h-4 w-4" />
                  <span>
                    {promo.origem && promo.origem !== 'Brasil' 
                      ? `${promo.origem} → ${promo.destino}`
                      : promo.destino
                    }
                  </span>
                </div>

                {/* Miles required */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-primary" />
                    <span className="font-bold text-lg">
                      {formatMiles(promo.milhas_min)}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      milhas
                    </span>
                  </div>
                  {canRedeem(promo.milhas_min) && (
                    <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300 text-xs">
                      Você pode!
                    </Badge>
                  )}
                </div>

                {/* Description */}
                {promo.descricao && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                    {promo.descricao}
                  </p>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(promo.created_at), { 
                      addSuffix: true, 
                      locale: getLocale() 
                    })}
                  </span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 px-2"
                    asChild
                  >
                    <a href={promo.link} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Ver
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
