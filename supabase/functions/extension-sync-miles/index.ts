import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-extension-version',
};

interface SyncRequest {
  program: string;
  balance: number;
  captured_at: string;
  source: string;
}

// Program codes mapping
const VALID_PROGRAMS = ['latam_pass', 'azul', 'smiles', 'livelo', 'esfera', 'aa', 'united', 'delta'];

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

// Rate limit: 1 sync per program per 6 hours
const RATE_LIMIT_HOURS = 6;

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

  // Validate authorization header
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(
      JSON.stringify({ error: 'Missing authorization header' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Create admin client
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Validate user using getUser (the correct method for Supabase v2)
    const token = authHeader.replace('Bearer ', '');
    
    // Create a client with the user's token for validation
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });
    
    const { data: userData, error: userError } = await supabaseUser.auth.getUser();
    
    if (userError || !userData?.user) {
      console.error('[extension-sync-miles] Auth error:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized', details: userError?.message }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const claimsData = { claims: { sub: userData.user.id } };

    const userId = claimsData.claims.sub;
    const extensionVersion = req.headers.get('X-Extension-Version') || 'unknown';

    console.log(`[extension-sync-miles] Request from user ${userId}, extension v${extensionVersion}`);

    // Parse request body
    const body = await req.json() as SyncRequest;
    
    // Validate request
    if (!body.program || typeof body.balance !== 'number' || !body.captured_at) {
      return new Response(
        JSON.stringify({ error: 'Invalid request body. Required: program, balance, captured_at' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!VALID_PROGRAMS.includes(body.program)) {
      return new Response(
        JSON.stringify({ error: `Invalid program code. Valid: ${VALID_PROGRAMS.join(', ')}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (body.balance < 0 || body.balance > 100_000_000) {
      return new Response(
        JSON.stringify({ error: 'Invalid balance value' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check rate limit
    const rateLimitTime = new Date();
    rateLimitTime.setHours(rateLimitTime.getHours() - RATE_LIMIT_HOURS);

    const { data: recentSync } = await supabaseAdmin
      .from('extension_sync_logs')
      .select('id, created_at')
      .eq('user_id', userId)
      .eq('program_code', body.program)
      .eq('success', true)
      .gte('created_at', rateLimitTime.toISOString())
      .order('created_at', { ascending: false })
      .limit(1);

    if (recentSync && recentSync.length > 0) {
      const lastSync = new Date(recentSync[0].created_at);
      const nextAllowed = new Date(lastSync.getTime() + (RATE_LIMIT_HOURS * 60 * 60 * 1000));
      const remainingMs = nextAllowed.getTime() - Date.now();
      const remainingHours = Math.ceil(remainingMs / (60 * 60 * 1000));

      return new Response(
        JSON.stringify({ 
          error: 'Rate limit exceeded',
          message: `Aguarde ${remainingHours} hora(s) para sincronizar novamente`,
          nextAllowedAt: nextAllowed.toISOString()
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate estimated value
    const valuePerMile = PROGRAM_VALUES[body.program] || 2.0;
    const estimatedValue = (body.balance * valuePerMile) / 100;

    // Find or create the mileage program entry
    const { data: existingProgram } = await supabaseAdmin
      .from('mileage_programs')
      .select('id, balance_miles')
      .eq('user_id', userId)
      .eq('program_code', body.program)
      .maybeSingle();

    let programId: string;
    let previousBalance: number | null = null;

    if (existingProgram) {
      // Update existing program
      programId = existingProgram.id;
      previousBalance = existingProgram.balance_miles;

      const { error: updateError } = await supabaseAdmin
        .from('mileage_programs')
        .update({
          balance_miles: body.balance,
          balance_value: estimatedValue,
          status: 'connected',
          last_sync_at: new Date().toISOString(),
          last_error: null,
          sync_source: 'browser_extension',
          updated_at: new Date().toISOString()
        })
        .eq('id', programId);

      if (updateError) {
        console.error('[extension-sync-miles] Update error:', updateError);
        throw updateError;
      }
    } else {
      // Get program name from code
      const programNames: Record<string, string> = {
        'latam_pass': 'LATAM Pass',
        'azul': 'Azul Fidelidade',
        'smiles': 'Smiles',
        'livelo': 'Livelo',
        'esfera': 'Esfera',
        'aa': 'AAdvantage',
        'united': 'MileagePlus',
        'delta': 'SkyMiles'
      };

      // Create new program entry
      const { data: newProgram, error: insertError } = await supabaseAdmin
        .from('mileage_programs')
        .insert({
          user_id: userId,
          program_code: body.program,
          program_name: programNames[body.program] || body.program,
          balance_miles: body.balance,
          balance_value: estimatedValue,
          status: 'connected',
          last_sync_at: new Date().toISOString(),
          sync_source: 'browser_extension'
        })
        .select('id')
        .single();

      if (insertError) {
        console.error('[extension-sync-miles] Insert error:', insertError);
        throw insertError;
      }

      programId = newProgram.id;
    }

    // Log the sync attempt
    await supabaseAdmin
      .from('extension_sync_logs')
      .insert({
        user_id: userId,
        program_code: body.program,
        program_id: programId,
        balance_captured: body.balance,
        previous_balance: previousBalance,
        captured_at: body.captured_at,
        extension_version: extensionVersion,
        source: body.source || 'browser_extension',
        success: true
      });

    console.log(`[extension-sync-miles] Success! User ${userId}, program ${body.program}, balance ${body.balance}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Milhas sincronizadas com sucesso',
        data: {
          programId,
          program: body.program,
          balance: body.balance,
          estimatedValue,
          previousBalance,
          syncedAt: new Date().toISOString()
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[extension-sync-miles] Error:', error);

    // Try to log the failed attempt - use admin client directly with JWT decode
    try {
      const token = authHeader.replace('Bearer ', '');
      // Decode JWT to get user ID (basic decode without validation for logging purposes)
      const payloadBase64 = token.split('.')[1];
      if (payloadBase64) {
        const payload = JSON.parse(atob(payloadBase64));
        if (payload.sub) {
          await supabaseAdmin
            .from('extension_sync_logs')
            .insert({
              user_id: payload.sub,
              program_code: 'unknown',
              success: false,
              error_message: error instanceof Error ? error.message : 'Unknown error'
            });
        }
      }
    } catch {
      // Ignore logging errors
    }

    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
