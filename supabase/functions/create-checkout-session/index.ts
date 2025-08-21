import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT-SESSION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { email, fullName, phone, selectedPlan } = await req.json();
    
    if (!email || !fullName) {
      throw new Error("Email and fullName are required");
    }

    logStep("Creating checkout session", { email, fullName, selectedPlan });

    // Create checkout session record
    const { data: sessionData, error: sessionError } = await supabaseClient
      .from("checkout_sessions")
      .insert({
        email,
        full_name: fullName,
        phone,
        selected_plan: selectedPlan || 'monthly',
        status: 'pending'
      })
      .select()
      .single();

    if (sessionError) {
      throw new Error(`Failed to create checkout session: ${sessionError.message}`);
    }

    logStep("Checkout session created", { sessionId: sessionData.id });

    return new Response(JSON.stringify({ 
      sessionId: sessionData.id,
      sessionToken: sessionData.session_token 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-checkout-session", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});