import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Send2FAEmailRequest {
  userId: string;
  email: string;
  language?: 'pt' | 'en' | 'es';
}

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function getEmailContent(code: string, language: 'pt' | 'en' | 'es' = 'pt') {
  const translations = {
    pt: {
      subject: 'Código de verificação - Couples Financials',
      title: 'Código de Verificação',
      greeting: 'Olá!',
      message: 'Use o código abaixo para completar sua autenticação de dois fatores:',
      codeLabel: 'Seu código de verificação',
      expiry: 'Este código expira em 10 minutos.',
      warning: 'Se você não solicitou este código, ignore este email.',
      footer: 'Equipe Couples Financials',
    },
    en: {
      subject: 'Verification Code - Couples Financials',
      title: 'Verification Code',
      greeting: 'Hello!',
      message: 'Use the code below to complete your two-factor authentication:',
      codeLabel: 'Your verification code',
      expiry: 'This code expires in 10 minutes.',
      warning: 'If you did not request this code, please ignore this email.',
      footer: 'Couples Financials Team',
    },
    es: {
      subject: 'Código de verificación - Couples Financials',
      title: 'Código de Verificación',
      greeting: '¡Hola!',
      message: 'Use el código a continuación para completar su autenticación de dos factores:',
      codeLabel: 'Su código de verificación',
      expiry: 'Este código expira en 10 minutos.',
      warning: 'Si no solicitó este código, ignore este correo electrónico.',
      footer: 'Equipo Couples Financials',
    },
  };

  const t = translations[language];

  return {
    subject: t.subject,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <tr>
            <td style="padding: 40px 30px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px;">${t.title}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #333333; font-size: 16px; margin-bottom: 20px;">${t.greeting}</p>
              <p style="color: #666666; font-size: 14px; margin-bottom: 30px;">${t.message}</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <p style="color: #888888; font-size: 12px; margin-bottom: 10px; text-transform: uppercase;">${t.codeLabel}</p>
                <div style="background-color: #f8f9fa; border: 2px dashed #667eea; border-radius: 8px; padding: 20px; display: inline-block;">
                  <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #333333;">${code}</span>
                </div>
              </div>
              
              <p style="color: #888888; font-size: 12px; text-align: center; margin-top: 30px;">
                ⏱️ ${t.expiry}
              </p>
              
              <p style="color: #999999; font-size: 11px; text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #eeeeee;">
                ⚠️ ${t.warning}
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 30px; background-color: #f8f9fa; text-align: center;">
              <p style="color: #999999; font-size: 12px; margin: 0;">${t.footer}</p>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, email, language = 'pt' }: Send2FAEmailRequest = await req.json();

    console.log('[SEND-2FA-EMAIL] Processing request for user:', userId);

    // Generate 6-digit code
    const code = generateCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

    // Store code in database
    const { error: dbError } = await supabase
      .from('user_2fa_codes')
      .insert({
        user_id: userId,
        code_hash: code, // In production, this should be hashed
        method: 'email',
        expires_at: expiresAt,
        is_used: false,
      });

    if (dbError) {
      console.error('[SEND-2FA-EMAIL] Database error:', dbError);
      throw new Error('Failed to store verification code');
    }

    // Get email content
    const emailContent = getEmailContent(code, language);

    // Send email
    const emailResponse = await resend.emails.send({
      from: "Couples Financials <noreply@couplesfinancials.com>",
      to: [email],
      subject: emailContent.subject,
      html: emailContent.html,
    });

    console.log('[SEND-2FA-EMAIL] Email sent successfully:', emailResponse);

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Verification code sent successfully'
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("[SEND-2FA-EMAIL] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
