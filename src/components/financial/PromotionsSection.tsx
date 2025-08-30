import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, Calendar, Plane, Gift, Percent, Target, Zap, Star, Heart, Filter, Clock, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { SyncPromotionsButton } from './SyncPromotionsButton';
import { PromotionFilters } from './PromotionFilters';
import { useFavorites } from '@/hooks/useFavorites';
import { usePromotionFilters } from '@/hooks/usePromotionFilters';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AirlinePromotion {
  id: string;
  airline_code: string;
  airline_name: string;
  title: string;
  description: string;
  promotion_type: string;
  miles_required?: number;
  bonus_percentage?: number;
  discount_percentage?: number;
  route_from?: string;
  route_to?: string;
  promotion_url?: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

interface PromotionsSectionProps {
  userTotalMiles: number;
}

export const PromotionsSection = ({ userTotalMiles }: PromotionsSectionProps) => {
  const [promotions, setPromotions] = useState<AirlinePromotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const { toggleFavorite, isFavorite } = useFavorites();
  
  const {
    filters,
    filteredPromotions,
    activeFiltersCount,
    setSearchTerm,
    setSelectedAirline,
    setSelectedType,
    setMilesRange,
    setShowFavoritesOnly,
    clearFilters
  } = usePromotionFilters(promotions);

  useEffect(() => {
    loadPromotions();
  }, [userTotalMiles]);

  const loadPromotions = async () => {
    try {
      const { data, error } = await supabase
        .from('airline_promotions')
        .select('*')
        .eq('is_active', true)
        .gte('end_date', new Date().toISOString().split('T')[0])
        .order('start_date', { ascending: false });

      if (error) throw error;

      setPromotions(data || []);
    } catch (error) {
      console.error('Error loading promotions:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar promoções",
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getPromotionTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'transfer_bonus': 'Bônus Transferência',
      'buy_miles': 'Compra de Milhas',
      'route_discount': 'Desconto em Rota',
      'double_points': 'Pontos em Dobro',
      'status_match': 'Equivalência Status'
    };
    return labels[type] || 'Geral';
  };

  const getPromotionTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'transfer_bonus': 'bg-blue-500/10 text-blue-700 border-blue-200',
      'buy_miles': 'bg-green-500/10 text-green-700 border-green-200',
      'route_discount': 'bg-purple-500/10 text-purple-700 border-purple-200',
      'double_points': 'bg-orange-500/10 text-orange-700 border-orange-200',
      'status_match': 'bg-pink-500/10 text-pink-700 border-pink-200'
    };
    return colors[type] || 'bg-gray-500/10 text-gray-700 border-gray-200';
  };

  const formatDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 0) return 'Expirado';
    if (diffDays === 1) return '1 dia restante';
    return `${diffDays} dias restantes`;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plane className="h-5 w-5" />
            Promoções de Companhias Aéreas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse">
                <div className="h-48 bg-muted rounded-lg"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Plane className="h-5 w-5" />
            Promoções de Companhias Aéreas
            {activeFiltersCount > 0 && (
              <Badge variant="secondary">{activeFiltersCount} filtros</Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Filtros
            </Button>
            <SyncPromotionsButton onSyncComplete={loadPromotions} />
          </div>
        </div>
        <CardDescription>
          Promoções ativas baseadas nas suas milhas ({userTotalMiles.toLocaleString()} milhas)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {showFilters && (
          <PromotionFilters
            searchTerm={filters.searchTerm}
            onSearchChange={setSearchTerm}
            selectedAirline={filters.selectedAirline}
            onAirlineChange={setSelectedAirline}
            selectedType={filters.selectedType}
            onTypeChange={setSelectedType}
            milesRange={filters.milesRange}
            onMilesRangeChange={setMilesRange}
            showFavoritesOnly={filters.showFavoritesOnly}
            onShowFavoritesChange={setShowFavoritesOnly}
            onClearFilters={clearFilters}
            activeFiltersCount={activeFiltersCount}
          />
        )}

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse">
                <div className="h-48 bg-muted rounded-lg"></div>
              </div>
            ))}
          </div>
        ) : filteredPromotions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Plane className="h-12 w-12 mx-auto mb-4 opacity-50" />
            {promotions.length === 0 ? (
              <>
                <p>Nenhuma promoção ativa encontrada</p>
                <p className="text-sm">Sincronize para buscar novas promoções</p>
              </>
            ) : (
              <>
                <p>Nenhuma promoção encontrada com os filtros aplicados</p>
                <p className="text-sm">Tente ajustar os filtros ou limpar a busca</p>
              </>
            )}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredPromotions.map((promotion) => {
              const isEligible = !promotion.miles_required || userTotalMiles >= promotion.miles_required;
              const daysRemaining = formatDaysRemaining(promotion.end_date);
              const isPromotionFavorite = isFavorite(promotion.id);
              
              return (
                <div
                  key={promotion.id}
                  className={`rounded-lg border p-4 transition-all hover:shadow-md ${
                    isEligible 
                      ? 'border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800' 
                      : 'border-border bg-card'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="outline" 
                        className={getPromotionTypeColor(promotion.promotion_type)}
                      >
                        {getPromotionTypeLabel(promotion.promotion_type)}
                      </Badge>
                      {isEligible && (
                        <Badge variant="default" className="bg-green-600">
                          Elegível
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleFavorite(promotion.id)}
                        className="h-8 w-8 p-0"
                      >
                        <Heart 
                          className={`h-4 w-4 ${isPromotionFavorite ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`} 
                        />
                      </Button>
                      <p className="text-xs text-muted-foreground">{daysRemaining}</p>
                    </div>
                  </div>

                  <div className="mb-3">
                    <h4 className="font-semibold text-sm mb-1">{promotion.airline_name}</h4>
                    <h3 className="font-bold text-base mb-2">{promotion.title}</h3>
                    <p className="text-sm text-muted-foreground">{promotion.description}</p>
                  </div>

                  {promotion.route_from && promotion.route_to && (
                    <div className="flex items-center gap-2 mb-2 text-sm">
                      <Plane className="h-4 w-4" />
                      <span>{promotion.route_from} → {promotion.route_to}</span>
                    </div>
                  )}

                  {promotion.miles_required && (
                    <div className="flex items-center gap-2 mb-2 text-sm">
                      <Target className="h-4 w-4" />
                      <span>{promotion.miles_required.toLocaleString()} milhas necessárias</span>
                    </div>
                  )}

                  {promotion.bonus_percentage && (
                    <div className="flex items-center gap-2 mb-2 text-sm text-green-600">
                      <Gift className="h-4 w-4" />
                      <span>+{promotion.bonus_percentage}% de bônus</span>
                    </div>
                  )}

                  {promotion.discount_percentage && (
                    <div className="flex items-center gap-2 mb-2 text-sm text-blue-600">
                      <Percent className="h-4 w-4" />
                      <span>{promotion.discount_percentage}% de desconto</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 mt-4">
                    <Button 
                      size="sm" 
                      className="flex-1"
                      onClick={() => promotion.promotion_url && window.open(promotion.promotion_url, '_blank')}
                    >
                      Ver Promoção
                      <ExternalLink className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};