import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CLEANUP-RATE-LIMITS] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    logStep("Cleanup job started");

    const startTime = Date.now();

    // 1. Clean up old rate limit entries (older than 24 hours)
    const { data: rateLimitResult, error: rateLimitError } = await supabaseClient
      .rpc('cleanup_old_rate_limits');

    if (rateLimitError) {
      logStep("Error cleaning rate limits", { error: rateLimitError.message });
    } else {
      logStep("Rate limits cleaned", { deletedCount: rateLimitResult });
    }

    // 2. Clean up old audit logs (older than 90 days) - optional retention policy
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const { count: auditDeletedCount, error: auditError } = await supabaseClient
      .from('security_audit_log')
      .delete({ count: 'exact' })
      .lt('created_at', ninetyDaysAgo.toISOString());

    if (auditError) {
      logStep("Error cleaning audit logs", { error: auditError.message });
    } else {
      logStep("Audit logs cleaned", { deletedCount: auditDeletedCount });
    }

    // 3. Clean up expired checkout sessions (older than 7 days and not completed)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { count: checkoutDeletedCount, error: checkoutError } = await supabaseClient
      .from('checkout_sessions')
      .delete({ count: 'exact' })
      .lt('created_at', sevenDaysAgo.toISOString())
      .in('status', ['pending', 'expired']);

    if (checkoutError) {
      logStep("Error cleaning checkout sessions", { error: checkoutError.message });
    } else {
      logStep("Expired checkout sessions cleaned", { deletedCount: checkoutDeletedCount });
    }

    const duration = Date.now() - startTime;

    logStep("Cleanup job completed", {
      duration: `${duration}ms`,
      rateLimitsDeleted: rateLimitResult || 0,
      auditLogsDeleted: auditDeletedCount || 0,
      checkoutSessionsDeleted: checkoutDeletedCount || 0
    });

    return new Response(JSON.stringify({
      success: true,
      message: "Cleanup completed successfully",
      results: {
        rateLimitsDeleted: rateLimitResult || 0,
        auditLogsDeleted: auditDeletedCount || 0,
        checkoutSessionsDeleted: checkoutDeletedCount || 0,
        durationMs: duration
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in cleanup job", { message: errorMessage });
    
    return new Response(JSON.stringify({ 
      success: false,
      error: errorMessage 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
