import { useState, useMemo } from 'react';
import { useFavorites } from './useFavorites';
import type { Database } from '@/integrations/supabase/types';

type AirlinePromotion = Database['public']['Tables']['airline_promotions']['Row'];

interface FilterState {
  searchTerm: string;
  selectedAirline: string;
  selectedType: string;
  milesRange: { min: number; max: number };
  showFavoritesOnly: boolean;
}

export const usePromotionFilters = (promotions: AirlinePromotion[]) => {
  const { isFavorite } = useFavorites();
  
  const [filters, setFilters] = useState<FilterState>({
    searchTerm: '',
    selectedAirline: 'all',
    selectedType: 'all',
    milesRange: { min: 0, max: 999999 },
    showFavoritesOnly: false
  });

  const filteredPromotions = useMemo(() => {
    return promotions.filter(promotion => {
      // Search filter
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        const matchesSearch = 
          promotion.title.toLowerCase().includes(searchLower) ||
          promotion.description.toLowerCase().includes(searchLower) ||
          promotion.airline_name.toLowerCase().includes(searchLower) ||
          promotion.route_from?.toLowerCase().includes(searchLower) ||
          promotion.route_to?.toLowerCase().includes(searchLower);
        
        if (!matchesSearch) return false;
      }

      // Airline filter
      if (filters.selectedAirline !== 'all' && promotion.airline_code !== filters.selectedAirline) {
        return false;
      }

      // Type filter
      if (filters.selectedType !== 'all' && promotion.promotion_type !== filters.selectedType) {
        return false;
      }

      // Miles range filter
      if (promotion.miles_required) {
        if (promotion.miles_required < filters.milesRange.min || 
            promotion.miles_required > filters.milesRange.max) {
          return false;
        }
      }

      // Favorites filter
      if (filters.showFavoritesOnly && !isFavorite(promotion.id)) {
        return false;
      }

      return true;
    });
  }, [promotions, filters, isFavorite]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.searchTerm) count++;
    if (filters.selectedAirline !== 'all') count++;
    if (filters.selectedType !== 'all') count++;
    if (filters.milesRange.min > 0 || filters.milesRange.max < 999999) count++;
    if (filters.showFavoritesOnly) count++;
    return count;
  }, [filters]);

  const updateFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      searchTerm: '',
      selectedAirline: 'all',
      selectedType: 'all',
      milesRange: { min: 0, max: 999999 },
      showFavoritesOnly: false
    });
  };

  return {
    filters,
    filteredPromotions,
    activeFiltersCount,
    updateFilter,
    clearFilters,
    // Individual setters for easier use
    setSearchTerm: (value: string) => updateFilter('searchTerm', value),
    setSelectedAirline: (value: string) => updateFilter('selectedAirline', value),
    setSelectedType: (value: string) => updateFilter('selectedType', value),
    setMilesRange: (value: { min: number; max: number }) => updateFilter('milesRange', value),
    setShowFavoritesOnly: (value: boolean) => updateFilter('showFavoritesOnly', value)
  };
};