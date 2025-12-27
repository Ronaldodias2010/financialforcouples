import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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

// Generate HTML email template
const generateInviteEmailHtml = (
  name: string,
  inviterName: string,
  email: string,
  tempPassword: string,
  loginUrl: string,
  language: 'pt' | 'en'
): string => {
  const logoUrl = "https://elxttabdtddlavhseipz.lovableproject.com/lovable-uploads/1f5e0469-b056-4cf9-9583-919702fa8736.png";
  
  const texts = {
    pt: {
      title: 'Você foi convidado!',
      subtitle: `${inviterName} quer gerenciar as finanças com você`,
      greeting: `Olá ${name}!`,
      message: `${inviterName} te convidou para fazer parte do Couples Financials, a plataforma para casais gerenciarem suas finanças juntos.`,
      credentials: 'Suas credenciais de acesso:',
      emailLabel: 'Email:',
      passwordLabel: 'Senha temporária:',
      changePassword: 'Por favor, altere sua senha após o primeiro acesso.',
      button: 'Acessar Plataforma',
      features: [
        '💑 Gerencie finanças em casal',
        '📊 Visualize relatórios compartilhados',
        '🎯 Definam metas juntos',
        '💳 Controlem cartões e contas'
      ],
      footer: '© 2024 Couples Financials. Todos os direitos reservados.'
    },
    en: {
      title: 'You\'ve been invited!',
      subtitle: `${inviterName} wants to manage finances with you`,
      greeting: `Hello ${name}!`,
      message: `${inviterName} invited you to join Couples Financials, the platform for couples to manage their finances together.`,
      credentials: 'Your access credentials:',
      emailLabel: 'Email:',
      passwordLabel: 'Temporary password:',
      changePassword: 'Please change your password after your first login.',
      button: 'Access Platform',
      features: [
        '💑 Manage finances as a couple',
        '📊 View shared reports',
        '🎯 Set goals together',
        '💳 Control cards and accounts'
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
              <h2 style="color: #ffffff; font-size: 24px; font-weight: 600; text-align: center; margin: 0 0 8px;">💚 ${t.title}</h2>
              <p style="color: #22c55e; font-size: 16px; text-align: center; margin: 0 0 24px;">${t.subtitle}</p>
              <p style="color: #e2e8f0; font-size: 16px; line-height: 24px; margin: 0 0 16px;">${t.greeting}</p>
              <p style="color: #e2e8f0; font-size: 16px; line-height: 24px; margin: 0 0 24px;">${t.message}</p>
              
              <!-- Credentials Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: rgba(34, 197, 94, 0.1); border: 1px solid #22c55e; border-radius: 8px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="color: #22c55e; font-size: 14px; font-weight: 600; margin: 0 0 12px;">${t.credentials}</p>
                    <p style="color: #e2e8f0; font-size: 14px; margin: 0 0 8px;"><strong>${t.emailLabel}</strong> ${email}</p>
                    <p style="color: #e2e8f0; font-size: 14px; margin: 0 0 12px;"><strong>${t.passwordLabel}</strong> <code style="background-color: #0f172a; padding: 4px 8px; border-radius: 4px; font-family: monospace;">${tempPassword}</code></p>
                    <p style="color: #fbbf24; font-size: 12px; margin: 0;">⚠️ ${t.changePassword}</p>
                  </td>
                </tr>
              </table>
              
              <!-- Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding: 0 0 32px;">
                    <a href="${loginUrl}" target="_blank" style="display: inline-block; background-color: #22c55e; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 16px 32px; border-radius: 8px;">${t.button}</a>
                  </td>
                </tr>
              </table>
              
              <!-- Features -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: rgba(233, 69, 96, 0.1); border-radius: 8px;">
                <tr>
                  <td style="padding: 16px;">
                    ${t.features.map(feature => `<p style="color: #e2e8f0; font-size: 14px; line-height: 20px; margin: 8px 0;">${feature}</p>`).join('')}
                  </td>
                </tr>
              </table>
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
    console.log(`Processing invite for: ${email}, from: ${inviter_name}`);

    // Generate temporary password
    const { data: tempPassword, error: passwordError } = await supabase
      .rpc('generate_temp_password');

    if (passwordError) {
      console.error('Error generating temp password:', passwordError);
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
      console.error('Error creating invite:', inviteError);
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

    // Create the login URL
    const baseUrl = req.headers.get('origin') || 'https://couplesfinancials.com';
    const loginUrl = `${baseUrl}/auth?invite=true&email=${encodeURIComponent(email)}`;

    const emailHtml = generateInviteEmailHtml(name, inviter_name, email, tempPassword, loginUrl, lang);

    console.log(`Sending invite email to ${email}`);
    
    const emailResponse = await resend.emails.send({
      from: 'Couples Financials <contato@couplesfinancials.com>',
      to: [email],
      subject: lang === 'en' 
        ? `${inviter_name} invited you to Couples Financials 💚`
        : `${inviter_name} convidou você para o Couples Financials 💚`,
      html: emailHtml,
    });

    console.log("Invite email sent successfully:", JSON.stringify(emailResponse));

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-invite:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
