import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Generate a random challenge
function generateChallenge(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[WebAuthn] Generating login options for email: ${email}`);

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Find user by email
    const { data: userData, error: userError } = await adminClient.auth.admin.listUsers();
    
    if (userError) {
      console.error("[WebAuthn] Error fetching users:", userError);
      throw userError;
    }

    const user = userData.users.find(u => u.email?.toLowerCase() === email.toLowerCase());
    
    if (!user) {
      // Don't reveal if user exists or not
      return new Response(
        JSON.stringify({ 
          error: "no_credentials",
          message: "Nenhuma credencial biométrica encontrada para este email" 
        }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user's credentials
    const { data: credentials, error: credError } = await adminClient
      .from("webauthn_credentials")
      .select("credential_id, transports")
      .eq("user_id", user.id);

    if (credError) {
      console.error("[WebAuthn] Error fetching credentials:", credError);
      throw credError;
    }

    if (!credentials || credentials.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: "no_credentials",
          message: "Nenhuma credencial biométrica encontrada para este email" 
        }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate challenge
    const challenge = generateChallenge();

    // Store challenge
    await adminClient
      .from("webauthn_challenges")
      .delete()
      .eq("user_id", user.id);

    const { error: insertError } = await adminClient
      .from("webauthn_challenges")
      .insert({
        user_id: user.id,
        challenge: challenge,
        type: "authentication",
        expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      });

    if (insertError) {
      console.error("[WebAuthn] Error storing challenge:", insertError);
      throw insertError;
    }

    // Build authentication options
    const allowCredentials = credentials.map((cred) => ({
      id: cred.credential_id,
      type: "public-key" as const,
      transports: cred.transports || ["internal", "hybrid"],
    }));

    const authenticationOptions = {
      challenge: challenge,
      rpId: "couplesfinancials.com",
      allowCredentials: allowCredentials,
      userVerification: "required",
      timeout: 60000,
    };

    console.log("[WebAuthn] Login options generated successfully");

    return new Response(
      JSON.stringify({ 
        options: authenticationOptions,
        userId: user.id, // We'll need this for verification
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[WebAuthn] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
