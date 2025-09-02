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

async function fetchJson(url: string, timeoutMs = 8000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(id);
  }
}

async function fetchRates() {
  // Try Frankfurter (no API key)
  try {
    const url = 'https://api.frankfurter.app/latest?from=BRL&to=USD,EUR,GBP';
    console.log('[update-exchange-rates] Provider: Frankfurter ->', url);
    const json = await fetchJson(url);
    console.log('[update-exchange-rates] Frankfurter response:', JSON.stringify(json));
    if (!json || !json.rates) throw new Error('Missing rates object from Frankfurter');
    const rates = json.rates as { USD?: number; EUR?: number; GBP?: number };
    if (typeof rates.USD !== 'number' || typeof rates.EUR !== 'number' || typeof rates.GBP !== 'number') {
      throw new Error(`Invalid rates from Frankfurter: USD=${rates.USD}, EUR=${rates.EUR}, GBP=${rates.GBP}`);
    }
    return { USD: rates.USD, EUR: rates.EUR, GBP: rates.GBP };
  } catch (e) {
    console.warn('[update-exchange-rates] Frankfurter failed, falling back. Reason:', e);
  }

  // Fallback: open.er-api (no API key)
  try {
    const url = 'https://open.er-api.com/v6/latest/BRL';
    console.log('[update-exchange-rates] Provider: ER-API ->', url);
    const json = await fetchJson(url);
    console.log('[update-exchange-rates] ER-API response:', JSON.stringify(json));
    if (!json || !json.rates) throw new Error('Missing rates object from ER-API');
    const rates = json.rates as { USD?: number; EUR?: number; GBP?: number };
    if (typeof rates.USD !== 'number' || typeof rates.EUR !== 'number' || typeof rates.GBP !== 'number') {
      throw new Error(`Invalid rates from ER-API: USD=${rates.USD}, EUR=${rates.EUR}, GBP=${rates.GBP}`);
    }
    return { USD: rates.USD, EUR: rates.EUR, GBP: rates.GBP };
  } catch (e) {
    console.error('[update-exchange-rates] All providers failed:', e);
    throw new Error('Failed to fetch exchange rates from all providers');
  }
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