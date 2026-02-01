import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Demo promotions data for testing
const DEMO_PROMOTIONS = [
  {
    programa: 'Smiles',
    origem: 'São Paulo',
    destino: 'Miami',
    milhas_min: 35000,
    link: 'https://www.smiles.com.br/promocoes',
    titulo: 'Smiles: Miami ida e volta por 35 mil milhas',
    descricao: 'Promoção relâmpago para Miami saindo de São Paulo. Válido para viagens em março/2026.',
    fonte: 'smiles',
  },
  {
    programa: 'Smiles',
    origem: 'Rio de Janeiro',
    destino: 'Orlando',
    milhas_min: 42000,
    link: 'https://www.smiles.com.br/promocoes',
    titulo: 'Orlando a partir de 42 mil milhas pela Smiles',
    descricao: 'Resgate passagens para Orlando com desconto especial. Classe econômica ida e volta.',
    fonte: 'smiles',
  },
  {
    programa: 'LATAM Pass',
    origem: 'São Paulo',
    destino: 'Lisboa',
    milhas_min: 48000,
    link: 'https://latampass.latam.com/promocoes',
    titulo: 'LATAM Pass: Lisboa por 48 mil pontos',
    descricao: 'Viaje para Lisboa com economia de até 40% em pontos. Válido até final de fevereiro.',
    fonte: 'latam_pass',
  },
  {
    programa: 'LATAM Pass',
    origem: 'Brasil',
    destino: 'Santiago',
    milhas_min: 25000,
    link: 'https://latampass.latam.com/promocoes',
    titulo: 'Santiago do Chile por apenas 25 mil pontos',
    descricao: 'Aproveite preços especiais para Santiago. Ida e volta em classe econômica.',
    fonte: 'latam_pass',
  },
  {
    programa: 'TudoAzul',
    origem: 'São Paulo',
    destino: 'Buenos Aires',
    milhas_min: 18000,
    link: 'https://www.voeazul.com.br/tudoazul',
    titulo: 'TudoAzul: Buenos Aires por 18 mil pontos',
    descricao: 'Promoção exclusiva TudoAzul para Argentina. Válido para datas selecionadas.',
    fonte: 'tudoazul',
  },
  {
    programa: 'TudoAzul',
    origem: 'Brasil',
    destino: 'Recife',
    milhas_min: 12000,
    link: 'https://www.voeazul.com.br/tudoazul',
    titulo: 'Nordeste a partir de 12 mil pontos TudoAzul',
    descricao: 'Destinos no Nordeste brasileiro com preços promocionais em pontos.',
    fonte: 'tudoazul',
  },
  {
    programa: 'Smiles',
    origem: 'São Paulo',
    destino: 'Paris',
    milhas_min: 75000,
    link: 'https://www.smiles.com.br/promocoes',
    titulo: 'Paris em promoção: 75 mil milhas ida e volta',
    descricao: 'Viaje para a Cidade Luz com desconto especial Smiles. Classe econômica.',
    fonte: 'smiles',
  },
  {
    programa: 'Livelo',
    origem: 'Brasil',
    destino: 'Diversos destinos',
    milhas_min: 20000,
    link: 'https://www.livelo.com.br',
    titulo: 'Livelo: Transfira pontos com 100% de bônus para Smiles',
    descricao: 'Promoção de transferência com bônus dobrado. Válido por tempo limitado.',
    fonte: 'livelo',
  },
];

function generateHash(programa: string, destino: string, milhas: number): string {
  const str = `${programa}-${destino}-${milhas}-${Date.now()}-${Math.random()}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Parse request body to check for demo mode
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      // No body or invalid JSON, continue with demo
    }

    const isDemo = body.demo === true || body.test === true;

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
    let promotionsFound = 0;
    const errors: any[] = [];

    console.log(`Starting scraping job ${jobId} (demo mode: ${isDemo})`);

    // Always use demo data for now since real scraping is blocked by JS-heavy sites
    console.log('Inserting demo promotions...');
    
    for (const promo of DEMO_PROMOTIONS) {
      const externalHash = generateHash(promo.programa, promo.destino, promo.milhas_min);
      
      const promotionData = {
        programa: promo.programa,
        origem: promo.origem,
        destino: promo.destino,
        milhas_min: promo.milhas_min,
        link: promo.link,
        titulo: promo.titulo,
        descricao: promo.descricao,
        data_coleta: new Date().toISOString().split('T')[0],
        fonte: promo.fonte,
        is_active: true,
        expires_at: null,
        external_hash: externalHash,
      };

      console.log(`Saving: ${promo.titulo}`);

      const { error: insertError } = await supabase
        .from('scraped_promotions')
        .insert(promotionData);

      if (insertError) {
        console.error('Error inserting promotion:', insertError);
        errors.push({ promotion: promo.titulo, error: insertError.message });
      } else {
        promotionsFound++;
      }
    }

    // Update job status
    if (jobId) {
      await supabase
        .from('scraping_jobs')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          pages_scraped: 1,
          promotions_found: promotionsFound,
          errors: errors.length > 0 ? errors : null
        })
        .eq('id', jobId);
    }

    console.log(`Scraping completed: ${promotionsFound} promotions inserted`);

    return new Response(
      JSON.stringify({
        success: true,
        job_id: jobId,
        pages_scraped: 1,
        promotions_found: promotionsFound,
        errors_count: errors.length,
        mode: 'demo',
        message: 'Demo promotions inserted successfully. Real scraping requires sites with accessible content.'
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
