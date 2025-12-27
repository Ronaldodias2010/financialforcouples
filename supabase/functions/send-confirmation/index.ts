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

interface ConfirmationEmailRequest {
  userEmail: string;
  language?: string;
}

// Generate HTML email template
const generateEmailHtml = (userName: string, confirmUrl: string, language: 'pt' | 'en'): string => {
  const logoUrl = "https://elxttabdtddlavhseipz.lovableproject.com/lovable-uploads/1f5e0469-b056-4cf9-9583-919702fa8736.png";
  
  const texts = {
    pt: {
      title: 'Confirme seu email',
      subtitle: 'Clique no botão abaixo para confirmar',
      greeting: `Olá ${userName}!`,
      message: 'Obrigado por se cadastrar no Couples Financials! Clique no botão abaixo para confirmar seu email e ativar sua conta.',
      button: 'Confirmar Email',
      features: [
        '📊 Controle completo das finanças do casal',
        '💳 Gestão de cartões e contas',
        '📈 Relatórios e insights financeiros',
        '🎯 Metas e investimentos compartilhados'
      ],
      footer: '© 2024 Couples Financials. Todos os direitos reservados.'
    },
    en: {
      title: 'Confirm your email',
      subtitle: 'Click the button below to confirm',
      greeting: `Hello ${userName}!`,
      message: 'Thank you for signing up for Couples Financials! Click the button below to confirm your email and activate your account.',
      button: 'Confirm Email',
      features: [
        '📊 Complete control of couple finances',
        '💳 Card and account management',
        '📈 Financial reports and insights',
        '🎯 Shared goals and investments'
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
              <h2 style="color: #ffffff; font-size: 24px; font-weight: 600; text-align: center; margin: 0 0 8px;">🎉 ${t.title}</h2>
              <p style="color: #22c55e; font-size: 16px; text-align: center; margin: 0 0 24px;">${t.subtitle}</p>
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
    const { userEmail, language = 'pt' }: ConfirmationEmailRequest = await req.json();
    console.log(`Processing confirmation email for: ${userEmail}, language: ${language}`);

    // Get user by email
    const { data: usersData } = await supabase.auth.admin.listUsers();
    const targetUser = usersData?.users?.find(u => u.email === userEmail);
    
    if (!targetUser) {
      console.error(`User with email ${userEmail} not found`);
      throw new Error(`User with email ${userEmail} not found`);
    }

    // Get user's display name from the database
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('user_id', targetUser.id)
      .single();

    const userName = userProfile?.display_name || userEmail.split('@')[0];
    const lang = language === 'en' ? 'en' : 'pt';
    const siteUrl = 'https://couplesfinancials.com';
    const redirectTo = `${siteUrl}/email-confirmation?lang=${lang}`;

    // Generate a real confirmation link using Supabase Admin API
    console.log(`Generating confirmation link for ${userEmail}...`);
    
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'signup',
      email: userEmail,
      options: {
        redirectTo: redirectTo
      }
    });

    if (linkError) {
      console.error('Error generating confirmation link:', linkError);
      throw new Error(`Failed to generate confirmation link: ${linkError.message}`);
    }

    const confirmUrl = linkData.properties?.action_link;
    
    if (!confirmUrl) {
      console.error('No action_link returned from generateLink');
      throw new Error('Failed to generate confirmation URL');
    }

    console.log(`Generated confirmation URL for ${userEmail}`);

    const emailHtml = generateEmailHtml(userName, confirmUrl, lang);

    console.log(`Sending confirmation email to ${userEmail}`);
    
    const emailResponse = await resend.emails.send({
      from: "Couples Financials <noreply@couplesfinancials.com>",
      to: [userEmail],
      subject: lang === 'en' 
        ? "🎉 Confirm your email - Couples Financials"
        : "🎉 Confirme seu email - Couples Financials",
      html: emailHtml,
    });

    console.log("Confirmation email sent successfully:", JSON.stringify(emailResponse));

    return new Response(JSON.stringify({ 
      success: true,
      email_id: emailResponse.id,
      message: `Confirmation email sent to ${userEmail}`
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-confirmation:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
