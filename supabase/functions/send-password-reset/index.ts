import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from 'https://esm.sh/resend@2.0.0';

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

// Generate HTML email template
const generatePasswordResetHtml = (userEmail: string, resetUrl: string, language: 'pt' | 'en'): string => {
  const logoUrl = "https://elxttabdtddlavhseipz.lovableproject.com/lovable-uploads/1f5e0469-b056-4cf9-9583-919702fa8736.png";
  
  const texts = {
    pt: {
      title: 'Redefinir sua senha',
      greeting: `Olá ${userEmail.split('@')[0]}!`,
      message: 'Recebemos uma solicitação para redefinir sua senha. Clique no botão abaixo para criar uma nova senha.',
      button: 'Redefinir Senha',
      expiry: 'Este link expira em 1 hora.',
      ignore: 'Se você não solicitou a redefinição de senha, pode ignorar este email com segurança.',
      tips: 'Dicas de segurança:',
      tipsList: [
        '🔒 Use uma senha forte com letras, números e símbolos',
        '🔑 Não compartilhe sua senha com ninguém',
        '📱 Ative autenticação em duas etapas quando disponível'
      ],
      footer: '© 2024 Couples Financials. Todos os direitos reservados.'
    },
    en: {
      title: 'Reset your password',
      greeting: `Hello ${userEmail.split('@')[0]}!`,
      message: 'We received a request to reset your password. Click the button below to create a new password.',
      button: 'Reset Password',
      expiry: 'This link expires in 1 hour.',
      ignore: 'If you didn\'t request a password reset, you can safely ignore this email.',
      tips: 'Security tips:',
      tipsList: [
        '🔒 Use a strong password with letters, numbers, and symbols',
        '🔑 Never share your password with anyone',
        '📱 Enable two-factor authentication when available'
      ],
      footer: '© 2024 Couples Financials. All rights reserved.'
    }
  };

  const t = texts[language];

  return `
<!DOCTYPE html>
<html lang="${language}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${t.title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #1a1a2e; min-height: 100vh;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #1a1a2e; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color: #16213e; border-radius: 12px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);">
          <!-- Header -->
          <tr>
            <td align="center" style="padding: 40px 40px 20px;">
              <img src="${logoUrl}" alt="Couples Financials" width="80" height="80" style="border-radius: 8px; display: block;">
              <h1 style="color: #e94560; font-size: 28px; font-weight: bold; margin: 20px 0 0;">Couples Financials</h1>
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="padding: 20px 40px;">
              <h2 style="color: #ffffff; font-size: 24px; font-weight: 600; text-align: center; margin: 0 0 24px;">🔐 ${t.title}</h2>
              <p style="color: #e2e8f0; font-size: 16px; line-height: 24px; margin: 0 0 16px;">${t.greeting}</p>
              <p style="color: #e2e8f0; font-size: 16px; line-height: 24px; margin: 0 0 24px;">${t.message}</p>
              
              <!-- Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding: 16px 0 24px;">
                    <a href="${resetUrl}" target="_blank" style="display: inline-block; background-color: #e94560; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 16px 32px; border-radius: 8px;">${t.button}</a>
                  </td>
                </tr>
              </table>
              
              <!-- Expiry Notice -->
              <p style="color: #fbbf24; font-size: 14px; text-align: center; margin: 0 0 24px;">⏱️ ${t.expiry}</p>
              
              <!-- Security Tips -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: rgba(34, 197, 94, 0.1); border-radius: 8px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 16px;">
                    <p style="color: #22c55e; font-size: 14px; font-weight: 600; margin: 0 0 12px;">${t.tips}</p>
                    ${t.tipsList.map(tip => `<p style="color: #e2e8f0; font-size: 14px; line-height: 20px; margin: 8px 0;">${tip}</p>`).join('')}
                  </td>
                </tr>
              </table>
              
              <p style="color: #94a3b8; font-size: 14px; text-align: center; margin: 0;">${t.ignore}</p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px 40px;">
              <hr style="border: none; border-top: 1px solid #334155; margin: 0 0 20px;">
              <p style="color: #94a3b8; font-size: 14px; line-height: 20px; text-align: center; margin: 0;">${t.footer}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userEmail, resetUrl, language = 'pt' }: PasswordResetRequest = await req.json();
    console.log(`Processing password reset for: ${userEmail}, language: ${language}`);

    const lang = language === 'en' ? 'en' : 'pt';
    const emailHtml = generatePasswordResetHtml(userEmail, resetUrl, lang);

    console.log(`Sending password reset email to ${userEmail}`);
    
    const emailResponse = await resend.emails.send({
      from: "Couples Financials <noreply@couplesfinancials.com>",
      to: [userEmail],
      subject: lang === 'en' 
        ? "🔐 Reset your Couples Financials password"
        : "🔐 Redefinir sua senha do Couples Financials",
      html: emailHtml,
    });

    console.log("Password reset email sent successfully:", JSON.stringify(emailResponse));

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-password-reset:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
