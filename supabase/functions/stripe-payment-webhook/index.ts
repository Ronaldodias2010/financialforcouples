import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';
import Stripe from 'https://esm.sh/stripe@13.11.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2024-06-20',
  httpClient: Stripe.createFetchHttpClient(),
});

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const handler = async (req: Request): Promise<Response> => {
  console.log('[STRIPE-WEBHOOK] Function started');

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

    if (!webhookSecret || !signature) {
      console.error('[STRIPE-WEBHOOK] Missing webhook secret or signature');
      return new Response('Missing webhook secret or signature', { status: 400 });
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('[STRIPE-WEBHOOK] Webhook signature verification failed:', err);
      return new Response('Invalid signature', { status: 400 });
    }

    console.log('[STRIPE-WEBHOOK] Processing event:', event.type);

    switch (event.type) {
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(invoice);
        break;
      }
      
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCanceled(subscription);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentSucceeded(invoice);
        break;
      }

      default:
        console.log('[STRIPE-WEBHOOK] Unhandled event type:', event.type);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (error: any) {
    console.error('[STRIPE-WEBHOOK] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
};

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  console.log('[STRIPE-WEBHOOK] Handling payment failure for:', invoice.customer);
  
  try {
    // Get customer details
    const customer = await stripe.customers.retrieve(invoice.customer as string) as Stripe.Customer;
    if (!customer.email) {
      console.error('[STRIPE-WEBHOOK] Customer has no email');
      return;
    }

    // Find user in our database
    const { data: subscriber } = await supabase
      .from('subscribers')
      .select('user_id, email')
      .eq('stripe_customer_id', customer.id)
      .single();

    if (!subscriber) {
      console.error('[STRIPE-WEBHOOK] No subscriber found for customer:', customer.id);
      return;
    }

    // Create payment failure record
    const gracePeriodEnd = new Date();
    gracePeriodEnd.setHours(gracePeriodEnd.getHours() + 24); // 24 hour grace period

    const { error: insertError } = await supabase
      .from('payment_failures')
      .insert({
        user_id: subscriber.user_id,
        email: subscriber.email,
        stripe_customer_id: customer.id,
        stripe_invoice_id: invoice.id,
        failure_reason: invoice.last_finalization_error?.message || 'Payment method failed',
        grace_period_started_at: new Date().toISOString(),
        grace_period_ends_at: gracePeriodEnd.toISOString(),
        status: 'failed'
      });

    if (insertError) {
      console.error('[STRIPE-WEBHOOK] Error inserting payment failure:', insertError);
      return;
    }

    // Schedule immediate payment failure email
    await scheduleEmail(
      subscriber.user_id,
      'payment_failed',
      new Date(),
      subscriber.email,
      null
    );

    // Schedule grace period email for 24h later  
    await scheduleEmail(
      subscriber.user_id,
      'grace_period', 
      gracePeriodEnd,
      subscriber.email,
      null
    );

    console.log('[STRIPE-WEBHOOK] Payment failure processed and emails scheduled');
    
  } catch (error) {
    console.error('[STRIPE-WEBHOOK] Error handling payment failure:', error);
  }
}

async function handleSubscriptionCanceled(subscription: Stripe.Subscription) {
  console.log('[STRIPE-WEBHOOK] Handling subscription cancellation for:', subscription.customer);
  
  try {
    // Update subscriber status
    const { error } = await supabase
      .from('subscribers')
      .update({
        subscribed: false,
        subscription_tier: 'essential',
        updated_at: new Date().toISOString()
      })
      .eq('stripe_customer_id', subscription.customer);

    if (error) {
      console.error('[STRIPE-WEBHOOK] Error updating subscriber:', error);
    } else {
      console.log('[STRIPE-WEBHOOK] Subscriber downgraded to essential');
    }
  } catch (error) {
    console.error('[STRIPE-WEBHOOK] Error handling subscription cancellation:', error);
  }
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log('[STRIPE-WEBHOOK] Handling payment success for:', invoice.customer);
  
  try {
    // Find and resolve any existing payment failures
    const { error } = await supabase
      .from('payment_failures')
      .update({
        status: 'resolved',
        resolved_at: new Date().toISOString()
      })
      .eq('stripe_customer_id', invoice.customer)
      .in('status', ['failed', 'grace_period']);

    if (!error) {
      console.log('[STRIPE-WEBHOOK] Payment failure resolved');
    }
  } catch (error) {
    console.error('[STRIPE-WEBHOOK] Error resolving payment failure:', error);
  }
}

async function scheduleEmail(
  userId: string,
  emailType: string,
  scheduledFor: Date,
  emailAddress: string,
  subscriptionEndDate: Date | null
) {
  // Detect language from email domain or default to Portuguese
  const language = emailAddress.includes('.com') && !emailAddress.includes('.com.br') ? 'en' : 'pt';
  
  const { error } = await supabase
    .from('payment_email_queue')
    .insert({
      user_id: userId,
      email_type: emailType,
      scheduled_for: scheduledFor.toISOString(),
      email_address: emailAddress,
      language: language,
      subscription_end_date: subscriptionEndDate,
      status: 'pending'
    });

  if (error) {
    console.error('[STRIPE-WEBHOOK] Error scheduling email:', error);
  }
}

serve(handler);