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
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AdminRequest {
  email?: string;
  userId?: string;
  newPassword?: string;
  action?: 'confirm_email' | 'reset_password';
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const clientIP = getClientIP(req);
  const auditContext = createAuditContext(req);

  try {
    // Check rate limit
    const rateLimitResult = await checkRateLimit(clientIP, 'confirm-email-admin');
    
    if (!rateLimitResult.allowed) {
      console.log(`[CONFIRM-EMAIL-ADMIN] Rate limit exceeded for IP: ${clientIP}`);

      // Log rate limit exceeded event
      await logSecurityEvent({
        actionType: 'rate_limit_exceeded',
        resourceType: 'user_account',
        ipAddress: auditContext.ipAddress,
        userAgent: auditContext.userAgent,
        details: { 
          function: 'confirm-email-admin',
          currentCount: rateLimitResult.currentCount,
          limit: rateLimitResult.limit,
          retryAfterSeconds: rateLimitResult.retryAfterSeconds
        }
      });

      return createRateLimitResponse(rateLimitResult.retryAfterSeconds || 60, corsHeaders);
    }

    const { email, userId, newPassword, action }: AdminRequest = await req.json();
    console.log(`Admin action request - email: ${email}, userId: ${userId}, action: ${action || 'auto'}`);

    let targetUserId = userId;

    // If email is provided, find user by email
    if (email && !userId) {
      const { data: usersData, error: listError } = await supabase.auth.admin.listUsers();
      
      if (listError) {
        console.error('Error listing users:', listError);
        throw new Error(`Failed to list users: ${listError.message}`);
      }

      const targetUser = usersData?.users?.find(u => u.email === email);
      
      if (!targetUser) {
        console.error(`User with email ${email} not found`);

        // Log failed admin action
        await logSecurityEvent({
          actionType: 'admin_action',
          resourceType: 'user_account',
          ipAddress: auditContext.ipAddress,
          userAgent: auditContext.userAgent,
          details: { 
            email,
            action: action || 'auto',
            success: false,
            reason: 'user_not_found'
          }
        });

        throw new Error(`User with email ${email} not found`);
      }

      targetUserId = targetUser.id;
      console.log(`Found user with ID: ${targetUserId}`);
    }

    if (!targetUserId) {
      throw new Error('Email or userId is required');
    }

    // Build update object
    const updateData: any = {};
    
    // If password reset is requested
    if (newPassword) {
      updateData.password = newPassword;
      console.log(`Will reset password for user ${targetUserId}`);
    }
    
    // If email confirmation is requested (or no specific action)
    if (action === 'confirm_email' || (!action && !newPassword)) {
      updateData.email_confirm = true;
      console.log(`Will confirm email for user ${targetUserId}`);
    }

    // If we have something to update
    if (Object.keys(updateData).length > 0) {
      const { data: updatedUser, error: updateError } = await supabase.auth.admin.updateUserById(
        targetUserId,
        updateData
      );

      if (updateError) {
        console.error('Error updating user:', updateError);

        // Log failed admin action
        await logSecurityEvent({
          actionType: 'admin_action',
          resourceType: 'user_account',
          userId: targetUserId,
          ipAddress: auditContext.ipAddress,
          userAgent: auditContext.userAgent,
          details: { 
            email,
            action: action || 'auto',
            success: false,
            reason: 'update_failed',
            error: updateError.message
          }
        });

        throw new Error(`Failed to update user: ${updateError.message}`);
      }

      console.log(`User ${targetUserId} updated successfully`);

      // Log successful admin action
      const actionType = newPassword ? 'password_reset' : 'email_confirmed';
      await logSecurityEvent({
        actionType: actionType,
        resourceType: 'user_account',
        userId: targetUserId,
        ipAddress: auditContext.ipAddress,
        userAgent: auditContext.userAgent,
        details: { 
          email,
          action: action || 'auto',
          success: true,
          passwordUpdated: !!newPassword,
          emailConfirmed: updateData.email_confirm || false
        }
      });

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `User updated successfully`,
          user_id: targetUserId,
          password_updated: !!newPassword,
          email_confirmed: updateData.email_confirm || false
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    throw new Error('No action specified');
  } catch (error: any) {
    console.error("Error in confirm-email-admin:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
