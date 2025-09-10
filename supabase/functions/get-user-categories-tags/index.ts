import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CategoryTagResponse {
  category_id: string;
  category_name_pt: string;
  category_name_en: string;
  category_name_es: string;
  category_type: string;
  category_color: string;
  system_tags: any[];
  user_tags: any[];
  excluded_system_tags: string[];
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
      return new Response(
        JSON.stringify({ error: 'User ID is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Fetching categories and tags for user: ${userId}`);

    // Call the optimized function
    const { data, error } = await supabase.rpc('get_user_category_tags_complete', {
      p_user_id: userId
    });

    if (error) {
      console.error('Error fetching user categories and tags:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch categories and tags' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Transform the data for N8N-friendly format
    const categories = (data as CategoryTagResponse[]).map(row => ({
      id: row.category_id,
      name: {
        pt: row.category_name_pt,
        en: row.category_name_en,
        es: row.category_name_es
      },
      type: row.category_type,
      color: row.category_color,
      tags: {
        system: row.system_tags || [],
        user: row.user_tags || [],
        excluded: row.excluded_system_tags || []
      }
    }));

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