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

// Get today's date and recent dates for BCB API
function getDateStrings() {
  const today = new Date();
  const dates: string[] = [];
  
  // Try today and last 5 business days
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    // Format: MM-DD-YYYY for BCB
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const year = d.getFullYear();
    dates.push(`${month}-${day}-${year}`);
  }
  
  return dates;
}

// Check if a date is recent (within last 2 days)
function isRecentDate(dateStr: string): boolean {
  const rateDate = new Date(dateStr);
  const today = new Date();
  const diffDays = Math.floor((today.getTime() - rateDate.getTime()) / (1000 * 60 * 60 * 24));
  return diffDays <= 2;
}

async function fetchJson(url: string, timeoutMs = 10000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { 
      signal: controller.signal,
      headers: {
        'User-Agent': 'CouplesFinancials/1.0',
        'Accept': 'application/json'
      }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(id);
  }
}

interface RatesResult {
  USD: number;
  EUR: number;
  GBP: number;
  rateDate: string; // ISO date string
  provider: string;
}

async function fetchFromBCB(): Promise<RatesResult | null> {
  const dates = getDateStrings();
  
  for (const dateStr of dates) {
    try {
      // BCB PTAX API - Official Brazilian Central Bank rates
      const url = `https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/CotacaoDolarDia(dataCotacao=@data)?@data='${dateStr}'&$format=json`;
      console.log(`[BCB] Trying date ${dateStr}: ${url}`);
      
      const json = await fetchJson(url, 12000);
      
      if (json.value && json.value.length > 0) {
        const cotacao = json.value[json.value.length - 1]; // Get last quotation of the day
        const usdToBrl = cotacao.cotacaoCompra; // Buy rate
        
        if (!usdToBrl || usdToBrl < 4 || usdToBrl > 8) {
          console.warn(`[BCB] Invalid USD rate: ${usdToBrl}`);
          continue;
        }
        
        // Parse the date from BCB response
        const rateDate = dateStr.split('-');
        const isoDate = `${rateDate[2]}-${rateDate[0]}-${rateDate[1]}`; // Convert to YYYY-MM-DD
        
        console.log(`[BCB] ✅ Found rate for ${dateStr}: 1 USD = R$ ${usdToBrl}`);
        
        // BCB only has USD. For EUR/GBP, we need to fetch from another source
        // But we prioritize BCB's USD rate
        return {
          USD: 1 / usdToBrl,
          EUR: 0, // Will be filled later
          GBP: 0, // Will be filled later
          rateDate: isoDate,
          provider: 'BCB'
        };
      }
    } catch (e) {
      console.warn(`[BCB] Error for date ${dateStr}:`, e);
    }
  }
  
  return null;
}

async function fetchFromAwesomeAPI(): Promise<RatesResult | null> {
  try {
    const url = 'https://economia.awesomeapi.com.br/json/last/USD-BRL,EUR-BRL,GBP-BRL';
    console.log(`[AwesomeAPI] Fetching: ${url}`);
    
    const json = await fetchJson(url);
    
    if (json.USDBRL && json.EURBRL && json.GBPBRL) {
      const usdRate = parseFloat(json.USDBRL.bid);
      const eurRate = parseFloat(json.EURBRL.bid);
      const gbpRate = parseFloat(json.GBPBRL.bid);
      
      // Get the timestamp from the response
      const timestamp = json.USDBRL.create_date || new Date().toISOString();
      const rateDate = timestamp.split(' ')[0]; // Extract date part
      
      console.log(`[AwesomeAPI] ✅ Success: 1 USD = R$ ${usdRate}, Date: ${rateDate}`);
      
      return {
        USD: 1 / usdRate,
        EUR: 1 / eurRate,
        GBP: 1 / gbpRate,
        rateDate,
        provider: 'AwesomeAPI'
      };
    }
    
    throw new Error('Invalid response format');
  } catch (e) {
    console.warn('[AwesomeAPI] Error:', e);
    return null;
  }
}

async function fetchFromExchangeRateHost(): Promise<RatesResult | null> {
  try {
    // exchangerate.host free API
    const url = 'https://api.exchangerate.host/latest?base=BRL&symbols=USD,EUR,GBP';
    console.log(`[ExchangeRate.host] Fetching: ${url}`);
    
    const json = await fetchJson(url);
    
    if (json.success !== false && json.rates) {
      const { USD, EUR, GBP } = json.rates;
      const rateDate = json.date || new Date().toISOString().split('T')[0];
      
      if (USD && EUR && GBP) {
        console.log(`[ExchangeRate.host] ✅ Success: USD=${USD}, Date: ${rateDate}`);
        
        return {
          USD,
          EUR,
          GBP,
          rateDate,
          provider: 'ExchangeRate.host'
        };
      }
    }
    
    throw new Error('Invalid response format');
  } catch (e) {
    console.warn('[ExchangeRate.host] Error:', e);
    return null;
  }
}

async function fetchFromFrankfurter(): Promise<RatesResult | null> {
  try {
    const url = 'https://api.frankfurter.app/latest?from=BRL&to=USD,EUR,GBP';
    console.log(`[Frankfurter] Fetching: ${url}`);
    
    const json = await fetchJson(url);
    
    if (json.rates) {
      const { USD, EUR, GBP } = json.rates;
      const rateDate = json.date || new Date().toISOString().split('T')[0];
      
      if (USD && EUR && GBP) {
        console.log(`[Frankfurter] ✅ Success: USD=${USD}, Date: ${rateDate}`);
        
        return {
          USD,
          EUR,
          GBP,
          rateDate,
          provider: 'Frankfurter'
        };
      }
    }
    
    throw new Error('Invalid response format');
  } catch (e) {
    console.warn('[Frankfurter] Error:', e);
    return null;
  }
}

async function fetchFromOpenErApi(): Promise<RatesResult | null> {
  try {
    const url = 'https://open.er-api.com/v6/latest/BRL';
    console.log(`[Open ER-API] Fetching: ${url}`);
    
    const json = await fetchJson(url);
    
    if (json.result === 'success' && json.rates) {
      const { USD, EUR, GBP } = json.rates;
      // Extract date from time_last_update_utc
      const rateDate = json.time_last_update_utc 
        ? new Date(json.time_last_update_utc).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0];
      
      if (USD && EUR && GBP) {
        console.log(`[Open ER-API] ✅ Success: USD=${USD}, Date: ${rateDate}`);
        
        return {
          USD,
          EUR,
          GBP,
          rateDate,
          provider: 'Open ER-API'
        };
      }
    }
    
    throw new Error('Invalid response format');
  } catch (e) {
    console.warn('[Open ER-API] Error:', e);
    return null;
  }
}

async function fetchRates(): Promise<RatesResult> {
  console.log('[update-exchange-rates] Starting rate fetch with priority: BCB -> AwesomeAPI -> ExchangeRate.host -> Open ER-API -> Frankfurter');
  
  // Strategy: Try BCB first for official USD rate, then complement EUR/GBP
  let bcbResult = await fetchFromBCB();
  
  // Try other providers for complete rates
  const providers = [
    fetchFromAwesomeAPI,
    fetchFromExchangeRateHost,
    fetchFromOpenErApi,
    fetchFromFrankfurter,
  ];
  
  let completeResult: RatesResult | null = null;
  
  for (const fetchProvider of providers) {
    const result = await fetchProvider();
    if (result) {
      // Check if rate is recent
      if (!isRecentDate(result.rateDate)) {
        console.warn(`[${result.provider}] Rate date ${result.rateDate} is too old, trying next provider...`);
        
        // Keep it as fallback if we don't find anything better
        if (!completeResult) {
          completeResult = result;
        }
        continue;
      }
      
      completeResult = result;
      break;
    }
  }
  
  // If we got BCB USD rate, use it as the most reliable
  if (bcbResult && completeResult) {
    console.log(`[update-exchange-rates] Using BCB USD rate (${bcbResult.USD}) with ${completeResult.provider} EUR/GBP rates`);
    return {
      USD: bcbResult.USD,
      EUR: completeResult.EUR,
      GBP: completeResult.GBP,
      rateDate: bcbResult.rateDate,
      provider: `BCB + ${completeResult.provider}`
    };
  }
  
  // If BCB failed but we have complete rates from another provider
  if (completeResult) {
    console.log(`[update-exchange-rates] Using ${completeResult.provider} for all rates`);
    return completeResult;
  }
  
  // If we only have BCB, we need to estimate EUR/GBP
  if (bcbResult) {
    console.warn('[update-exchange-rates] Only BCB available, estimating EUR/GBP from historical ratios');
    // Approximate EUR/GBP based on typical USD ratios
    return {
      USD: bcbResult.USD,
      EUR: bcbResult.USD * 0.92, // EUR is typically ~0.92 of USD
      GBP: bcbResult.USD * 0.79, // GBP is typically ~0.79 of USD
      rateDate: bcbResult.rateDate,
      provider: 'BCB (estimated)'
    };
  }
  
  throw new Error('Failed to fetch exchange rates from all providers');
}

async function upsertRate(target: 'USD' | 'EUR' | 'GBP', rate: number, rateDate: string) {
  const { error } = await supabase
    .from('exchange_rates')
    .upsert({ 
      base_currency: 'BRL', 
      target_currency: target, 
      rate, 
      last_updated: new Date().toISOString(),
      rate_date: rateDate
    }, {
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
    
    console.log(`[update-exchange-rates] Starting ${isManual ? 'manual' : 'automatic'} update at ${new Date().toISOString()}`);
    
    const rates = await fetchRates();

    await upsertRate('USD', rates.USD, rates.rateDate);
    await upsertRate('EUR', rates.EUR, rates.rateDate);
    await upsertRate('GBP', rates.GBP, rates.rateDate);

    const usdToBrl = (1 / rates.USD).toFixed(4);
    console.log(`[update-exchange-rates] ✅ Rates updated successfully from ${rates.provider}. 1 USD = R$ ${usdToBrl} (Date: ${rates.rateDate})`);

    const responseBody = { 
      success: true, 
      rates: {
        USD: rates.USD,
        EUR: rates.EUR,
        GBP: rates.GBP
      },
      usd_to_brl: parseFloat(usdToBrl),
      rate_date: rates.rateDate,
      provider: rates.provider,
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
