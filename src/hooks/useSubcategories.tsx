import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/useLanguage';
import { useCouple } from '@/hooks/useCouple';

export interface Subcategory {
  id: string;
  name: string;
  name_en: string | null;
  name_es: string | null;
  color: string | null;
  icon: string | null;
  is_system: boolean;
  category_id: string;
}

export const useSubcategories = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { language } = useLanguage();
  const { couple, isPartOfCouple } = useCouple();
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Get user IDs to query (including partner if in a couple)
  const getUserIds = useCallback((): string[] => {
    if (!user) return [];
    if (isPartOfCouple && couple) {
      return [couple.user1_id, couple.user2_id].filter(Boolean);
    }
    return [user.id];
  }, [user, couple, isPartOfCouple]);

  // Fetch all subcategories for the user (and partner if coupled)
  const fetchAllSubcategories = useCallback(async () => {
    if (!user) return;
    
    const userIds = getUserIds();
    if (userIds.length === 0) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('subcategories')
        .select('id, name, name_en, name_es, color, icon, is_system, category_id')
        .in('user_id', userIds)
        .is('deleted_at', null)
        .order('is_system', { ascending: false })
        .order('name');

      if (error) throw error;
      setSubcategories(data || []);
    } catch (error) {
      console.error('Error fetching subcategories:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, getUserIds]);

  // Fetch subcategories for a specific category
  const fetchSubcategoriesForCategory = useCallback(async (categoryId: string): Promise<Subcategory[]> => {
    if (!user || !categoryId) return [];

    const userIds = getUserIds();
    if (userIds.length === 0) return [];

    try {
      // Direct query with user_id filter
      const { data, error } = await supabase
        .from('subcategories')
        .select('id, name, name_en, name_es, color, icon, is_system, category_id')
        .eq('category_id', categoryId)
        .in('user_id', userIds)
        .is('deleted_at', null)
        .order('is_system', { ascending: false })
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching subcategories for category:', error);
      return [];
    }
  }, [user, getUserIds]);

  // Get localized name for a subcategory
  const getLocalizedName = useCallback((subcategory: Subcategory): string => {
    if (language === 'en' && subcategory.name_en) {
      return subcategory.name_en;
    }
    if (language === 'es' && subcategory.name_es) {
      return subcategory.name_es;
    }
    return subcategory.name;
  }, [language]);

  // Get subcategories for a specific category from cached data
  const getSubcategoriesForCategory = useCallback((categoryId: string): Subcategory[] => {
    return subcategories.filter(sub => sub.category_id === categoryId);
  }, [subcategories]);

  // Add a new subcategory
  const addSubcategory = useCallback(async (
    categoryId: string, 
    name: string, 
    color?: string,
    nameEn?: string,
    nameEs?: string
  ): Promise<Subcategory | null> => {
    if (!user || !categoryId || !name.trim()) return null;

    try {
      const { data, error } = await supabase
        .from('subcategories')
        .insert({
          user_id: user.id,
          category_id: categoryId,
          name: name.trim(),
          name_en: nameEn || null,
          name_es: nameEs || null,
          color: color || '#6366f1',
          is_system: false,
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          toast({
            title: language === 'pt' ? 'Subcategoria já existe' : 'Subcategory already exists',
            description: language === 'pt' 
              ? 'Uma subcategoria com este nome já existe nesta categoria.'
              : 'A subcategory with this name already exists in this category.',
            variant: 'destructive',
          });
          return null;
        }
        throw error;
      }

      await fetchAllSubcategories();
      return data;
    } catch (error) {
      console.error('Error adding subcategory:', error);
      toast({
        title: language === 'pt' ? 'Erro' : 'Error',
        description: language === 'pt' 
          ? 'Não foi possível adicionar a subcategoria.'
          : 'Could not add subcategory.',
        variant: 'destructive',
      });
      return null;
    }
  }, [user, language, toast, fetchAllSubcategories]);

  // Update a subcategory
  const updateSubcategory = useCallback(async (
    subcategoryId: string,
    updates: Partial<Pick<Subcategory, 'name' | 'name_en' | 'name_es' | 'color' | 'icon'>>
  ): Promise<boolean> => {
    if (!user || !subcategoryId) return false;

    try {
      const { error } = await supabase
        .from('subcategories')
        .update(updates)
        .eq('id', subcategoryId)
        .eq('user_id', user.id);

      if (error) throw error;

      await fetchAllSubcategories();
      return true;
    } catch (error) {
      console.error('Error updating subcategory:', error);
      toast({
        title: language === 'pt' ? 'Erro' : 'Error',
        description: language === 'pt' 
          ? 'Não foi possível atualizar a subcategoria.'
          : 'Could not update subcategory.',
        variant: 'destructive',
      });
      return false;
    }
  }, [user, language, toast, fetchAllSubcategories]);

  // Delete (soft delete) a subcategory
  const deleteSubcategory = useCallback(async (subcategoryId: string): Promise<boolean> => {
    if (!user || !subcategoryId) return false;

    try {
      const { error } = await supabase
        .from('subcategories')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', subcategoryId)
        .eq('user_id', user.id);

      if (error) throw error;

      await fetchAllSubcategories();
      return true;
    } catch (error) {
      console.error('Error deleting subcategory:', error);
      toast({
        title: language === 'pt' ? 'Erro' : 'Error',
        description: language === 'pt' 
          ? 'Não foi possível remover a subcategoria.'
          : 'Could not delete subcategory.',
        variant: 'destructive',
      });
      return false;
    }
  }, [user, language, toast, fetchAllSubcategories]);

  // Migrate existing tags to subcategories (for user)
  const migrateTagsToSubcategories = useCallback(async (): Promise<{ success: boolean; migrated_count: number }> => {
    if (!user) return { success: false, migrated_count: 0 };

    try {
      const { data, error } = await supabase.rpc('migrate_tags_to_subcategories');

      if (error) throw error;

      await fetchAllSubcategories();
      
      // Parse the JSON response - handle various return types
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        const result = data as Record<string, unknown>;
        if ('success' in result && 'migrated_count' in result) {
          return { 
            success: Boolean(result.success), 
            migrated_count: Number(result.migrated_count) || 0 
          };
        }
      }
      return { success: true, migrated_count: 0 };
    } catch (error) {
      console.error('Error migrating tags:', error);
      return { success: false, migrated_count: 0 };
    }
  }, [user, fetchAllSubcategories]);

  // Initial fetch
  useEffect(() => {
    if (user) {
      fetchAllSubcategories();
    }
  }, [user, fetchAllSubcategories]);

  // Real-time subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('subcategories-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'subcategories',
        },
        () => {
          fetchAllSubcategories();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchAllSubcategories]);

  return {
    subcategories,
    isLoading,
    fetchAllSubcategories,
    fetchSubcategoriesForCategory,
    getSubcategoriesForCategory,
    getLocalizedName,
    addSubcategory,
    updateSubcategory,
    deleteSubcategory,
    migrateTagsToSubcategories,
  };
};
