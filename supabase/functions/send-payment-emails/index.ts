import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';
import { renderAsync } from 'https://esm.sh/@react-email/components@0.0.22';
import { Resend } from "https://esm.sh/resend@2.0.0";
import React from 'https://esm.sh/react@18.3.1';

// Import new payment templates
import { PaymentFailedPT } from './_templates/payment-failed-pt.tsx';
import { PaymentFailedEN } from './_templates/payment-failed-en.tsx';
import { PaymentFailedES } from './_templates/payment-failed-es.tsx';

import { PaymentGracePeriodPT } from './_templates/payment-grace-period-pt.tsx';
import { PaymentGracePeriodEN } from './_templates/payment-grace-period-en.tsx';
import { PaymentGracePeriodES } from './_templates/payment-grace-period-es.tsx';

import { PaymentReminderPT } from './_templates/payment-reminder-pt.tsx';
import { PaymentReminderEN } from './_templates/payment-reminder-en.tsx';
import { PaymentReminderES } from './_templates/payment-reminder-es.tsx';

const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string);
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PaymentEmailRequest {
  email: string;
  userName: string;
  emailType: 'reminder_3_days' | 'reminder_1_day' | 'payment_failed' | 'grace_period' | 'downgrade_notice';
  language: 'pt' | 'en' | 'es';
  subscriptionEndDate?: string;
  customerPortalUrl?: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log('[PAYMENT-EMAILS] Function started');

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, userName, emailType, language, subscriptionEndDate, customerPortalUrl }: PaymentEmailRequest = await req.json();

    console.log('[PAYMENT-EMAILS] Processing request:', { email, emailType, language });

    let template: any;
    let subject: string;
    let from: string;

    const templateProps = {
      userName: userName || 'Usuário',
      subscriptionEndDate: subscriptionEndDate || '',
      customerPortalUrl: customerPortalUrl || 'https://couplesfinancials.com/subscription',
    };

    // Select template based on email type and language
    switch (emailType) {
      case 'reminder_3_days':
        switch (language) {
          case 'en':
            template = React.createElement(PaymentReminderEN, { ...templateProps, daysRemaining: 3 });
            subject = '⏰ Your premium subscription renews in 3 days';
            from = 'Couples Financials <billing@couplesfinancials.com>';
            break;
          case 'es':
            template = React.createElement(PaymentReminderES, { ...templateProps, daysRemaining: 3 });
            subject = '⏰ Tu suscripción premium se renueva en 3 días';
            from = 'Couples Financials <billing@couplesfinancials.com>';
            break;
          default:
            template = React.createElement(PaymentReminderPT, { ...templateProps, daysRemaining: 3 });
            subject = '⏰ Sua assinatura premium renova em 3 dias';
            from = 'Couples Financials <billing@couplesfinancials.com>';
        }
        break;

      case 'reminder_1_day':
        switch (language) {
          case 'en':
            template = React.createElement(PaymentReminderEN, { ...templateProps, daysRemaining: 1 });
            subject = '⏰ Your premium subscription renews tomorrow';
            from = 'Couples Financials <billing@couplesfinancials.com>';
            break;
          case 'es':
            template = React.createElement(PaymentReminderES, { ...templateProps, daysRemaining: 1 });
            subject = '⏰ Tu suscripción premium se renueva mañana';
            from = 'Couples Financials <billing@couplesfinancials.com>';
            break;
          default:
            template = React.createElement(PaymentReminderPT, { ...templateProps, daysRemaining: 1 });
            subject = '⏰ Sua assinatura premium renova amanhã';
            from = 'Couples Financials <billing@couplesfinancials.com>';
        }
        break;

      case 'payment_failed':
        switch (language) {
          case 'en':
            template = React.createElement(PaymentFailedEN, templateProps);
            subject = '🚨 Payment Failed - Action Required';
            from = 'Couples Financials - Billing <billing@couplesfinancials.com>';
            break;
          case 'es':
            template = React.createElement(PaymentFailedES, templateProps);
            subject = '🚨 Pago Fallido - Acción Requerida';
            from = 'Couples Financials - Facturación <billing@couplesfinancials.com>';
            break;
          default:
            template = React.createElement(PaymentFailedPT, templateProps);
            subject = '🚨 Falha no Pagamento - Ação Necessária';
            from = 'Couples Financials - Cobrança <billing@couplesfinancials.com>';
        }
        break;

      case 'grace_period':
        switch (language) {
          case 'en':
            template = React.createElement(PaymentGracePeriodEN, templateProps);
            subject = '⚠️ 24-Hour Grace Period - Update Payment Method';
            from = 'Couples Financials - Support <support@couplesfinancials.com>';
            break;
          case 'es':
            template = React.createElement(PaymentGracePeriodES, templateProps);
            subject = '⚠️ Período de Gracia de 24 Horas - Actualizar Método de Pago';
            from = 'Couples Financials - Soporte <support@couplesfinancials.com>';
            break;
          default:
            template = React.createElement(PaymentGracePeriodPT, templateProps);
            subject = '⚠️ Período de Graça de 24h - Atualize o Método de Pagamento';
            from = 'Couples Financials - Suporte <support@couplesfinancials.com>';
        }
        break;

      default:
        throw new Error(`Unknown email type: ${emailType}`);
    }

    // Render email template
    const html = await renderAsync(template);

    console.log('[PAYMENT-EMAILS] Template rendered, sending email...');

    // Send email
    const { error: resendError } = await resend.emails.send({
      from,
      to: [email],
      subject,
      html,
    });

    if (resendError) {
      console.error('[PAYMENT-EMAILS] Resend error:', resendError);
      throw resendError;
    }

    console.log('[PAYMENT-EMAILS] Email sent successfully to:', email);

    return new Response(
      JSON.stringify({ success: true, message: 'Email sent successfully' }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('[PAYMENT-EMAILS] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);