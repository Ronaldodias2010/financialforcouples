import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    console.log('🔧 Testing Moblix credentials...');
    console.log('SUPABASE_URL:', supabaseUrl ? 'configured' : 'missing');
    console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'configured' : 'missing');
    
    const moblixUsername = Deno.env.get('MOBLIX_USERNAME');
    const moblixPassword = Deno.env.get('MOBLIX_PASSWORD');
    const moblixBaseUrl = Deno.env.get('MOBLIX_BASE_URL');

    console.log('MOBLIX_USERNAME:', moblixUsername ? 'configured' : 'missing');
    console.log('MOBLIX_PASSWORD:', moblixPassword ? 'configured' : 'missing');
    console.log('MOBLIX_BASE_URL:', moblixBaseUrl ? moblixBaseUrl : 'missing');

    if (!moblixUsername || !moblixPassword || !moblixBaseUrl) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing Moblix credentials',
        credentials: {
          username: !!moblixUsername,
          password: !!moblixPassword,
          baseUrl: !!moblixBaseUrl
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('🔐 Testing Moblix authentication...');
    
    // Test authentication
    const tokenResponse = await fetch(`${moblixBaseUrl}/api/Token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Origin': 'externo',
      },
      body: new URLSearchParams({
        grant_type: 'password',
        username: moblixUsername,
        password: moblixPassword,
      }),
    });

    console.log(`📊 Token response status: ${tokenResponse.status}`);
    
    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error(`❌ Auth failed: ${errorText}`);
      return new Response(JSON.stringify({
        success: false,
        error: 'Authentication failed',
        status: tokenResponse.status,
        response: errorText
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const tokenData = await tokenResponse.json();
    console.log('✅ Authentication successful');

    // Test offers endpoint
    console.log('📥 Testing offers endpoint...');
    const offersResponse = await fetch(`${moblixBaseUrl}/oferta/api/ofertas?international=false&quantidade=5&shuffle=false`, {
      method: 'GET',
      headers: {
        'Origin': 'externo',
      },
    });

    console.log(`📊 Offers response status: ${offersResponse.status}`);

    if (!offersResponse.ok) {
      const errorText = await offersResponse.text();
      console.error(`❌ Offers failed: ${errorText}`);
      return new Response(JSON.stringify({
        success: false,
        error: 'Offers request failed',
        status: offersResponse.status,
        response: errorText.substring(0, 500)
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const offersData = await offersResponse.json();
    console.log('🔍 Offers response structure:', {
      keys: Object.keys(offersData),
      dataLength: Array.isArray(offersData.Data) ? offersData.Data.length : 'not array'
    });

    // Try to call the actual sync function
    console.log('🚀 Calling sync-airline-promotions function...');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: syncResult, error: syncError } = await supabase.functions.invoke('sync-airline-promotions', {
      body: {}
    });

    console.log('📋 Sync result:', syncResult);
    if (syncError) {
      console.error('❌ Sync error:', syncError);
    }

    return new Response(JSON.stringify({
      success: true,
      moblix_test: {
        auth_success: true,
        offers_count: Array.isArray(offersData.Data) ? offersData.Data.length : 0,
        first_offer: offersData.Data?.[0] ? {
          IdGeral: offersData.Data[0].IdGeral,
          IataOrigem: offersData.Data[0].IataOrigem,
          IataDestino: offersData.Data[0].IataDestino,
          ValorAdulto: offersData.Data[0].ValorAdulto
        } : null
      },
      sync_result: syncResult,
      sync_error: syncError
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('💥 Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});