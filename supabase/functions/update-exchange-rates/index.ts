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

async function fetchRates() {
  const url = 'https://api.exchangerate.host/latest?base=BRL&symbols=USD,EUR,GBP';
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch rates: ${res.status}`);
  const json = await res.json();
  return json?.rates as { USD: number; EUR: number; GBP: number };
}

async function upsertRate(target: 'USD' | 'EUR' | 'GBP', rate: number) {
  const { error } = await supabase
    .from('exchange_rates')
    .upsert({ base_currency: 'BRL', target_currency: target, rate, last_updated: new Date().toISOString() }, {
      onConflict: 'base_currency,target_currency'
    });
  if (error) throw error;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rates = await fetchRates();

    await upsertRate('USD', rates.USD);
    await upsertRate('EUR', rates.EUR);
    await upsertRate('GBP', rates.GBP);

    const body = { success: true, rates };
    return new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
  } catch (e) {
    console.error('[update-exchange-rates] Error:', e);
    return new Response(JSON.stringify({ success: false, error: String(e) }), { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
  }
});