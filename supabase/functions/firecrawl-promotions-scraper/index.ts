import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Sources configuration - specific pages to scrape
const SOURCES = [
  {
    name: 'melhores_destinos',
    baseUrl: 'https://www.melhoresdestinos.com.br',
    targetPaths: [
      '/promocoes/passagens-aereas',
      '/promocoes',
      '/categoria/milhas',
      '/tag/smiles',
      '/tag/latam-pass'
    ]
  },
  {
    name: 'passageiro_primeira',
    baseUrl: 'https://passageirodeprimeira.com',
    targetPaths: [
      '/categoria/smiles',
      '/categoria/latam-pass',
      '/categoria/azul-tudoazul',
      '/promocoes'
    ]
  }
];

// Keywords to validate if page contains mileage or travel content
const MILEAGE_KEYWORDS = [
  'milhas', 'pontos', 'resgate', 'fidelidade',
  'passagem', 'promoção', 'destino', 'viagem',
  'smiles', 'latam', 'tudoazul', 'livelo', 'azul',
  'voo', 'aéreo', 'aereo', 'classe executiva', 'ida e volta'
];

// Extraction schema for Firecrawl JSON extraction
const extractionSchema = {
  type: 'object',
  properties: {
    promotions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          programa: { 
            type: 'string',
            description: 'Nome do programa de milhas (Smiles, LATAM Pass, TudoAzul, Livelo, etc)'
          },
          origem: { 
            type: 'string',
            description: 'Cidade ou aeroporto de origem (pode ser null)'
          },
          destino: { 
            type: 'string',
            description: 'Cidade ou aeroporto de destino'
          },
          milhas_min: { 
            type: 'number',
            description: 'Quantidade mínima de milhas necessárias para o resgate'
          },
          titulo: { 
            type: 'string',
            description: 'Título ou nome da promoção'
          },
          descricao: { 
            type: 'string',
            description: 'Descrição breve da promoção'
          },
          data_expiracao: { 
            type: 'string',
            description: 'Data de expiração da promoção no formato YYYY-MM-DD'
          }
        },
        required: ['destino', 'milhas_min']
      }
    }
  }
};

function isValidMileagePage(content: string): boolean {
  const lowerContent = content.toLowerCase();
  const matchCount = MILEAGE_KEYWORDS.filter(kw => 
    lowerContent.includes(kw)
  ).length;
  // Be more lenient - just 1 match is enough for travel content
  return matchCount >= 1;
}

function generateHash(programa: string, destino: string, milhas: number, link: string): string {
  const str = `${programa}-${destino}-${milhas}-${link}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

async function scrapeWithFirecrawl(
  url: string, 
  apiKey: string
): Promise<{ success: boolean; markdown?: string; error?: string }> {
  try {
    console.log(`Scraping URL: ${url}`);
    
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
        waitFor: 3000,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Firecrawl scrape error:', data);
      return { success: false, error: data.error || `Status ${response.status}` };
    }

    const markdown = data.data?.markdown || data.markdown || '';
    return { success: true, markdown };
  } catch (error) {
    console.error('Scrape error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

async function extractPromotionsWithAI(
  markdown: string,
  url: string,
  apiKey: string
): Promise<any[]> {
  try {
    // Use Firecrawl's JSON extraction with the schema
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        formats: [{ 
          type: 'json', 
          schema: extractionSchema,
          prompt: 'Extraia todas as promoções de passagens aéreas com milhas desta página. Foque em: programa de milhas, origem, destino, quantidade mínima de milhas, título e descrição. Se a quantidade de milhas não estiver explícita, tente inferir do contexto.'
        }],
        onlyMainContent: true,
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('Extraction error:', data);
      return [];
    }

    const json = data.data?.json || data.json;
    if (json && json.promotions && Array.isArray(json.promotions)) {
      return json.promotions.filter((p: any) => p.destino && p.milhas_min);
    }

    return [];
  } catch (error) {
    console.error('AI extraction error:', error);
    return [];
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');

  if (!firecrawlApiKey) {
    console.error('FIRECRAWL_API_KEY not configured');
    return new Response(
      JSON.stringify({ success: false, error: 'Firecrawl API key not configured' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Create scraping job record
    const { data: job, error: jobError } = await supabase
      .from('scraping_jobs')
      .insert({ status: 'running', started_at: new Date().toISOString() })
      .select()
      .single();

    if (jobError) {
      console.error('Error creating job:', jobError);
    }

    const jobId = job?.id;
    let pagesScraped = 0;
    let promotionsFound = 0;
    const errors: any[] = [];

    console.log(`Starting scraping job ${jobId}`);

    // Process each source
    for (const source of SOURCES) {
      console.log(`Processing source: ${source.name}`);

      for (const path of source.targetPaths) {
        const url = `${source.baseUrl}${path}`;
        
        try {
          // Rate limiting: wait 2 seconds between requests
          await new Promise(resolve => setTimeout(resolve, 2000));

          // Scrape the page
          const scrapeResult = await scrapeWithFirecrawl(url, firecrawlApiKey);
          
          if (!scrapeResult.success) {
            console.log(`Failed to scrape ${url}: ${scrapeResult.error}`);
            errors.push({ url, error: scrapeResult.error });
            continue;
          }

          pagesScraped++;

          // Validate it's a mileage page
          if (!scrapeResult.markdown || !isValidMileagePage(scrapeResult.markdown)) {
            console.log(`Skipping ${url} - not a valid mileage page`);
            continue;
          }

          // Extract promotions using AI
          const promotions = await extractPromotionsWithAI(
            scrapeResult.markdown,
            url,
            firecrawlApiKey
          );

          console.log(`Found ${promotions.length} promotions in ${url}`);

          // Save promotions to database
          for (const promo of promotions) {
            const externalHash = generateHash(
              promo.programa || source.name,
              promo.destino,
              promo.milhas_min,
              url
            );

            const promotionData = {
              programa: promo.programa || inferProgram(source.name),
              origem: promo.origem || null,
              destino: promo.destino,
              milhas_min: Math.round(promo.milhas_min),
              link: url,
              titulo: promo.titulo || null,
              descricao: promo.descricao || null,
              data_coleta: new Date().toISOString().split('T')[0],
              fonte: source.name,
              is_active: true,
              expires_at: promo.data_expiracao || null,
              external_hash: externalHash
            };

            // Upsert to avoid duplicates
            const { error: insertError } = await supabase
              .from('scraped_promotions')
              .upsert(promotionData, { 
                onConflict: 'external_hash',
                ignoreDuplicates: true 
              });

            if (insertError) {
              console.error('Error inserting promotion:', insertError);
              errors.push({ promotion: promo.destino, error: insertError.message });
            } else {
              promotionsFound++;
            }
          }
        } catch (error) {
          console.error(`Error processing ${url}:`, error);
          errors.push({ url, error: error instanceof Error ? error.message : 'Unknown error' });
        }
      }
    }

    // Update job status
    if (jobId) {
      await supabase
        .from('scraping_jobs')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          pages_scraped: pagesScraped,
          promotions_found: promotionsFound,
          errors: errors.length > 0 ? errors : null
        })
        .eq('id', jobId);
    }

    // Deactivate old promotions (older than 7 days without update)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    await supabase
      .from('scraped_promotions')
      .update({ is_active: false })
      .lt('data_coleta', sevenDaysAgo.toISOString().split('T')[0])
      .eq('is_active', true);

    console.log(`Scraping completed: ${pagesScraped} pages, ${promotionsFound} promotions`);

    return new Response(
      JSON.stringify({
        success: true,
        job_id: jobId,
        pages_scraped: pagesScraped,
        promotions_found: promotionsFound,
        errors_count: errors.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Scraper error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function inferProgram(sourceName: string): string {
  const programMap: Record<string, string> = {
    'melhores_destinos': 'Diversos',
    'passageiro_primeira': 'Diversos',
    'smiles': 'Smiles',
    'latam_pass': 'LATAM Pass',
    'tudoazul': 'TudoAzul'
  };
  return programMap[sourceName] || 'Diversos';
}
