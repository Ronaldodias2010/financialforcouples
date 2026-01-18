import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

console.log('✅ ensure-profile function loaded');

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Invalid token');
    }

    console.log('🔍 Checking profile for user:', user.id);

    // Check if profile exists
    const { data: existingProfile, error: checkError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (checkError) {
      console.error('❌ Error checking profile:', checkError);
      throw checkError;
    }

    if (existingProfile) {
      console.log('✅ Profile already exists');
      return new Response(
        JSON.stringify({ 
          success: true, 
          profileExists: true,
          profile: existingProfile 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Profile doesn't exist, create it
    console.log('📝 Creating profile for user:', user.id);
    
    const displayName = user.user_metadata?.display_name || 
                       user.user_metadata?.full_name || 
                       user.user_metadata?.name ||
                       user.email?.split('@')[0] ||
                       'User';

    const phoneNumber = user.user_metadata?.phone_number || null;

    const { data: newProfile, error: insertError } = await supabase
      .from('profiles')
      .insert({
        user_id: user.id,
        display_name: displayName,
        phone_number: phoneNumber
      })
      .select()
      .single();

    if (insertError) {
      console.error('❌ Error creating profile:', insertError);
      throw insertError;
    }

    console.log('✅ Profile created successfully');

    // Create Emergency Fund Account automatically for new users
    console.log('🏦 Creating emergency fund account for user:', user.id);
    
    const { data: existingEmergencyAccount } = await supabase
      .from('accounts')
      .select('id')
      .eq('user_id', user.id)
      .eq('account_type', 'emergency')
      .maybeSingle();

    if (!existingEmergencyAccount) {
      const { error: accountError } = await supabase
        .from('accounts')
        .insert({
          user_id: user.id,
          owner_user: 'user1',
          name: 'Reserva de Emergência',
          account_type: 'emergency',
          account_model: 'personal',
          balance: 0,
          overdraft_limit: 0,
          currency: 'BRL',
          is_active: true,
          is_cash_account: false
        });

      if (accountError) {
        console.error('❌ Error creating emergency account:', accountError);
        // Don't throw - profile was created successfully, account is secondary
      } else {
        console.log('✅ Emergency fund account created successfully');
      }
    } else {
      console.log('✅ Emergency fund account already exists');
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        profileExists: false,
        profileCreated: true,
        profile: newProfile 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ ensure-profile error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
