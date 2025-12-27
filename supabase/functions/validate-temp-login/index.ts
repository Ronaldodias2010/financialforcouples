import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { checkRateLimit, getClientIP, createRateLimitResponse } from "../_shared/rateLimiter.ts";
import { logSecurityEvent, createAuditContext } from "../_shared/auditLogger.ts";

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface TempLoginRequest {
  email: string;
  temp_password: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const clientIP = getClientIP(req);
  const auditContext = createAuditContext(req);

  try {
    // Check rate limit
    const rateLimitResult = await checkRateLimit(clientIP, 'validate-temp-login');
    
    if (!rateLimitResult.allowed) {
      console.log(`[VALIDATE-TEMP-LOGIN] Rate limit exceeded for IP: ${clientIP}`);

      // Log rate limit exceeded event
      await logSecurityEvent({
        actionType: 'rate_limit_exceeded',
        resourceType: 'user_invite',
        ipAddress: auditContext.ipAddress,
        userAgent: auditContext.userAgent,
        details: { 
          function: 'validate-temp-login',
          currentCount: rateLimitResult.currentCount,
          limit: rateLimitResult.limit,
          retryAfterSeconds: rateLimitResult.retryAfterSeconds
        }
      });

      return createRateLimitResponse(rateLimitResult.retryAfterSeconds || 60, corsHeaders);
    }

    const { email, temp_password }: TempLoginRequest = await req.json();

    console.log(`[VALIDATE-TEMP-LOGIN] Attempting login for email: ${email}`);

    // Log login attempt
    await logSecurityEvent({
      actionType: 'temp_login',
      resourceType: 'user_invite',
      ipAddress: auditContext.ipAddress,
      userAgent: auditContext.userAgent,
      details: { 
        email,
        step: 'attempt'
      }
    });

    // Check if there's a valid invite with this email and temp password
    const { data: invite, error: inviteError } = await supabase
      .from('user_invites')
      .select('*')
      .eq('invitee_email', email)
      .eq('temp_password', temp_password)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .single();

    if (inviteError || !invite) {
      console.log(`[VALIDATE-TEMP-LOGIN] Invalid invite for email: ${email}`);

      // Log failed login attempt
      await logSecurityEvent({
        actionType: 'login_attempt',
        resourceType: 'user_invite',
        ipAddress: auditContext.ipAddress,
        userAgent: auditContext.userAgent,
        details: { 
          email,
          success: false,
          reason: 'invalid_or_expired_invite'
        }
      });

      return new Response(
        JSON.stringify({ error: 'Invalid or expired invitation' }),
        {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Create user account with a secure password (not the temp one)
    const securePassword = `${temp_password}${Date.now()}${Math.random()}`;
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      password: securePassword,
      email_confirm: true,
      user_metadata: {
        display_name: invite.invitee_name,
        requires_password_change: true
      }
    });

    if (authError) {
      console.error('Error creating user:', authError);

      // Log failed user creation
      await logSecurityEvent({
        actionType: 'login_attempt',
        resourceType: 'user_account',
        ipAddress: auditContext.ipAddress,
        userAgent: auditContext.userAgent,
        details: { 
          email,
          success: false,
          reason: 'user_creation_failed',
          error: authError.message
        }
      });

      return new Response(
        JSON.stringify({ error: 'Error creating user account' }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Create the couple relationship and profile
    if (authData.user) {
      // Get inviter's profile to update second_user_name
      const { data: inviterProfile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('user_id', invite.inviter_user_id)
        .single();

      // Check if profile already exists (trigger might have created it)
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', authData.user.id)
        .single();

      // Only create profile if it doesn't exist
      if (!existingProfile) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            user_id: authData.user.id,
            display_name: invite.invitee_name || email.split('@')[0]
          });

        if (profileError) {
          console.error('Error creating profile:', profileError);
        }
      } else {
        // Update existing profile with display name
        const { error: updateProfileError } = await supabase
          .from('profiles')
          .update({
            display_name: invite.invitee_name || email.split('@')[0]
          })
          .eq('user_id', authData.user.id);

        if (updateProfileError) {
          console.error('Error updating profile:', updateProfileError);
        }
      }

      // Update inviter's profile with second user name
      const { error: updateInviterError } = await supabase
        .from('profiles')
        .update({
          second_user_name: invite.invitee_name || email.split('@')[0],
          second_user_email: invite.invitee_email
        })
        .eq('user_id', invite.inviter_user_id);

      if (updateInviterError) {
        console.error('Error updating inviter profile:', updateInviterError);
      }

      const { error: coupleError } = await supabase
        .from('user_couples')
        .insert({
          user1_id: invite.inviter_user_id,
          user2_id: authData.user.id,
          status: 'active'
        });

      if (coupleError) {
        console.error('Error creating couple relationship:', coupleError);
      }

      // Update invite status to accepted
      const { error: updateError } = await supabase
        .from('user_invites')
        .update({ status: 'accepted' })
        .eq('id', invite.id);

      if (updateError) {
        console.error('Error updating invite status:', updateError);
      }

      // Generate a session token for the user using signInWithPassword  
      const { data: sessionData, error: sessionError } = await supabase.auth.signInWithPassword({
        email: email,
        password: securePassword
      });

      if (sessionError) {
        console.error('Error creating session:', sessionError);

        // Log failed session creation
        await logSecurityEvent({
          actionType: 'login_attempt',
          resourceType: 'user_account',
          userId: authData.user.id,
          ipAddress: auditContext.ipAddress,
          userAgent: auditContext.userAgent,
          details: { 
            email,
            success: false,
            reason: 'session_creation_failed'
          }
        });

        return new Response(
          JSON.stringify({ error: 'Error creating session' }),
          {
            status: 500,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }

      // Log successful login
      await logSecurityEvent({
        actionType: 'login_attempt',
        resourceType: 'user_account',
        userId: authData.user.id,
        ipAddress: auditContext.ipAddress,
        userAgent: auditContext.userAgent,
        details: { 
          email,
          success: true,
          inviteId: invite.id,
          inviterId: invite.inviter_user_id
        }
      });

      console.log(`[VALIDATE-TEMP-LOGIN] User created and logged in successfully: ${authData.user.id}`);

      return new Response(JSON.stringify({ 
        success: true, 
        user: authData.user,
        access_token: sessionData.session?.access_token,
        refresh_token: sessionData.session?.refresh_token,
        requires_password_change: true
      }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      });
    }

    // Default response if no conditions are met
    return new Response(JSON.stringify({ error: 'Invalid request' }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("Error in validate-temp-login function:", error);

    // Log error
    await logSecurityEvent({
      actionType: 'login_attempt',
      resourceType: 'user_invite',
      ipAddress: auditContext.ipAddress,
      userAgent: auditContext.userAgent,
      details: { 
        success: false,
        reason: 'unexpected_error',
        error: error.message
      }
    });

    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
