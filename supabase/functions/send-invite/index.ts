import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { renderAsync } from 'npm:@react-email/components@0.0.22';
import React from 'npm:react@18.3.1';
import { CouplesFinancialsEmail } from './_templates/couples-financials-email.tsx';
import { CouplesFinancialsEmailEn } from './_templates/couples-financials-email-en.tsx';

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

interface InviteEmailRequest {
  email: string;
  name: string;
  inviter_name: string;
  language?: 'pt' | 'en';
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get auth header to identify the inviter
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Get the user from auth token
    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      throw new Error('Invalid authentication');
    }

    const { email, name, inviter_name, language: bodyLang }: InviteEmailRequest = await req.json();

    // Generate temporary password
    const { data: tempPassword, error: passwordError } = await supabase
      .rpc('generate_temp_password');

    if (passwordError) {
      throw new Error('Error generating temporary password');
    }

    // Create invite record in database
    const { error: inviteError } = await supabase
      .from('user_invites')
      .insert({
        inviter_user_id: user.id,
        invitee_email: email,
        invitee_name: name,
        temp_password: tempPassword,
        status: 'pending'
      });

    if (inviteError) {
      throw new Error('Error creating invite record');
    }

    // Determine preferred language
    const acceptLanguage = (req.headers.get('accept-language') || '').toLowerCase();
    const countryHeaderKeys = ['cf-ipcountry', 'x-vercel-ip-country', 'x-country', 'x-geo-country', 'x-country-code'];
    const country = (countryHeaderKeys.map((k) => req.headers.get(k)).find(Boolean) || '').toUpperCase();

    let lang: 'pt' | 'en' = 'pt';
    if (bodyLang === 'en' || bodyLang === 'pt') {
      lang = bodyLang;
    } else if (country && country !== 'BR') {
      lang = 'en';
    } else if (!/pt(-br)?/.test(acceptLanguage)) {
      lang = 'en';
    }

    // Create the login URL with invite parameters
    const baseUrl = req.headers.get('origin') || 'https://couplesfinancials.com';
    const loginUrl = `${baseUrl}/auth?invite=true&email=${encodeURIComponent(email)}`;

    // Render the React email template according to language
    const emailHtml = lang === 'en'
      ? await renderAsync(
          React.createElement(CouplesFinancialsEmailEn, {
            name,
            inviter_name,
            email,
            temp_password: tempPassword,
            login_url: loginUrl,
          })
        )
      : await renderAsync(
          React.createElement(CouplesFinancialsEmail, {
            name,
            inviter_name,
            email,
            temp_password: tempPassword,
            login_url: loginUrl,
          })
        );

    const emailResponse = await resend.emails.send({
      from: 'Couples Financials <contato@couplesfinancials.com>',
      to: [email],
      subject: lang === 'en' 
        ? `${inviter_name} invited you to Couples Financials 💚`
        : `${inviter_name} convidou você para o Couples Financials 💚`,
      html: emailHtml,
    });

    console.log("Invite email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-invite function:", error);
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