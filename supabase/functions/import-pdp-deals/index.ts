import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface IncomingDeal {
  origin?: string;
  destination?: string;
  cost_raw?: string;
  source_url?: string;
  full_text?: string;
}

interface ParsedDeal {
  programa: string;
  origem: string | null;
  destino: string;
  milhas_min: number;
  link: string;
  titulo: string | null;
  descricao: string | null;
  fonte: string;
  data_coleta: string;
  is_active: boolean;
  external_hash: string;
}

// Parse miles from cost_raw string
function parseMiles(costRaw: string): number | null {
  if (!costRaw) return null;
  
  const text = costRaw.toLowerCase();
  
  // Pattern: "X.XXX Milhas" or "X mil milhas/pontos"
  // Examples:
  // "4.510 Milhas" -> 4510
  // "51 mil pontos Azul" -> 51000
  // "35.000 milhas" -> 35000
  
  // Try "X mil" pattern first (e.g., "51 mil pontos")
  const milPattern = /(\d+(?:[.,]\d+)?)\s*mil\s*(milhas|pontos|miles)/i;
  const milMatch = text.match(milPattern);
  if (milMatch) {
    const value = parseFloat(milMatch[1].replace(',', '.'));
    return Math.round(value * 1000);
  }
  
  // Try direct number pattern (e.g., "4.510 Milhas", "35.000 milhas")
  const directPattern = /(\d{1,3}(?:[.,]\d{3})*|\d+)\s*(milhas|pontos|miles)/i;
  const directMatch = text.match(directPattern);
  if (directMatch) {
    // Remove dots/commas used as thousands separators
    const numStr = directMatch[1].replace(/\./g, '').replace(/,/g, '');
    return parseInt(numStr, 10);
  }
  
  return null;
}

// Detect program from text
function detectProgram(text: string): string {
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes('smiles')) return 'Smiles';
  if (lowerText.includes('latam') || lowerText.includes('pass')) return 'LATAM Pass';
  if (lowerText.includes('azul') || lowerText.includes('tudoazul')) return 'TudoAzul';
  if (lowerText.includes('livelo')) return 'Livelo';
  
  return 'Diversos';
}

// Generate hash for deduplication
function generateHash(deal: IncomingDeal, miles: number): string {
  const str = `${deal.origin || ''}-${deal.destination || ''}-${miles}-${new Date().toISOString().split('T')[0]}`;
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

// Parse incoming deal to our format
function parseDeal(deal: IncomingDeal): ParsedDeal | null {
  const costRaw = deal.cost_raw || deal.full_text || '';
  const miles = parseMiles(costRaw);
  
  // Skip if no miles found
  if (!miles || miles <= 0) {
    console.log(`Skipping deal without miles: ${costRaw}`);
    return null;
  }
  
  const fullText = deal.full_text || deal.cost_raw || '';
  const programa = detectProgram(fullText);
  
  return {
    programa,
    origem: deal.origin || null,
    destino: deal.destination || 'Destino não especificado',
    milhas_min: miles,
    link: deal.source_url || '',
    titulo: deal.full_text ? deal.full_text.substring(0, 200) : null,
    descricao: costRaw,
    fonte: 'passageirodeprimeira',
    data_coleta: new Date().toISOString(),
    is_active: true,
    external_hash: generateHash(deal, miles),
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  
  try {
    const body = await req.json().catch(() => ({}));
    
    // Support both modes:
    // 1. PULL mode: provide ngrok_url to fetch from
    // 2. PUSH mode: provide deals array directly
    
    let deals: IncomingDeal[] = [];
    
    if (body.ngrok_url) {
      // PULL mode: fetch from ngrok URL
      console.log(`Fetching deals from: ${body.ngrok_url}`);
      
      try {
        const response = await fetch(body.ngrok_url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'ngrok-skip-browser-warning': 'true',
          },
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch from ngrok: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Raw response from ngrok:', JSON.stringify(data).substring(0, 500));
        
        // The API might return deals directly as array or nested in a property
        if (Array.isArray(data)) {
          deals = data;
        } else if (data.deals && Array.isArray(data.deals)) {
          deals = data.deals;
        } else if (data.data && Array.isArray(data.data)) {
          deals = data.data;
        } else {
          console.log('Unexpected data format:', typeof data);
          deals = [];
        }
      } catch (fetchError) {
        console.error('Fetch error:', fetchError);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch from ngrok', details: fetchError.message }),
          { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else if (body.deals && Array.isArray(body.deals)) {
      // PUSH mode: deals provided directly
      deals = body.deals;
    }
    
    console.log(`Processing ${deals.length} deals from Passageiro de Primeira`);
    
    if (!deals.length) {
      return new Response(
        JSON.stringify({ success: true, message: 'No deals to process', inserted: 0, skipped: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Parse all deals
    const parsedDeals = deals
      .map(parseDeal)
      .filter((d): d is ParsedDeal => d !== null);
    
    console.log(`Parsed ${parsedDeals.length} valid deals with miles`);
    
    if (!parsedDeals.length) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No deals with valid miles found', 
          inserted: 0, 
          skipped: deals.length,
          raw_deals_received: deals.length,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Check for existing hashes to avoid duplicates
    const hashes = parsedDeals.map(d => d.external_hash);
    const { data: existingDeals } = await supabase
      .from('scraped_promotions')
      .select('external_hash')
      .in('external_hash', hashes);
    
    const existingHashes = new Set(existingDeals?.map(d => d.external_hash) || []);
    const newDeals = parsedDeals.filter(d => !existingHashes.has(d.external_hash));
    
    console.log(`${newDeals.length} new deals to insert, ${parsedDeals.length - newDeals.length} duplicates skipped`);
    
    if (!newDeals.length) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'All deals already exist', 
          inserted: 0, 
          skipped: parsedDeals.length 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Insert new deals
    const { data: insertedData, error: insertError } = await supabase
      .from('scraped_promotions')
      .insert(newDeals)
      .select('id');
    
    if (insertError) {
      console.error('Error inserting deals:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to insert deals', details: insertError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const insertedCount = insertedData?.length || 0;
    console.log(`Successfully inserted ${insertedCount} deals`);
    
    return new Response(
      JSON.stringify({
        success: true,
        message: `Imported ${insertedCount} deals from Passageiro de Primeira`,
        inserted: insertedCount,
        skipped: deals.length - insertedCount,
        deals_parsed: parsedDeals.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error processing deals:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
