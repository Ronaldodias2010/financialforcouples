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
  source?: 'subcategory' | 'system_tag' | 'user_tag';
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

  // Unified fetch: subcategories + system tags + user tags for a specific category
  const fetchSubcategoriesForCategory = useCallback(async (categoryId: string): Promise<Subcategory[]> => {
    if (!user || !categoryId) return [];

    const userIds = getUserIds();
    if (userIds.length === 0) return [];

    try {
      // 1. Get category info to find default_category_id
      const { data: categoryData } = await supabase
        .from('categories')
        .select('id, default_category_id')
        .eq('id', categoryId)
        .single();

      // 2. Get excluded system tag IDs for this category
      const { data: exclusionsData } = await supabase
        .from('user_category_tag_exclusions')
        .select('system_tag_id')
        .eq('user_id', user.id)
        .eq('category_id', categoryId);

      const excludedTagIds = new Set((exclusionsData || []).map(e => e.system_tag_id));

      // 3. Fetch from subcategories table (the actual FK target)
      const { data: subcategoriesData } = await supabase
        .from('subcategories')
        .select('id, name, name_en, name_es, color, icon, is_system, category_id')
        .eq('category_id', categoryId)
        .in('user_id', userIds)
        .is('deleted_at', null);

      const dbSubcategories: Subcategory[] = (subcategoriesData || []).map(sub => ({
        id: sub.id,
        name: sub.name,
        name_en: sub.name_en,
        name_es: sub.name_es,
        color: sub.color,
        icon: sub.icon,
        is_system: sub.is_system ?? false,
        category_id: sub.category_id,
        source: 'subcategory' as const,
      }));

      // 4. Get system tags via category_tag_relations (using default_category_id)
      let systemTags: Subcategory[] = [];
      const defaultCatId = categoryData?.default_category_id;
      if (defaultCatId) {
        const { data: tagRelations } = await supabase
          .from('category_tag_relations')
          .select(`
            category_tags!inner (
              id,
              name_pt,
              name_en,
              name_es,
              color
            )
          `)
          .eq('category_id', defaultCatId)
          .eq('is_active', true);

        if (tagRelations) {
          systemTags = (tagRelations as any[])
            .map(rel => rel.category_tags)
            .filter(tag => tag && !excludedTagIds.has(tag.id))
            .map(tag => ({
              id: tag.id,
              name: tag.name_pt,
              name_en: tag.name_en,
              name_es: tag.name_es,
              color: tag.color,
              icon: null,
              is_system: true,
              category_id: categoryId,
              source: 'system_tag' as const,
            }));
        }
      }

      // 5. Get user custom tags for this category
      const { data: userTagsData } = await supabase
        .from('user_category_tags')
        .select('id, tag_name, tag_name_en, tag_name_es, color, category_id')
        .eq('category_id', categoryId)
        .in('user_id', userIds);

      const userTags: Subcategory[] = (userTagsData || []).map(tag => ({
        id: tag.id,
        name: tag.tag_name,
        name_en: tag.tag_name_en || null,
        name_es: tag.tag_name_es || null,
        color: tag.color,
        icon: null,
        is_system: false,
        category_id: tag.category_id,
        source: 'user_tag' as const,
      }));

      // 6. Merge and deduplicate by normalized name
      const normalize = (s: string) =>
        s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

      const seen = new Map<string, Subcategory>();
      
      // Add DB subcategories first (these are FK-safe)
      dbSubcategories.forEach(sub => {
        seen.set(normalize(sub.name), sub);
      });

      // Add system tags (don't override DB subcategories)
      systemTags.forEach(tag => {
        const key = normalize(tag.name);
        if (!seen.has(key)) {
          seen.set(key, tag);
        }
      });
      
      // Add user tags (don't override DB subcategories)
      userTags.forEach(tag => {
        const key = normalize(tag.name);
        if (!seen.has(key)) {
          seen.set(key, tag);
        }
      });

      const merged = Array.from(seen.values());
      
      // Sort: subcategory source first, then system, then alphabetical
      merged.sort((a, b) => {
        if (a.source === 'subcategory' && b.source !== 'subcategory') return -1;
        if (a.source !== 'subcategory' && b.source === 'subcategory') return 1;
        if (a.is_system !== b.is_system) return a.is_system ? -1 : 1;
        return a.name.localeCompare(b.name);
      });

      return merged;
    } catch (error) {
      console.error('Error fetching unified subcategories/tags for category:', error);
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
    
    if (error.message.includes('SUBCATEGORY_IS_CATEGORY:')) {
      const msg = error.message.split('SUBCATEGORY_IS_CATEGORY:')[1]?.trim();
      return { type: 'SUBCATEGORY_IS_CATEGORY', message: msg || '' };
    }
    if (error.message.includes('SUBCATEGORY_DUPLICATE:')) {
      const msg = error.message.split('SUBCATEGORY_DUPLICATE:')[1]?.trim();
      return { type: 'SUBCATEGORY_DUPLICATE', message: msg || '' };
    }
    if (error.message.includes('TAG_IS_CATEGORY:')) {
      return { type: 'SUBCATEGORY_IS_CATEGORY', message: error.message.split('TAG_IS_CATEGORY:')[1]?.trim() || '' };
    }
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
          title: language === 'pt' ? 'Tag duplicada' : language === 'es' ? 'Tag duplicada' : 'Duplicate tag',
          description: parsed.message || (language === 'pt' 
            ? 'Esta tag já existe nesta categoria.'
            : language === 'es'
            ? 'Esta tag ya existe en esta categoría.'
            : 'This tag already exists in this category.'),
        };
      case 'UNIQUE_VIOLATION':
        return {
          title: language === 'pt' ? 'Tag já existe' : language === 'es' ? 'Tag ya existe' : 'Tag already exists',
          description: language === 'pt' 
            ? 'Uma tag com este nome já existe nesta categoria.'
            : language === 'es'
            ? 'Una tag con este nombre ya existe en esta categoría.'
            : 'A tag with this name already exists in this category.',
        };
      default:
        return {
          title: language === 'pt' ? 'Erro' : language === 'es' ? 'Error' : 'Error',
          description: language === 'pt' 
            ? 'Não foi possível adicionar a tag.'
            : language === 'es'
            ? 'No se pudo agregar la tag.'
            : 'Could not add tag.',
        };
    }
  }, [language]);

  // Add a new tag/subcategory (uses user_category_tags for consistency with CategoryManager)
  const addSubcategory = useCallback(async (
    categoryId: string, 
    name: string, 
    color?: string,
    nameEn?: string,
    nameEs?: string
  ): Promise<Subcategory | null> => {
    if (!user || !categoryId || !name.trim()) return null;

    try {
      // Try using the normalized insertion function first
      const { data, error } = await (supabase as any).rpc('insert_normalized_user_tag', {
        p_user_id: user.id,
        p_category_id: categoryId,
        p_tag_name: name.trim(),
        p_color: color || '#6366f1'
      });

      if (error) {
        // Fallback to direct insert in user_category_tags
        const { data: directData, error: directError } = await supabase
          .from('user_category_tags')
          .insert({
            user_id: user.id,
            category_id: categoryId,
            tag_name: name.trim(),
            tag_name_en: nameEn?.trim() || null,
            tag_name_es: nameEs?.trim() || null,
            color: color || '#6366f1',
          })
          .select()
          .single();

        if (directError) {
          const parsed = parseErrorMessage(directError);
          if (parsed) {
            const { title, description } = getErrorToast(parsed);
            toast({ title, description, variant: 'destructive' });
            return null;
          }
          throw directError;
        }

        // Map to Subcategory format
        const result: Subcategory = {
          id: directData.id,
          name: directData.tag_name,
          name_en: directData.tag_name_en,
          name_es: directData.tag_name_es,
          color: directData.color,
          icon: null,
          is_system: false,
          category_id: directData.category_id,
          source: 'user_tag',
        };

        await fetchAllSubcategories();
        toast({
          title: language === 'pt' ? 'Sucesso' : language === 'es' ? 'Éxito' : 'Success',
          description: language === 'pt' ? 'Tag adicionada com sucesso.' : language === 'es' ? 'Tag agregada con éxito.' : 'Tag added successfully.',
        });
        return result;
      }

      await fetchAllSubcategories();
      toast({
        title: language === 'pt' ? 'Sucesso' : language === 'es' ? 'Éxito' : 'Success',
        description: language === 'pt' ? 'Tag adicionada com sucesso.' : language === 'es' ? 'Tag agregada con éxito.' : 'Tag added successfully.',
      });
      return null; // RPC doesn't return the full object
    } catch (error) {
      console.error('Error adding tag:', error);
      toast({
        title: language === 'pt' ? 'Erro' : 'Error',
        description: language === 'pt' ? 'Não foi possível adicionar a tag.' : 'Could not add tag.',
        variant: 'destructive',
      });
      return null;
    }
  }, [user, language, toast, fetchAllSubcategories, parseErrorMessage, getErrorToast]);

  // Update a subcategory/tag
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
        description: language === 'pt' ? 'Não foi possível atualizar.' : 'Could not update.',
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
        description: language === 'pt' ? 'Não foi possível remover.' : 'Could not delete.',
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

  // Also listen to user_category_tags changes for real-time sync
  useRealtimeTable('user_category_tags', () => {
    fetchAllSubcategories();
  }, !!user);

  // Also listen to user_category_tag_exclusions changes
  useRealtimeTable('user_category_tag_exclusions', () => {
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
