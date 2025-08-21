import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from 'npm:resend@4.0.0';
import { renderAsync } from 'npm:@react-email/components@0.0.22';
import React from 'npm:react@18.3.1';
import { EmailConfirmationPT } from './_templates/email-confirmation-pt.tsx';
import { EmailConfirmationEN } from './_templates/email-confirmation-en.tsx';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface WebhookPayload {
  user: {
    id: string;
    email: string;
    phone?: string;
    user_metadata?: {
      display_name?: string;
      full_name?: string;
      name?: string;
    };
  };
  email_data: {
    token: string;
    token_hash: string;
    redirect_to: string;
    email_action_type: string;
    site_url: string;
  };
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Read body fast
    const requestText = await req.text();
    if (!requestText || requestText.trim() === '') {
      console.log('Empty request body received');
      return new Response(JSON.stringify({ error: 'Empty request body' }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const payload: WebhookPayload = JSON.parse(requestText);
    console.log('Webhook payload received (ack fast):', JSON.stringify({ user: payload.user.email }, null, 2));

    // Start background email render/send to avoid 5s timeout
    EdgeRuntime.waitUntil((async () => {
      try {
        const { user, email_data } = payload;
        const { token_hash, redirect_to, email_action_type } = email_data;

        const language = 'pt';
        const userName = user.user_metadata?.display_name ||
                        user.user_metadata?.full_name || 
                        user.user_metadata?.name || 
                        user.email.split('@')[0];

        const confirmUrl = `${Deno.env.get('SUPABASE_URL')}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to}`;
        const emailHtml = language === 'en' 
            ? await renderAsync(
                React.createElement(EmailConfirmationEN, {
                  userEmail: userName,
                  loginUrl: confirmUrl
                })
              )
            : await renderAsync(
                React.createElement(EmailConfirmationPT, {
                  userEmail: userName,
                  loginUrl: confirmUrl
                })
              );

        const emailResponse = await resend.emails.send({
          from: "Couples Financials <noreply@couplesfinancials.com>",
          to: [user.email],
          subject: language === 'en' 
            ? "🎉 Confirm your email address - Couples Financials"
            : "🎉 Confirme seu endereço de email - Couples Financials",
          html: emailHtml,
        });

        console.log("Confirmation email sent successfully:", emailResponse);
      } catch (bgErr) {
        console.error('Error sending confirmation email in background:', bgErr);
      }
    })());

    // Immediate ACK to prevent timeout
    return new Response(JSON.stringify({ accepted: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-confirmation-webhook function:", error);
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