import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useRealtimeTable } from '@/hooks/useRealtimeManager';

export interface TravelSuggestion {
  id: string;
  user_id: string;
  promotion_id: string;
  saldo_usuario: number;
  programa_usuario: string;
  mensagem: string;
  is_viewed: boolean;
  is_favorite: boolean;
  created_at: string;
  promotion?: {
    id: string;
    programa: string;
    origem: string | null;
    destino: string;
    milhas_min: number;
    link: string;
    titulo: string | null;
    descricao: string | null;
    fonte: string;
  };
}

export function useTravelSuggestions() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [suggestions, setSuggestions] = useState<TravelSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSuggestions = useCallback(async () => {
    if (!user?.id) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Fetch suggestions with promotion details
      const { data, error: fetchError } = await supabase
        .from('user_travel_suggestions')
        .select(`
          *,
          promotion:scraped_promotions(
            id,
            programa,
            origem,
            destino,
            milhas_min,
            link,
            titulo,
            descricao,
            fonte
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      setSuggestions(data || []);
    } catch (err) {
      console.error('Error fetching travel suggestions:', err);
      setError(err instanceof Error ? err.message : 'Failed to load suggestions');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Mark suggestion as viewed
  const markAsViewed = useCallback(async (suggestionId: string) => {
    try {
      const { error: updateError } = await supabase
        .from('user_travel_suggestions')
        .update({ is_viewed: true })
        .eq('id', suggestionId)
        .eq('user_id', user?.id);

      if (updateError) throw updateError;

      setSuggestions(prev =>
        prev.map(s => s.id === suggestionId ? { ...s, is_viewed: true } : s)
      );
    } catch (err) {
      console.error('Error marking suggestion as viewed:', err);
    }
  }, [user?.id]);

  // Toggle favorite
  const toggleFavorite = useCallback(async (suggestionId: string) => {
    const suggestion = suggestions.find(s => s.id === suggestionId);
    if (!suggestion) return;

    try {
      const { error: updateError } = await supabase
        .from('user_travel_suggestions')
        .update({ is_favorite: !suggestion.is_favorite })
        .eq('id', suggestionId)
        .eq('user_id', user?.id);

      if (updateError) throw updateError;

      setSuggestions(prev =>
        prev.map(s => s.id === suggestionId ? { ...s, is_favorite: !s.is_favorite } : s)
      );

      toast({
        title: suggestion.is_favorite ? 'Removido dos favoritos' : 'Adicionado aos favoritos',
        description: suggestion.promotion?.destino || 'Sugestão atualizada',
      });
    } catch (err) {
      console.error('Error toggling favorite:', err);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar favorito',
        variant: 'destructive',
      });
    }
  }, [user?.id, suggestions, toast]);

  // Dismiss suggestion
  const dismissSuggestion = useCallback(async (suggestionId: string) => {
    try {
      // We just mark as viewed and filter out in UI
      await markAsViewed(suggestionId);
    } catch (err) {
      console.error('Error dismissing suggestion:', err);
    }
  }, [markAsViewed]);

  // Get unviewed count
  const unviewedCount = suggestions.filter(s => !s.is_viewed).length;

  // Get favorites
  const favorites = suggestions.filter(s => s.is_favorite);

  // Initial fetch
  useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  // Real-time subscription
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('travel-suggestions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_travel_suggestions',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchSuggestions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, fetchSuggestions]);

  return {
    suggestions,
    isLoading,
    error,
    unviewedCount,
    favorites,
    markAsViewed,
    toggleFavorite,
    dismissSuggestion,
    refresh: fetchSuggestions,
  };
}
