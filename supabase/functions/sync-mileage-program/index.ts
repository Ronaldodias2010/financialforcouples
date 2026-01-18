import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SyncRequest {
  programId: string;
}

interface MileageProgram {
  id: string;
  user_id: string;
  program_code: string;
  program_name: string;
  status: string;
  balance_miles: number;
  balance_value: number | null;
  external_member_id: string | null;
}

// Program value per mile (in cents)
const PROGRAM_VALUES: Record<string, number> = {
  'latam_pass': 2.87,
  'smiles': 2.50,
  'azul': 2.20,
  'esfera': 1.50,
  'livelo': 1.80,
  'aa': 7.50,
  'united': 6.50,
  'delta': 5.80,
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const DEADLINE_MS = 55_000; // 55 seconds (margin before 60s timeout)
  const startTime = Date.now();

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  
  // Create admin client for database operations
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

  // Create user client for auth validation
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(
      JSON.stringify({ error: 'Missing authorization header' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const supabaseAnon = createClient(
    supabaseUrl,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  );

  try {
    // Validate user
    const { data: { user }, error: authError } = await supabaseAnon.auth.getUser();
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { programId } = await req.json() as SyncRequest;

    if (!programId) {
      return new Response(
        JSON.stringify({ error: 'programId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[sync-mileage-program] Starting sync for program ${programId}, user ${user.id}`);

    // Fetch the program
    const { data: program, error: fetchError } = await supabaseAdmin
      .from('mileage_programs')
      .select('*')
      .eq('id', programId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !program) {
      console.error('Program fetch error:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Program not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const typedProgram = program as MileageProgram;

    // Check deadline before external calls
    const checkDeadline = () => {
      if (Date.now() - startTime > DEADLINE_MS) {
        throw new Error('SYNC_TIMEOUT');
      }
    };

    try {
      checkDeadline();

      // Mark as syncing
      await supabaseAdmin
        .from('mileage_programs')
        .update({ 
          status: 'connecting',
          updated_at: new Date().toISOString()
        })
        .eq('id', programId);

      // ============================================================
      // EXTERNAL API SYNC LOGIC WOULD GO HERE
      // For now, we simulate a "no real API" scenario
      // In the future, this would call LATAM, Smiles, etc. APIs
      // ============================================================
      
      checkDeadline();

      // Simulate provider check (placeholder for real API integration)
      // In a real implementation, this would:
      // 1. Check for stored OAuth tokens
      // 2. Refresh tokens if expired
      // 3. Call provider API to get balance
      // 4. Update database with new balance
      
      const hasRealIntegration = false; // TODO: implement real integration checks
      
      if (!hasRealIntegration) {
        // No real API available - mark as connected with existing balance
        // This allows manual entry to work while keeping status consistent
        const valuePerMile = PROGRAM_VALUES[typedProgram.program_code] || 2.0;
        const estimatedValue = (typedProgram.balance_miles * valuePerMile) / 100;

        checkDeadline();

        await supabaseAdmin
          .from('mileage_programs')
          .update({
            status: 'connected',
            last_sync_at: new Date().toISOString(),
            balance_value: estimatedValue,
            last_error: null,
            updated_at: new Date().toISOString()
          })
          .eq('id', programId);

        console.log(`[sync-mileage-program] Sync complete (manual mode) for ${programId}`);

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Sync completed (manual mode)',
            balance: typedProgram.balance_miles,
            requiresManualUpdate: true
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Real API integration would continue here...
      // const balance = await fetchBalanceFromProvider(typedProgram);
      // ...

    } catch (syncError) {
      const errorMessage = syncError instanceof Error ? syncError.message : 'Unknown sync error';
      console.error(`[sync-mileage-program] Sync error for ${programId}:`, errorMessage);

      const isTimeout = errorMessage === 'SYNC_TIMEOUT';
      const userFriendlyError = isTimeout 
        ? 'Tempo limite de sincronização excedido. Tente novamente.'
        : 'Erro ao sincronizar. Verifique sua conexão e tente novamente.';

      // Update program with error status
      await supabaseAdmin
        .from('mileage_programs')
        .update({
          status: 'error',
          last_error: userFriendlyError,
          updated_at: new Date().toISOString()
        })
        .eq('id', programId);

      return new Response(
        JSON.stringify({ 
          success: false, 
          error: userFriendlyError,
          isTimeout 
        }),
        { status: isTimeout ? 408 : 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('[sync-mileage-program] Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
