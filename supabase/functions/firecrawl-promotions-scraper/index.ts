import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// ── Parsing helpers ──────────────────────────────────────────────

function parseMiles(text: string): number | null {
  if (!text) return null;
  const lower = text.toLowerCase();

  // "X mil milhas/pontos" → X * 1000
  const milPattern = /(\d+(?:[.,]\d+)?)\s*mil\s*(milhas|pontos|miles)/i;
  const milMatch = lower.match(milPattern);
  if (milMatch) {
    return Math.round(parseFloat(milMatch[1].replace(',', '.')) * 1000);
  }

  // "35.000 milhas" or "4.510 Milhas"
  const directPattern = /(\d{1,3}(?:[.,]\d{3})*|\d+)\s*(milhas|pontos|miles)/i;
  const directMatch = lower.match(directPattern);
  if (directMatch) {
    const numStr = directMatch[1].replace(/\./g, '').replace(/,/g, '');
    return parseInt(numStr, 10);
  }

  // Standalone large number that looks like miles (e.g. "35000", "120.000")
  const standalonePattern = /\b(\d{1,3}(?:\.\d{3})+|\d{4,6})\b/;
  const standaloneMatch = text.match(standalonePattern);
  if (standaloneMatch) {
    const num = parseInt(standaloneMatch[1].replace(/\./g, ''), 10);
    if (num >= 1000 && num <= 500000) return num;
  }

  return null;
}

// Context-aware miles parser: looks for miles near relevant keywords
function parseMilesFromContext(markdown: string): number | null {
  // Split into sentences/lines and find ones with mile-related keywords
  const lines = markdown.split('\n');
  const mileKeywords = ['milha', 'ponto', 'miles', 'points', 'resgate', 'trecho', 'ida e volta', 'round trip'];
  
  for (const line of lines) {
    const lower = line.toLowerCase();
    if (mileKeywords.some(k => lower.includes(k))) {
      const miles = parseMiles(line);
      if (miles && miles >= 1000 && miles <= 500000) return miles;
    }
  }

  // Fallback: try title line
  const titleMatch = markdown.match(/^#\s+(.+)$/m);
  if (titleMatch) {
    const miles = parseMiles(titleMatch[1]);
    if (miles && miles >= 1000 && miles <= 500000) return miles;
  }

  return null;
}

function detectProgram(text: string): string {
  const l = text.toLowerCase();
  if (l.includes('smiles')) return 'Smiles';
  if (l.includes('latam') || l.includes('multiplus')) return 'LATAM Pass';
  if (l.includes('azul') || l.includes('tudoazul')) return 'TudoAzul';
  if (l.includes('livelo')) return 'Livelo';
  if (l.includes('esfera')) return 'Esfera';
  if (l.includes('aadvantage') || l.includes('american airlines')) return 'AAdvantage';
  return 'Diversos';
}

function extractRoute(text: string): { origem: string | null; destino: string | null } {
  // "São Paulo → Miami", "de Guarulhos para Lisboa"
  const arrowMatch = text.match(/(?:de\s+|saindo\s+de\s+)?([A-ZÀ-Ú][a-zà-ú]+(?:\s+[A-ZÀ-Ú][a-zà-ú]+)*)\s*(?:→|->|para|–)\s*([A-ZÀ-Ú][a-zà-ú]+(?:\s+[A-ZÀ-Ú][a-zà-ú]+)*)/);
  if (arrowMatch) {
    return { origem: arrowMatch[1].trim(), destino: arrowMatch[2].trim() };
  }

  // "passagem para Paris", "voo para Orlando"
  const toMatch = text.match(/(?:passagem|voo|viaje?|ida)\s+(?:para|a)\s+([A-ZÀ-Ú][a-zà-ú]+(?:\s+[A-ZÀ-Ú][a-zà-ú]+)*)/i);
  if (toMatch) {
    return { origem: null, destino: toMatch[1].trim() };
  }

  return { origem: null, destino: null };
}

function generateHash(titulo: string, miles: number): string {
  const str = `${titulo}-${miles}-${new Date().toISOString().split('T')[0]}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

// ── Extract articles (title + URL) from the listing markdown ──

interface ListingArticle {
  titulo: string;
  url: string;
}

function extractArticlesFromListing(markdown: string): ListingArticle[] {
  const articles: ListingArticle[] = [];
  const seen = new Set<string>();

  // Match markdown links in H1 headers: # [Title](URL)
  const linkRegex = /^#\s+\[([^\]]+)\]\((https?:\/\/(?:www\.)?passageirodeprimeira\.com\/[^\s)]+)\)/gm;
  let match;
  while ((match = linkRegex.exec(markdown)) !== null) {
    const titulo = match[1].trim();
    const url = match[2];

    // Skip category/tag/page/generic URLs
    if (
      url.includes('/categorias/') ||
      url.includes('/tag/') ||
      url.includes('/page/') ||
      url.includes('/autor/') ||
      url.endsWith('.com/') ||
      url.endsWith('.com')
    ) continue;

    // Deduplicate
    if (seen.has(url)) continue;
    seen.add(url);

    articles.push({ titulo, url });
  }

  return articles;
}

// ── Parse a single article markdown into a promotion ──────────

interface ParsedPromotion {
  programa: string;
  origem: string | null;
  destino: string;
  milhas_min: number;
  link: string;
  titulo: string;
  descricao: string | null;
  fonte: string;
  data_coleta: string;
  is_active: boolean;
  external_hash: string;
}

// Extract a percentage value from text (e.g., "70% de bônus" → 70)
function extractPercentage(text: string): number | null {
  const match = text.match(/(\d+)%/);
  return match ? parseInt(match[1], 10) : null;
}

// Extract cost per thousand points (milheiro) e.g., "R$ 33,60" → 3360 (in centavos)
function extractMilheiroCost(text: string): number | null {
  const match = text.match(/R\$\s*(\d+[.,]\d{2})/);
  if (match) {
    return Math.round(parseFloat(match[1].replace(',', '.')) * 100);
  }
  return null;
}

// Parse promotion from listing title + optional article content
function parsePromotion(titulo: string, url: string, articleMarkdown?: string): ParsedPromotion | null {
  if (!titulo || titulo.length < 10) return null;

  const lower = titulo.toLowerCase();

  // Skip non-promotion content
  const skipPatterns = ['whatsapp', 'canal gratuito', 'baixe o app', 'download', 'política de privacidade'];
  if (skipPatterns.some(p => lower.includes(p))) return null;

  const fullText = articleMarkdown ? `${titulo}\n${articleMarkdown}` : titulo;
  const programa = detectProgram(fullText);

  // Try to extract miles from title first, then article
  let miles = parseMilesFromContext(titulo) || (articleMarkdown ? parseMilesFromContext(articleMarkdown) : null);

  // For bonus/discount promotions without explicit miles, use a synthetic value
  // based on the percentage or cost info
  if (!miles) {
    const pct = extractPercentage(titulo);
    if (pct && pct >= 10) {
      // Use percentage as a relevance indicator (not actual miles)
      // Store as a synthetic value: percentage * 1000 for sorting
      miles = pct * 1000;
    }
  }

  // Still no value? Skip this article
  if (!miles || miles < 1000) return null;

  const route = extractRoute(fullText);

  // Build description from article content or title
  let descricao: string | null = null;
  if (articleMarkdown) {
    const paragraphs = articleMarkdown
      .split('\n')
      .filter(l => l.trim().length > 30 && !l.startsWith('#') && !l.startsWith('[') && !l.startsWith('!'))
      .slice(0, 2);
    descricao = paragraphs.join(' ').substring(0, 300) || titulo;
  } else {
    descricao = titulo;
  }

  const destino = route.destino || 'Promoção Geral';

  return {
    programa,
    origem: route.origem,
    destino,
    milhas_min: miles,
    link: url,
    titulo: titulo.substring(0, 200),
    descricao,
    fonte: 'passageirodeprimeira',
    data_coleta: new Date().toISOString(),
    is_active: true,
    external_hash: generateHash(titulo, miles),
  };
}

// ── Firecrawl helper ──────────────────────────────────────────

async function firecrawlScrape(apiKey: string, url: string): Promise<{ markdown?: string; error?: string }> {
  try {
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        formats: ['markdown'],
        onlyMainContent: true,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      return { error: data.error || `HTTP ${response.status}` };
    }

    // Firecrawl v1 nests content in data.data
    const markdown = data.data?.markdown || data.markdown || '';
    return { markdown };
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

// ── Main handler ──────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    let body: Record<string, unknown> = {};
    try { body = await req.json(); } catch { /* empty body is fine */ }

    if (!firecrawlApiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'FIRECRAWL_API_KEY not configured. Please enable the Firecrawl connector.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create scraping job record
    const { data: job } = await supabase
      .from('scraping_jobs')
      .insert({ status: 'running', started_at: new Date().toISOString() })
      .select()
      .single();

    const jobId = job?.id;
    const errors: { url: string; error: string }[] = [];
    const maxArticles = Number(body.max_articles) || 20;

    console.log(`[firecrawl-promotions-scraper] Job ${jobId} started. Max articles: ${maxArticles}`);

    // Step 1: Scrape the promotions listing page
    const listingUrl = 'https://passageirodeprimeira.com/categorias/promocoes/';
    console.log(`Scraping listing page: ${listingUrl}`);
    const listingResult = await firecrawlScrape(firecrawlApiKey, listingUrl);

    if (listingResult.error || !listingResult.markdown) {
      console.error('Failed to scrape listing page:', listingResult.error);
      errors.push({ url: listingUrl, error: listingResult.error || 'No markdown returned' });

      if (jobId) {
        await supabase.from('scraping_jobs').update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          pages_scraped: 0,
          promotions_found: 0,
          errors: errors,
        }).eq('id', jobId);
      }

      return new Response(
        JSON.stringify({ success: false, error: 'Failed to scrape listing page', details: listingResult.error }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 2: Extract articles from listing (title + URL)
    const articles = extractArticlesFromListing(listingResult.markdown).slice(0, maxArticles);
    console.log(`Found ${articles.length} unique articles on listing`);

    if (articles.length === 0) {
      if (jobId) {
        await supabase.from('scraping_jobs').update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          pages_scraped: 1,
          promotions_found: 0,
        }).eq('id', jobId);
      }

      return new Response(
        JSON.stringify({ success: true, message: 'No articles found on listing page', promotions_found: 0, mode: 'firecrawl' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 3: Parse promotions from titles first (no extra credits)
    // Then scrape individual articles only for those that need enrichment
    const parsedPromotions: ParsedPromotion[] = [];
    let pagesScraped = 1; // listing page
    const enrichArticles = body.enrich !== false; // default: true

    for (const article of articles) {
      // First try parsing from title alone
      let promo = parsePromotion(article.titulo, article.url);

      // If title-based parsing succeeded but we want richer data, scrape the article
      if (enrichArticles && promo) {
        console.log(`Enriching: ${article.titulo.substring(0, 60)}...`);
        const articleResult = await firecrawlScrape(firecrawlApiKey, article.url);
        pagesScraped++;

        if (articleResult.markdown && !articleResult.markdown.includes('is blocked')) {
          // Re-parse with full article content
          const enriched = parsePromotion(article.titulo, article.url, articleResult.markdown);
          if (enriched) promo = enriched;
        }
      } else if (!promo) {
        // Title alone didn't yield a result, try scraping the article
        if (enrichArticles) {
          console.log(`Scraping for parsing: ${article.titulo.substring(0, 60)}...`);
          const articleResult = await firecrawlScrape(firecrawlApiKey, article.url);
          pagesScraped++;

          if (articleResult.markdown && !articleResult.markdown.includes('is blocked')) {
            promo = parsePromotion(article.titulo, article.url, articleResult.markdown);
          }
        }
      }

      if (promo) {
        parsedPromotions.push(promo);
        console.log(`  ✓ ${promo.titulo.substring(0, 60)} (${promo.milhas_min} pts, ${promo.programa})`);
      } else {
        console.log(`  ✗ Skipped: ${article.titulo.substring(0, 60)}`);
      }
    }

    console.log(`Parsed ${parsedPromotions.length} promotions from ${pagesScraped} pages`);

    // Step 4: Deduplicate against existing promotions
    if (parsedPromotions.length > 0) {
      const hashes = parsedPromotions.map(p => p.external_hash);
      const { data: existing } = await supabase
        .from('scraped_promotions')
        .select('external_hash')
        .in('external_hash', hashes);

      const existingHashes = new Set(existing?.map((e: { external_hash: string }) => e.external_hash) || []);
      const newPromotions = parsedPromotions.filter(p => !existingHashes.has(p.external_hash));

      console.log(`${newPromotions.length} new, ${parsedPromotions.length - newPromotions.length} duplicates`);

      // Insert new promotions
      let insertedCount = 0;
      if (newPromotions.length > 0) {
        const { data: inserted, error: insertError } = await supabase
          .from('scraped_promotions')
          .insert(newPromotions)
          .select('id');

        if (insertError) {
          console.error('Insert error:', insertError);
          errors.push({ url: 'db-insert', error: insertError.message });
        } else {
          insertedCount = inserted?.length || 0;
        }
      }

      // Cleanup old promotions (>7 days inactive, >30 days delete)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      await supabase
        .from('scraped_promotions')
        .update({ is_active: false })
        .lt('data_coleta', sevenDaysAgo.toISOString())
        .eq('is_active', true);

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      await supabase
        .from('scraped_promotions')
        .delete()
        .lt('data_coleta', thirtyDaysAgo.toISOString());

      // Update job
      if (jobId) {
        await supabase.from('scraping_jobs').update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          pages_scraped: pagesScraped,
          promotions_found: insertedCount,
          errors: errors.length > 0 ? errors : null,
        }).eq('id', jobId);
      }

      return new Response(
        JSON.stringify({
          success: true,
          job_id: jobId,
          pages_scraped: pagesScraped,
          articles_found: articles.length,
          promotions_parsed: parsedPromotions.length,
          promotions_found: insertedCount,
          duplicates_skipped: parsedPromotions.length - newPromotions.length,
          errors_count: errors.length,
          mode: 'firecrawl',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // No promotions parsed
    if (jobId) {
      await supabase.from('scraping_jobs').update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        pages_scraped: pagesScraped,
        promotions_found: 0,
        errors: errors.length > 0 ? errors : null,
      }).eq('id', jobId);
    }

    return new Response(
      JSON.stringify({
        success: true,
        job_id: jobId,
        pages_scraped: pagesScraped,
        articles_found: articles.length,
        promotions_parsed: 0,
        promotions_found: 0,
        errors_count: errors.length,
        mode: 'firecrawl',
        message: 'No promotions with valid miles data found in articles',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Scraper error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
