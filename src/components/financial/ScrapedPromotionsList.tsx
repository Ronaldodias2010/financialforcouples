import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, Plane, MapPin, Gift, TrendingDown, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/useLanguage';
import { useAuth } from '@/hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';
import { ptBR, enUS, es } from 'date-fns/locale';
import { FeaturedPromotionCard } from './FeaturedPromotionCard';
import { findMatchingPromotions, type PromotionMatch } from '@/utils/promotionMatcher';

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

interface MileageGoal {
  id: string;
  name: string;
  description: string | null;
  target_miles: number;
  current_miles: number;
  is_completed: boolean;
}

interface ScrapedPromotionsListProps {
  userTotalMiles?: number;
  mileageGoals?: MileageGoal[];
}

export const ScrapedPromotionsList = ({ userTotalMiles = 0, mileageGoals = [] }: ScrapedPromotionsListProps) => {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const [promotions, setPromotions] = useState<ScrapedPromotion[]>([]);
  const [goals, setGoals] = useState<MileageGoal[]>(mileageGoals);
  const [loading, setLoading] = useState(true);
  const [matchedPromotions, setMatchedPromotions] = useState<PromotionMatch[]>([]);
  const [dismissedPromotions, setDismissedPromotions] = useState<Set<string>>(() => {
    // Load dismissed promotions from localStorage
    // Format: "promotionId" or "goalId:destination" for destination-based dismissal
    try {
      const stored = localStorage.getItem('dismissedFeaturedPromotions');
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

  // Load goals if not provided via props
  useEffect(() => {
    if (mileageGoals.length === 0 && user?.id) {
      loadUserGoals();
    } else {
      setGoals(mileageGoals);
    }
  }, [mileageGoals, user?.id]);

  // Match promotions with goals when both are loaded
  useEffect(() => {
    if (promotions.length > 0 && goals.length > 0) {
      const activeGoals = goals.filter(g => !g.is_completed);
      const matches = findMatchingPromotions(promotions, activeGoals);
      setMatchedPromotions(matches);
    }
  }, [promotions, goals]);

  useEffect(() => {
    loadPromotions();
  }, []);

  const loadUserGoals = async () => {
    if (!user?.id) return;
    
    const { data, error } = await supabase
      .from('mileage_goals')
      .select('id, name, description, target_miles, current_miles, is_completed')
      .eq('user_id', user.id)
      .eq('is_completed', false);

    if (!error && data) {
      setGoals(data);
    }
  };

  const loadPromotions = async () => {
    try {
      // Calculate 21 days ago for expiration filter
      const twentyOneDaysAgo = new Date();
      twentyOneDaysAgo.setDate(twentyOneDaysAgo.getDate() - 21);
      
      const { data, error } = await supabase
        .from('scraped_promotions')
        .select('*')
        .eq('is_active', true)
        .gte('created_at', twentyOneDaysAgo.toISOString())
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


  const dismissPromotion = (promotionId: string, goalId?: string) => {
    const newDismissed = new Set(dismissedPromotions);
    
    // Find the promotion to get its destination
    const promotion = promotions.find(p => p.id === promotionId);
    
    if (promotion && goalId) {
      // Dismiss all promotions for this destination + goal combination
      const destinationKey = `${goalId}:${promotion.destino.toLowerCase()}`;
      newDismissed.add(destinationKey);
    }
    
    // Also add the specific promotion ID as fallback
    newDismissed.add(promotionId);
    
    setDismissedPromotions(newDismissed);
    
    // Persist to localStorage
    try {
      localStorage.setItem('dismissedFeaturedPromotions', JSON.stringify([...newDismissed]));
    } catch (error) {
      console.warn('Could not save dismissed promotions:', error);
    }
    
    toast({
      title: t('promotions.dismissed') || 'Promoção dispensada',
      description: t('promotions.dismissedDescription') || 'Promoções para este destino não serão mais exibidas para esta meta.',
    });
  };
  
  // Helper to check if a matched promotion should be hidden
  const isPromotionDismissed = (promotionId: string, goalId: string, destination: string) => {
    // Check if specific promotion was dismissed
    if (dismissedPromotions.has(promotionId)) return true;
    
    // Check if destination+goal combination was dismissed
    const destinationKey = `${goalId}:${destination.toLowerCase()}`;
    if (dismissedPromotions.has(destinationKey)) return true;
    
    return false;
  };

  const getProgramColor = (programa: string) => {
    const colors: Record<string, string> = {
      'Smiles': 'bg-orange-500/10 text-orange-700 border-orange-200 dark:text-orange-400',
      'LATAM Pass': 'bg-red-500/10 text-red-700 border-red-200 dark:text-red-400',
      'TudoAzul': 'bg-blue-500/10 text-blue-700 border-blue-200 dark:text-blue-400',
      'Livelo': 'bg-purple-500/10 text-purple-700 border-purple-200 dark:text-purple-400',
      'Esfera': 'bg-green-500/10 text-green-700 border-green-200 dark:text-green-400',
      'AAdvantage': 'bg-sky-500/10 text-sky-700 border-sky-200 dark:text-sky-400',
      'Avianca': 'bg-rose-500/10 text-rose-700 border-rose-200 dark:text-rose-400',
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
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-primary" />
            Promoções de Milhas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Plane className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p>Nenhuma promoção encontrada no momento.</p>
            <p className="text-sm mt-2">As promoções são atualizadas automaticamente todos os dias às 14h.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Filter out dismissed promotions (by ID or by destination+goal combination)
  const visibleMatchedPromotions = matchedPromotions.filter(
    m => !isPromotionDismissed(m.promotion.id, m.goal.id, m.promotion.destino)
  );
  const matchedPromoIds = new Set(matchedPromotions.map(m => m.promotion.id));
  const regularPromotions = promotions.filter(p => !matchedPromoIds.has(p.id));

  return (
    <div className="space-y-6">
      {/* Featured Promotions - Matching Goals */}
      {visibleMatchedPromotions.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-lg">
              {t('promotions.matchingGoals') || 'Promoções que combinam com suas metas'}
            </h3>
          </div>
          <div className="space-y-4">
            {visibleMatchedPromotions.slice(0, 3).map((match) => (
                <FeaturedPromotionCard
                  key={`featured-${match.promotion.id}-${match.goal.id}`}
                  promotion={match.promotion}
                  matchedGoal={{
                    id: match.goal.id,
                    name: match.goal.name,
                    current_miles: match.goal.current_miles,
                    target_miles: match.goal.target_miles,
                  }}
                  userTotalMiles={userTotalMiles}
                  onDismiss={(promoId) => dismissPromotion(promoId, match.goal.id)}
                />
            ))}
          </div>
        </div>
      )}

      {/* Regular Promotions Grid */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5 text-primary" />
                {matchedPromotions.length > 0 ? 'Outras Promoções' : 'Promoções de Milhas'}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {regularPromotions.length} promoções disponíveis
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {regularPromotions.map((promo) => (
            <Card 
              key={promo.id} 
              className={`relative overflow-hidden transition-all hover:shadow-lg ${
                canRedeem(promo.milhas_min) 
                  ? 'border-green-300 bg-green-50/30 dark:border-green-800 dark:bg-green-950/20' 
                  : ''
              }`}
            >

              <CardContent className="pt-4 pb-4">
                {/* Program + source badges */}
                <div className="flex items-center gap-1.5 mb-3 flex-wrap">
                  <Badge 
                    variant="outline" 
                    className={getProgramColor(promo.programa)}
                  >
                    {promo.programa}
                  </Badge>
                  {getSourceBadge(promo.fonte)}
                </div>

                {/* Title */}
                <h3 className="font-semibold text-sm line-clamp-2 mb-3">
                  {promo.titulo || `${promo.programa} - ${promo.destino}`}
                </h3>

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
  </div>
  );
};
