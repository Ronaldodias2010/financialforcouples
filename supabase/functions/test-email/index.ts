import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";
import { renderAsync } from 'npm:@react-email/components@0.0.22';
import React from 'npm:react@18.3.1';
import { CouplesFinancialsEmail } from './_templates/couples-financials-email.tsx';
import { PremiumAccessEmail } from './_templates/premium-access-email.tsx';
import { CouplesFinancialsEmailEn } from './_templates/couples-financials-email-en.tsx';
import { PremiumAccessEmailEn } from './_templates/premium-access-email-en.tsx';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, template, language = 'pt' } = await req.json();

    if (!email) {
      throw new Error("Email é obrigatório");
    }

    const testData = {
      email,
      name: language === 'pt' ? "Usuário Teste" : "Test User",
      inviter_name: language === 'pt' ? "Admin Couples Financials" : "Couples Financials Admin",
      temp_password: "TEST2024",
      login_url: "https://elxttabdtddlavhseipz.supabase.co",
      start_date: language === 'pt' ? new Date().toLocaleDateString('pt-BR') : new Date().toLocaleDateString('en-US'),
      end_date: language === 'pt' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR') : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US'),
      days_duration: 30
    };

    let emailHtml: string;
    let subject: string;

    if (template === 'premium') {
      if (language === 'en') {
        emailHtml = await renderAsync(
          React.createElement(PremiumAccessEmailEn, {
            user_email: testData.email,
            start_date: testData.start_date,
            end_date: testData.end_date,
            temp_password: testData.temp_password,
            login_url: testData.login_url,
            days_duration: testData.days_duration,
          })
        );
        subject = "🎉 Premium Access Granted - Couples Financials";
      } else {
        emailHtml = await renderAsync(
          React.createElement(PremiumAccessEmail, {
            user_email: testData.email,
            start_date: testData.start_date,
            end_date: testData.end_date,
            temp_password: testData.temp_password,
            login_url: testData.login_url,
            days_duration: testData.days_duration,
          })
        );
        subject = "🎉 Acesso Premium Concedido - Couples Financials";
      }
    } else {
      if (language === 'en') {
        emailHtml = await renderAsync(
          React.createElement(CouplesFinancialsEmailEn, {
            name: testData.name,
            inviter_name: testData.inviter_name,
            email: testData.email,
            temp_password: testData.temp_password,
            login_url: testData.login_url,
          })
        );
        subject = "💚 Invitation to Couples Financials - Test";
      } else {
        emailHtml = await renderAsync(
          React.createElement(CouplesFinancialsEmail, {
            name: testData.name,
            inviter_name: testData.inviter_name,
            email: testData.email,
            temp_password: testData.temp_password,
            login_url: testData.login_url,
          })
        );
        subject = "💚 Convite para Couples Financials - Teste";
      }
    }

    const emailResponse = await resend.emails.send({
      from: "Couples Financials <contato@couplesfinancials.com>",
      to: [email],
      subject,
      html: emailHtml,
    });

    console.log(`Test ${template || 'invite'} email sent successfully:`, emailResponse);

    return new Response(JSON.stringify({
      success: true,
      message: `Email de teste (${template || 'convite'}) enviado com sucesso!`,
      template: template || 'invite',
      emailResponse
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in test-email function:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);