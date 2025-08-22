import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[MANAGE-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    const token = authHeader.replace("Bearer ", "");

    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const { action, subscriptionId, priceId, paymentMethodId } = await req.json();
    logStep("Action requested", { action, subscriptionId, priceId, paymentMethodId });

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Find stripe customer by email
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    if (customers.data.length === 0) {
      throw new Error("No Stripe customer found for this user");
    }
    const customerId = customers.data[0].id;
    logStep("Found customer", { customerId });

    let result;

    switch (action) {
      case "cancel_subscription":
        if (!subscriptionId) throw new Error("Subscription ID required");
        result = await stripe.subscriptions.update(subscriptionId, {
          cancel_at_period_end: true,
        });
        logStep("Subscription marked for cancellation", { subscriptionId });
        break;

      case "reactivate_subscription":
        if (!subscriptionId) throw new Error("Subscription ID required");
        result = await stripe.subscriptions.update(subscriptionId, {
          cancel_at_period_end: false,
        });
        logStep("Subscription reactivated", { subscriptionId });
        break;

      case "change_plan":
        if (!subscriptionId || !priceId) throw new Error("Subscription ID and Price ID required");
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        result = await stripe.subscriptions.update(subscriptionId, {
          items: [{
            id: subscription.items.data[0].id,
            price: priceId,
          }],
          proration_behavior: 'always_invoice',
        });
        logStep("Plan changed", { subscriptionId, newPriceId: priceId });
        break;

      case "update_payment_method":
        if (!paymentMethodId) throw new Error("Payment Method ID required");
        
        // Attach payment method to customer
        await stripe.paymentMethods.attach(paymentMethodId, {
          customer: customerId,
        });

        // Set as default payment method
        await stripe.customers.update(customerId, {
          invoice_settings: {
            default_payment_method: paymentMethodId,
          },
        });

        // Update subscription's default payment method
        const subscriptions = await stripe.subscriptions.list({
          customer: customerId,
          status: 'active',
          limit: 1,
        });

        if (subscriptions.data.length > 0) {
          await stripe.subscriptions.update(subscriptions.data[0].id, {
            default_payment_method: paymentMethodId,
          });
        }

        result = { success: true };
        logStep("Payment method updated", { paymentMethodId });
        break;

      case "get_setup_intent":
        const setupIntent = await stripe.setupIntents.create({
          customer: customerId,
          payment_method_types: ['card'],
          usage: 'off_session',
        });
        result = {
          client_secret: setupIntent.client_secret,
        };
        logStep("Setup intent created", { setupIntentId: setupIntent.id });
        break;

      case "download_invoice":
        const { invoiceId } = await req.json();
        if (!invoiceId) throw new Error("Invoice ID required");
        
        const invoice = await stripe.invoices.retrieve(invoiceId);
        result = {
          download_url: invoice.invoice_pdf,
          invoice_number: invoice.number,
        };
        logStep("Invoice download prepared", { invoiceId });
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message });
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});