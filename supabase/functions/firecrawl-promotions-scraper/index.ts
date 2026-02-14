import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// ── Known destinations for matching ──────────────────────────────

const KNOWN_DESTINATIONS: { name: string; aliases: string[] }[] = [
  // Americas
  { name: 'Miami', aliases: ['miami'] },
  { name: 'Orlando', aliases: ['orlando'] },
  { name: 'New York', aliases: ['new york', 'nova york', 'nova iorque', 'nyc'] },
  { name: 'Los Angeles', aliases: ['los angeles', 'la'] },
  { name: 'Las Vegas', aliases: ['las vegas', 'vegas'] },
  { name: 'San Francisco', aliases: ['san francisco', 'são francisco'] },
  { name: 'Chicago', aliases: ['chicago'] },
  { name: 'Boston', aliases: ['boston'] },
  { name: 'Washington', aliases: ['washington'] },
  { name: 'Houston', aliases: ['houston'] },
  { name: 'Dallas', aliases: ['dallas'] },
  { name: 'Atlanta', aliases: ['atlanta'] },
  { name: 'Denver', aliases: ['denver'] },
  { name: 'Seattle', aliases: ['seattle'] },
  { name: 'Cancún', aliases: ['cancun', 'cancún'] },
  { name: 'Cidade do México', aliases: ['cidade do mexico', 'ciudad de mexico', 'mexico city'] },
  { name: 'Punta Cana', aliases: ['punta cana'] },
  { name: 'Havana', aliases: ['havana'] },
  { name: 'Aruba', aliases: ['aruba'] },
  { name: 'Curaçao', aliases: ['curacao', 'curaçao'] },
  { name: 'Buenos Aires', aliases: ['buenos aires'] },
  { name: 'Santiago', aliases: ['santiago'] },
  { name: 'Lima', aliases: ['lima'] },
  { name: 'Bogotá', aliases: ['bogota', 'bogotá'] },
  { name: 'Montevidéu', aliases: ['montevideu', 'montevideo'] },
  { name: 'Cartagena', aliases: ['cartagena'] },
  { name: 'Bariloche', aliases: ['bariloche'] },
  { name: 'Mendoza', aliases: ['mendoza'] },
  { name: 'Toronto', aliases: ['toronto'] },
  { name: 'Vancouver', aliases: ['vancouver'] },
  // Europe
  { name: 'Lisboa', aliases: ['lisboa', 'lisbon'] },
  { name: 'Porto', aliases: ['porto'] },
  { name: 'Paris', aliases: ['paris'] },
  { name: 'Londres', aliases: ['londres', 'london'] },
  { name: 'Madri', aliases: ['madri', 'madrid'] },
  { name: 'Barcelona', aliases: ['barcelona'] },
  { name: 'Roma', aliases: ['roma', 'rome'] },
  { name: 'Milão', aliases: ['milao', 'milão', 'milan'] },
  { name: 'Veneza', aliases: ['veneza', 'venice'] },
  { name: 'Florença', aliases: ['florenca', 'florença', 'florence'] },
  { name: 'Amsterdam', aliases: ['amsterdam', 'amsterdã'] },
  { name: 'Berlim', aliases: ['berlim', 'berlin'] },
  { name: 'Munique', aliases: ['munique', 'munich'] },
  { name: 'Frankfurt', aliases: ['frankfurt'] },
  { name: 'Zurique', aliases: ['zurique', 'zurich'] },
  { name: 'Genebra', aliases: ['genebra', 'geneva'] },
  { name: 'Viena', aliases: ['viena', 'vienna'] },
  { name: 'Praga', aliases: ['praga', 'prague'] },
  { name: 'Dublin', aliases: ['dublin'] },
  { name: 'Edimburgo', aliases: ['edimburgo', 'edinburgh'] },
  { name: 'Atenas', aliases: ['atenas', 'athens'] },
  { name: 'Istambul', aliases: ['istambul', 'istanbul'] },
  { name: 'Copenhague', aliases: ['copenhague', 'copenhagen'] },
  { name: 'Estocolmo', aliases: ['estocolmo', 'stockholm'] },
  { name: 'Oslo', aliases: ['oslo'] },
  { name: 'Varsóvia', aliases: ['varsovia', 'varsóvia', 'warsaw'] },
  { name: 'Budapeste', aliases: ['budapeste', 'budapest'] },
  { name: 'Bruxelas', aliases: ['bruxelas', 'brussels'] },
  // Middle East & Africa
  { name: 'Dubai', aliases: ['dubai'] },
  { name: 'Abu Dhabi', aliases: ['abu dhabi'] },
  { name: 'Doha', aliases: ['doha'] },
  { name: 'Tel Aviv', aliases: ['tel aviv'] },
  { name: 'Cairo', aliases: ['cairo'] },
  { name: 'Cidade do Cabo', aliases: ['cidade do cabo', 'cape town'] },
  { name: 'Joanesburgo', aliases: ['joanesburgo', 'johannesburg'] },
  // Asia & Oceania
  { name: 'Tóquio', aliases: ['toquio', 'tóquio', 'tokyo'] },
  { name: 'Seul', aliases: ['seul', 'seoul'] },
  { name: 'Bangkok', aliases: ['bangkok'] },
  { name: 'Singapura', aliases: ['singapura', 'singapore'] },
  { name: 'Hong Kong', aliases: ['hong kong'] },
  { name: 'Xangai', aliases: ['xangai', 'shanghai'] },
  { name: 'Pequim', aliases: ['pequim', 'beijing'] },
  { name: 'Sydney', aliases: ['sydney'] },
  { name: 'Auckland', aliases: ['auckland'] },
  { name: 'Bali', aliases: ['bali'] },
  { name: 'Maldivas', aliases: ['maldivas', 'maldives'] },
  // Central America & Caribbean
  { name: 'Cidade do Panamá', aliases: ['cidade do panama', 'panama city', 'panamá'] },
  { name: 'San José', aliases: ['san jose', 'costa rica'] },
  // Brazil (domestic)
  { name: 'São Paulo', aliases: ['sao paulo', 'são paulo', 'guarulhos', 'congonhas', 'gru'] },
  { name: 'Rio de Janeiro', aliases: ['rio de janeiro', 'galeão', 'galeao', 'santos dumont'] },
  { name: 'Salvador', aliases: ['salvador'] },
  { name: 'Recife', aliases: ['recife'] },
  { name: 'Fortaleza', aliases: ['fortaleza'] },
  { name: 'Natal', aliases: ['natal'] },
  { name: 'Florianópolis', aliases: ['florianopolis', 'florianópolis', 'floripa'] },
  { name: 'Porto Alegre', aliases: ['porto alegre'] },
  { name: 'Brasília', aliases: ['brasilia', 'brasília'] },
  { name: 'Belo Horizonte', aliases: ['belo horizonte', 'confins'] },
  { name: 'Curitiba', aliases: ['curitiba'] },
  { name: 'Manaus', aliases: ['manaus'] },
  { name: 'Belém', aliases: ['belem', 'belém'] },
  { name: 'Maceió', aliases: ['maceio', 'maceió'] },
  { name: 'João Pessoa', aliases: ['joao pessoa', 'joão pessoa'] },
  { name: 'Fernando de Noronha', aliases: ['fernando de noronha', 'noronha'] },
  { name: 'Foz do Iguaçu', aliases: ['foz do iguacu', 'foz do iguaçu', 'iguaçu'] },
  { name: 'St. Martin', aliases: ['st. martin', 'saint martin', 'são martinho', 'st martin'] },
  { name: 'Gramado', aliases: ['gramado'] },
  { name: 'Búzios', aliases: ['buzios', 'búzios'] },
  // Generic regions
  { name: 'Europa', aliases: ['europa', 'europe'] },
  { name: 'Estados Unidos', aliases: ['estados unidos', 'eua', 'usa'] },
  { name: 'Caribe', aliases: ['caribe', 'caribbean'] },
  { name: 'Ásia', aliases: ['asia', 'ásia'] },
  { name: 'África', aliases: ['africa', 'áfrica'] },
  { name: 'Oceania', aliases: ['oceania'] },
];

// ── Blocked title patterns ──────────────────────────────────────

const BLOCKED_TITLE_PATTERNS = [
  'is blocked', 'rezync', 'whatsapp', 'baixe o app', 'download',
  'política de privacidade', 'canal gratuito', 'grupo do telegram',
  'inscreva-se', 'newsletter', 'cupom de desconto',
];

// ── Non-travel content patterns ─────────────────────────────────

const NON_TRAVEL_PATTERNS = [
  'compra de pontos', 'comprar pontos', 'transferência de pontos',
  'transferir pontos', 'bônus de transferência', 'bonus de transferencia',
  'desconto na compra', 'milheiro', 'assinatura do clube',
  'cartão de crédito', 'cashback',
];

// ── Parsing helpers ──────────────────────────────────────────────

function parseMilesReal(text: string): number | null {
  if (!text) return null;
  const lower = text.toLowerCase();

  // "X mil milhas/pontos [ProgramName]" → X * 1000
  // Accepts text after pontos/milhas (e.g. "66 mil pontos Azul")
  const milPattern = /(\d+(?:[.,]\d+)?)\s*mil\s+(?:milhas|pontos|miles)(?:\s+\w+)*/i;
  const milMatch = lower.match(milPattern);
  if (milMatch) {
    return Math.round(parseFloat(milMatch[1].replace(',', '.')) * 1000);
  }

  // "44.500 pontos Azul Fidelidade" or "8.400 pontos Azul"
  // Accepts text after pontos/milhas
  const directPattern = /(\d{1,3}(?:[.,]\d{3})*|\d+)\s+(?:milhas|pontos|miles)(?:\s+\w+)*/i;
  const directMatch = lower.match(directPattern);
  if (directMatch) {
    const numStr = directMatch[1].replace(/\./g, '').replace(/,/g, '');
    const num = parseInt(numStr, 10);
    if (num >= 1000 && num <= 500000) return num;
  }

  return null;
}

// Context-aware: scan lines with mile keywords
function parseMilesFromContext(text: string): number | null {
  const lines = text.split('\n');
  const mileKeywords = ['milha', 'ponto', 'miles', 'points', 'resgate', 'trecho', 'ida e volta', 'round trip'];
  
  for (const line of lines) {
    const lower = line.toLowerCase();
    if (mileKeywords.some(k => lower.includes(k))) {
      const miles = parseMilesReal(line);
      if (miles) return miles;
    }
  }

  // Try title line
  const titleMatch = text.match(/^#\s+(.+)$/m);
  if (titleMatch) {
    const miles = parseMilesReal(titleMatch[1]);
    if (miles) return miles;
  }

  // Try standalone numbers near "voe", "passagem", "emissão"
  const contextPattern = /(?:voe|passagem|emiss[aã]o|resgate)[^.]{0,50}?(\d{1,3}(?:\.\d{3})+|\d{4,6})/gi;
  let ctxMatch;
  while ((ctxMatch = contextPattern.exec(text)) !== null) {
    const num = parseInt(ctxMatch[1].replace(/\./g, ''), 10);
    if (num >= 1000 && num <= 500000) return num;
  }

  return null;
}

function detectProgram(text: string): string {
  const l = text.toLowerCase();
  // Order by specificity: more specific first
  if (l.includes('esfera')) return 'Esfera';
  if (l.includes('tudoazul') || /tudo\s*azul/i.test(l)) return 'TudoAzul';
  if (l.includes('smiles')) return 'Smiles';
  if (l.includes('latam') || l.includes('multiplus') || l.includes('latam pass')) return 'LATAM Pass';
  if (l.includes('livelo')) return 'Livelo';
  if (l.includes('azul')) return 'TudoAzul'; // "Azul" alone → TudoAzul
  if (l.includes('aadvantage') || l.includes('american airlines')) return 'AAdvantage';
  if (l.includes('avianca')) return 'Avianca';
  return 'Diversos';
}

function matchKnownDestination(text: string): string | null {
  const lower = text.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, ''); // remove accents for matching
  
  for (const dest of KNOWN_DESTINATIONS) {
    for (const alias of dest.aliases) {
      const normalizedAlias = alias.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (lower.includes(normalizedAlias)) {
        return dest.name;
      }
    }
  }
  return null;
}

function extractRoute(text: string): { origem: string | null; destino: string | null } {
  // Try known destinations FIRST (most reliable)
  const knownDest = matchKnownDestination(text);
  if (knownDest) {
    // Try to also find origin
    const originMatch = text.match(/(?:de\s+|saindo\s+de\s+)([A-ZÀ-Ú][a-zà-ú]+(?:\s+[A-ZÀ-Ú][a-zà-ú]+)*)\s*(?:→|->|para|–)/);
    return { origem: originMatch ? originMatch[1].trim() : null, destino: knownDest };
  }

  // "São Paulo → Miami", "de Guarulhos para Lisboa"
  const arrowMatch = text.match(/(?:de\s+|saindo\s+de\s+)?([A-ZÀ-Ú][a-zà-ú]+(?:\s+[A-ZÀ-Ú][a-zà-ú]+)*)\s*(?:→|->|para|–)\s*([A-ZÀ-Ú][a-zà-ú]+(?:\s+[A-ZÀ-Ú][a-zà-ú]+)*)/);
  if (arrowMatch) {
    return { origem: arrowMatch[1].trim(), destino: arrowMatch[2].trim() };
  }

  // "passagem para Paris", "voo para Orlando"
  const toMatch = text.match(/(?:passagem|voo|viaje?|ida|voe)\s+(?:para|a)\s+([A-ZÀ-Ú][a-zà-ú]+(?:\s+[A-ZÀ-Ú][a-zà-ú]+)*)/i);
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

// ── Extract articles from listing markdown ──────────────────────

interface ListingArticle {
  titulo: string;
  url: string;
}

function cleanTitle(raw: string): string {
  // Remove markdown image syntax: ![alt text](url)
  let cleaned = raw.replace(/!\[[^\]]*\]\([^)]*\)/g, '').trim();
  // Remove leading ![  (incomplete image syntax)
  cleaned = cleaned.replace(/^!\[/g, '').trim();
  // Remove trailing image remnants
  cleaned = cleaned.replace(/\]\([^)]*\)$/g, '').trim();
  return cleaned;
}

function extractArticlesFromListing(markdown: string): ListingArticle[] {
  const articles: ListingArticle[] = [];
  const seen = new Set<string>();

  const linkRegex = /\[([^\]]+)\]\((https?:\/\/(?:www\.)?passageirodeprimeira\.com\/[^\s)]+)\)/gm;
  let match;
  while ((match = linkRegex.exec(markdown)) !== null) {
    const rawTitulo = match[1].trim();
    const url = match[2];

    // Skip non-article URLs
    if (
      url.includes('/categorias/') ||
      url.includes('/tag/') ||
      url.includes('/page/') ||
      url.includes('/autor/') ||
      url.endsWith('.com/') ||
      url.endsWith('.com')
    ) continue;

    // Skip image/media URLs - these are NOT article links
    if (/\.(png|jpg|jpeg|gif|webp|svg|bmp|ico|mp4|mp3|pdf)(\?.*)?$/i.test(url)) continue;
    // Also skip wp-content/uploads paths (image storage)
    if (url.includes('/wp-content/uploads/')) continue;

    if (seen.has(url)) continue;
    seen.add(url);

    const titulo = cleanTitle(rawTitulo);
    if (titulo.length < 10) continue;

    articles.push({ titulo, url });
  }

  // No limit here - return ALL articles found
  return articles;
}

// ── Parse a single article into a promotion ──────────────────────

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

function parsePromotion(titulo: string, url: string, articleMarkdown?: string): ParsedPromotion | null {
  if (!titulo || titulo.length < 10) return null;

  const lower = titulo.toLowerCase();

  // 1. Filter blocked titles
  if (BLOCKED_TITLE_PATTERNS.some(p => lower.includes(p))) {
    console.log(`  ✗ Blocked title: ${titulo.substring(0, 60)}`);
    return null;
  }

  // 2. Filter non-travel content
  if (NON_TRAVEL_PATTERNS.some(p => lower.includes(p))) {
    console.log(`  ✗ Non-travel content: ${titulo.substring(0, 60)}`);
    return null;
  }

  const fullText = articleMarkdown ? `${titulo}\n${articleMarkdown}` : titulo;

  // 3. Extract REAL miles only (no synthetic from percentages)
  let miles = parseMilesFromContext(titulo);
  if (!miles && articleMarkdown) {
    miles = parseMilesFromContext(articleMarkdown);
  }

  if (!miles || miles < 1000) {
    console.log(`  ✗ No real miles found: ${titulo.substring(0, 60)}`);
    return null;
  }

  // 4. Extract destination (MANDATORY) - use title first, fallback to full text
  let route = extractRoute(titulo);
  if (!route.destino && articleMarkdown) {
    route = extractRoute(fullText);
  }
  if (!route.destino) {
    console.log(`  ✗ No destination found: ${titulo.substring(0, 60)}`);
    return null;
  }

  // 5. Detect program FROM TITLE ONLY to avoid article body pollution
  const programa = detectProgram(titulo);

  // Build description
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

  return {
    programa,
    origem: route.origem,
    destino: route.destino,
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

// ── Firecrawl helper ──────────────────────────────────────────────

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

    const markdown = data.data?.markdown || data.markdown || '';
    return { markdown };
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

// ── Main handler ──────────────────────────────────────────────────

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

    // Step 2: Extract ALL articles (no early limit) and clean titles
    const allArticles = extractArticlesFromListing(listingResult.markdown);
    console.log(`Found ${allArticles.length} unique articles on listing`);

    if (allArticles.length === 0) {
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

    // Step 3: Smart parsing - filter BEFORE spending credits
    // Group A: titles with destination + miles → card directly (0 extra credits)
    // Group B: titles with destination but no miles → scrape article (1 credit each)
    // Group C: no destination → discard (0 credits)
    const parsedPromotions: ParsedPromotion[] = [];
    let pagesScraped = 1;
    const enrichArticles = body.enrich !== false;
    const groupA: { article: ListingArticle; promo: ParsedPromotion }[] = [];
    const groupB: ListingArticle[] = [];

    for (const article of allArticles) {
      const lower = article.titulo.toLowerCase();
      
      // Skip blocked/non-travel titles
      if (BLOCKED_TITLE_PATTERNS.some(p => lower.includes(p))) continue;
      if (NON_TRAVEL_PATTERNS.some(p => lower.includes(p))) continue;

      const dest = matchKnownDestination(article.titulo);
      if (!dest) {
        console.log(`  ✗ No destination: ${article.titulo.substring(0, 60)}`);
        continue; // Group C: discard
      }

      // Try parsing from title alone
      const promo = parsePromotion(article.titulo, article.url);
      if (promo) {
        groupA.push({ article, promo });
        console.log(`  ✓ Title-parsed: ${promo.destino} | ${promo.milhas_min} pts | ${promo.programa}`);
      } else {
        groupB.push(article);
        console.log(`  → Needs scrape: ${article.titulo.substring(0, 60)}`);
      }
    }

    // Add all Group A promotions directly
    for (const { promo } of groupA) {
      parsedPromotions.push(promo);
    }

    // Scrape Group B articles (only those with destination but no miles)
    const maxGroupBScrapes = Math.min(groupB.length, maxArticles - groupA.length);
    if (enrichArticles && maxGroupBScrapes > 0) {
      for (let i = 0; i < maxGroupBScrapes; i++) {
        const article = groupB[i];
        console.log(`Scraping for enrichment: ${article.titulo.substring(0, 60)}...`);
        const articleResult = await firecrawlScrape(firecrawlApiKey, article.url);
        pagesScraped++;

        if (articleResult.markdown && !articleResult.markdown.includes('is blocked')) {
          const promo = parsePromotion(article.titulo, article.url, articleResult.markdown);
          if (promo) {
            parsedPromotions.push(promo);
            console.log(`  ✓ Enriched: ${promo.destino} | ${promo.milhas_min} pts | ${promo.programa}`);
          }
        }
      }
    }

    // Also enrich Group A for better descriptions (limited)
    if (enrichArticles) {
      const enrichLimit = Math.min(groupA.length, 5);
      for (let i = 0; i < enrichLimit; i++) {
        const { article } = groupA[i];
        console.log(`Enriching Group A: ${article.titulo.substring(0, 60)}...`);
        const articleResult = await firecrawlScrape(firecrawlApiKey, article.url);
        pagesScraped++;

        if (articleResult.markdown && !articleResult.markdown.includes('is blocked')) {
          const enriched = parsePromotion(article.titulo, article.url, articleResult.markdown);
          if (enriched) {
            // Replace the title-only version with enriched version
            const idx = parsedPromotions.findIndex(p => p.link === article.url);
            if (idx >= 0) parsedPromotions[idx] = enriched;
          }
        }
      }
    }

    console.log(`Parsed ${parsedPromotions.length} valid promotions from ${pagesScraped} pages (GroupA: ${groupA.length}, GroupB scraped: ${maxGroupBScrapes})`);

    // Step 4: Deduplicate and insert
    if (parsedPromotions.length > 0) {
      const hashes = parsedPromotions.map(p => p.external_hash);
      const { data: existing } = await supabase
        .from('scraped_promotions')
        .select('external_hash')
        .in('external_hash', hashes);

      const existingHashes = new Set(existing?.map((e: { external_hash: string }) => e.external_hash) || []);
      const newPromotions = parsedPromotions.filter(p => !existingHashes.has(p.external_hash));

      console.log(`${newPromotions.length} new, ${parsedPromotions.length - newPromotions.length} duplicates`);

      let insertedCount = 0;
      if (newPromotions.length > 0) {
        const { data: inserted, error: insertError } = await supabase
          .from('scraped_promotions')
          .upsert(newPromotions, { onConflict: 'external_hash', ignoreDuplicates: true })
          .select('id');

        if (insertError) {
          console.error('Insert error:', insertError);
          errors.push({ url: 'db-insert', error: insertError.message });
        } else {
          insertedCount = inserted?.length || 0;
        }
      }

      // Cleanup: 21-day rule
      const twentyOneDaysAgo = new Date();
      twentyOneDaysAgo.setDate(twentyOneDaysAgo.getDate() - 21);
      
      // Deactivate promotions older than 21 days
      await supabase
        .from('scraped_promotions')
        .update({ is_active: false })
        .lt('data_coleta', twentyOneDaysAgo.toISOString())
        .eq('is_active', true);

      // Delete promotions older than 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      await supabase
        .from('scraped_promotions')
        .delete()
        .lt('data_coleta', thirtyDaysAgo.toISOString());

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
          articles_found: allArticles.length,
          promotions_parsed: parsedPromotions.length,
          promotions_found: insertedCount,
          duplicates_skipped: parsedPromotions.length - newPromotions.length,
          errors_count: errors.length,
          mode: 'firecrawl',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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
        articles_found: allArticles.length,
        promotions_parsed: 0,
        promotions_found: 0,
        errors_count: errors.length,
        mode: 'firecrawl',
        message: 'No promotions with valid destination + miles found',
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
