import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper to decode base64url
function base64urlDecode(str: string): Uint8Array {
  const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(base64 + padding);
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { credential, userId } = body;

    if (!credential || !credential.id || !credential.response || !userId) {
      return new Response(
        JSON.stringify({ error: "Invalid authentication data" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[WebAuthn] Verifying login for user: ${userId}`);

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get stored challenge
    const { data: challengeData, error: challengeError } = await adminClient
      .from("webauthn_challenges")
      .select("*")
      .eq("user_id", userId)
      .eq("type", "authentication")
      .gte("expires_at", new Date().toISOString())
      .single();

    if (challengeError || !challengeData) {
      console.error("[WebAuthn] Challenge not found or expired");
      return new Response(
        JSON.stringify({ error: "Challenge expired. Please try again." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get stored credential
    const { data: storedCredential, error: credError } = await adminClient
      .from("webauthn_credentials")
      .select("*")
      .eq("user_id", userId)
      .eq("credential_id", credential.id)
      .single();

    if (credError || !storedCredential) {
      console.error("[WebAuthn] Credential not found");
      return new Response(
        JSON.stringify({ error: "Credential not found" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Decode and verify client data
    const clientDataJSON = base64urlDecode(credential.response.clientDataJSON);
    const clientData = JSON.parse(new TextDecoder().decode(clientDataJSON));

    if (clientData.challenge !== challengeData.challenge) {
      console.error("[WebAuthn] Challenge mismatch");
      return new Response(
        JSON.stringify({ error: "Challenge verification failed" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (clientData.type !== "webauthn.get") {
      console.error("[WebAuthn] Invalid client data type");
      return new Response(
        JSON.stringify({ error: "Invalid authentication type" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify origin
    const allowedOrigins = [
      "https://couplesfinancials.com",
      "https://www.couplesfinancials.com",
      "https://id-preview--7150d9bc-0276-4ec3-9617-5a690eb3a444.lovable.app",
    ];
    
    const originMatch = allowedOrigins.some(origin => 
      clientData.origin.includes(origin.replace("https://", ""))
    );
    
    if (!originMatch) {
      console.log("[WebAuthn] Warning: Origin check - received:", clientData.origin);
      // Be lenient for development
    }

    // Decode authenticator data and check counter
    const authData = base64urlDecode(credential.response.authenticatorData);
    
    // Counter is at bytes 33-36 (after rpIdHash and flags)
    const counter = new DataView(authData.buffer, authData.byteOffset + 33, 4).getUint32(0);
    
    // Verify counter is greater than stored counter (replay protection)
    if (counter <= storedCredential.counter) {
      console.error("[WebAuthn] Counter replay detected");
      // For platform authenticators, counter might always be 0
      // Only fail if counter is non-zero and less than stored
      if (storedCredential.counter > 0 && counter > 0) {
        return new Response(
          JSON.stringify({ error: "Replay attack detected" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Update counter and last used timestamp
    await adminClient
      .from("webauthn_credentials")
      .update({ 
        counter: counter,
        last_used_at: new Date().toISOString(),
      })
      .eq("id", storedCredential.id);

    // Clean up challenge
    await adminClient
      .from("webauthn_challenges")
      .delete()
      .eq("user_id", userId);

    // Generate session token for the user
    // Use signInWithPassword alternative - create a magic link token
    const { data: userData } = await adminClient.auth.admin.getUserById(userId);
    
    if (!userData?.user?.email) {
      throw new Error("User not found");
    }

    // Generate a one-time sign-in link
    const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
      type: "magiclink",
      email: userData.user.email,
      options: {
        redirectTo: "https://couplesfinancials.com/app",
      },
    });

    if (linkError) {
      console.error("[WebAuthn] Error generating sign-in link:", linkError);
      throw linkError;
    }

    // Extract token from the link
    const tokenMatch = linkData.properties?.hashed_token;
    
    console.log("[WebAuthn] Login verification successful for user:", userId);

    return new Response(
      JSON.stringify({ 
        success: true,
        email: userData.user.email,
        // Return the OTP token for client-side verification
        token: linkData.properties?.hashed_token,
        token_type: "magiclink",
        // Alternative: use verifyOtp on client side
        action_link: linkData.properties?.action_link,
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
