import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Found existing customer", { customerId });
    } else {
      const newCustomer = await stripe.customers.create({
        email: user.email,
        metadata: { user_id: user.id }
      });
      customerId = newCustomer.id;
      logStep("Created new customer", { customerId });
    }

    // Determine which price to use (defaults to monthly)
    let selectedPrice = "price_1S1qdSFOhUY5r0H1b7o1WG2Z";
    let promoData = null;
    let sessionConfig: any = {};
    
    try {
      const body = await req.json();
      if (body?.priceId && typeof body.priceId === 'string') {
        selectedPrice = body.priceId;
      }
      if (body?.promoData) {
        promoData = body.promoData;
        logStep("Promo data received", promoData);
        
        // If promo has a specific Stripe price ID, use it
        if (promoData.stripe_price_id) {
          selectedPrice = promoData.stripe_price_id;
          logStep("Using promo price ID", { priceId: selectedPrice });
        }
        
        // Configure discount for the session if no specific price ID
        if (!promoData.stripe_price_id && promoData.discount_value) {
          if (promoData.discount_type === 'percentage') {
            sessionConfig.discounts = [{
              coupon: await stripe.coupons.create({
                percent_off: promoData.discount_value,
                duration: 'once'
              })
            }];
          } else if (promoData.discount_type === 'fixed') {
            sessionConfig.discounts = [{
              coupon: await stripe.coupons.create({
                amount_off: Math.round(promoData.discount_value * 100), // Convert to cents
                currency: 'brl',
                duration: 'once'
              })
            }];
          }
        }
      }
    } catch (_) {
      // No body provided; keep default price
    }
    logStep("Using price", { priceId: selectedPrice, hasPromo: !!promoData });

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: selectedPrice,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${req.headers.get("origin")}/subscription-success`,
      cancel_url: `${req.headers.get("origin")}/subscription`,
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      customer_update: {
        address: 'auto',
        name: 'auto'
      },
      ...sessionConfig
    });

    logStep("Created checkout session", { sessionId: session.id, url: session.url });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-checkout", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});