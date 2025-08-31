import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[schedule-exchange-rates] Starting scheduled rate update');
    
    // Call the update-exchange-rates function
    const { data, error } = await supabase.functions.invoke('update-exchange-rates', {
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ scheduled: true })
    });

    if (error) {
      console.error('[schedule-exchange-rates] Error calling update function:', error);
      throw error;
    }

    console.log('[schedule-exchange-rates] Successfully updated exchange rates:', data);

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Exchange rates updated successfully',
      data 
    }), { 
      status: 200, 
      headers: { 'Content-Type': 'application/json', ...corsHeaders } 
    });

  } catch (error) {
    console.error('[schedule-exchange-rates] Error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: String(error) 
    }), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json', ...corsHeaders } 
    });
  }
});