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
      console.error('Error fetching user tags:', error);
      toast({
        title: "Erro ao carregar tags",
        description: "Não foi possível carregar as tags personalizadas.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addUserTag = async (categoryId: string, tagName: string, color: string = '#6366f1') => {
    if (!user) return false;

    try {
      // Normalize tag name to prevent duplicates  
      const normalizedTagName = tagName.trim().replace(/\s+/g, ' ');
      
      // Check for existing tag with same normalized name in this category
      const existingTags = userTags[categoryId] || [];
      const exists = existingTags.some(tag => 
        tag.tag_name.trim().toLowerCase().replace(/\s+/g, ' ') === normalizedTagName.toLowerCase()
      );
      
      if (exists) {
        toast({
          title: "Tag já existe",
          description: "Uma tag com este nome já existe nesta categoria.",
          variant: "destructive",
        });
        return false;
      }

      const { data, error } = await supabase
        .from('user_category_tags')
        .insert({
          user_id: user.id,
          category_id: categoryId,
          tag_name: normalizedTagName,
          color
        })
        .select()
        .single();

      if (error) throw error;

      setUserTags(prev => ({
        ...prev,
        [categoryId]: [...(prev[categoryId] || []), data]
      }));

      return true;
    } catch (error: any) {
      console.error('Error adding user tag:', error);
      if (error.code === '23505') {
        toast({
          title: "Tag já existe",
          description: "Esta tag já foi adicionada para esta categoria.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erro ao adicionar tag",
          description: "Não foi possível adicionar a tag.",
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