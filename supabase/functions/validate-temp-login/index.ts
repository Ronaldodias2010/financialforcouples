import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

// Restricted CORS headers - only allow specific origins
const corsHeaders = {
  "Access-Control-Allow-Origin": "https://elxttabdtddlavhseipz.lovableproject.com",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limiting storage (in production, use Redis or similar)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function isRateLimited(identifier: string): boolean {
  const now = Date.now();
  const limit = rateLimitMap.get(identifier);
  
  if (!limit || now > limit.resetTime) {
    // Reset or create new limit
    rateLimitMap.set(identifier, { count: 1, resetTime: now + 60000 }); // 1 minute window
    return false;
  }
  
  if (limit.count >= 5) { // Max 5 attempts per minute
    return true;
  }
  
  limit.count++;
  return false;
}

interface TempLoginRequest {
  email: string;
  temp_password: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    
    // Rate limiting check
    if (isRateLimited(clientIP)) {
      console.log(`Rate limit exceeded for IP: ${clientIP}`);
      return new Response(
        JSON.stringify({ error: "Too many attempts. Please try again later." }),
        {
          status: 429,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const { email, temp_password }: TempLoginRequest = await req.json();

    if (!email || !temp_password) {
      return new Response(
        JSON.stringify({ error: "Invalid request format" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log(`Validating temp login for email: ${email}`);

    // Check if invite exists and is valid (using the hashed password)
    const { data: invite, error: inviteError } = await supabase
      .from('user_invites')
      .select('*')
      .eq('invitee_email', email)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .single();

    if (inviteError || !invite) {
      console.log(`Invalid or expired invite for email: ${email}`);
      return new Response(
        JSON.stringify({ error: "Invalid or expired invitation" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Verify password using the new hash verification function
    const { data: passwordValid, error: verifyError } = await supabase
      .rpc('verify_temp_password', {
        password: temp_password,
        hash: invite.temp_password_hash
      });

    if (verifyError || !passwordValid) {
      console.log(`Invalid password for email: ${email}`);
      return new Response(
        JSON.stringify({ error: "Invalid credentials" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Generate a secure password for the permanent account
    const permanentPassword = crypto.randomUUID();
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email: email,
      password: permanentPassword,
      email_confirm: true,
      user_metadata: {
        display_name: invite.invitee_name,
        requires_password_change: true
      }
    });

    if (userError || !userData.user) {
      console.error('Error creating user:', userError);
      return new Response(
        JSON.stringify({ error: "Failed to create account" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Create or update profile
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        user_id: userData.user.id,
        display_name: invite.invitee_name,
      });

    if (profileError) {
      console.error('Error creating profile:', profileError);
    }

    // Create couple relationship
    const { error: coupleError } = await supabase
      .from('user_couples')
      .insert({
        user1_id: invite.inviter_user_id,
        user2_id: userData.user.id,
        status: 'active'
      });

    if (coupleError) {
      console.error('Error creating couple relationship:', coupleError);
    }

    // Mark invite as accepted and clear sensitive data
    const { error: updateError } = await supabase
      .from('user_invites')
      .update({
        status: 'accepted',
        temp_password: null, // Clear plaintext if any
        temp_password_hash: null, // Clear hash after use
        updated_at: new Date().toISOString()
      })
      .eq('id', invite.id);

    if (updateError) {
      console.error('Error updating invite status:', updateError);
    }

    // Sign in the user to get session tokens
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: email,
      password: permanentPassword,
    });

    if (signInError || !signInData.session) {
      console.error('Error signing in user:', signInError);
      return new Response(
        JSON.stringify({ error: "Account created but sign-in failed" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log(`Successfully created account and signed in user: ${email}`);

    return new Response(JSON.stringify({
      message: "Account created successfully",
      user: signInData.user,
      session: signInData.session,
      requires_password_change: true
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });


  } catch (error: any) {
    console.error("Error in validate-temp-login function:", error);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);