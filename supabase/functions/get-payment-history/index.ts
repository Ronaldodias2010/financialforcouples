import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[GET-PAYMENT-HISTORY] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    const token = authHeader.replace("Bearer ", "");

    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Find stripe customer by email
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    if (customers.data.length === 0) {
      logStep("No Stripe customer found");
      return new Response(JSON.stringify({ payments: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found customer", { customerId });

    // Get payment history from charges
    const charges = await stripe.charges.list({
      customer: customerId,
      limit: 50,
      expand: ["data.payment_method"],
    });

    // Get invoices for subscription payments
    const invoices = await stripe.invoices.list({
      customer: customerId,
      limit: 50,
      status: 'paid',
    });

    const payments = [];

    // Process charges (one-time payments and subscription payments)
    for (const charge of charges.data) {
      if (charge.status === 'succeeded') {
        payments.push({
          id: charge.id,
          amount: charge.amount / 100,
          currency: charge.currency,
          date: new Date(charge.created * 1000).toISOString(),
          status: 'paid',
          description: charge.description || 'Pagamento',
          type: 'charge',
          payment_method: charge.payment_method_details?.card ? {
            brand: charge.payment_method_details.card.brand,
            last4: charge.payment_method_details.card.last4
          } : null
        });
      }
    }

    // Process invoices (subscription payments)
    for (const invoice of invoices.data) {
      if (invoice.status === 'paid' && invoice.amount_paid > 0) {
        payments.push({
          id: invoice.id,
          amount: invoice.amount_paid / 100,
          currency: invoice.currency,
          date: new Date(invoice.status_transitions.paid_at! * 1000).toISOString(),
          status: 'paid',
          description: invoice.description || `Assinatura Premium - ${invoice.lines.data[0]?.description || 'Mensalidade'}`,
          type: 'subscription',
          invoice_number: invoice.number,
          period: {
            start: new Date(invoice.period_start * 1000).toISOString(),
            end: new Date(invoice.period_end * 1000).toISOString()
          }
        });
      }
    }

    // Remove duplicates and sort by date (newest first)
    const uniquePayments = payments
      .filter((payment, index, self) => 
        index === self.findIndex(p => p.id === payment.id)
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    logStep("Retrieved payment history", { count: uniquePayments.length });

    return new Response(JSON.stringify({ payments: uniquePayments }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message });
    return new Response(JSON.stringify({ error: message, payments: [] }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});