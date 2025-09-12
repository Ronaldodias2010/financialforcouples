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
  let bestRates: { USD: number; EUR: number; GBP: number } | null = null;
  const providers = [
    {
      name: 'Frankfurter',
      url: 'https://api.frankfurter.app/latest?from=BRL&to=USD,EUR,GBP',
      parser: (json: any) => json.rates
    },
    {
      name: 'ExchangeRate-API',
      url: 'https://v6.exchangerate-api.com/v6/latest/BRL',
      parser: (json: any) => json.rates
    },
    {
      name: 'ER-API',
      url: 'https://open.er-api.com/v6/latest/BRL',
      parser: (json: any) => json.rates
    },
    {
      name: 'Fixer (fallback)',
      url: 'https://api.fixer.io/latest?base=BRL&symbols=USD,EUR,GBP',
      parser: (json: any) => json.rates
    }
  ];

  for (const provider of providers) {
    try {
      console.log(`[update-exchange-rates] Trying provider: ${provider.name} -> ${provider.url}`);
      const json = await fetchJson(provider.url);
      console.log(`[update-exchange-rates] ${provider.name} response:`, JSON.stringify(json));
      
      if (!json) throw new Error(`No response from ${provider.name}`);
      
      const rates = provider.parser(json);
      if (!rates || typeof rates !== 'object') {
        throw new Error(`Missing rates object from ${provider.name}`);
      }

      const { USD, EUR, GBP } = rates as { USD?: number; EUR?: number; GBP?: number };
      
      if (typeof USD !== 'number' || typeof EUR !== 'number' || typeof GBP !== 'number') {
        throw new Error(`Invalid rates from ${provider.name}: USD=${USD}, EUR=${EUR}, GBP=${GBP}`);
      }

      // Validate rates are reasonable (USD should be between 0.10 and 0.30 for BRL)
      if (USD < 0.10 || USD > 0.30) {
        throw new Error(`Suspicious USD rate from ${provider.name}: ${USD}`);
      }

      console.log(`[update-exchange-rates] ✅ ${provider.name} success: USD=${USD} (1 USD = ${(1/USD).toFixed(2)} BRL)`);
      
      // Use the first valid rate we get
      if (!bestRates) {
        bestRates = { USD, EUR, GBP };
        break;
      }
    } catch (e) {
      console.warn(`[update-exchange-rates] ❌ ${provider.name} failed:`, e);
      continue;
    }
  }

  if (!bestRates) {
    throw new Error('Failed to fetch exchange rates from all providers');
  }

  return bestRates;
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
    const body = await req.json().catch(() => ({}));
    const isManual = body.manual || body.scheduled;
    
    console.log(`[update-exchange-rates] Starting ${isManual ? 'manual' : 'automatic'} update`);
    
    const rates = await fetchRates();

    await upsertRate('USD', rates.USD);
    await upsertRate('EUR', rates.EUR);
    await upsertRate('GBP', rates.GBP);

    const usdToBrl = (1 / rates.USD).toFixed(4);
    console.log(`[update-exchange-rates] ✅ Rates updated successfully. 1 USD = R$ ${usdToBrl}`);

    const responseBody = { 
      success: true, 
      rates,
      usd_to_brl: parseFloat(usdToBrl),
      updated_at: new Date().toISOString(),
      manual: isManual
    };
    
    return new Response(JSON.stringify(responseBody), { 
      status: 200, 
      headers: { 'Content-Type': 'application/json', ...corsHeaders } 
    });
  } catch (e) {
    console.error('[update-exchange-rates] Error:', e);
    return new Response(JSON.stringify({ 
      success: false, 
      error: String(e),
      timestamp: new Date().toISOString()
    }), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json', ...corsHeaders } 
    });
  }
});