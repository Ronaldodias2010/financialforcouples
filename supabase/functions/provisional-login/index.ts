import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

console.log('✅ provisional-login function loaded');

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Create admin client with service role
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const { email, password } = await req.json();

    if (!email || !password) {
      return new Response(
        JSON.stringify({ success: false, error: 'Email and password are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('🔐 [provisional-login] Attempting login for:', email);

    // First, verify the user exists and password is correct
    // We need to find the user by email
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (userError) {
      console.error('❌ [provisional-login] Error listing users:', userError);
      return new Response(
        JSON.stringify({ success: false, error: 'Authentication failed' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const user = userData.users.find(u => u.email?.toLowerCase() === email.toLowerCase());
    
    if (!user) {
      console.log('❌ [provisional-login] User not found:', email);
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid credentials' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ [provisional-login] User found:', user.id, 'email_confirmed:', user.email_confirmed_at ? 'yes' : 'no');

    // Try to sign in with email/password to verify the password
    // Using a temporary anon client for password verification
    const supabaseAnon = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!);
    
    const { data: signInData, error: signInError } = await supabaseAnon.auth.signInWithPassword({
      email,
      password
    });

    // If sign in succeeds, the user can login normally (email is confirmed)
    if (signInData?.session) {
      console.log('✅ [provisional-login] Normal login successful, returning session');
      return new Response(
        JSON.stringify({ 
          success: true, 
          access_token: signInData.session.access_token,
          refresh_token: signInData.session.refresh_token,
          user: signInData.user,
          provisional: false
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If error is NOT about email confirmation, it's a real error (wrong password)
    if (signInError && !signInError.message?.toLowerCase().includes('email not confirmed')) {
      console.log('❌ [provisional-login] Login failed:', signInError.message);
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid credentials' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Email not confirmed - verify password using admin API by creating a verification request
    console.log('🔄 [provisional-login] Email not confirmed, generating session via admin...');

    // Generate a session for the user using admin API
    // First, we need to confirm the email temporarily to allow login
    // Then generate the session, then mark as provisional in our system
    
    // Update user to confirm email (this is safe because we verified the password attempt)
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      email_confirm: true
    });

    if (updateError) {
      console.error('❌ [provisional-login] Error confirming email:', updateError);
      return new Response(
        JSON.stringify({ success: false, error: 'Could not complete provisional login' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Now try to sign in again
    const { data: finalSignIn, error: finalError } = await supabaseAnon.auth.signInWithPassword({
      email,
      password
    });

    if (finalError || !finalSignIn?.session) {
      console.error('❌ [provisional-login] Final login failed:', finalError);
      return new Response(
        JSON.stringify({ success: false, error: 'Login failed after email confirmation' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ [provisional-login] Provisional login successful!');

    // Mark user as having provisional access in profiles table
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ 
        provisional_login: true,
        email_verified: false 
      })
      .eq('user_id', user.id);

    if (profileError) {
      console.warn('⚠️ [provisional-login] Could not update profile provisional status:', profileError);
      // Don't fail the login, this is not critical
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        access_token: finalSignIn.session.access_token,
        refresh_token: finalSignIn.session.refresh_token,
        user: finalSignIn.user,
        provisional: true,
        message: 'Logged in with provisional access. Please verify your email for full access.'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ [provisional-login] Unexpected error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'An error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
