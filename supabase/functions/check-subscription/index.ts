import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
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
    logStep("Stripe key verified");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    logStep("Authenticating user with token");
    
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // First check for manual premium access (takes priority over Stripe)
    const { data: manualAccess } = await supabaseClient
      .from("manual_premium_access")
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .gte('end_date', new Date().toISOString().split('T')[0])
      .maybeSingle();

    if (manualAccess) {
      logStep("Active manual premium access found", { 
        email: manualAccess.email, 
        endDate: manualAccess.end_date 
      });
      
      await supabaseClient.from("subscribers").upsert({
        email: user.email,
        user_id: user.id,
        stripe_customer_id: null,
        subscribed: true,
        subscription_tier: 'premium',
        subscription_end: `${manualAccess.end_date}T23:59:59+00:00`,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'email' });
      
      await supabaseClient.from("profiles").update({
        subscribed: true,
        subscription_tier: 'premium'
      }).eq('user_id', user.id);

      return new Response(JSON.stringify({ 
        subscribed: true,
        subscription_tier: 'premium',
        subscription_end: `${manualAccess.end_date}T23:59:59+00:00`,
        manual_access: true
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }


    // Check if user is admin - admins automatically get premium access
    const adminEmails = ['admin@arxexperience.com.br', 'admin@example.com'];
    if (adminEmails.includes(user.email)) {
      logStep("Admin user detected, granting premium access", { email: user.email });
      
      // Update database with premium status for the admin
      await supabaseClient.from("subscribers").upsert({
        email: user.email,
        user_id: user.id,
        stripe_customer_id: null,
        subscribed: true,
        subscription_tier: 'premium',
        subscription_end: '2025-12-31T23:59:59+00:00',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'email' });
      
      await supabaseClient.from("profiles").update({
        subscribed: true,
        subscription_tier: 'premium'
      }).eq('user_id', user.id);

      // Also grant premium to active partner, if any
      const { data: couple } = await supabaseClient
        .from('user_couples')
        .select('user1_id, user2_id, status')
        .eq('status', 'active')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .maybeSingle();

      if (couple) {
        const partnerId = couple.user1_id === user.id ? couple.user2_id : couple.user1_id;
        if (partnerId) {
          const { data: partnerUser } = await supabaseClient.auth.admin.getUserById(partnerId);
          const partnerEmail = partnerUser?.user?.email || null;

          if (partnerEmail) {
            await supabaseClient.from('subscribers').upsert({
              email: partnerEmail,
              user_id: partnerId,
              stripe_customer_id: null,
              subscribed: true,
              subscription_tier: 'premium',
              subscription_end: '2025-12-31T23:59:59+00:00',
              updated_at: new Date().toISOString(),
            }, { onConflict: 'email' });
          }

          await supabaseClient.from('profiles').update({
            subscribed: true,
            subscription_tier: 'premium',
          }).eq('user_id', partnerId);
        }
      }
      
      return new Response(JSON.stringify({ 
        subscribed: true,
        subscription_tier: 'premium',
        subscription_end: '2025-12-31T23:59:59+00:00',
        admin_access: true
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Check existing subscription data in database
    const { data: existingSubscriber } = await supabaseClient
      .from("subscribers")
      .select('*')
      .eq('email', user.email)
      .single();

    logStep("Existing subscriber data", existingSubscriber);

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("No Stripe customer found, checking local subscription data");
      
      // If user has local subscription data (like manual premium), preserve it
      if (existingSubscriber && existingSubscriber.subscribed) {
        logStep("Local subscription found, preserving it", { 
          tier: existingSubscriber.subscription_tier,
          end: existingSubscriber.subscription_end 
        });
        
        return new Response(JSON.stringify({ 
          subscribed: existingSubscriber.subscribed,
          subscription_tier: existingSubscriber.subscription_tier,
          subscription_end: existingSubscriber.subscription_end
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      // Check if partner has an active subscription (shared access for couples)
      const { data: couple } = await supabaseClient
        .from('user_couples')
        .select('user1_id, user2_id, status')
        .eq('status', 'active')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .maybeSingle();

      if (couple) {
        const partnerId = couple.user1_id === user.id ? couple.user2_id : couple.user1_id;
        if (partnerId) {
          const { data: partnerSub } = await supabaseClient
            .from('subscribers')
            .select('subscribed, subscription_end')
            .eq('user_id', partnerId)
            .single();

          if (partnerSub?.subscribed) {
            logStep('Granting shared premium from partner', { partnerId, subscription_end: partnerSub.subscription_end });
            await supabaseClient.from("subscribers").upsert({
              email: user.email,
              user_id: user.id,
              stripe_customer_id: null,
              subscribed: true,
              subscription_tier: 'premium',
              subscription_end: partnerSub.subscription_end,
              updated_at: new Date().toISOString(),
            }, { onConflict: 'email' });
            await supabaseClient.from("profiles").update({
              subscribed: true,
              subscription_tier: 'premium'
            }).eq('user_id', user.id);

            return new Response(JSON.stringify({
              subscribed: true,
              subscription_tier: 'premium',
              subscription_end: partnerSub.subscription_end,
              shared: true
            }), {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: 200,
            });
          }
        }
      }
      
      // No subscription anywhere, set as essential
      logStep("No local or partner subscription found, setting as essential");
      await supabaseClient.from("subscribers").upsert({
        email: user.email,
        user_id: user.id,
        stripe_customer_id: null,
        subscribed: false,
        subscription_tier: 'essential',
        subscription_end: null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'email' });
      
      // Update profiles table as well
      await supabaseClient.from("profiles").update({
        subscribed: false,
        subscription_tier: 'essential'
      }).eq('user_id', user.id);
      
      return new Response(JSON.stringify({ 
        subscribed: false, 
        subscription_tier: 'essential' 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });
    let hasActiveSub = subscriptions.data.length > 0;
    let subscriptionTier = 'essential';
    let subscriptionEnd: string | null = null;

    if (hasActiveSub) {
      const subscription = subscriptions.data[0];
      subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
      subscriptionTier = 'premium';
      logStep("Active subscription found", { subscriptionId: subscription.id, endDate: subscriptionEnd });
    } else {
      logStep("No active subscription found");
    }

    // If user has no active subscription, check if their partner has one (shared premium for couples)
    if (!hasActiveSub) {
      const { data: couple } = await supabaseClient
        .from('user_couples')
        .select('user1_id, user2_id, status')
        .eq('status', 'active')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .maybeSingle();

      if (couple) {
        const partnerId = couple.user1_id === user.id ? couple.user2_id : couple.user1_id;
        if (partnerId) {
          const { data: partnerSub } = await supabaseClient
            .from('subscribers')
            .select('subscribed, subscription_end')
            .eq('user_id', partnerId)
            .single();
          if (partnerSub?.subscribed) {
            hasActiveSub = true;
            subscriptionTier = 'premium';
            subscriptionEnd = partnerSub.subscription_end;
            logStep('Partner has active subscription - granting shared premium', { partnerId, subscriptionEnd });
          }
        }
      }
    }

    await supabaseClient.from("subscribers").upsert({
      email: user.email,
      user_id: user.id,
      stripe_customer_id: customerId,
      subscribed: hasActiveSub,
      subscription_tier: subscriptionTier,
      subscription_end: subscriptionEnd,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'email' });

    // Update profiles table as well
    await supabaseClient.from("profiles").update({
      subscribed: hasActiveSub,
      subscription_tier: subscriptionTier
    }).eq('user_id', user.id);

    // If the user has an active subscription, grant shared access to partner as well
    if (hasActiveSub) {
      const { data: couple } = await supabaseClient
        .from('user_couples')
        .select('user1_id, user2_id, status')
        .eq('status', 'active')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .maybeSingle();
      if (couple) {
        const partnerId = couple.user1_id === user.id ? couple.user2_id : couple.user1_id;
        if (partnerId) {
          const { data: partnerUser } = await supabaseClient.auth.admin.getUserById(partnerId);
          const partnerEmail = partnerUser?.user?.email || null;

          if (partnerEmail) {
            await supabaseClient.from('subscribers').upsert({
              email: partnerEmail,
              user_id: partnerId,
              stripe_customer_id: null,
              subscribed: true,
              subscription_tier: 'premium',
              subscription_end: subscriptionEnd,
              updated_at: new Date().toISOString(),
            }, { onConflict: 'email' });
          }

          await supabaseClient.from('profiles').update({
            subscribed: true,
            subscription_tier: 'premium',
          }).eq('user_id', partnerId);
        }
      }
    }

    logStep("Updated database with subscription info", { subscribed: hasActiveSub, subscriptionTier });
    return new Response(JSON.stringify({
      subscribed: hasActiveSub,
      subscription_tier: subscriptionTier,
      subscription_end: subscriptionEnd
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-subscription", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});