import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, Calendar, Plane, Gift, Percent, Target, Zap, Star, Heart, Filter, Clock, CheckCircle, X, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { SyncPromotionsButton } from './SyncPromotionsButton';
import { PromotionFilters } from './PromotionFilters';
import { useFavorites } from '@/hooks/useFavorites';
import { usePromotionFilters } from '@/hooks/usePromotionFilters';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Database } from '@/integrations/supabase/types';

type AirlinePromotion = Database['public']['Tables']['airline_promotions']['Row'];

interface PromotionsSectionProps {
  userTotalMiles: number;
}

export const PromotionsSection = ({ userTotalMiles }: PromotionsSectionProps) => {
  const [promotions, setPromotions] = useState<AirlinePromotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [hiddenCards, setHiddenCards] = useState<Set<string>>(new Set());
  const [showHidden, setShowHidden] = useState(false);
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

      // Mock data for testing - 10 cards
      const mockPromotions: AirlinePromotion[] = [
        {
          id: 'mock-1',
          airline_code: 'G3',
          airline_name: 'GOL',
          title: 'São Paulo → Brasília - Oferta Especial',
          description: 'Passagem promocional de ida e volta por apenas R$ 220. Válida para viagens em novembro.',
          promotion_type: 'route_promotion',
          start_date: '2025-09-10',
          end_date: '2025-12-31',
          is_active: true,
          miles_required: 15000,
          route_from: 'SAO',
          route_to: 'BSB',
          raw_price: 220.02,
          boarding_tax: 93.49,
          departure_date: '2025-11-11',
          return_date: '2025-11-12',
          is_round_trip: true,
          currency: 'BRL',
          data_source: 'moblix',
          promotion_url: 'https://example.com',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          bonus_percentage: null,
          discount_percentage: null,
          external_promotion_id: null,
          external_reference: null,
          last_synced_at: null,
          original_price: null,
          promotional_price: null,
          terms_conditions: null
        },
        {
          id: 'mock-2',
          airline_code: 'LA',
          airline_name: 'LATAM',
          title: 'Belo Horizonte → Rio de Janeiro',
          description: 'Voo direto com preço imperdível. Aproveite para conhecer a cidade maravilhosa.',
          promotion_type: 'route_discount',
          start_date: '2025-09-10',
          end_date: '2025-12-15',
          is_active: true,
          miles_required: 12000,
          route_from: 'CNF',
          route_to: 'GIG',
          raw_price: 447.10,
          boarding_tax: 67.67,
          departure_date: '2025-10-09',
          return_date: '2025-10-14',
          is_round_trip: true,
          currency: 'BRL',
          data_source: 'moblix',
          promotion_url: 'https://example.com',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          bonus_percentage: null,
          discount_percentage: 25,
          external_promotion_id: null,
          external_reference: null,
          last_synced_at: null,
          original_price: null,
          promotional_price: null,
          terms_conditions: null
        },
        {
          id: 'mock-3',
          airline_code: 'AD',
          airline_name: 'Azul',
          title: 'Compra de Milhas com 100% de Bônus',
          description: 'Compre milhas e ganhe 100% de bônus. Oferta válida por tempo limitado.',
          promotion_type: 'buy_miles',
          start_date: '2025-09-10',
          end_date: '2025-11-30',
          is_active: true,
          miles_required: null,
          route_from: null,
          route_to: null,
          raw_price: null,
          boarding_tax: null,
          departure_date: null,
          return_date: null,
          is_round_trip: null,
          currency: 'BRL',
          data_source: 'manual',
          promotion_url: 'https://example.com',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          bonus_percentage: 100,
          discount_percentage: null,
          external_promotion_id: null,
          external_reference: null,
          last_synced_at: null,
          original_price: null,
          promotional_price: null,
          terms_conditions: null
        },
        {
          id: 'mock-4',
          airline_code: 'TP',
          airline_name: 'TAP',
          title: 'Transfer Bonus TAP - 40% Extra',
          description: 'Transfira pontos para a TAP e ganhe 40% de bônus. Válido para cartões parceiros.',
          promotion_type: 'transfer_bonus',
          start_date: '2025-09-10',
          end_date: '2025-12-20',
          is_active: true,
          miles_required: 20000,
          route_from: null,
          route_to: null,
          raw_price: null,
          boarding_tax: null,
          departure_date: null,
          return_date: null,
          is_round_trip: null,
          currency: 'EUR',
          data_source: 'manual',
          promotion_url: 'https://example.com',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          bonus_percentage: 40,
          discount_percentage: null,
          external_promotion_id: null,
          external_reference: null,
          last_synced_at: null,
          original_price: null,
          promotional_price: null,
          terms_conditions: null
        },
        {
          id: 'mock-5',
          airline_code: 'AA',
          airline_name: 'American Airlines',
          title: 'Campinas → Brasília Executiva',
          description: 'Voo executivo com preço promocional. Embarque em Viracopos.',
          promotion_type: 'route_promotion',
          start_date: '2025-09-10',
          end_date: '2025-10-31',
          is_active: true,
          miles_required: 25000,
          route_from: 'VCP',
          route_to: 'BSB',
          raw_price: 347.00,
          boarding_tax: 63.19,
          departure_date: '2025-09-25',
          return_date: '2025-10-02',
          is_round_trip: true,
          currency: 'BRL',
          data_source: 'moblix',
          promotion_url: 'https://example.com',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          bonus_percentage: null,
          discount_percentage: null,
          external_promotion_id: null,
          external_reference: null,
          last_synced_at: null,
          original_price: null,
          promotional_price: null,
          terms_conditions: null
        },
        {
          id: 'mock-6',
          airline_code: 'G3',
          airline_name: 'GOL',
          title: 'Pontos em Dobro - Voos Nacionais',
          description: 'Ganhe pontos em dobro em todos os voos nacionais até o final do ano.',
          promotion_type: 'double_points',
          start_date: '2025-09-10',
          end_date: '2025-12-31',
          is_active: true,
          miles_required: null,
          route_from: null,
          route_to: null,
          raw_price: null,
          boarding_tax: null,
          departure_date: null,
          return_date: null,
          is_round_trip: null,
          currency: 'BRL',
          data_source: 'manual',
          promotion_url: 'https://example.com',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          bonus_percentage: 100,
          discount_percentage: null,
          external_promotion_id: null,
          external_reference: null,
          last_synced_at: null,
          original_price: null,
          promotional_price: null,
          terms_conditions: null
        },
        {
          id: 'mock-7',
          airline_code: 'LA',
          airline_name: 'LATAM',
          title: 'Salvador → Belo Horizonte',
          description: 'Conecte o nordeste ao sudeste com preços especiais. Viagem de negócios ou lazer.',
          promotion_type: 'route_promotion',
          start_date: '2025-09-10',
          end_date: '2025-11-15',
          is_active: true,
          miles_required: 18000,
          route_from: 'SSA',
          route_to: 'CNF',
          raw_price: 331.88,
          boarding_tax: 106.12,
          departure_date: '2025-09-30',
          return_date: '2025-10-20',
          is_round_trip: true,
          currency: 'BRL',
          data_source: 'moblix',
          promotion_url: 'https://example.com',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          bonus_percentage: null,
          discount_percentage: 15,
          external_promotion_id: null,
          external_reference: null,
          last_synced_at: null,
          original_price: null,
          promotional_price: null,
          terms_conditions: null
        },
        {
          id: 'mock-8',
          airline_code: 'AD',
          airline_name: 'Azul',
          title: 'Status Match Gold - Azul',
          description: 'Equivalência de status para clientes Gold de outras companhias.',
          promotion_type: 'status_match',
          start_date: '2025-09-10',
          end_date: '2025-11-30',
          is_active: true,
          miles_required: 50000,
          route_from: null,
          route_to: null,
          raw_price: null,
          boarding_tax: null,
          departure_date: null,
          return_date: null,
          is_round_trip: null,
          currency: 'BRL',
          data_source: 'manual',
          promotion_url: 'https://example.com',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          bonus_percentage: null,
          discount_percentage: null,
          external_promotion_id: null,
          external_reference: null,
          last_synced_at: null,
          original_price: null,
          promotional_price: null,
          terms_conditions: null
        },
        {
          id: 'mock-9',
          airline_code: 'G3',
          airline_name: 'GOL',
          title: 'Guarulhos → Santos Dumont Premium',
          description: 'Voo direto entre os principais aeroportos. Serviço premium incluído.',
          promotion_type: 'route_discount',
          start_date: '2025-09-10',
          end_date: '2025-12-07',
          is_active: true,
          miles_required: 22000,
          route_from: 'GRU',
          route_to: 'SDU',
          raw_price: 386.67,
          boarding_tax: 67.75,
          departure_date: '2025-10-15',
          return_date: '2025-10-16',
          is_round_trip: true,
          currency: 'BRL',
          data_source: 'moblix',
          promotion_url: 'https://example.com',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          bonus_percentage: null,
          discount_percentage: 30,
          external_promotion_id: null,
          external_reference: null,
          last_synced_at: null,
          original_price: null,
          promotional_price: null,
          terms_conditions: null
        },
        {
          id: 'mock-10',
          airline_code: 'TP',
          airline_name: 'TAP',
          title: 'Mega Promoção Black Friday',
          description: 'Descontos especiais para voos internacionais. Não perca esta oportunidade única.',
          promotion_type: 'buy_miles',
          start_date: '2025-09-10',
          end_date: '2025-11-29',
          is_active: true,
          miles_required: 35000,
          route_from: null,
          route_to: null,
          raw_price: null,
          boarding_tax: null,
          departure_date: null,
          return_date: null,
          is_round_trip: null,
          currency: 'EUR',
          data_source: 'manual',
          promotion_url: 'https://example.com',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          bonus_percentage: 80,
          discount_percentage: 50,
          external_promotion_id: null,
          external_reference: null,
          last_synced_at: null,
          original_price: null,
          promotional_price: null,
          terms_conditions: null
        }
      ];

      setPromotions(data && data.length > 0 ? data : mockPromotions);
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
      'route_promotion': 'Oferta de Rota',
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
      'route_promotion': 'bg-indigo-500/10 text-indigo-700 border-indigo-200',
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

  const hideCard = (promotionId: string) => {
    setHiddenCards(prev => new Set(prev).add(promotionId));
    toast({
      title: "Card escondido",
      description: "Use o botão 'Mostrar escondidos' para ver novamente",
    });
  };

  const showCard = (promotionId: string) => {
    setHiddenCards(prev => {
      const newSet = new Set(prev);
      newSet.delete(promotionId);
      return newSet;
    });
  };

  const showAllCards = () => {
    setHiddenCards(new Set());
    setShowHidden(false);
    toast({
      title: "Cards restaurados",
      description: "Todos os cards escondidos foram exibidos novamente",
    });
  };

  // Filter out hidden cards unless showing hidden
  const visiblePromotions = showHidden 
    ? filteredPromotions.filter(p => hiddenCards.has(p.id))
    : filteredPromotions.filter(p => !hiddenCards.has(p.id));

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
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div className="flex flex-col gap-2">
            <CardTitle className="flex items-center gap-2 flex-wrap">
              <Plane className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-base sm:text-lg">Promoções de Companhias Aéreas</span>
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="text-xs">{activeFiltersCount} filtros</Badge>
              )}
              {hiddenCards.size > 0 && !showHidden && (
                <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 text-xs">
                  {hiddenCards.size} escondidos
                </Badge>
              )}
            </CardTitle>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {hiddenCards.size > 0 && (
              <Button
                variant={showHidden ? "default" : "outline"}
                size="sm"
                onClick={() => setShowHidden(!showHidden)}
                className="flex items-center gap-2 text-xs sm:text-sm"
              >
                {showHidden ? <Eye className="h-3 w-3 sm:h-4 sm:w-4" /> : <EyeOff className="h-3 w-3 sm:h-4 sm:w-4" />}
                <span className="hidden sm:inline">{showHidden ? 'Ver ativos' : `Ver escondidos (${hiddenCards.size})`}</span>
                <span className="sm:hidden">{showHidden ? 'Ativos' : `Escondidos (${hiddenCards.size})`}</span>
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 text-xs sm:text-sm"
            >
              <Filter className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Filtros</span>
              <span className="sm:hidden">Filtros</span>
            </Button>
            <SyncPromotionsButton onSyncComplete={loadPromotions} />
          </div>
        </div>
        <CardDescription className="text-sm">
          {showHidden 
            ? `Exibindo ${hiddenCards.size} promoções escondidas`
            : `Promoções ativas baseadas nas suas milhas (${Math.floor(userTotalMiles).toLocaleString()} milhas)`
          }
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
        ) : visiblePromotions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Plane className="h-12 w-12 mx-auto mb-4 opacity-50" />
            {showHidden ? (
              <>
                <p>Nenhuma promoção escondida</p>
                <p className="text-sm">Esconda algumas promoções para organizar sua visualização</p>
              </>
            ) : promotions.length === 0 ? (
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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visiblePromotions.map((promotion) => {
              const isEligible = !promotion.miles_required || userTotalMiles >= promotion.miles_required;
              const daysRemaining = formatDaysRemaining(promotion.end_date);
              const isPromotionFavorite = isFavorite(promotion.id);
              
              return (
                <div
                  key={promotion.id}
                  className={`rounded-lg border p-3 sm:p-4 transition-all hover:shadow-md ${
                    isEligible 
                      ? 'border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800' 
                      : 'border-border bg-card'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex flex-wrap items-center gap-1 sm:gap-2 min-w-0 flex-1">
                      <Badge 
                        variant="outline" 
                        className={`${getPromotionTypeColor(promotion.promotion_type)} text-xs`}
                      >
                        {getPromotionTypeLabel(promotion.promotion_type)}
                      </Badge>
                      {promotion.data_source === 'moblix' && (
                        <Badge 
                          variant="outline" 
                          className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-semibold"
                        >
                          Moblix
                        </Badge>
                      )}
                      {isEligible && (
                        <Badge variant="default" className="bg-green-600 text-xs">
                          Elegível
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleFavorite(promotion.id)}
                        className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                        title={isPromotionFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                      >
                        <Heart 
                          className={`h-3 w-3 sm:h-4 sm:w-4 ${isPromotionFavorite ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`} 
                        />
                      </Button>
                      {showHidden ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => showCard(promotion.id)}
                          className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                          title="Mostrar card novamente"
                        >
                          <Eye className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => hideCard(promotion.id)}
                          className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                          title="Esconder card temporariamente"
                        >
                          <X className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground hover:text-red-500" />
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <div className="mb-1 sm:mb-2">
                    <p className="text-xs text-muted-foreground text-right">{daysRemaining}</p>
                  </div>

                  <div className="mb-3">
                    <h4 className="font-semibold text-xs sm:text-sm mb-1">{promotion.airline_name}</h4>
                    <h3 className="font-bold text-sm sm:text-base mb-2 line-clamp-2">{promotion.title}</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground line-clamp-3">{promotion.description}</p>
                  </div>

                  {promotion.route_from && promotion.route_to && (
                    <div className="flex items-center gap-2 mb-2 text-xs sm:text-sm">
                      <Plane className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                      <span className="truncate">{promotion.route_from} → {promotion.route_to}</span>
                    </div>
                  )}

                  {promotion.miles_required && (
                    <div className="flex items-center gap-2 mb-2 text-xs sm:text-sm">
                      <Target className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                      <span className="truncate">{Math.floor(promotion.miles_required).toLocaleString()} milhas necessárias</span>
                    </div>
                  )}

                  {promotion.bonus_percentage && (
                    <div className="flex items-center gap-2 mb-2 text-xs sm:text-sm text-green-600">
                      <Gift className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                      <span>+{promotion.bonus_percentage}% de bônus</span>
                    </div>
                  )}

                  {promotion.discount_percentage && (
                    <div className="flex items-center gap-2 mb-2 text-xs sm:text-sm text-blue-600">
                      <Percent className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                      <span>{promotion.discount_percentage}% de desconto</span>
                    </div>
                  )}

                  {promotion.raw_price && promotion.data_source === 'moblix' && (
                    <div className="flex items-center gap-2 mb-2 text-xs sm:text-sm text-blue-600">
                      <span className="font-medium">R$ {promotion.raw_price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      {promotion.boarding_tax && (
                        <span className="text-muted-foreground">+ R$ {promotion.boarding_tax.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} taxa</span>
                      )}
                    </div>
                  )}

                  {promotion.departure_date && promotion.data_source === 'moblix' && (
                    <div className="flex items-center gap-2 mb-2 text-xs sm:text-sm">
                      <Calendar className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                      <span>Ida: {new Date(promotion.departure_date).toLocaleDateString('pt-BR')}</span>
                      {promotion.return_date && (
                        <span>• Volta: {new Date(promotion.return_date).toLocaleDateString('pt-BR')}</span>
                      )}
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row items-stretch gap-2 mt-4">
                    <Button 
                      size="sm" 
                      className="flex-1 text-xs sm:text-sm"
                      onClick={() => promotion.promotion_url && window.open(promotion.promotion_url, '_blank')}
                    >
                      Ver Promoção
                      <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4 ml-2" />
                    </Button>
                    {showHidden && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => showCard(promotion.id)}
                        className="flex items-center justify-center gap-2 text-xs sm:text-sm"
                      >
                        <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="hidden sm:inline">Restaurar</span>
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {/* Action buttons */}
        {(showHidden && hiddenCards.size > 0) && (
          <div className="flex justify-center pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={showAllCards}
              className="flex items-center gap-2"
            >
              <Eye className="h-4 w-4" />
              Restaurar Todos os Cards
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};