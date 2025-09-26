import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const handler = async (req: Request): Promise<Response> => {
  console.log('[PROCESS-PAYMENT-EMAILS] Function started');

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get pending emails scheduled for now or earlier
    const { data: pendingEmails, error: queryError } = await supabase
      .from('payment_email_queue')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_for', new Date().toISOString())
      .order('scheduled_for', { ascending: true });

    if (queryError) {
      console.error('[PROCESS-PAYMENT-EMAILS] Query error:', queryError);
      throw queryError;
    }

    if (!pendingEmails || pendingEmails.length === 0) {
      console.log('[PROCESS-PAYMENT-EMAILS] No pending emails to process');
      return new Response(
        JSON.stringify({ processed: 0, message: 'No pending emails' }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    console.log(`[PROCESS-PAYMENT-EMAILS] Processing ${pendingEmails.length} pending emails`);

    let processed = 0;
    let failed = 0;

    for (const email of pendingEmails) {
      try {
        // Get user name for personalization
        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('user_id', email.user_id)
          .single();

        const userName = profile?.display_name || email.email_address.split('@')[0];

        // Send email via send-payment-emails function
        const { error: sendError } = await supabase.functions.invoke('send-payment-emails', {
          body: {
            email: email.email_address,
            userName,
            emailType: email.email_type,
            language: email.language,
            subscriptionEndDate: email.subscription_end_date,
            customerPortalUrl: 'https://couplesfinancials.com/subscription'
          }
        });

        if (sendError) {
          console.error(`[PROCESS-PAYMENT-EMAILS] Error sending email ${email.id}:`, sendError);
          
          // Mark as failed
          await supabase
            .from('payment_email_queue')
            .update({
              status: 'failed',
              failure_reason: sendError.message,
              sent_at: new Date().toISOString()
            })
            .eq('id', email.id);
          
          failed++;
        } else {
          console.log(`[PROCESS-PAYMENT-EMAILS] Email sent successfully: ${email.id}`);
          
          // Mark as sent
          await supabase
            .from('payment_email_queue')
            .update({
              status: 'sent',
              sent_at: new Date().toISOString()
            })
            .eq('id', email.id);
          
          processed++;
        }

      } catch (emailError) {
        console.error(`[PROCESS-PAYMENT-EMAILS] Error processing email ${email.id}:`, emailError);
        
        // Mark as failed
        await supabase
          .from('payment_email_queue')
          .update({
            status: 'failed',
            failure_reason: (emailError as Error).message,
            sent_at: new Date().toISOString()
          })
          .eq('id', email.id);
        
        failed++;
      }
    }

    // Process downgrades for users whose grace period has expired
    await processGracePeriodExpiry();

    const summary = {
      processed,
      failed,
      total: pendingEmails.length,
      message: `Processed ${processed} emails, ${failed} failed`
    };

    console.log('[PROCESS-PAYMENT-EMAILS] Summary:', summary);

    return new Response(
      JSON.stringify(summary),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('[PROCESS-PAYMENT-EMAILS] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

async function processGracePeriodExpiry() {
  console.log('[PROCESS-PAYMENT-EMAILS] Checking for expired grace periods...');
  
  try {
    // Find users whose grace period has expired
    const { data: expiredFailures, error } = await supabase
      .from('payment_failures')
      .select('user_id, email')
      .eq('status', 'grace_period')
      .lte('grace_period_ends_at', new Date().toISOString());

    if (error) {
      console.error('[PROCESS-PAYMENT-EMAILS] Error querying expired grace periods:', error);
      return;
    }

    if (!expiredFailures || expiredFailures.length === 0) {
      console.log('[PROCESS-PAYMENT-EMAILS] No expired grace periods found');
      return;
    }

    console.log(`[PROCESS-PAYMENT-EMAILS] Processing ${expiredFailures.length} expired grace periods`);

    for (const failure of expiredFailures) {
      try {
        // Downgrade to essential
        const { error: updateError } = await supabase
          .from('subscribers')
          .update({
            subscribed: false,
            subscription_tier: 'essential',
            updated_at: new Date().toISOString()
          })
          .eq('user_id', failure.user_id);

        if (updateError) {
          console.error(`[PROCESS-PAYMENT-EMAILS] Error downgrading user ${failure.user_id}:`, updateError);
          continue;
        }

        // Mark payment failure as downgraded
        await supabase
          .from('payment_failures')
          .update({
            status: 'downgraded',
            downgrade_scheduled_for: new Date().toISOString()
          })
          .eq('user_id', failure.user_id);

        // Schedule downgrade notification email
        await supabase
          .from('payment_email_queue')
          .insert({
            user_id: failure.user_id,
            email_type: 'downgrade_notice',
            scheduled_for: new Date().toISOString(),
            email_address: failure.email,
            language: 'pt', // Could be enhanced to detect user language
            status: 'pending'
          });

        console.log(`[PROCESS-PAYMENT-EMAILS] User ${failure.user_id} downgraded to essential`);

      } catch (userError) {
        console.error(`[PROCESS-PAYMENT-EMAILS] Error processing user ${failure.user_id}:`, userError);
      }
    }

  } catch (error) {
    console.error('[PROCESS-PAYMENT-EMAILS] Error in processGracePeriodExpiry:', error);
  }
}

serve(handler);