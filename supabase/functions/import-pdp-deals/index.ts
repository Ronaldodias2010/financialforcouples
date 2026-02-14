import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Update this on every deployment (or inject via CI)
const VERSION = "import-pdp-deals@2026-02-06.1";
const DEPLOYED_AT = new Date().toISOString();

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
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

function jsonResponse(payload: Record<string, unknown>, status = 200) {
  return new Response(
    JSON.stringify({
      ...payload,
      _version: VERSION,
      _deployed_at: DEPLOYED_AT,
    }),
    {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    },
  );
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

async function cleanupPromotions(supabase: ReturnType<typeof createClient>) {
  // Deactivate old promotions (older than 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { error: deactivateError } = await supabase
    .from('scraped_promotions')
    .update({ is_active: false })
    .lt('data_coleta', sevenDaysAgo.toISOString())
    .eq('is_active', true);

  if (deactivateError) {
    console.error('Error deactivating old promotions:', deactivateError);
  }

  // Delete very old promotions (older than 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { error: deleteError } = await supabase
    .from('scraped_promotions')
    .delete()
    .lt('data_coleta', thirtyDaysAgo.toISOString());

  if (deleteError) {
    console.error('Error deleting 30+ day promotions:', deleteError);
  }

  return {
    deactivated_ok: !deactivateError,
    deleted_ok: !deleteError,
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  console.log(`[${VERSION}] ${req.method} request at ${new Date().toISOString()}`);

  try {
    const body = await req.json().catch(() => ({}));

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !serviceRoleKey || !anonKey) {
      return jsonResponse({
        error: 'Missing environment variables',
        details: 'SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / SUPABASE_ANON_KEY not set',
      }, 500);
    }

    // Auth: require a valid logged-in user
    const authHeader = req.headers.get('Authorization') || '';
    const authClient = createClient(supabaseUrl, anonKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });

    const { data: authData, error: authError } = await authClient.auth.getUser();
    if (authError || !authData?.user) {
      console.warn(`[${VERSION}] Unauthorized request`);
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }

    // Service role client for DB writes
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Handle clean action
    if (body.action === 'clean') {
      console.log('Cleaning invalid promotions...');

      // First get IDs of invalid records
      const { data: invalidRecords, error: selectError } = await supabase
        .from('scraped_promotions')
        .select('id')
        .or('destino.ilike.%voo%,destino.ilike.%amanhã%,destino.ilike.%hoje%,destino.ilike.%ontem%');

      let deletedInvalidCount = 0;

      if (!selectError && invalidRecords && invalidRecords.length > 0) {
        const ids = invalidRecords.map((r: { id: string }) => r.id);
        const { error: deleteError } = await supabase
          .from('scraped_promotions')
          .delete()
          .in('id', ids);

        if (deleteError) {
          console.error('Error deleting invalid records:', deleteError);
        } else {
          deletedInvalidCount = ids.length;
        }
      } else if (selectError) {
        console.error('Error selecting invalid records:', selectError);
      }

      const cleanup = await cleanupPromotions(supabase);

      return jsonResponse({
        success: true,
        message: `Limpeza concluída. ${deletedInvalidCount} registros inválidos removidos.`,
        deleted_invalid: deletedInvalidCount,
        cleanup,
      });
    }

    // Support three modes:
    // 1. PULL mode: provide ngrok_url to fetch from
    // 2. PUSH mode: provide deals array directly
    // 3. FIRECRAWL mode: no ngrok_url and no deals → use Firecrawl to scrape directly

    let deals: IncomingDeal[] = [];

    if (body.ngrok_url) {
      // PULL mode: fetch from ngrok URL
      console.log(`Fetching deals from: ${body.ngrok_url}`);

      try {
        const response = await fetch(body.ngrok_url, {
          method: 'GET',
          headers: {
            Accept: 'application/json',
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
        return jsonResponse(
          { error: 'Failed to fetch from ngrok', details: fetchError?.message || String(fetchError) },
          502,
        );
      }
    } else if (body.deals && Array.isArray(body.deals)) {
      // PUSH mode: deals provided directly
      deals = body.deals;
    } else if (body.mode === 'firecrawl' || (!body.ngrok_url && !body.deals)) {
      // FIRECRAWL mode: delegate to firecrawl-promotions-scraper
      console.log('No ngrok_url or deals provided, delegating to firecrawl-promotions-scraper');

      const firecrawlResponse = await fetch(
        `${supabaseUrl}/functions/v1/firecrawl-promotions-scraper`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': authHeader,
          },
          body: JSON.stringify({ max_articles: body.max_articles || 20 }),
        }
      );

      const firecrawlData = await firecrawlResponse.json();
      return jsonResponse({
        ...firecrawlData,
        delegated_to: 'firecrawl-promotions-scraper',
      }, firecrawlResponse.status);
    }

    console.log(`Processing ${deals.length} deals from Passageiro de Primeira`);

    if (!deals.length) {
      return jsonResponse({ success: true, message: 'No deals to process', inserted: 0, skipped: 0 });
    }

    // Parse all deals
    const parsedDeals = deals
      .map(parseDeal)
      .filter((d): d is ParsedDeal => d !== null);

    console.log(`Parsed ${parsedDeals.length} valid deals with miles`);

    if (!parsedDeals.length) {
      return jsonResponse({
        success: true,
        message: 'No deals with valid miles found',
        inserted: 0,
        skipped: deals.length,
        raw_deals_received: deals.length,
      });
    }

    // Check for existing hashes to avoid duplicates
    const hashes = parsedDeals.map((d) => d.external_hash);
    const { data: existingDeals } = await supabase
      .from('scraped_promotions')
      .select('external_hash')
      .in('external_hash', hashes);

    const existingHashes = new Set(existingDeals?.map((d: { external_hash: string }) => d.external_hash) || []);
    const newDeals = parsedDeals.filter((d) => !existingHashes.has(d.external_hash));

    console.log(`${newDeals.length} new deals to insert, ${parsedDeals.length - newDeals.length} duplicates skipped`);

    if (!newDeals.length) {
      // Still run cleanup to keep table healthy
      const cleanup = await cleanupPromotions(supabase);

      return jsonResponse({
        success: true,
        message: 'All deals already exist',
        inserted: 0,
        skipped: parsedDeals.length,
        cleanup,
      });
    }

    // Insert new deals
    const { data: insertedData, error: insertError } = await supabase
      .from('scraped_promotions')
      .insert(newDeals)
      .select('id');

    if (insertError) {
      console.error('Error inserting deals:', insertError);
      return jsonResponse({ error: 'Failed to insert deals', details: insertError.message }, 500);
    }

    const insertedCount = insertedData?.length || 0;
    console.log(`Successfully inserted ${insertedCount} deals`);

    const cleanup = await cleanupPromotions(supabase);

    return jsonResponse({
      success: true,
      message: `Imported ${insertedCount} deals from Passageiro de Primeira`,
      inserted: insertedCount,
      skipped: deals.length - insertedCount,
      deals_parsed: parsedDeals.length,
      cleanup,
    });
  } catch (error) {
    console.error('Error processing deals:', error);
    return jsonResponse({ error: 'Internal server error', details: error?.message || String(error) }, 500);
  }
});
