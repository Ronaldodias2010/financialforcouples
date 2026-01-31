import { useState } from 'react';
import { useTravelSuggestions, TravelSuggestion } from '@/hooks/useTravelSuggestions';
import { useLanguage } from '@/hooks/useLanguage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Plane, 
  MapPin, 
  ExternalLink, 
  Heart, 
  Eye, 
  RefreshCw,
  Sparkles,
  Filter,
  ChevronDown
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface TravelSuggestionsSectionProps {
  userTotalMiles?: number;
}

const programLogos: Record<string, string> = {
  'Smiles': '/mileage-logos/smiles.png',
  'LATAM Pass': '/mileage-logos/latam.png',
  'TudoAzul': '/mileage-logos/azul.jpg',
  'Livelo': '/mileage-logos/livelo.png',
  'Esfera': '/mileage-logos/esfera.png',
};

const programColors: Record<string, string> = {
  'Smiles': 'bg-orange-500',
  'LATAM Pass': 'bg-red-600',
  'TudoAzul': 'bg-blue-600',
  'Livelo': 'bg-purple-600',
  'Esfera': 'bg-green-600',
  'Diversos': 'bg-gray-600',
};

function SuggestionCard({ 
  suggestion, 
  onView, 
  onToggleFavorite 
}: { 
  suggestion: TravelSuggestion;
  onView: () => void;
  onToggleFavorite: () => void;
}) {
  const promo = suggestion.promotion;
  if (!promo) return null;

  const programColor = programColors[promo.programa] || 'bg-primary';
  const logo = programLogos[promo.programa];
  const canAfford = suggestion.saldo_usuario >= promo.milhas_min;
  const savings = suggestion.saldo_usuario - promo.milhas_min;

  return (
    <Card className={cn(
      "transition-all hover:shadow-md",
      !suggestion.is_viewed && "ring-2 ring-primary/20"
    )}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Program Logo/Badge */}
          <div className={cn(
            "flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center",
            programColor
          )}>
            {logo ? (
              <img src={logo} alt={promo.programa} className="w-8 h-8 object-contain" />
            ) : (
              <Plane className="w-6 h-6 text-white" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="font-semibold text-lg flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  {promo.destino}
                </h4>
                {promo.origem && (
                  <p className="text-sm text-muted-foreground">
                    Saindo de {promo.origem}
                  </p>
                )}
              </div>
              {!suggestion.is_viewed && (
                <Badge variant="secondary" className="flex-shrink-0">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Novo
                </Badge>
              )}
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Programa:</span>
                <span className="ml-1 font-medium">{promo.programa}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Necessário:</span>
                <span className="ml-1 font-medium">
                  {promo.milhas_min.toLocaleString('pt-BR')} milhas
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Seu saldo:</span>
                <span className={cn(
                  "ml-1 font-medium",
                  canAfford ? "text-green-600" : "text-orange-600"
                )}>
                  {suggestion.saldo_usuario.toLocaleString('pt-BR')} milhas
                </span>
              </div>
              {canAfford && savings > 0 && (
                <div>
                  <span className="text-muted-foreground">Sobra:</span>
                  <span className="ml-1 font-medium text-green-600">
                    {savings.toLocaleString('pt-BR')} milhas
                  </span>
                </div>
              )}
            </div>

            {promo.titulo && (
              <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                {promo.titulo}
              </p>
            )}

            {/* Actions */}
            <div className="mt-4 flex items-center gap-2">
              <Button
                size="sm"
                variant="default"
                className="flex-1"
                onClick={() => {
                  onView();
                  window.open(promo.link, '_blank', 'noopener,noreferrer');
                }}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Ver Oferta
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={onToggleFavorite}
              >
                <Heart 
                  className={cn(
                    "w-4 h-4",
                    suggestion.is_favorite && "fill-red-500 text-red-500"
                  )} 
                />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function TravelSuggestionsSection({ userTotalMiles }: TravelSuggestionsSectionProps) {
  const { t } = useLanguage();
  const { 
    suggestions, 
    isLoading, 
    error, 
    unviewedCount,
    markAsViewed, 
    toggleFavorite,
    refresh 
  } = useTravelSuggestions();

  const [filter, setFilter] = useState<'all' | 'favorites' | 'unviewed'>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refresh();
    setIsRefreshing(false);
  };

  const filteredSuggestions = suggestions.filter(s => {
    if (filter === 'favorites') return s.is_favorite;
    if (filter === 'unviewed') return !s.is_viewed;
    return true;
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plane className="h-5 w-5 text-primary" />
            Sugestões de Viagem
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2].map(i => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plane className="h-5 w-5 text-primary" />
            Sugestões de Viagem
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">Erro ao carregar sugestões: {error}</p>
          <Button variant="outline" onClick={handleRefresh} className="mt-2">
            Tentar novamente
          </Button>
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
              <Plane className="h-5 w-5 text-primary" />
              Sugestões de Viagem Personalizadas
              {unviewedCount > 0 && (
                <Badge variant="default" className="ml-2">
                  {unviewedCount} novas
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Destinos que você pode alcançar com suas milhas
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="w-4 h-4 mr-2" />
                  {filter === 'all' ? 'Todas' : filter === 'favorites' ? 'Favoritas' : 'Novas'}
                  <ChevronDown className="w-4 h-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setFilter('all')}>
                  <Eye className="w-4 h-4 mr-2" />
                  Todas ({suggestions.length})
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter('unviewed')}>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Novas ({unviewedCount})
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter('favorites')}>
                  <Heart className="w-4 h-4 mr-2" />
                  Favoritas ({suggestions.filter(s => s.is_favorite).length})
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredSuggestions.length === 0 ? (
          <div className="text-center py-8">
            <Plane className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-2">
              {filter === 'favorites' 
                ? 'Nenhuma sugestão favorita' 
                : filter === 'unviewed'
                ? 'Nenhuma sugestão nova'
                : 'Nenhuma sugestão disponível'}
            </h3>
            <p className="text-muted-foreground">
              {filter === 'all' 
                ? 'Adicione milhas ao seu perfil para receber sugestões personalizadas de viagens.'
                : 'Altere o filtro para ver outras sugestões.'}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filteredSuggestions.map(suggestion => (
              <SuggestionCard
                key={suggestion.id}
                suggestion={suggestion}
                onView={() => markAsViewed(suggestion.id)}
                onToggleFavorite={() => toggleFavorite(suggestion.id)}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
