import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/useLanguage';
import { useCouple } from '@/hooks/useCouple';
import { useRealtimeTable } from '@/hooks/useRealtimeManager';

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

  // Parse trigger error messages
  const parseErrorMessage = useCallback((error: { message?: string; code?: string }): { type: string; message: string } | null => {
    if (!error.message) return null;
    
    // Check for custom trigger errors
    if (error.message.includes('SUBCATEGORY_IS_CATEGORY:')) {
      const msg = error.message.split('SUBCATEGORY_IS_CATEGORY:')[1]?.trim();
      return { type: 'SUBCATEGORY_IS_CATEGORY', message: msg || '' };
    }
    if (error.message.includes('SUBCATEGORY_DUPLICATE:')) {
      const msg = error.message.split('SUBCATEGORY_DUPLICATE:')[1]?.trim();
      return { type: 'SUBCATEGORY_DUPLICATE', message: msg || '' };
    }
    // Unique constraint violation
    if (error.code === '23505') {
      return { type: 'UNIQUE_VIOLATION', message: '' };
    }
    return null;
  }, []);

  // Get localized error message
  const getErrorToast = useCallback((parsed: { type: string; message: string }): { title: string; description: string } => {
    switch (parsed.type) {
      case 'SUBCATEGORY_IS_CATEGORY':
        return {
          title: language === 'pt' ? 'Nome inválido' : language === 'es' ? 'Nombre inválido' : 'Invalid name',
          description: language === 'pt' 
            ? 'Este nome já existe como categoria. Escolha outro nome.'
            : language === 'es'
            ? 'Este nombre ya existe como categoría. Elija otro nombre.'
            : 'This name already exists as a category. Choose another name.',
        };
      case 'SUBCATEGORY_DUPLICATE':
        return {
          title: language === 'pt' ? 'Subcategoria duplicada' : language === 'es' ? 'Subcategoría duplicada' : 'Duplicate subcategory',
          description: parsed.message || (language === 'pt' 
            ? 'Esta subcategoria já existe em outra categoria.'
            : language === 'es'
            ? 'Esta subcategoría ya existe en otra categoría.'
            : 'This subcategory already exists in another category.'),
        };
      case 'UNIQUE_VIOLATION':
        return {
          title: language === 'pt' ? 'Subcategoria já existe' : language === 'es' ? 'Subcategoría ya existe' : 'Subcategory already exists',
          description: language === 'pt' 
            ? 'Uma subcategoria com este nome já existe nesta categoria.'
            : language === 'es'
            ? 'Una subcategoría con este nombre ya existe en esta categoría.'
            : 'A subcategory with this name already exists in this category.',
        };
      default:
        return {
          title: language === 'pt' ? 'Erro' : language === 'es' ? 'Error' : 'Error',
          description: language === 'pt' 
            ? 'Não foi possível adicionar a subcategoria.'
            : language === 'es'
            ? 'No se pudo agregar la subcategoría.'
            : 'Could not add subcategory.',
        };
    }
  }, [language]);

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
          name_en: nameEn?.trim() || null,
          name_es: nameEs?.trim() || null,
          color: color || '#6366f1',
          is_system: false,
        })
        .select()
        .single();

      if (error) {
        const parsed = parseErrorMessage(error);
        if (parsed) {
          const { title, description } = getErrorToast(parsed);
          toast({ title, description, variant: 'destructive' });
          return null;
        }
        throw error;
      }

      await fetchAllSubcategories();
      
      toast({
        title: language === 'pt' ? 'Sucesso' : language === 'es' ? 'Éxito' : 'Success',
        description: language === 'pt' 
          ? 'Subcategoria adicionada com sucesso.'
          : language === 'es'
          ? 'Subcategoría agregada con éxito.'
          : 'Subcategory added successfully.',
      });
      
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
  }, [user, language, toast, fetchAllSubcategories, parseErrorMessage, getErrorToast]);

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

  // Use centralized realtime manager
  useRealtimeTable('subcategories', () => {
    fetchAllSubcategories();
  }, !!user);

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
