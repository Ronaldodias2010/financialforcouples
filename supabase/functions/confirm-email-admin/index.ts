import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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

  try {
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
        throw new Error(`Failed to update user: ${updateError.message}`);
      }

      console.log(`User ${targetUserId} updated successfully`);

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
