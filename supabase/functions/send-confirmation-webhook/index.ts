import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from 'https://esm.sh/resend@2.0.0';
import { renderAsync } from 'https://esm.sh/@react-email/components@0.0.22';
import React from 'https://esm.sh/react@18.3.1';
import { EmailConfirmationPT } from './_templates/email-confirmation-pt.tsx';
import { EmailConfirmationEN } from './_templates/email-confirmation-en.tsx';
import { EmailConfirmationES } from './_templates/email-confirmation-es.tsx';
import { MagicLinkPT } from './_templates/email-magiclink-pt.tsx';
import { MagicLinkEN } from './_templates/email-magiclink-en.tsx';
import { MagicLinkES } from './_templates/email-magiclink-es.tsx';

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

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Read body fast
    const requestText = await req.text();
    if (!requestText || requestText.trim() === '') {
      console.log('Empty request body received');
      return new Response(JSON.stringify({ error: 'Empty request body' }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const payload: WebhookPayload = JSON.parse(requestText);
    console.log('Webhook payload received (ack fast):', JSON.stringify({ user: payload.user.email }, null, 2));

    // Start background email render/send to avoid 5s timeout
    (async () => {
      try {
        const { user, email_data } = payload;
        const { token_hash, redirect_to, email_action_type } = email_data;

        // Detect language from redirect_to URL or default to Portuguese
        const detectLanguage = (redirectTo: string): 'pt' | 'en' | 'es' => {
          const url = new URL(redirectTo);
          const hostname = url.hostname;
          
          // Check for specific language domains or paths
          if (hostname.includes('couples-financials') || hostname.includes('lovableproject')) {
            // For now, use Portuguese as default for our main domains
            // Later we can detect language from URL params or user agent
            return 'pt';
          }
          
          // Default fallback
          return 'pt';
        };

        const language = detectLanguage(redirect_to);
        const userName = user.user_metadata?.display_name ||
                        user.user_metadata?.full_name || 
                        user.user_metadata?.name || 
                        user.email.split('@')[0];

        const confirmUrl = `${Deno.env.get('SUPABASE_URL')}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to}`;
        
        const action = (email_action_type || '').toLowerCase();
        const isMagicLink = action.includes('magic') || action === 'email_link';

        const EmailComponent = isMagicLink
          ? (language === 'en' ? MagicLinkEN : language === 'es' ? MagicLinkES : MagicLinkPT)
          : (language === 'en' ? EmailConfirmationEN : language === 'es' ? EmailConfirmationES : EmailConfirmationPT);

        let emailHtml: string;
        
        try {
          console.log('Rendering email template...');
          emailHtml = await renderAsync(
            React.createElement(EmailComponent, {
              userEmail: userName,
              loginUrl: confirmUrl
            })
          );
          console.log('Email template rendered successfully');
        } catch (renderError) {
          console.error('Error rendering email template:', renderError);
          // Fallback to simple HTML email if React template fails
          emailHtml = `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="utf-8">
                <style>
                  body { font-family: Arial, sans-serif; background-color: #1a1a2e; padding: 20px; }
                  .container { background-color: #16213e; max-width: 600px; margin: 0 auto; padding: 40px; border-radius: 12px; }
                  .logo { text-align: center; margin-bottom: 32px; }
                  h1 { color: #e94560; text-align: center; }
                  h2 { color: #ffffff; text-align: center; }
                  p { color: #e2e8f0; line-height: 1.6; }
                  .button { display: inline-block; background-color: #22c55e; color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 8px; margin: 20px 0; }
                  .footer { color: #94a3b8; font-size: 14px; text-align: center; margin-top: 32px; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="logo">
                    <img src="https://elxttabdtddlavhseipz.lovableproject.com/lovable-uploads/1f5e0469-b056-4cf9-9583-919702fa8736.png" alt="Couples Financials" width="80" height="80">
                  </div>
                  <h1>Couples Financials</h1>
                  <h2>${isMagicLink ? (language === 'pt' ? 'Seu email foi verificado!' : language === 'es' ? '¡Tu email ha sido verificado!' : 'Your email has been verified!') : (language === 'pt' ? 'Confirme seu email' : language === 'es' ? 'Confirma tu email' : 'Confirm your email')}</h2>
                  <p>${language === 'pt' ? `Olá ${userName}!` : language === 'es' ? `¡Hola ${userName}!` : `Hello ${userName}!`}</p>
                  <p style="text-align: center;">
                    <a href="${confirmUrl}" class="button">${isMagicLink ? (language === 'pt' ? 'Continuar' : language === 'es' ? 'Continuar' : 'Continue') : (language === 'pt' ? 'Confirmar Email' : language === 'es' ? 'Confirmar Email' : 'Confirm Email')}</a>
                  </p>
                  <p class="footer">© 2024 Couples Financials</p>
                </div>
              </body>
            </html>
          `;
          console.log('Using fallback HTML email');
        }

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

        const emailResponse = await resend.emails.send({
          from: "Couples Financials <noreply@couplesfinancials.com>",
          to: [user.email],
          subject,
          html: emailHtml,
        });

        console.log("Confirmation email sent successfully:", emailResponse);
      } catch (bgErr) {
        console.error('Error sending confirmation email in background:', bgErr);
      }
    })();

    // Immediate ACK to prevent timeout
    return new Response(JSON.stringify({ accepted: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-confirmation-webhook function:", error);
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