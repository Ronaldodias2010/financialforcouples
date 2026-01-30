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
  resetUrl?: string;
  language?: string;
}

// Generate a secure temporary password
const generateTempPassword = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  const specialChars = '!@#$%';
  let password = '';
  
  // Generate 8 random characters
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  // Add a special character
  password += specialChars.charAt(Math.floor(Math.random() * specialChars.length));
  
  // Add a number at the end
  password += Math.floor(Math.random() * 10);
  
  return password;
};

// Generate HTML email template with temporary password
const generatePasswordResetHtml = (userEmail: string, tempPassword: string, loginUrl: string, language: 'pt' | 'en'): string => {
  const logoUrl = "https://couplesfinancials.com/lovable-uploads/couples-financials-logo-new.png";
  
  const texts = {
    pt: {
      title: 'Sua Senha Temporária',
      greeting: `Olá ${userEmail.split('@')[0]}!`,
      message: 'Recebemos sua solicitação de recuperação de senha. Aqui está sua senha temporária para acessar sua conta:',
      passwordLabel: 'Senha Temporária:',
      instructions: 'Use esta senha para fazer login e depois altere-a nas configurações do seu perfil.',
      button: 'Fazer Login',
      expiry: '⚠️ Por segurança, altere sua senha assim que fizer login.',
      tips: 'Próximos passos:',
      tipsList: [
        '1️⃣ Clique no botão "Fazer Login" abaixo',
        '2️⃣ Use seu email e a senha temporária acima',
        '3️⃣ Após entrar, vá em Configurações e altere sua senha'
      ],
      ignore: 'Se você não solicitou a recuperação de senha, entre em contato conosco imediatamente.',
      footer: '© 2024 Couples Financials. Todos os direitos reservados.'
    },
    en: {
      title: 'Your Temporary Password',
      greeting: `Hello ${userEmail.split('@')[0]}!`,
      message: 'We received your password recovery request. Here is your temporary password to access your account:',
      passwordLabel: 'Temporary Password:',
      instructions: 'Use this password to log in and then change it in your profile settings.',
      button: 'Log In',
      expiry: '⚠️ For security, change your password as soon as you log in.',
      tips: 'Next steps:',
      tipsList: [
        '1️⃣ Click the "Log In" button below',
        '2️⃣ Use your email and the temporary password above',
        '3️⃣ After logging in, go to Settings and change your password'
      ],
      ignore: 'If you didn\'t request password recovery, contact us immediately.',
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
              
              <!-- Temporary Password Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0f3460; border: 2px solid #e94560; border-radius: 12px; margin-bottom: 24px;">
                <tr>
                  <td align="center" style="padding: 24px;">
                    <p style="color: #94a3b8; font-size: 14px; margin: 0 0 8px;">${t.passwordLabel}</p>
                    <p style="color: #22c55e; font-size: 32px; font-weight: bold; font-family: monospace; letter-spacing: 4px; margin: 0; user-select: all;">${tempPassword}</p>
                  </td>
                </tr>
              </table>

              <p style="color: #fbbf24; font-size: 14px; text-align: center; margin: 0 0 24px;">${t.instructions}</p>
              
              <!-- Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding: 16px 0 24px;">
                    <a href="${loginUrl}" target="_blank" style="display: inline-block; background-color: #e94560; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 16px 32px; border-radius: 8px;">${t.button}</a>
                  </td>
                </tr>
              </table>
              
              <!-- Expiry Notice -->
              <p style="color: #fbbf24; font-size: 14px; text-align: center; margin: 0 0 24px;">${t.expiry}</p>
              
              <!-- Steps -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: rgba(34, 197, 94, 0.1); border-radius: 8px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 16px;">
                    <p style="color: #22c55e; font-size: 14px; font-weight: 600; margin: 0 0 12px;">${t.tips}</p>
                    ${t.tipsList.map(tip => `<p style="color: #e2e8f0; font-size: 14px; line-height: 20px; margin: 8px 0;">${tip}</p>`).join('')}
                  </td>
                </tr>
              </table>
              
              <p style="color: #ef4444; font-size: 14px; text-align: center; margin: 0;">${t.ignore}</p>
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
    const { userEmail, language = 'pt' }: PasswordResetRequest = await req.json();
    console.log(`Processing password reset for: ${userEmail}, language: ${language}`);

    // 1. Find user by email
    const { data: usersData, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('Error listing users:', listError);
      throw new Error(`Failed to list users: ${listError.message}`);
    }

    const targetUser = usersData?.users?.find(u => u.email === userEmail);
    
    if (!targetUser) {
      console.log(`User with email ${userEmail} not found - sending success anyway for security`);
      // Return success anyway to prevent email enumeration attacks
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // 2. Generate temporary password
    const tempPassword = generateTempPassword();
    console.log(`Generated temporary password for user ${targetUser.id}`);

    // 3. Update user's password using admin API AND set requires_password_change flag
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      targetUser.id,
      { 
        password: tempPassword,
        user_metadata: {
          ...targetUser.user_metadata,
          requires_password_change: true
        }
      }
    );

    if (updateError) {
      console.error('Error updating user password:', updateError);
      throw new Error(`Failed to update password: ${updateError.message}`);
    }

    console.log(`Password updated successfully for user ${targetUser.id}`);

    // 4. Send email with temporary password
    const lang = language === 'en' ? 'en' : 'pt';
    
    // IMPORTANT: Always use production domain for email links
    // This prevents issues when emails are triggered from preview/staging environments
    const baseUrl = "https://couplesfinancials.com";
    const loginUrl = `${baseUrl}/auth`;
    const emailHtml = generatePasswordResetHtml(userEmail, tempPassword, loginUrl, lang);

    console.log(`Sending temporary password email to ${userEmail}`);
    
    const emailResponse = await resend.emails.send({
      from: "Couples Financials <noreply@couplesfinancials.com>",
      to: [userEmail],
      subject: lang === 'en' 
        ? "🔐 Your Temporary Password - Couples Financials"
        : "🔐 Sua Senha Temporária - Couples Financials",
      html: emailHtml,
    });

    console.log("Temporary password email sent successfully:", JSON.stringify(emailResponse));

    return new Response(JSON.stringify({ success: true, emailId: emailResponse.data?.id }), {
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
