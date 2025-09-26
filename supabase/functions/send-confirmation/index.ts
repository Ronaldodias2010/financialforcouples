import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from 'https://esm.sh/resend@2.0.0';
import { renderAsync } from 'https://esm.sh/@react-email/components@0.0.22';
import React from 'https://esm.sh/react@18.3.1';
import { EmailConfirmationPT } from './_templates/email-confirmation-pt.tsx';
import { EmailConfirmationEN } from './_templates/email-confirmation-en.tsx';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ConfirmationEmailRequest {
  userEmail: string;
  language?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userEmail, language = 'pt' }: ConfirmationEmailRequest = await req.json();

    // Get user by email using listUsers which searches by email
    const { data: usersData } = await supabase.auth.admin.listUsers();
    const targetUser = usersData?.users?.find(u => u.email === userEmail);
    
    if (!targetUser) {
      throw new Error(`User with email ${userEmail} not found`);
    }

    // Get user's display name from the database
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('user_id', targetUser.id)
      .single();

    const userName = userProfile?.display_name || userEmail.split('@')[0];

    // Generate login URL
    const loginUrl = `${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '')}.lovableproject.com/app`;

    // Choose template based on language
    const emailHtml = language === 'en' 
        ? await renderAsync(
            React.createElement(EmailConfirmationEN, {
              userEmail: userName,
              loginUrl
            })
          )
        : await renderAsync(
            React.createElement(EmailConfirmationPT, {
              userEmail: userName,
              loginUrl
            })
          );

    const emailResponse = await resend.emails.send({
      from: "Couples Financials <noreply@couplesfinancials.com>",
      to: [userEmail],
      subject: language === 'en' 
        ? "🎉 Welcome to Couples Financials! Account confirmed successfully"
        : "🎉 Bem-vindo ao Couples Financials! Sua conta foi confirmada com sucesso",
      html: emailHtml,
    });

    console.log("Confirmation email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-confirmation function:", error);
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