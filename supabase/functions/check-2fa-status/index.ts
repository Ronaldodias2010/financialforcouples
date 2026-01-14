import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { userId } = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "userId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Get 2FA settings
    const { data: settings, error: settingsError } = await supabaseAdmin
      .from("user_2fa_settings")
      .select("is_enabled, method, phone_number")
      .eq("user_id", userId)
      .maybeSingle();

    if (settingsError) {
      console.error("Error fetching 2FA settings:", settingsError);
      return new Response(
        JSON.stringify({ is_enabled: false, method: "none", phone_number: null }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If SMS method is enabled but no phone in 2FA settings, get from profile
    let phoneNumber = settings?.phone_number ?? null;
    
    if (settings?.method === 'sms' && !phoneNumber) {
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("phone_number")
        .eq("user_id", userId)
        .single();
      
      if (profile?.phone_number) {
        // Format phone number with + prefix
        let phone = profile.phone_number.replace(/\D/g, '');
        if (!phone.startsWith('+')) {
          phone = `+${phone}`;
        }
        phoneNumber = phone;
        
        // Update 2FA settings with the correct phone from profile
        await supabaseAdmin
          .from("user_2fa_settings")
          .update({ phone_number: phoneNumber, updated_at: new Date().toISOString() })
          .eq("user_id", userId);
        
        console.log(`[check-2fa-status] Updated phone for user ${userId} from profile: ${phoneNumber}`);
      }
    }

    return new Response(
      JSON.stringify({
        is_enabled: settings?.is_enabled ?? false,
        method: settings?.method ?? "none",
        phone_number: phoneNumber,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ is_enabled: false, method: "none", phone_number: null }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});