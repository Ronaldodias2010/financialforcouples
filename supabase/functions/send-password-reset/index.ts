import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from 'https://esm.sh/resend@2.0.0';
import { renderAsync } from 'https://esm.sh/@react-email/components@0.0.22';
import React from 'https://esm.sh/react@18.3.1';
import { PasswordResetPT } from './_templates/password-reset-pt.tsx';
import { PasswordResetEN } from './_templates/password-reset-en.tsx';

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

interface PasswordResetRequest {
  userEmail: string;
  resetUrl: string;
  language?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userEmail, resetUrl, language = 'pt' }: PasswordResetRequest = await req.json();

    // Choose template based on language
    const emailHtml = language === 'en' 
      ? await renderAsync(
          React.createElement(PasswordResetEN, {
            userEmail,
            resetUrl
          })
        )
      : await renderAsync(
          React.createElement(PasswordResetPT, {
            userEmail,
            resetUrl
          })
        );

    const emailResponse = await resend.emails.send({
      from: "Couples Financials <noreply@couplesfinancials.com>",
      to: [userEmail],
      subject: language === 'en' 
        ? "🔐 Reset your Couples Financials password"
        : "🔐 Redefinir sua senha do Couples Financials",
      html: emailHtml,
    });

    console.log("Password reset email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-password-reset function:", error);
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