import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Category {
  id: string;
  name: string;
  category_type: string;
  color: string;
  default_category_id?: string;
}

interface DefaultCategory {
  id: string;
  name_pt: string;
  name_en: string;
  name_es: string;
  category_type: string;
  color: string;
}

interface SystemTag {
  id: string;
  name_pt: string;
  name_en: string;
  name_es: string;
  color: string;
}

interface UserTag {
  id: string;
  tag_name: string;
  tag_name_en?: string;
  tag_name_es?: string;
  color: string;
  category_id: string;
}

interface CategoryResponse {
  id: string;
  name: {
    pt: string;
    en: string;
    es: string;
  };
  type: string;
  color: string;
  tags: {
    system: SystemTag[];
    user: UserTag[];
    excluded: string[];
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user ID from URL path
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const userId = pathParts[pathParts.length - 1];

    if (!userId || userId === 'get-user-categories-tags') {
      console.error('User ID is required');
      return new Response(
        JSON.stringify({ error: 'User ID is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Fetching categories and tags for user: ${userId}`);

    // Fetch user categories
    const { data: userCategories, error: categoriesError } = await supabase
      .from('categories')
      .select('id, name, category_type, color, default_category_id')
      .eq('user_id', userId);

    if (categoriesError) {
      console.error('Error fetching user categories:', categoriesError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch user categories', details: categoriesError.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Fetch default categories for name translations
    const { data: defaultCategories, error: defaultCategoriesError } = await supabase
      .from('default_categories')
      .select('id, name_pt, name_en, name_es, category_type, color');

    if (defaultCategoriesError) {
      console.error('Error fetching default categories:', defaultCategoriesError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch default categories', details: defaultCategoriesError.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Fetch system tags for all categories via relations
    const { data: tagRelations, error: tagRelationsError } = await supabase
      .from('category_tag_relations')
      .select(`
        category_id,
        category_tags!inner(
          id,
          name_pt,
          name_en,
          name_es,
          color
        )
      `)
      .eq('is_active', true);

    if (tagRelationsError) {
      console.error('Error fetching tag relations:', tagRelationsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch tag relations', details: tagRelationsError.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Fetch user tags
    const { data: userTags, error: userTagsError } = await supabase
      .from('user_category_tags')
      .select('id, tag_name, tag_name_en, tag_name_es, color, category_id')
      .eq('user_id', userId);

    if (userTagsError) {
      console.error('Error fetching user tags:', userTagsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch user tags', details: userTagsError.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Fetch user tag exclusions
    const { data: excludedTags, error: excludedTagsError } = await supabase
      .from('user_category_tag_exclusions')
      .select('system_tag_id, category_id')
      .eq('user_id', userId);

    if (excludedTagsError) {
      console.error('Error fetching excluded tags:', excludedTagsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch excluded tags', details: excludedTagsError.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Process categories and build response
    const categories: CategoryResponse[] = (userCategories as Category[]).map(category => {
      // Find default category for translations if available
      let defaultCategory: DefaultCategory | undefined;
      
      if (category.default_category_id) {
        defaultCategory = (defaultCategories as DefaultCategory[])?.find(
          dc => dc.id === category.default_category_id
        );
      }

      // If no default category found, try to find by normalized name and type
      if (!defaultCategory) {
        defaultCategory = (defaultCategories as DefaultCategory[])?.find(dc => 
          dc.category_type === category.category_type &&
          (dc.name_pt.toLowerCase() === category.name.toLowerCase() ||
           dc.name_en.toLowerCase() === category.name.toLowerCase() ||
           dc.name_es.toLowerCase() === category.name.toLowerCase())
        );
      }

      // Get system tags for this category (filter by default_category_id or user category_id)
      const categorySystemTags: SystemTag[] = [];
      
      if (category.default_category_id || defaultCategory?.id) {
        const targetCategoryId = category.default_category_id || defaultCategory?.id;
        const systemTagsForCategory = (tagRelations as any[])?.filter(
          rel => rel.category_id === targetCategoryId
        ) || [];
        
        systemTagsForCategory.forEach(rel => {
          if (rel.category_tags) {
            categorySystemTags.push({
              id: rel.category_tags.id,
              name_pt: rel.category_tags.name_pt,
              name_en: rel.category_tags.name_en,
              name_es: rel.category_tags.name_es,
              color: rel.category_tags.color
            });
          }
        });
      }

      // Get user tags for this category
      const categoryUserTags = (userTags as UserTag[])?.filter(
        tag => tag.category_id === category.id
      ) || [];

      // Get excluded system tag IDs for this category
      const excludedTagIds = (excludedTags as any[])?.filter(
        exc => exc.category_id === category.id
      ).map(exc => exc.system_tag_id) || [];

      // Filter out excluded system tags
      const filteredSystemTags = categorySystemTags.filter(
        tag => !excludedTagIds.includes(tag.id)
      );

      return {
        id: category.id,
        name: {
          pt: defaultCategory?.name_pt || category.name,
          en: defaultCategory?.name_en || category.name,
          es: defaultCategory?.name_es || category.name
        },
        type: category.category_type,
        color: category.color,
        tags: {
          system: filteredSystemTags,
          user: categoryUserTags,
          excluded: excludedTagIds
        }
      };
    });

    const response = {
      success: true,
      user_id: userId,
      categories,
      total_categories: categories.length,
      generated_at: new Date().toISOString()
    };

    console.log(`Successfully fetched ${categories.length} categories for user ${userId}`);

    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});