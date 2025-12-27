import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ConfirmationEmailRequest {
  userEmail: string;
  language?: string;
}

// Generate HTML email template
const generateEmailHtml = (userEmail: string, loginUrl: string, language: 'pt' | 'en' | 'es'): string => {
  const logoUrl = "https://elxttabdtddlavhseipz.lovableproject.com/lovable-uploads/1f5e0469-b056-4cf9-9583-919702fa8736.png";
  
  const texts = {
    pt: {
      preview: 'Confirme seu endereço de email para ativar sua conta',
      title: 'Confirme seu endereço de email',
      greeting: 'Olá! Obrigado por se cadastrar no',
      brand: 'Couples Financials',
      message: 'Para ativar sua conta, confirme seu endereço de email.',
      emailLabel: 'Email a ser confirmado:',
      button: 'Confirmar Email',
      linkText: 'Ou copie e cole este link no seu navegador:',
      afterConfirm: 'Após confirmar seu email, você poderá:',
      features: [
        'Gerenciar suas contas bancárias',
        'Controlar gastos com cartões',
        'Visualizar relatórios detalhados',
        'Definir metas financeiras',
        'Acompanhar milhas e pontos',
        'Convidar seu parceiro(a)'
      ],
      footer: 'Se você não criou esta conta, pode ignorar este email com segurança.',
      tagline: 'Gestão financeira inteligente para casais'
    },
    en: {
      preview: 'Confirm your email address to activate your account',
      title: 'Confirm your email address',
      greeting: 'Hello! Thank you for signing up for',
      brand: 'Couples Financials',
      message: 'To activate your account, please confirm your email address.',
      emailLabel: 'Email to be confirmed:',
      button: 'Confirm Email',
      linkText: 'Or copy and paste this link into your browser:',
      afterConfirm: 'After confirming your email, you\'ll be able to:',
      features: [
        'Manage your bank accounts',
        'Track credit card expenses',
        'View detailed reports',
        'Set financial goals',
        'Track miles and points',
        'Invite your partner'
      ],
      footer: 'If you didn\'t create this account, you can safely ignore this email.',
      tagline: 'Smart financial management for couples'
    },
    es: {
      preview: 'Confirma tu dirección de email para activar tu cuenta',
      title: 'Confirma tu dirección de email',
      greeting: '¡Hola! Gracias por registrarte en',
      brand: 'Couples Financials',
      message: 'Para activar tu cuenta, confirma tu dirección de email.',
      emailLabel: 'Email a confirmar:',
      button: 'Confirmar Email',
      linkText: 'O copia y pega este enlace en tu navegador:',
      afterConfirm: 'Después de confirmar tu email, podrás:',
      features: [
        'Gestionar tus cuentas bancarias',
        'Controlar gastos con tarjetas',
        'Ver reportes detallados',
        'Definir metas financieras',
        'Seguir millas y puntos',
        'Invitar a tu pareja'
      ],
      footer: 'Si no creaste esta cuenta, puedes ignorar este email con seguridad.',
      tagline: 'Gestión financiera inteligente para parejas'
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
              <h2 style="color: #ffffff; font-size: 24px; font-weight: 600; text-align: center; margin: 0 0 24px;">🎉 ${t.title}</h2>
              <p style="color: #e2e8f0; font-size: 16px; line-height: 24px; margin: 0 0 16px;">${t.greeting} <strong>${t.brand}</strong>. ${t.message}</p>
              <p style="color: #e2e8f0; font-size: 16px; line-height: 24px; margin: 0 0 24px;">${t.emailLabel} <strong>${userEmail}</strong></p>
              
              <!-- Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding: 16px 0 24px;">
                    <a href="${loginUrl}" target="_blank" style="display: inline-block; background-color: #22c55e; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 16px 32px; border-radius: 8px;">${t.button}</a>
                  </td>
                </tr>
              </table>
              
              <p style="color: #94a3b8; font-size: 14px; text-align: center; margin: 0 0 16px;">${t.linkText}</p>
              <p style="color: #60a5fa; font-size: 12px; word-break: break-all; text-align: center; margin: 0 0 24px;">${loginUrl}</p>
              
              <!-- Features -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: rgba(233, 69, 96, 0.1); border-radius: 8px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 16px;">
                    <p style="color: #22c55e; font-size: 14px; font-weight: 600; margin: 0 0 12px;">${t.afterConfirm}</p>
                    ${t.features.map(feature => `<p style="color: #e2e8f0; font-size: 14px; line-height: 20px; margin: 8px 0;">✓ ${feature}</p>`).join('')}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px 40px;">
              <hr style="border: none; border-top: 1px solid #334155; margin: 0 0 20px;">
              <p style="color: #94a3b8; font-size: 14px; line-height: 20px; text-align: center; margin: 0 0 16px;">${t.footer}</p>
              <p style="color: #94a3b8; font-size: 14px; line-height: 20px; text-align: center; margin: 0;"><strong>Couples Financials</strong> - ${t.tagline}</p>
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
    const { userEmail, language = 'pt' }: ConfirmationEmailRequest = await req.json();
    console.log(`Processing confirmation email for: ${userEmail}, language: ${language}`);
    
    const loginUrl = `https://couplesfinancials.com/auth?email=${encodeURIComponent(userEmail)}`;
    const lang = language === 'en' ? 'en' : language === 'es' ? 'es' : 'pt';

    const emailHtml = generateEmailHtml(userEmail, loginUrl, lang);

    const subject = lang === 'en' 
      ? "🎉 Confirm your email address - Couples Financials"
      : lang === 'es'
      ? "🎉 Confirma tu dirección de email - Couples Financials"
      : "🎉 Confirme seu endereço de email - Couples Financials";

    console.log(`Sending email to ${userEmail} with subject: ${subject}`);

    const emailResponse = await resend.emails.send({
      from: "Couples Financials <noreply@couplesfinancials.com>",
      to: [userEmail],
      subject: subject,
      html: emailHtml,
    });

    console.log("Confirmation email sent successfully:", JSON.stringify(emailResponse));

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-confirmation-manual:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
