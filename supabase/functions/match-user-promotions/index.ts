import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface UserMileageBalance {
  user_id: string;
  programa: string;
  saldo: number;
}

interface Promotion {
  id: string;
  programa: string;
  origem: string | null;
  destino: string;
  milhas_min: number;
  link: string;
  titulo: string | null;
}

function generatePersonalizedMessage(
  destino: string,
  milhasMin: number,
  programa: string,
  saldoUsuario: number
): string {
  const sobra = saldoUsuario - milhasMin;
  
  if (sobra >= milhasMin * 0.5) {
    return `Ótima oportunidade! Você pode viajar para ${destino} usando ${milhasMin.toLocaleString('pt-BR')} milhas ${programa}. Com ${saldoUsuario.toLocaleString('pt-BR')} milhas, ainda sobram ${sobra.toLocaleString('pt-BR')} para outra viagem!`;
  } else if (sobra > 0) {
    return `Você pode viajar para ${destino} usando ${milhasMin.toLocaleString('pt-BR')} milhas ${programa}. Você possui ${saldoUsuario.toLocaleString('pt-BR')} milhas disponíveis.`;
  } else {
    return `Viagem para ${destino} por ${milhasMin.toLocaleString('pt-BR')} milhas ${programa}. Você possui ${saldoUsuario.toLocaleString('pt-BR')} milhas disponíveis.`;
  }
}

function normalizeProgram(programa: string): string {
  const normalized = programa.toLowerCase().trim();
  
  if (normalized.includes('smiles')) return 'Smiles';
  if (normalized.includes('latam') || normalized.includes('multiplus')) return 'LATAM Pass';
  if (normalized.includes('azul') || normalized.includes('tudoazul')) return 'TudoAzul';
  if (normalized.includes('livelo')) return 'Livelo';
  if (normalized.includes('esfera')) return 'Esfera';
  
  return programa;
}

function programsMatch(userProgram: string, promoProgram: string): boolean {
  const normalizedUser = normalizeProgram(userProgram);
  const normalizedPromo = normalizeProgram(promoProgram);
  
  // Exact match
  if (normalizedUser === normalizedPromo) return true;
  
  // "Diversos" promotions match any program
  if (normalizedPromo === 'Diversos') return true;
  
  // Livelo can be transferred to other programs
  if (normalizedUser === 'Livelo') return true;
  
  return false;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const body = await req.json().catch(() => ({}));
    const specificUserId = body.user_id as string | undefined;

    console.log('Starting user-promotion matching...');

    // Get all users with mileage balances
    // Source 1: card_mileage_rules (existing_miles)
    const { data: cardMiles, error: cardError } = await supabase
      .from('card_mileage_rules')
      .select('user_id, bank_name, existing_miles')
      .eq('is_active', true)
      .gt('existing_miles', 0);

    if (cardError) {
      console.error('Error fetching card miles:', cardError);
    }

    // Source 2: mileage_programs (balance_miles) - check if table exists
    const { data: programMiles, error: programError } = await supabase
      .from('mileage_programs')
      .select('user_id, program_name, balance_miles')
      .eq('is_active', true)
      .gt('balance_miles', 0);

    if (programError && !programError.message.includes('does not exist')) {
      console.error('Error fetching program miles:', programError);
    }

    // Combine balances by user and program
    const userBalances = new Map<string, UserMileageBalance[]>();

    // Process card miles
    cardMiles?.forEach(card => {
      const userId = card.user_id;
      const programa = inferProgramFromBank(card.bank_name);
      
      if (!userBalances.has(userId)) {
        userBalances.set(userId, []);
      }
      
      const existing = userBalances.get(userId)!.find(b => b.programa === programa);
      if (existing) {
        existing.saldo += card.existing_miles || 0;
      } else {
        userBalances.get(userId)!.push({
          user_id: userId,
          programa,
          saldo: card.existing_miles || 0
        });
      }
    });

    // Process program miles
    programMiles?.forEach(prog => {
      const userId = prog.user_id;
      const programa = normalizeProgram(prog.program_name);
      
      if (!userBalances.has(userId)) {
        userBalances.set(userId, []);
      }
      
      const existing = userBalances.get(userId)!.find(b => b.programa === programa);
      if (existing) {
        existing.saldo += prog.balance_miles || 0;
      } else {
        userBalances.get(userId)!.push({
          user_id: userId,
          programa,
          saldo: prog.balance_miles || 0
        });
      }
    });

    // Filter to specific user if provided
    if (specificUserId) {
      const userBalance = userBalances.get(specificUserId);
      userBalances.clear();
      if (userBalance) {
        userBalances.set(specificUserId, userBalance);
      }
    }

    console.log(`Processing ${userBalances.size} users with mileage balances`);

    // Get active promotions
    const { data: promotions, error: promoError } = await supabase
      .from('scraped_promotions')
      .select('id, programa, origem, destino, milhas_min, link, titulo')
      .eq('is_active', true)
      .order('milhas_min', { ascending: true });

    if (promoError) {
      throw new Error(`Error fetching promotions: ${promoError.message}`);
    }

    if (!promotions || promotions.length === 0) {
      console.log('No active promotions found');
      return new Response(
        JSON.stringify({ success: true, message: 'No promotions to match', suggestions_created: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${promotions.length} active promotions`);

    let suggestionsCreated = 0;
    const errors: any[] = [];

    // Match users with promotions
    for (const [userId, balances] of userBalances) {
      for (const balance of balances) {
        // Find promotions user can afford with this balance
        const affordablePromotions = promotions.filter(promo => 
          promo.milhas_min <= balance.saldo && programsMatch(balance.programa, promo.programa)
        );

        // Limit to top 10 suggestions per user per program
        const topPromotions = affordablePromotions.slice(0, 10);

        for (const promo of topPromotions) {
          const mensagem = generatePersonalizedMessage(
            promo.destino,
            promo.milhas_min,
            promo.programa,
            balance.saldo
          );

          // Upsert suggestion (avoid duplicates)
          const { error: insertError } = await supabase
            .from('user_travel_suggestions')
            .upsert({
              user_id: userId,
              promotion_id: promo.id,
              saldo_usuario: balance.saldo,
              programa_usuario: balance.programa,
              mensagem,
              is_viewed: false
            }, {
              onConflict: 'user_id,promotion_id'
            });

          if (insertError) {
            console.error('Error inserting suggestion:', insertError);
            errors.push({ user_id: userId, promo_id: promo.id, error: insertError.message });
          } else {
            suggestionsCreated++;
          }
        }
      }
    }

    // Clean up old suggestions for inactive promotions
    await supabase
      .from('user_travel_suggestions')
      .delete()
      .not('promotion_id', 'in', `(${promotions.map(p => `'${p.id}'`).join(',')})`);

    console.log(`Matching completed: ${suggestionsCreated} suggestions created`);

    return new Response(
      JSON.stringify({
        success: true,
        users_processed: userBalances.size,
        promotions_available: promotions.length,
        suggestions_created: suggestionsCreated,
        errors_count: errors.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Match error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function inferProgramFromBank(bankName: string): string {
  const normalized = bankName.toLowerCase();
  
  if (normalized.includes('bradesco')) return 'Livelo';
  if (normalized.includes('itau') || normalized.includes('itaú')) return 'Livelo';
  if (normalized.includes('bb') || normalized.includes('banco do brasil')) return 'Livelo';
  if (normalized.includes('santander')) return 'Esfera';
  if (normalized.includes('nubank')) return 'Smiles';
  if (normalized.includes('inter')) return 'Smiles';
  if (normalized.includes('c6')) return 'C6 Points';
  if (normalized.includes('azul')) return 'TudoAzul';
  if (normalized.includes('latam')) return 'LATAM Pass';
  if (normalized.includes('gol') || normalized.includes('smiles')) return 'Smiles';
  
  return 'Livelo'; // Default
}
