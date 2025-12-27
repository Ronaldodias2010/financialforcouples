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
  console.log('[CHECK-PREMIUM-EXPIRATION] Function started');

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let totalProcessed = 0;
    let emailsSent = 0;

    // Check for users expiring in 3 days (warning)
    console.log('[CHECK-PREMIUM-EXPIRATION] Checking users expiring in 3 days...');
    const { data: users3Days } = await supabase.rpc('get_users_near_expiration', { days_before: 3 });
    
    if (users3Days && users3Days.length > 0) {
      console.log(`[CHECK-PREMIUM-EXPIRATION] Found ${users3Days.length} users expiring in 3 days`);
      
      for (const user of users3Days) {
        try {
          // Send warning email
          const { error: emailError } = await supabase.functions.invoke('send-expiration-warning', {
            body: {
              email: user.email,
              userName: user.email.split('@')[0], // Simple name extraction
              expirationDate: user.end_date,
              warningType: 'warning_3_days',
              language: user.language_preference || 'pt'
            }
          });

          if (!emailError) {
            // Mark email as sent
            await supabase.rpc('mark_expiration_email_sent', {
              p_user_id: user.user_id,
              p_email: user.email,
              p_warning_type: 'warning_3_days',
              p_expiration_date: user.end_date,
              p_language: user.language_preference || 'pt'
            });
            emailsSent++;
          } else {
            console.error(`[CHECK-PREMIUM-EXPIRATION] Error sending 3-day warning to ${user.email}:`, emailError);
          }
        } catch (error) {
          console.error(`[CHECK-PREMIUM-EXPIRATION] Error processing 3-day warning for ${user.email}:`, error);
        }
      }
      totalProcessed += users3Days.length;
    }

    // Check for users expiring in 1 day (final warning)
    console.log('[CHECK-PREMIUM-EXPIRATION] Checking users expiring in 1 day...');
    const { data: users1Day } = await supabase.rpc('get_users_near_expiration', { days_before: 1 });
    
    if (users1Day && users1Day.length > 0) {
      console.log(`[CHECK-PREMIUM-EXPIRATION] Found ${users1Day.length} users expiring in 1 day`);
      
      for (const user of users1Day) {
        try {
          // Send final warning email
          const { error: emailError } = await supabase.functions.invoke('send-expiration-warning', {
            body: {
              email: user.email,
              userName: user.email.split('@')[0],
              expirationDate: user.end_date,
              warningType: 'warning_1_day',
              language: user.language_preference || 'pt'
            }
          });

          if (!emailError) {
            // Mark email as sent
            await supabase.rpc('mark_expiration_email_sent', {
              p_user_id: user.user_id,
              p_email: user.email,
              p_warning_type: 'warning_1_day',
              p_expiration_date: user.end_date,
              p_language: user.language_preference || 'pt'
            });
            emailsSent++;
          } else {
            console.error(`[CHECK-PREMIUM-EXPIRATION] Error sending 1-day warning to ${user.email}:`, emailError);
          }
        } catch (error) {
          console.error(`[CHECK-PREMIUM-EXPIRATION] Error processing 1-day warning for ${user.email}:`, error);
        }
      }
      totalProcessed += users1Day.length;
    }

    // Check for users expired today (grace period notification)
    console.log('[CHECK-PREMIUM-EXPIRATION] Checking users expired today...');
    const { data: usersExpired } = await supabase.rpc('get_users_near_expiration', { days_before: 0 });
    
    if (usersExpired && usersExpired.length > 0) {
      console.log(`[CHECK-PREMIUM-EXPIRATION] Found ${usersExpired.length} users expired today`);
      
      for (const user of usersExpired) {
        try {
          // Send grace period email
          const { error: emailError } = await supabase.functions.invoke('send-expiration-warning', {
            body: {
              email: user.email,
              userName: user.email.split('@')[0],
              expirationDate: user.end_date,
              warningType: 'grace_period',
              language: user.language_preference || 'pt'
            }
          });

          if (!emailError) {
            // Mark email as sent
            await supabase.rpc('mark_expiration_email_sent', {
              p_user_id: user.user_id,
              p_email: user.email,
              p_warning_type: 'grace_period',
              p_expiration_date: user.end_date,
              p_language: user.language_preference || 'pt'
            });
            emailsSent++;
          } else {
            console.error(`[CHECK-PREMIUM-EXPIRATION] Error sending grace period email to ${user.email}:`, emailError);
          }
        } catch (error) {
          console.error(`[CHECK-PREMIUM-EXPIRATION] Error processing grace period for ${user.email}:`, error);
        }
      }
      totalProcessed += usersExpired.length;
    }

    // Update expired users status and downgrade if needed
    console.log('[CHECK-PREMIUM-EXPIRATION] Running check_manual_premium_expiration to update expired users...');
    const { error: updateError } = await supabase.rpc('check_manual_premium_expiration');
    
    if (updateError) {
      console.error('[CHECK-PREMIUM-EXPIRATION] Error updating expired users:', updateError);
    } else {
      console.log('[CHECK-PREMIUM-EXPIRATION] Successfully updated expired users and checked for downgrades');
    }

    const summary = {
      success: true,
      totalProcessed,
      emailsSent,
      message: `Processed ${totalProcessed} users, sent ${emailsSent} emails`
    };

    console.log('[CHECK-PREMIUM-EXPIRATION] Completed:', summary);

    return new Response(
      JSON.stringify(summary),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('[CHECK-PREMIUM-EXPIRATION] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);