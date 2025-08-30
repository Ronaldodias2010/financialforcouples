import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[RECORD-PROMO-REWARD] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseService = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const { usageId, paymentCompleted = false } = await req.json();
    
    if (!usageId) {
      throw new Error("Usage ID is required");
    }

    // Get usage details with promo code info
    const { data: usage, error: usageError } = await supabaseService
      .from('promo_code_usage')
      .select(`
        *,
        promo_codes!inner (
          id,
          owner_user_id,
          code,
          discount_value
        )
      `)
      .eq('id', usageId)
      .single();

    if (usageError || !usage) {
      throw new Error("Usage record not found");
    }

    const promoCode = usage.promo_codes;
    const rewardAmount = usage.amount_paid * 0.1; // 10% commission for code owner

    logStep("Processing reward", { 
      usageId, 
      codeOwner: promoCode.owner_user_id,
      rewardAmount 
    });

    // Update usage status if payment completed
    if (paymentCompleted) {
      await supabaseService
        .from('promo_code_usage')
        .update({ 
          status: 'completed',
          payment_completed_at: new Date().toISOString()
        })
        .eq('id', usageId);
    }

    // Create or update reward record
    const { data: existingReward } = await supabaseService
      .from('promo_rewards')
      .select('id, status')
      .eq('usage_id', usageId)
      .single();

    if (existingReward) {
      // Update existing reward
      if (paymentCompleted && existingReward.status === 'pending') {
        await supabaseService
          .from('promo_rewards')
          .update({ status: 'pending' })
          .eq('id', existingReward.id);
      }
    } else {
      // Create new reward
      await supabaseService
        .from('promo_rewards')
        .insert({
          owner_user_id: promoCode.owner_user_id,
          promo_code_id: promoCode.id,
          usage_id: usageId,
          reward_amount: rewardAmount,
          reward_currency: 'BRL',
          status: paymentCompleted ? 'pending' : 'pending'
        });
    }

    logStep("Reward recorded successfully", { usageId, paymentCompleted });

    return new Response(JSON.stringify({ 
      success: true,
      reward_amount: rewardAmount
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in record-promo-reward", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});