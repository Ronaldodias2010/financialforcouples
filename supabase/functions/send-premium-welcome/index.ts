import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { renderAsync } from 'https://esm.sh/@react-email/components@0.0.22';
import React from 'https://esm.sh/react@18.3.1';

// Welcome email templates
import { PremiumWelcomeEmailPT } from './_templates/premium-welcome-pt.tsx';
import { PremiumWelcomeEmailEN } from './_templates/premium-welcome-en.tsx';
import { PremiumWelcomeEmailES } from './_templates/premium-welcome-es.tsx';

// Access granted email templates
import { PremiumAccessGrantedEmailPT } from './_templates/premium-access-granted-pt.tsx';
import { PremiumAccessGrantedEmailEN } from './_templates/premium-access-granted-en.tsx';
import { PremiumAccessGrantedEmailES } from './_templates/premium-access-granted-es.tsx';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  type: 'welcome' | 'access_granted';
  user_email: string;
  user_name?: string;
  language: 'pt' | 'en' | 'es';
  subscription_end?: string;
  start_date?: string;
  end_date?: string;
  temp_password?: string;
  days_duration?: number;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Send premium welcome function started");

    const {
      type,
      user_email,
      user_name,
      language,
      subscription_end,
      start_date,
      end_date,
      temp_password,
      days_duration,
    }: WelcomeEmailRequest = await req.json();

    console.log("Email request:", { type, user_email, language });

    // Create the login URL
    const baseUrl = req.headers.get('origin') || 'https://couplesfinancials.com';
    const loginUrl = `${baseUrl}/auth`;

    let emailHtml: string;
    let subject: string;

    if (type === 'welcome') {
      // Premium welcome email (for Stripe subscriptions)
      const templateData = {
        user_email,
        user_name,
        subscription_end: subscription_end || '',
        login_url: loginUrl,
      };

      switch (language) {
        case 'en':
          emailHtml = await renderAsync(React.createElement(PremiumWelcomeEmailEN, templateData));
          subject = '🎉 Welcome to Couples Financials Premium!';
          break;
        case 'es':
          emailHtml = await renderAsync(React.createElement(PremiumWelcomeEmailES, templateData));
          subject = '🎉 ¡Bienvenido a Couples Financials Premium!';
          break;
        default:
          emailHtml = await renderAsync(React.createElement(PremiumWelcomeEmailPT, templateData));
          subject = '🎉 Bem-vindo ao Premium do Couples Financials!';
      }
    } else {
      // Premium access granted email (for manual admin grants)
      const templateData = {
        user_email,
        start_date: start_date || '',
        end_date: end_date || '',
        temp_password: temp_password || '',
        login_url: loginUrl,
        days_duration: days_duration || 0,
      };

      switch (language) {
        case 'en':
          emailHtml = await renderAsync(React.createElement(PremiumAccessGrantedEmailEN, templateData));
          subject = '🎉 Premium Access Granted - Couples Financials!';
          break;
        case 'es':
          emailHtml = await renderAsync(React.createElement(PremiumAccessGrantedEmailES, templateData));
          subject = '🎉 ¡Acceso Premium Concedido - Couples Financials!';
          break;
        default:
          emailHtml = await renderAsync(React.createElement(PremiumAccessGrantedEmailPT, templateData));
          subject = '🎉 Acesso Premium Concedido - Couples Financials!';
      }
    }

    console.log("Sending email with subject:", subject);

    const emailResponse = await resend.emails.send({
      from: 'Couples Financials <contato@couplesfinancials.com>',
      to: [user_email],
      subject,
      html: emailHtml,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-premium-welcome function:", error);
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