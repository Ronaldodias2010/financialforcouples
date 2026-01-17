import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

interface Verify2FAEmailRequest {
  code: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ verified: false, error: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "").trim();
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !userData?.user) {
      console.error("[VERIFY-2FA-EMAIL] auth.getUser error:", userError);
      return new Response(JSON.stringify({ verified: false, error: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { code }: Verify2FAEmailRequest = await req.json();
    const normalizedCode = (code ?? "").toString().replace(/\D/g, "").trim();

    if (normalizedCode.length !== 6) {
      return new Response(JSON.stringify({ verified: false }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = userData.user.id;

    const { data: codeRow, error: codeError } = await supabaseAdmin
      .from("user_2fa_codes")
      .select("id")
      .eq("user_id", userId)
      .eq("method", "email")
      .eq("code_hash", normalizedCode)
      .gt("expires_at", new Date().toISOString())
      .is("used_at", null)
      .maybeSingle();

    if (codeError) {
      console.error("[VERIFY-2FA-EMAIL] code lookup error:", codeError);
      return new Response(JSON.stringify({ verified: false }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!codeRow) {
      return new Response(JSON.stringify({ verified: false }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Mark as used
    const { error: usedError } = await supabaseAdmin
      .from("user_2fa_codes")
      .update({ used_at: new Date().toISOString() })
      .eq("id", codeRow.id);

    if (usedError) {
      console.error("[VERIFY-2FA-EMAIL] update used_at error:", usedError);
      return new Response(JSON.stringify({ verified: false }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Ensure 2FA settings are enabled for email
    const { error: settingsError } = await supabaseAdmin
      .from("user_2fa_settings")
      .upsert(
        {
          user_id: userId,
          method: "email",
          is_enabled: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

    if (settingsError) {
      console.error("[VERIFY-2FA-EMAIL] upsert settings error:", settingsError);
      // Still consider the code verified; user can retry login and settings will update later
    }

    return new Response(JSON.stringify({ verified: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[VERIFY-2FA-EMAIL] Error:", error);
    return new Response(JSON.stringify({ verified: false, error: "internal_error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
