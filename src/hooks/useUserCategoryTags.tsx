import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';

interface UserCategoryTag {
  id: string;
  tag_name: string;
  color: string;
  category_id: string;
}

export const useUserCategoryTags = () => {
  const [userTags, setUserTags] = useState<Record<string, UserCategoryTag[]>>({});
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchUserTags = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_category_tags')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      const tagsByCategory: Record<string, UserCategoryTag[]> = {};
      data?.forEach(tag => {
        if (!tagsByCategory[tag.category_id]) {
          tagsByCategory[tag.category_id] = [];
        }
        tagsByCategory[tag.category_id].push(tag);
      });

      setUserTags(tagsByCategory);
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
      const { data, error } = await supabase
        .from('user_category_tags')
        .insert({
          user_id: user.id,
          category_id: categoryId,
          tag_name: tagName.trim(),
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
    isLoading,
    addUserTag,
    removeUserTag,
    getUserTagsForCategory,
    refetch: fetchUserTags
  };
};