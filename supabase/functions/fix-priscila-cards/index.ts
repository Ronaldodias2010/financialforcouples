import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Fix Mercado Pago credit_limit: should be 6000 (available=1000, spent=5000)
    const { error } = await supabaseAdmin
      .from('cards')
      .update({ credit_limit: 6000 })
      .eq('id', '75676cb4-431b-4146-ab02-80d77d035bf1');

    const { data: card } = await supabaseAdmin
      .from('cards')
      .select('id, name, credit_limit, initial_balance, current_balance')
      .eq('id', '75676cb4-431b-4146-ab02-80d77d035bf1')
      .single();

    const available = card ? card.initial_balance - card.current_balance : null;

    return new Response(JSON.stringify({ error: error?.message, card, available }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});