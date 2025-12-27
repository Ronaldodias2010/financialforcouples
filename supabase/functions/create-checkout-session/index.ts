import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { checkRateLimit, getClientIP, createRateLimitResponse } from "../_shared/rateLimiter.ts";
import { logSecurityEvent, createAuditContext } from "../_shared/auditLogger.ts";

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

  const clientIP = getClientIP(req);
  const auditContext = createAuditContext(req);

  try {
    logStep("Function started");

    // Check rate limit
    const rateLimitResult = await checkRateLimit(clientIP, 'create-checkout-session');
    
    if (!rateLimitResult.allowed) {
      logStep("Rate limit exceeded", { 
        ip: clientIP, 
        retryAfter: rateLimitResult.retryAfterSeconds 
      });

      // Log rate limit exceeded event
      await logSecurityEvent({
        actionType: 'rate_limit_exceeded',
        resourceType: 'checkout_session',
        ipAddress: auditContext.ipAddress,
        userAgent: auditContext.userAgent,
        details: { 
          function: 'create-checkout-session',
          currentCount: rateLimitResult.currentCount,
          limit: rateLimitResult.limit,
          retryAfterSeconds: rateLimitResult.retryAfterSeconds
        }
      });

      return createRateLimitResponse(rateLimitResult.retryAfterSeconds || 60, corsHeaders);
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { email, fullName, phone, selectedPlan, promoCode } = await req.json();
    
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
        promo_code: promoCode || null,
        status: 'pending'
      })
      .select()
      .single();

    if (sessionError) {
      throw new Error(`Failed to create checkout session: ${sessionError.message}`);
    }

    logStep("Checkout session created", { sessionId: sessionData.id });

    // Log successful checkout creation
    await logSecurityEvent({
      actionType: 'checkout_created',
      resourceType: 'checkout_session',
      resourceId: sessionData.id,
      ipAddress: auditContext.ipAddress,
      userAgent: auditContext.userAgent,
      details: { 
        email,
        selectedPlan: selectedPlan || 'monthly',
        hasPromoCode: !!promoCode
      }
    });

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

    // Log error event
    await logSecurityEvent({
      actionType: 'checkout_created',
      resourceType: 'checkout_session',
      ipAddress: auditContext.ipAddress,
      userAgent: auditContext.userAgent,
      details: { 
        success: false,
        error: errorMessage
      }
    });

    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
