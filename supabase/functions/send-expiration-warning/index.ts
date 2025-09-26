import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';
import { renderAsync } from 'https://esm.sh/@react-email/components@0.0.22';
import { Resend } from 'https://esm.sh/resend@2.0.0';
import React from 'https://esm.sh/react@18.3.1';

// Import templates
import { PremiumExpirationWarningPT } from './_templates/premium-expiration-warning-pt.tsx';
import { PremiumExpirationWarningEN } from './_templates/premium-expiration-warning-en.tsx';
import { PremiumExpirationWarningES } from './_templates/premium-expiration-warning-es.tsx';

import { PremiumFinalWarningPT } from './_templates/premium-final-warning-pt.tsx';
import { PremiumFinalWarningEN } from './_templates/premium-final-warning-en.tsx';
import { PremiumFinalWarningES } from './_templates/premium-final-warning-es.tsx';

import { PremiumGracePeriodPT } from './_templates/premium-grace-period-pt.tsx';
import { PremiumGracePeriodEN } from './_templates/premium-grace-period-en.tsx';
import { PremiumGracePeriodES } from './_templates/premium-grace-period-es.tsx';

const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string);
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExpirationEmailRequest {
  email: string;
  userName: string;
  expirationDate: string;
  warningType: 'warning_3_days' | 'warning_1_day' | 'grace_period';
  language: 'pt' | 'en' | 'es';
}

const handler = async (req: Request): Promise<Response> => {
  console.log('[EXPIRATION-WARNING] Function started');

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, userName, expirationDate, warningType, language }: ExpirationEmailRequest = await req.json();

    console.log('[EXPIRATION-WARNING] Processing request:', { email, userName, expirationDate, warningType, language });

    // Determine template and subject based on warning type and language
    let template: any;
    let subject: string;
    let from: string;

    const templateProps = {
      userName: userName || 'Usuário',
      expirationDate,
      daysRemaining: warningType === 'warning_3_days' ? 3 : warningType === 'warning_1_day' ? 1 : 0,
    };

    // Select template based on warning type and language
    if (warningType === 'warning_3_days') {
      switch (language) {
        case 'en':
          template = React.createElement(PremiumExpirationWarningEN, templateProps);
          subject = '⏰ Your premium access expires in 3 days';
          from = 'Couples Financials <premium@couplesfinancials.com>';
          break;
        case 'es':
          template = React.createElement(PremiumExpirationWarningES, templateProps);
          subject = '⏰ Tu acceso premium expira en 3 días';
          from = 'Couples Financials <premium@couplesfinancials.com>';
          break;
        default:
          template = React.createElement(PremiumExpirationWarningPT, templateProps);
          subject = '⏰ Seu acesso premium expira em 3 dias';
          from = 'Couples Financials <premium@couplesfinancials.com>';
      }
    } else if (warningType === 'warning_1_day') {
      switch (language) {
        case 'en':
          template = React.createElement(PremiumFinalWarningEN, templateProps);
          subject = '🚨 FINAL WARNING: Premium expires tomorrow!';
          from = 'Couples Financials - URGENT <premium@couplesfinancials.com>';
          break;
        case 'es':
          template = React.createElement(PremiumFinalWarningES, templateProps);
          subject = '🚨 AVISO FINAL: ¡Premium expira mañana!';
          from = 'Couples Financials - URGENTE <premium@couplesfinancials.com>';
          break;
        default:
          template = React.createElement(PremiumFinalWarningPT, templateProps);
          subject = '🚨 AVISO FINAL: Premium expira amanhã!';
          from = 'Couples Financials - URGENTE <premium@couplesfinancials.com>';
      }
    } else { // grace_period
      switch (language) {
        case 'en':
          template = React.createElement(PremiumGracePeriodEN, templateProps);
          subject = '🛡️ Your data is safe - 90-day grace period';
          from = 'Couples Financials <support@couplesfinancials.com>';
          break;
        case 'es':
          template = React.createElement(PremiumGracePeriodES, templateProps);
          subject = '🛡️ Tus datos están seguros - Período de gracia de 90 días';
          from = 'Couples Financials <support@couplesfinancials.com>';
          break;
        default:
          template = React.createElement(PremiumGracePeriodPT, templateProps);
          subject = '🛡️ Seus dados estão seguros - Período de graça de 90 dias';
          from = 'Couples Financials <support@couplesfinancials.com>';
      }
    }

    // Render email template
    const html = await renderAsync(template);

    console.log('[EXPIRATION-WARNING] Template rendered, sending email...');

    // Send email
    const { error: resendError } = await resend.emails.send({
      from,
      to: [email],
      subject,
      html,
    });

    if (resendError) {
      console.error('[EXPIRATION-WARNING] Resend error:', resendError);
      throw resendError;
    }

    console.log('[EXPIRATION-WARNING] Email sent successfully to:', email);

    return new Response(
      JSON.stringify({ success: true, message: 'Email sent successfully' }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('[EXPIRATION-WARNING] Error:', error);
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