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

interface ConfirmEmailRequest {
  email: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email }: ConfirmEmailRequest = await req.json();
    console.log(`Confirming email for: ${email}`);

    if (!email) {
      throw new Error('Email is required');
    }

    // Find user by email
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

    console.log(`Found user with ID: ${targetUser.id}, current email_confirmed_at: ${targetUser.email_confirmed_at}`);

    // Confirm the user's email using admin API
    const { data: updatedUser, error: updateError } = await supabase.auth.admin.updateUserById(
      targetUser.id,
      { email_confirm: true }
    );

    if (updateError) {
      console.error('Error confirming email:', updateError);
      throw new Error(`Failed to confirm email: ${updateError.message}`);
    }

    console.log(`Email confirmed successfully for ${email}. New email_confirmed_at: ${updatedUser?.user?.email_confirmed_at}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Email ${email} confirmed successfully`,
        user_id: targetUser.id,
        email_confirmed_at: updatedUser?.user?.email_confirmed_at
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in confirm-email-admin:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
