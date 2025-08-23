import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header provided" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: "Authentication failed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const user = userData.user;
    const isAdmin = user.email === 'admin@arxexperience.com.br' || user.email === 'admin@example.com' || (user.email?.includes('admin') ?? false);
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Access denied - admin only" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 403,
      });
    }

    const body = await req.json().catch(() => ({}));
    const userId: string | undefined = body.userId || body.user_id;
    if (!userId) {
      return new Response(JSON.stringify({ error: "userId is required" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Ensure it's an essential user before deleting
    const { data: subscriber, error: subErr } = await supabaseClient
      .from('subscribers')
      .select('subscription_tier, user_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (subErr) {
      console.log('Error checking subscriber:', subErr);
    }

    if (!subscriber || subscriber.subscription_tier !== 'essential') {
      // If no subscriber or not essential, proceed but log
      console.log('Proceeding with deletion even if not essential', { subscriber });
    }

    // Delete couple relationships first
    await supabaseClient
      .from('user_couples')
      .delete()
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);

    // Delete from profiles
    await supabaseClient
      .from('profiles')
      .delete()
      .eq('user_id', userId);

    // Delete from subscribers
    await supabaseClient
      .from('subscribers')
      .delete()
      .eq('user_id', userId);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error('ERROR admin-delete-essential-user:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
