import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[COMPLETE-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");

    logStep("User authenticated", { userId: user.id, email: user.email });

    const { sessionToken } = await req.json();
    if (!sessionToken) throw new Error("Session token required");

    // Find checkout session
    const { data: checkoutSession, error: sessionError } = await supabaseService
      .from("checkout_sessions")
      .select("*")
      .eq("session_token", sessionToken)
      .eq("email", user.email)
      .single();

    if (sessionError || !checkoutSession) {
      throw new Error("Invalid or expired checkout session");
    }

    logStep("Found checkout session", { sessionId: checkoutSession.id });

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    
    // Create or find Stripe customer
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Found existing customer", { customerId });
    } else {
      const newCustomer = await stripe.customers.create({
        email: user.email,
        name: checkoutSession.full_name,
        phone: checkoutSession.phone,
        metadata: { user_id: user.id }
      });
      customerId = newCustomer.id;
      logStep("Created new customer", { customerId });
    }

    // Determine price ID based on plan
    // Using the same price for all regions for now - you should create specific prices in Stripe
    const priceId = checkoutSession.selected_plan === 'yearly' 
      ? 'price_1RsLL5FOhUY5r0H1WIXv7yuP' // yearly price ID 
      : 'price_1RsLL5FOhUY5r0H1WIXv7yuP'; // monthly price ID - same for now, create separate in Stripe

    // Create Stripe checkout session
    const stripeSession = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${req.headers.get("origin")}/auth?checkout=success&token=${sessionToken}`,
      cancel_url: `${req.headers.get("origin")}/checkout-direto?token=${sessionToken}`,
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      customer_update: {
        address: 'auto',
        name: 'auto'
      }
    });

    logStep("Created Stripe session", { sessionId: stripeSession.id, url: stripeSession.url });

    // Update checkout session with Stripe session ID
    await supabaseService
      .from("checkout_sessions")
      .update({
        stripe_session_id: stripeSession.id,
        user_id: user.id,
        status: 'payment_pending',
        updated_at: new Date().toISOString()
      })
      .eq("id", checkoutSession.id);

    return new Response(JSON.stringify({ url: stripeSession.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in complete-checkout", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});