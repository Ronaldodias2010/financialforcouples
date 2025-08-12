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

// Enhanced CORS headers - restrict to specific domains
const corsHeaders = {
  "Access-Control-Allow-Origin": "https://couplesfinancials.com",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Rate limiting storage
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 5;

function isRateLimited(identifier: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return false;
  }
  
  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    return true;
  }
  
  record.count++;
  return false;
}

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

  // Only allow POST requests
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  try {
    // Rate limiting
    const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    if (isRateLimited(clientIP)) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
        status: 429,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
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

    // Input validation
    if (!email || !name || !inviter_name) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(JSON.stringify({ error: "Invalid email format" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Security logging
    await supabase.from('security_audit_log').insert({
      user_id: user.id,
      action_type: 'invite_sent',
      resource_type: 'user_invite',
      ip_address: clientIP,
      user_agent: req.headers.get('user-agent'),
      details: { 
        invitee_email: email,
        invitee_name: name 
      }
    });

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