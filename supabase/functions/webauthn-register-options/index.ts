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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the origin from request headers to determine RP ID
    const origin = req.headers.get("Origin") || req.headers.get("Referer") || "";
    let rpId = "couplesfinancials.com"; // Default for production
    
    // Check if running on preview/development environment
    if (origin.includes("lovableproject.com")) {
      // Extract the subdomain for lovableproject.com
      const match = origin.match(/([a-z0-9-]+\.lovableproject\.com)/i);
      rpId = match ? match[1] : "lovableproject.com";
    } else if (origin.includes("lovable.app")) {
      const match = origin.match(/([a-z0-9-]+\.lovable\.app)/i);
      rpId = match ? match[1] : "lovable.app";
    } else if (origin.includes("localhost")) {
      rpId = "localhost";
    }
    
    console.log(`[WebAuthn] Using RP ID: ${rpId} (from origin: ${origin})`);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.claims.sub as string;
    const userEmail = claimsData.claims.email as string;

    console.log(`[WebAuthn] Generating registration options for user: ${userId}`);

    // Generate challenge
    const challenge = generateChallenge();

    // Store challenge in database
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Clean up old challenges for this user
    await adminClient
      .from("webauthn_challenges")
      .delete()
      .eq("user_id", userId);

    // Store new challenge with RP ID for verification
    const { error: insertError } = await adminClient
      .from("webauthn_challenges")
      .insert({
        user_id: userId,
        challenge: challenge,
        type: "registration",
        expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      });

    if (insertError) {
      console.error("[WebAuthn] Error storing challenge:", insertError);
      throw insertError;
    }

    // Get existing credentials to exclude
    const { data: existingCredentials } = await adminClient
      .from("webauthn_credentials")
      .select("credential_id")
      .eq("user_id", userId);

    const excludeCredentials = (existingCredentials || []).map((cred) => ({
      id: cred.credential_id,
      type: "public-key" as const,
      transports: ["internal", "hybrid"] as AuthenticatorTransport[],
    }));

    // Build registration options
    const registrationOptions = {
      challenge: challenge,
      rp: {
        name: "CouplesFinancials",
        id: rpId,
      },
      user: {
        id: btoa(userId).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, ""),
        name: userEmail,
        displayName: userEmail.split("@")[0],
      },
      pubKeyCredParams: [
        { alg: -7, type: "public-key" },   // ES256
        { alg: -257, type: "public-key" }, // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: "platform",
        userVerification: "required",
        residentKey: "preferred",
      },
      timeout: 60000,
      attestation: "none",
      excludeCredentials: excludeCredentials,
    };

    console.log("[WebAuthn] Registration options generated successfully");

    return new Response(
      JSON.stringify({ options: registrationOptions }),
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
