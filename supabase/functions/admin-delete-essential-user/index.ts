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

    // Check subscriber status - only allow deletion of essential users
    const { data: subscriber, error: subErr } = await supabaseClient
      .from('subscribers')
      .select('subscription_tier, subscribed, user_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (subErr) {
      console.log('Error checking subscriber:', subErr);
    }

    // Block deletion of premium/subscribed users
    if (subscriber && (subscriber.subscribed === true || (subscriber.subscription_tier && subscriber.subscription_tier !== 'essential'))) {
      return new Response(JSON.stringify({ 
        error: "Cannot delete premium users. Only essential tier users can be deleted." 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 403,
      });
    }

    console.log('Starting complete user deletion for:', userId);

    // Delete all user data from all tables
    // 1. Delete couple relationships
    await supabaseClient
      .from('user_couples')
      .delete()
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);

    // 2. Delete couple relationship requests
    await supabaseClient
      .from('couple_relationship_requests')
      .delete()
      .eq('requester_user_id', userId);

    // 3. Delete transactions
    await supabaseClient
      .from('transactions')
      .delete()
      .eq('user_id', userId);

    // 4. Delete cards and related data
    await supabaseClient
      .from('card_payment_history')
      .delete()
      .eq('user_id', userId);

    await supabaseClient
      .from('card_mileage_rules')
      .delete()
      .eq('user_id', userId);

    await supabaseClient
      .from('cards')
      .delete()
      .eq('user_id', userId);

    // 5. Delete accounts
    await supabaseClient
      .from('accounts')
      .delete()
      .eq('user_id', userId);

    // 6. Delete categories
    await supabaseClient
      .from('categories')
      .delete()
      .eq('user_id', userId);

    // 7. Delete investments and related
    const { data: investmentIds } = await supabaseClient
      .from('investments')
      .select('id')
      .eq('user_id', userId);
    
    if (investmentIds && investmentIds.length > 0) {
      await supabaseClient
        .from('investment_performance')
        .delete()
        .in('investment_id', investmentIds.map(i => i.id));
    }

    await supabaseClient
      .from('investments')
      .delete()
      .eq('user_id', userId);

    await supabaseClient
      .from('investment_goals')
      .delete()
      .eq('user_id', userId);

    await supabaseClient
      .from('investment_types')
      .delete()
      .eq('user_id', userId);

    // 8. Delete mileage data
    await supabaseClient
      .from('mileage_history')
      .delete()
      .eq('user_id', userId);

    await supabaseClient
      .from('mileage_goals')
      .delete()
      .eq('user_id', userId);

    // 9. Delete recurring expenses and future expenses
    await supabaseClient
      .from('manual_future_expenses')
      .delete()
      .eq('user_id', userId);

    await supabaseClient
      .from('recurring_expenses')
      .delete()
      .eq('user_id', userId);

    // 10. Delete future incomes
    await supabaseClient
      .from('manual_future_incomes')
      .delete()
      .eq('user_id', userId);

    // 11. Delete AI history and usage
    await supabaseClient
      .from('ai_history')
      .delete()
      .eq('user_id', userId);

    await supabaseClient
      .from('ai_usage_tracking')
      .delete()
      .eq('user_id', userId);

    // 12. Delete imported files and transactions
    await supabaseClient
      .from('imported_transactions')
      .delete()
      .eq('user_id', userId);

    await supabaseClient
      .from('imported_files')
      .delete()
      .eq('user_id', userId);

    // 13. Delete user activity tracking
    await supabaseClient
      .from('user_activity_tracking')
      .delete()
      .eq('user_id', userId);

    // 14. Delete from profiles
    await supabaseClient
      .from('profiles')
      .delete()
      .eq('user_id', userId);

    // 15. Delete from subscribers
    await supabaseClient
      .from('subscribers')
      .delete()
      .eq('user_id', userId);

    // 16. Finally, delete the user from auth.users (allows re-registration)
    const { error: deleteAuthError } = await supabaseClient.auth.admin.deleteUser(userId);
    
    if (deleteAuthError) {
      console.error('Error deleting auth user:', deleteAuthError);
      return new Response(JSON.stringify({ 
        error: "Failed to delete user from authentication system",
        details: deleteAuthError.message 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    console.log('Successfully deleted user completely:', userId);

    return new Response(JSON.stringify({ 
      success: true,
      message: "User and all associated data deleted successfully. User can now re-register."
    }), {
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