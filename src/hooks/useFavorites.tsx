import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface FavoritePromotion {
  id: string;
  user_id: string;
  promotion_id: string;
  created_at: string;
}

export const useFavorites = () => {
  const [favorites, setFavorites] = useState<FavoritePromotion[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const loadFavorites = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('user_promotion_favorites')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      setFavorites(data || []);
    } catch (error) {
      console.error('Error loading favorites:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar favoritos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (promotionId: string) => {
    if (!user) return;

    const existingFavorite = favorites.find(f => f.promotion_id === promotionId);

    try {
      if (existingFavorite) {
        // Remove from favorites
        const { error } = await supabase
          .from('user_promotion_favorites')
          .delete()
          .eq('id', existingFavorite.id);

        if (error) throw error;

        setFavorites(prev => prev.filter(f => f.id !== existingFavorite.id));
        toast({
          title: "Removido dos favoritos",
          description: "Promoção removida dos favoritos",
        });
      } else {
        // Add to favorites
        const { data, error } = await supabase
          .from('user_promotion_favorites')
          .insert({
            user_id: user.id,
            promotion_id: promotionId
          })
          .select()
          .single();

        if (error) throw error;

        setFavorites(prev => [...prev, data]);
        toast({
          title: "Adicionado aos favoritos",
          description: "Promoção adicionada aos favoritos",
        });
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast({
        title: "Erro",
        description: "Erro ao alterar favoritos",
        variant: "destructive",
      });
    }
  };

  const isFavorite = (promotionId: string) => {
    return favorites.some(f => f.promotion_id === promotionId);
  };

  useEffect(() => {
    loadFavorites();
  }, [user]);

  return {
    favorites,
    loading,
    toggleFavorite,
    isFavorite,
    refetch: loadFavorites
  };
};