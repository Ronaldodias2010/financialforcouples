import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from 'https://esm.sh/resend@2.0.0';

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

// Generate HTML email template
const generateEmailHtml = (
  userName: string,
  confirmUrl: string,
  isMagicLink: boolean,
  language: 'pt' | 'en' | 'es'
): string => {
  const logoUrl = "https://elxttabdtddlavhseipz.lovableproject.com/lovable-uploads/1f5e0469-b056-4cf9-9583-919702fa8736.png";
  
  const texts = {
    pt: {
      title: isMagicLink ? 'Seu email foi verificado!' : 'Confirme seu email',
      greeting: `Olá ${userName}!`,
      message: isMagicLink 
        ? 'Clique no botão abaixo para continuar com segurança para o pagamento.'
        : 'Clique no botão abaixo para confirmar seu endereço de email e acessar a plataforma.',
      button: isMagicLink ? 'Continuar para pagamento' : 'Confirmar Email',
      footer: 'Se você não solicitou isso, pode ignorar este email com segurança.',
      features: [
        '📊 Controle completo das finanças do casal',
        '💳 Gestão de cartões e contas',
        '📈 Relatórios e insights financeiros',
        '🎯 Metas e investimentos compartilhados'
      ]
    },
    en: {
      title: isMagicLink ? 'Your email has been verified!' : 'Confirm your email',
      greeting: `Hello ${userName}!`,
      message: isMagicLink 
        ? 'Click the button below to continue securely to payment.'
        : 'Click the button below to confirm your email address and access the platform.',
      button: isMagicLink ? 'Continue to payment' : 'Confirm Email',
      footer: 'If you didn\'t request this, you can safely ignore this email.',
      features: [
        '📊 Complete control of couple finances',
        '💳 Card and account management',
        '📈 Financial reports and insights',
        '🎯 Shared goals and investments'
      ]
    },
    es: {
      title: isMagicLink ? '¡Tu email ha sido verificado!' : 'Confirma tu email',
      greeting: `¡Hola ${userName}!`,
      message: isMagicLink 
        ? 'Haz clic en el botón a continuación para continuar de forma segura al pago.'
        : 'Haz clic en el botón a continuación para confirmar tu dirección de email y acceder a la plataforma.',
      button: isMagicLink ? 'Continuar al pago' : 'Confirmar Email',
      footer: 'Si no solicitaste esto, puedes ignorar este email con seguridad.',
      features: [
        '📊 Control completo de las finanzas de la pareja',
        '💳 Gestión de tarjetas y cuentas',
        '📈 Informes e insights financieros',
        '🎯 Metas e inversiones compartidas'
      ]
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
              <h2 style="color: #ffffff; font-size: 24px; font-weight: 600; text-align: center; margin: 0 0 24px;">${t.title}</h2>
              <p style="color: #e2e8f0; font-size: 16px; line-height: 24px; margin: 0 0 16px;">${t.greeting}</p>
              <p style="color: #e2e8f0; font-size: 16px; line-height: 24px; margin: 0 0 24px;">${t.message}</p>
              
              <!-- Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding: 16px 0 32px;">
                    <a href="${confirmUrl}" target="_blank" style="display: inline-block; background-color: #22c55e; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 16px 32px; border-radius: 8px;">${t.button}</a>
                  </td>
                </tr>
              </table>
              
              ${!isMagicLink ? `
              <!-- Features -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: rgba(233, 69, 96, 0.1); border-radius: 8px; padding: 20px;">
                <tr>
                  <td style="padding: 16px;">
                    ${t.features.map(feature => `<p style="color: #e2e8f0; font-size: 14px; line-height: 20px; margin: 8px 0;">${feature}</p>`).join('')}
                  </td>
                </tr>
              </table>
              ` : ''}
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px 40px;">
              <hr style="border: none; border-top: 1px solid #334155; margin: 0 0 20px;">
              <p style="color: #94a3b8; font-size: 14px; line-height: 20px; text-align: center; margin: 0 0 16px;">${t.footer}</p>
              <p style="color: #94a3b8; font-size: 14px; line-height: 20px; text-align: center; margin: 0;">© 2024 Couples Financials. All rights reserved.</p>
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
    const requestText = await req.text();
    if (!requestText || requestText.trim() === '') {
      console.log('Empty request body received');
      return new Response(JSON.stringify({ error: 'Empty request body' }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const payload: WebhookPayload = JSON.parse(requestText);
    console.log('Webhook payload received:', JSON.stringify({ user: payload.user.email }, null, 2));

    // Process email in background to avoid timeout
    (async () => {
      try {
        const { user, email_data } = payload;
        const { token_hash, redirect_to, email_action_type } = email_data;

        // Detect language from redirect_to URL
        const detectLanguage = (redirectTo: string): 'pt' | 'en' | 'es' => {
          try {
            const url = new URL(redirectTo);
            const langParam = url.searchParams.get('lang');
            if (langParam === 'en' || langParam === 'es' || langParam === 'pt') {
              return langParam;
            }
          } catch {}
          return 'pt';
        };

        const language = detectLanguage(redirect_to);
        const userName = user.user_metadata?.display_name ||
                        user.user_metadata?.full_name || 
                        user.user_metadata?.name || 
                        user.email.split('@')[0];

        // Build the real Supabase verification URL that will actually confirm the email
        const confirmUrl = `${Deno.env.get('SUPABASE_URL')}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${encodeURIComponent(redirect_to)}`;
        
        const action = (email_action_type || '').toLowerCase();
        const isMagicLink = action.includes('magic') || action === 'email_link';

        const emailHtml = generateEmailHtml(userName, confirmUrl, isMagicLink, language);

        const subject = isMagicLink
          ? (language === 'en'
              ? '✅ Email verified — continue to secure payment'
              : language === 'es'
              ? '✅ Email verificado — continúa al pago seguro'
              : '✅ Email verificado — continue para o pagamento com segurança')
          : (language === 'en'
              ? '🎉 Confirm your email address - Couples Financials'
              : language === 'es'
              ? '🎉 Confirma tu dirección de email - Couples Financials'
              : '🎉 Confirme seu endereço de email - Couples Financials');

        console.log(`Sending email to ${user.email} with subject: ${subject}`);
        console.log(`Confirmation URL (type: ${email_action_type}): ${confirmUrl.substring(0, 100)}...`);
        
        const emailResponse = await resend.emails.send({
          from: "Couples Financials <noreply@couplesfinancials.com>",
          to: [user.email],
          subject,
          html: emailHtml,
        });

        console.log("Email sent successfully:", JSON.stringify(emailResponse));
      } catch (bgErr) {
        console.error('Error sending email in background:', bgErr);
      }
    })();

    return new Response(JSON.stringify({ accepted: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-confirmation-webhook:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
