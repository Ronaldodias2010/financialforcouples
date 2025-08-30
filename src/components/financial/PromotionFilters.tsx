import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, X, Heart } from 'lucide-react';

interface PromotionFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedAirline: string;
  onAirlineChange: (value: string) => void;
  selectedType: string;
  onTypeChange: (value: string) => void;
  milesRange: { min: number; max: number };
  onMilesRangeChange: (range: { min: number; max: number }) => void;
  showFavoritesOnly: boolean;
  onShowFavoritesChange: (value: boolean) => void;
  onClearFilters: () => void;
  activeFiltersCount: number;
}

export const PromotionFilters = ({
  searchTerm,
  onSearchChange,
  selectedAirline,
  onAirlineChange,
  selectedType,
  onTypeChange,
  milesRange,
  onMilesRangeChange,
  showFavoritesOnly,
  onShowFavoritesChange,
  onClearFilters,
  activeFiltersCount
}: PromotionFiltersProps) => {
  const airlines = [
    { value: 'all', label: 'Todas as Companhias' },
    { value: 'LATAM', label: 'LATAM Airlines' },
    { value: 'GOL', label: 'GOL Linhas Aéreas' },
    { value: 'AZUL', label: 'Azul Linhas Aéreas' },
    { value: 'TAP', label: 'TAP Air Portugal' },
    { value: 'AVIANCA', label: 'Avianca' },
    { value: 'AIR_FRANCE', label: 'Air France' },
    { value: 'AMERICAN', label: 'American Airlines' },
    { value: 'UNITED', label: 'United Airlines' }
  ];

  const promotionTypes = [
    { value: 'all', label: 'Todos os Tipos' },
    { value: 'transfer_bonus', label: 'Bônus Transferência' },
    { value: 'buy_miles', label: 'Compra de Milhas' },
    { value: 'route_discount', label: 'Desconto em Rota' },
    { value: 'double_points', label: 'Pontos em Dobro' },
    { value: 'status_match', label: 'Equivalência Status' }
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
            {activeFiltersCount > 0 && (
              <Badge variant="secondary">{activeFiltersCount}</Badge>
            )}
          </CardTitle>
          {activeFiltersCount > 0 && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onClearFilters}
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Limpar
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="space-y-2">
          <Label htmlFor="search">Buscar promoções</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="search"
              type="text"
              placeholder="Busque por destino, companhia..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Favorites Toggle */}
        <div className="flex items-center space-x-2">
          <Button
            variant={showFavoritesOnly ? "default" : "outline"}
            size="sm"
            onClick={() => onShowFavoritesChange(!showFavoritesOnly)}
            className="flex items-center gap-2"
          >
            <Heart className={`h-4 w-4 ${showFavoritesOnly ? 'fill-current' : ''}`} />
            Apenas Favoritos
          </Button>
        </div>

        {/* Airline Filter */}
        <div className="space-y-2">
          <Label>Companhia Aérea</Label>
          <Select value={selectedAirline} onValueChange={onAirlineChange}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma companhia" />
            </SelectTrigger>
            <SelectContent>
              {airlines.map((airline) => (
                <SelectItem key={airline.value} value={airline.value}>
                  {airline.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Promotion Type Filter */}
        <div className="space-y-2">
          <Label>Tipo de Promoção</Label>
          <Select value={selectedType} onValueChange={onTypeChange}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione um tipo" />
            </SelectTrigger>
            <SelectContent>
              {promotionTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Miles Range Filter */}
        <div className="space-y-2">
          <Label>Faixa de Milhas Necessárias</Label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="min-miles" className="text-xs">Mínimo</Label>
              <Input
                id="min-miles"
                type="number"
                placeholder="0"
                value={milesRange.min || ''}
                onChange={(e) => onMilesRangeChange({
                  ...milesRange,
                  min: parseInt(e.target.value) || 0
                })}
              />
            </div>
            <div>
              <Label htmlFor="max-miles" className="text-xs">Máximo</Label>
              <Input
                id="max-miles"
                type="number"
                placeholder="∞"
                value={milesRange.max || ''}
                onChange={(e) => onMilesRangeChange({
                  ...milesRange,
                  max: parseInt(e.target.value) || 999999
                })}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};