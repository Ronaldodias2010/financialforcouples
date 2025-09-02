import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";
import { renderAsync } from 'npm:@react-email/components@0.0.22';
import React from 'npm:react@18.3.1';
import { CouplesFinancialsEmail } from './_templates/couples-financials-email.tsx';
import { PremiumAccessEmail } from './_templates/premium-access-email.tsx';
import { CouplesFinancialsEmailEn } from './_templates/couples-financials-email-en.tsx';
import { PremiumAccessEmailEn } from './_templates/premium-access-email-en.tsx';
import { EmailConfirmationPT } from './_templates/email-confirmation-pt.tsx';
import { EmailConfirmationEN } from './_templates/email-confirmation-en.tsx';
import { PasswordResetPT } from './_templates/password-reset-pt.tsx';
import { PasswordResetEN } from './_templates/password-reset-en.tsx';
import { PremiumWelcomeEmailPT } from './_templates/premium-welcome-pt.tsx';
import { PremiumWelcomeEmailEN } from './_templates/premium-welcome-en.tsx';
import { PremiumWelcomeEmailES } from './_templates/premium-welcome-es.tsx';
import { PremiumAccessGrantedEmailPT } from './_templates/premium-access-granted-pt.tsx';
import { PremiumAccessGrantedEmailEN } from './_templates/premium-access-granted-en.tsx';
import { PremiumAccessGrantedEmailES } from './_templates/premium-access-granted-es.tsx';

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
      name: language === 'pt' ? "Usuário Teste" : language === 'es' ? "Usuario de Prueba" : "Test User",
      user_name: language === 'pt' ? "João Silva" : language === 'es' ? "Juan Pérez" : "John Smith",
      inviter_name: language === 'pt' ? "Admin Couples Financials" : "Couples Financials Admin",
      temp_password: "TEST2024",
      login_url: "https://www.couplesfinancials.com/auth",
      start_date: new Date().toISOString(),
      end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      subscription_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      days_duration: 30,
      userEmail: email,
      loginUrl: "https://www.couplesfinancials.com/auth",
      resetUrl: "https://www.couplesfinancials.com/reset-password"
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
    } else if (template === 'confirmation') {
      if (language === 'en') {
        emailHtml = await renderAsync(
          React.createElement(EmailConfirmationEN, {
            userEmail: testData.userEmail,
            loginUrl: testData.loginUrl,
          })
        );
        subject = "🎉 Account Confirmed - Couples Financials";
      } else {
        emailHtml = await renderAsync(
          React.createElement(EmailConfirmationPT, {
            userEmail: testData.userEmail,
            loginUrl: testData.loginUrl,
          })
        );
        subject = "🎉 Conta Confirmada - Couples Financials";
      }
    } else if (template === 'password-reset') {
      if (language === 'en') {
        emailHtml = await renderAsync(
          React.createElement(PasswordResetEN, {
            userEmail: testData.userEmail,
            resetUrl: testData.resetUrl,
          })
        );
        subject = "🔐 Password Reset - Couples Financials";
      } else {
        emailHtml = await renderAsync(
          React.createElement(PasswordResetPT, {
            userEmail: testData.userEmail,
            resetUrl: testData.resetUrl,
          })
        );
        subject = "🔐 Redefinir Senha - Couples Financials";
      }
    } else if (template === 'premium-welcome') {
      if (language === 'en') {
        emailHtml = await renderAsync(
          React.createElement(PremiumWelcomeEmailEN, {
            user_email: testData.email,
            user_name: testData.user_name,
            subscription_end: testData.subscription_end,
            login_url: testData.login_url,
          })
        );
        subject = "🎉 Welcome to Couples Financials Premium!";
      } else if (language === 'es') {
        emailHtml = await renderAsync(
          React.createElement(PremiumWelcomeEmailES, {
            user_email: testData.email,
            user_name: testData.user_name,
            subscription_end: testData.subscription_end,
            login_url: testData.login_url,
          })
        );
        subject = "🎉 ¡Bienvenido a Couples Financials Premium!";
      } else {
        emailHtml = await renderAsync(
          React.createElement(PremiumWelcomeEmailPT, {
            user_email: testData.email,
            user_name: testData.user_name,
            subscription_end: testData.subscription_end,
            login_url: testData.login_url,
          })
        );
        subject = "🎉 Bem-vindo ao Couples Financials Premium!";
      }
    } else if (template === 'premium-access-granted') {
      if (language === 'en') {
        emailHtml = await renderAsync(
          React.createElement(PremiumAccessGrantedEmailEN, {
            user_email: testData.email,
            start_date: testData.start_date,
            end_date: testData.end_date,
            temp_password: testData.temp_password,
            login_url: testData.login_url,
            days_duration: testData.days_duration,
          })
        );
        subject = "🎁 Premium Access Granted by Admin - Couples Financials";
      } else if (language === 'es') {
        emailHtml = await renderAsync(
          React.createElement(PremiumAccessGrantedEmailES, {
            user_email: testData.email,
            start_date: testData.start_date,
            end_date: testData.end_date,
            temp_password: testData.temp_password,
            login_url: testData.login_url,
            days_duration: testData.days_duration,
          })
        );
        subject = "🎁 Acceso Premium Concedido por Admin - Couples Financials";
      } else {
        emailHtml = await renderAsync(
          React.createElement(PremiumAccessGrantedEmailPT, {
            user_email: testData.email,
            start_date: testData.start_date,
            end_date: testData.end_date,
            temp_password: testData.temp_password,
            login_url: testData.login_url,
            days_duration: testData.days_duration,
          })
        );
        subject = "🎁 Acesso Premium Concedido pelo Admin - Couples Financials";
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