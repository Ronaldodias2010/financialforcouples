import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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

  try {
    const { email, temp_password }: TempLoginRequest = await req.json();

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
      return new Response(
        JSON.stringify({ error: 'Invalid or expired invitation' }),
        {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Create user account with the temp password
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      password: temp_password,
      email_confirm: true,
      user_metadata: {
        display_name: invite.invitee_name,
        requires_password_change: true
      }
    });

    if (authError) {
      console.error('Error creating user:', authError);
      return new Response(
        JSON.stringify({ error: 'Error creating user account' }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Create the couple relationship
    if (authData.user) {
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
    }

    // Generate session for the user
    const { data: sessionData, error: sessionError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: email
    });

    if (sessionError) {
      console.error('Error generating session:', sessionError);
      return new Response(
        JSON.stringify({ error: 'Error generating session' }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    return new Response(JSON.stringify({ 
      success: true, 
      user: authData.user,
      session_url: sessionData.properties?.action_link,
      requires_password_change: true
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error("Error in validate-temp-login function:", error);
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