import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // For each card: initial_balance_original = desired_spent - expense_sum
    // The trigger will then compute:
    //   current_balance = initial_balance_original + expense_sum = desired_spent
    //   initial_balance = credit_limit

    // Priscila's cards (user: a46d7924)
    // Mercado Pago: desired_spent=5000, expense_sum=1397.94 → ibo=3602.06
    // BoFA (USD): desired_spent=6942.57, expense_sum=699.98 → ibo=6242.59
    // Caixa Platinum: desired_spent=6900, expense_sum=473.70 → ibo=6426.30, credit_limit=7000
    // Bradesco: desired_spent=988.89, expense_sum=37 → ibo=951.89
    // Inter: desired_spent=1131.12, expense_sum=20 → ibo=1111.12

    // Ronaldo's cards (user: fdc6cdb6) - recalculate to match new trigger
    // Inter Black: desired_spent=15700, expense_sum=5634.27 → ibo=10065.73
    // Sicredi Gold: desired_spent=7650, expense_sum=7424.68 → ibo=225.32
    // Bank of America (USD): desired_spent=4251.69, expense_sum=36 → ibo=4215.69
    // Nubank Black: desired_spent=3308.13, expense_sum=263.87 → ibo=3044.26

    const updates = [
      // Priscila
      { id: '75676cb4-431b-4146-ab02-80d77d035bf1', initial_balance_original: 3602.06 },
      { id: '8d55ba7d-0e1f-4429-a2d3-2342585891e5', initial_balance_original: 6242.59 },
      { id: '60952650-403b-4352-bd8b-4445df441808', initial_balance_original: 6426.30, credit_limit: 7000 },
      { id: '31cf3b57-d231-4a9e-9499-19a66d4dd0d0', initial_balance_original: 951.89 },
      { id: 'a02ed5e9-e832-40e3-b229-6bddfdfc06b5', initial_balance_original: 1111.12 },
      // Ronaldo
      { id: 'c76d59fe-81ff-4236-a136-c6bb63dfc609', initial_balance_original: 10065.73 },
      { id: 'cc3f6b27-ee67-4fd1-98cd-c928261d20b5', initial_balance_original: 225.32 },
      { id: '0af49abd-760a-4cc3-be27-dbe6e1a4ca55', initial_balance_original: 4215.69 },
      { id: '54cefa78-0396-4ca0-bb37-abacc0ab2a06', initial_balance_original: 3044.26 },
    ];

    const results = [];
    for (const u of updates) {
      const updateData: Record<string, number> = { 
        initial_balance_original: u.initial_balance_original 
      };
      if ('credit_limit' in u && u.credit_limit) {
        updateData.credit_limit = u.credit_limit;
      }

      const { error } = await supabaseAdmin
        .from('cards')
        .update(updateData)
        .eq('id', u.id);

      // Verify
      const { data: card } = await supabaseAdmin
        .from('cards')
        .select('id, name, credit_limit, initial_balance, current_balance, initial_balance_original, currency')
        .eq('id', u.id)
        .single();

      const available = card ? (card.initial_balance ?? card.credit_limit) - (card.current_balance ?? 0) : null;

      results.push({ 
        id: u.id, 
        name: card?.name,
        error: error?.message || null,
        credit_limit: card?.credit_limit,
        initial_balance: card?.initial_balance,
        current_balance: card?.current_balance,
        initial_balance_original: card?.initial_balance_original,
        available,
        currency: card?.currency
      });
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});