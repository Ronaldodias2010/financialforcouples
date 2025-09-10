import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';

interface UserCategoryTag {
  id: string;
  tag_name: string;
  tag_name_en?: string;
  tag_name_es?: string;
  color: string;
  category_id: string;
}

export const useUserCategoryTags = () => {
  const [userTags, setUserTags] = useState<Record<string, UserCategoryTag[]>>({});
  const [excludedSystemTags, setExcludedSystemTags] = useState<Record<string, string[]>>({});
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchUserTags = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      console.log('Fetching user tags using optimized approach...');
      
      // Try to use the optimized function first (cast as any since it's not in types yet)
      const { data: optimizedData, error: optimizedError } = await (supabase as any).rpc('get_user_category_tags_complete', {
        p_user_id: user.id
      });

      if (optimizedError || !optimizedData) {
        console.warn('Optimized function not available, using fallback method:', optimizedError);
        await fetchUserTagsFallback();
        return;
      }

      // Process optimized data
      const tagsByCategory: Record<string, UserCategoryTag[]> = {};
      const exclusionsByCategory: Record<string, string[]> = {};

      // Ensure optimizedData is an array
      const dataArray = Array.isArray(optimizedData) ? optimizedData : [];
      
      dataArray.forEach((row: any) => {
        // Process user tags
        if (row.user_tags && Array.isArray(row.user_tags)) {
          tagsByCategory[row.category_id] = row.user_tags;
        }

        // Process excluded system tags
        if (row.excluded_system_tags && Array.isArray(row.excluded_system_tags)) {
          exclusionsByCategory[row.category_id] = row.excluded_system_tags;
        }
      });

      setUserTags(tagsByCategory);
      setExcludedSystemTags(exclusionsByCategory);
      console.log('Successfully used optimized user tags method');
    } catch (error) {
      console.error('Error fetching user tags with optimized method:', error);
      await fetchUserTagsFallback();
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserTagsFallback = async () => {
    try {
      console.log('Using fallback method for fetching user tags...');
      
      // Fetch user custom tags with translations
      const { data: userTagsData, error: userTagsError } = await supabase
        .from('user_category_tags')
        .select('id, tag_name, tag_name_en, tag_name_es, color, category_id')
        .eq('user_id', user.id);

      if (userTagsError) throw userTagsError;

      // Fetch excluded system tags
      const { data: exclusionsData, error: exclusionsError } = await supabase
        .from('user_category_tag_exclusions')
        .select('*')
        .eq('user_id', user.id);

      if (exclusionsError) throw exclusionsError;

      const tagsByCategory: Record<string, UserCategoryTag[]> = {};
      userTagsData?.forEach(tag => {
        if (!tagsByCategory[tag.category_id]) {
          tagsByCategory[tag.category_id] = [];
        }
        tagsByCategory[tag.category_id].push(tag);
      });

      const exclusionsByCategory: Record<string, string[]> = {};
      exclusionsData?.forEach(exclusion => {
        if (!exclusionsByCategory[exclusion.category_id]) {
          exclusionsByCategory[exclusion.category_id] = [];
        }
        exclusionsByCategory[exclusion.category_id].push(exclusion.system_tag_id);
      });

      setUserTags(tagsByCategory);
      setExcludedSystemTags(exclusionsByCategory);
    } catch (error) {
      console.error('Error fetching user tags with fallback method:', error);
      toast({
        title: "Erro ao carregar tags",
        description: "Não foi possível carregar as tags personalizadas.",
        variant: "destructive",
      });
    }
  };

  const addUserTag = async (categoryId: string, tagName: string, color: string = '#6366f1'): Promise<boolean> => {
    if (!user) return false;

    try {
      // Use the normalized insertion function (cast as any since it's not in types yet)
      const { data, error } = await (supabase as any).rpc('insert_normalized_user_tag', {
        p_user_id: user.id,
        p_category_id: categoryId,
        p_tag_name: tagName,
        p_color: color
      });

      if (error) throw error;

      // Refetch to get the actual created tag
      await fetchUserTags();

      toast({
        title: "Tag adicionada",
        description: "Tag personalizada criada com sucesso.",
      });

      return true;
    } catch (error) {
      console.error('Error adding user tag:', error);
      
      // Check if it's a duplicate error
      if (error?.message?.includes('already exists') || error?.code === '23505') {
        toast({
          title: "Tag já existe",
          description: "Esta tag já foi adicionada a esta categoria.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erro ao adicionar tag",
          description: "Não foi possível criar a tag personalizada.",
          variant: "destructive",
        });
      }
      return false;
    }
  };

  const removeUserTag = async (tagId: string, categoryId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_category_tags')
        .delete()
        .eq('id', tagId)
        .eq('user_id', user.id);

      if (error) throw error;

      setUserTags(prev => ({
        ...prev,
        [categoryId]: prev[categoryId]?.filter(tag => tag.id !== tagId) || []
      }));

      toast({
        title: "Tag removida",
        description: "Tag removida com sucesso.",
      });
    } catch (error) {
      console.error('Error removing user tag:', error);
      toast({
        title: "Erro ao remover tag",
        description: "Não foi possível remover a tag.",
        variant: "destructive",
      });
    }
  };

  const excludeSystemTag = async (systemTagId: string, categoryId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_category_tag_exclusions')
        .insert({
          user_id: user.id,
          category_id: categoryId,
          system_tag_id: systemTagId
        });

      if (error) throw error;

      setExcludedSystemTags(prev => ({
        ...prev,
        [categoryId]: [...(prev[categoryId] || []), systemTagId]
      }));

      toast({
        title: "Tag removida",
        description: "Tag removida da categoria.",
      });
    } catch (error) {
      console.error('Error excluding system tag:', error);
      toast({
        title: "Erro ao remover tag",
        description: "Não foi possível remover a tag.",
        variant: "destructive",
      });
    }
  };

  const restoreSystemTag = async (systemTagId: string, categoryId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_category_tag_exclusions')
        .delete()
        .eq('user_id', user.id)
        .eq('category_id', categoryId)
        .eq('system_tag_id', systemTagId);

      if (error) throw error;

      setExcludedSystemTags(prev => ({
        ...prev,
        [categoryId]: prev[categoryId]?.filter(id => id !== systemTagId) || []
      }));

      toast({
        title: "Tag restaurada",
        description: "Tag restaurada na categoria.",
      });
    } catch (error) {
      console.error('Error restoring system tag:', error);
      toast({
        title: "Erro ao restaurar tag",
        description: "Não foi possível restaurar a tag.",
        variant: "destructive",
      });
    }
  };

  const getUserTagsForCategory = (categoryId: string): UserCategoryTag[] => {
    return userTags[categoryId] || [];
  };

  useEffect(() => {
    if (user) {
      fetchUserTags();
    }
  }, [user]);

  return {
    userTags,
    excludedSystemTags,
    isLoading,
    addUserTag,
    removeUserTag,
    excludeSystemTag,
    restoreSystemTag,
    getUserTagsForCategory,
    refetch: fetchUserTags
  };
};