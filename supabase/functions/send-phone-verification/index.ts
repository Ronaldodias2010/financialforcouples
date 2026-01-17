import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phoneNumber, language = 'pt' } = await req.json();

    if (!phoneNumber) {
      return new Response(
        JSON.stringify({ error: 'Phone number is required' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }

    // Clean phone number (remove spaces, dashes, etc.)
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    const formattedPhone = cleanPhone.startsWith('+') ? cleanPhone : `+${cleanPhone}`;

    console.log('[SMS 2FA] Sending verification to:', formattedPhone);

    // Get Twilio credentials
    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const verifyServiceSid = Deno.env.get('TWILIO_VERIFY_SERVICE_SID');

    // Check if using Twilio Verify API (recommended for 2FA)
    if (accountSid && authToken && verifyServiceSid) {
      console.log('[SMS 2FA] Using Twilio Verify API with Service SID:', verifyServiceSid);
      
      // Use Twilio Verify API - the recommended way for 2FA
      const verifyUrl = `https://verify.twilio.com/v2/Services/${verifyServiceSid}/Verifications`;
      
      const body = new URLSearchParams({
        To: formattedPhone,
        Channel: 'sms',
        Locale: language === 'pt' ? 'pt' : language === 'es' ? 'es' : 'en'
      });

      const response = await fetch(verifyUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(`${accountSid}:${authToken}`)}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString()
      });

      const responseData = await response.json();

      if (!response.ok) {
        console.error('[SMS 2FA] Twilio Verify error:', responseData);
        
        // Check for specific Twilio error codes
        if (responseData.code === 60410) {
          // Phone number is blocked by Twilio (treat as a handled business-case, not a hard error)
          return new Response(
            JSON.stringify({
              success: false,
              error: 'phone_blocked',
              message: language === 'en'
                ? 'This phone number has been temporarily blocked. Please use email verification instead.'
                : language === 'es'
                ? 'Este número de teléfono ha sido bloqueado temporalmente. Por favor, use la verificación por correo electrónico.'
                : 'Este número de telefone foi temporariamente bloqueado. Por favor, use a verificação por e-mail.',
              code: responseData.code,
            }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 200,
            }
          );
        }
        
        throw new Error(responseData.message || 'Failed to send verification SMS');
      }

      console.log('[SMS 2FA] Verification sent successfully, status:', responseData.status);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Verification code sent successfully',
          status: responseData.status,
          useVerifyApi: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fallback: Use basic Messages API with custom code storage
    const fromNumber = Deno.env.get('TWILIO_PHONE_NUMBER');
    
    if (!accountSid || !authToken || !fromNumber) {
      // Development mode - generate code but don't send
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      console.log('[SMS 2FA] DEV MODE - Code:', verificationCode, 'for:', formattedPhone);
      
      // Store in database for dev testing
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 5);

      await supabase.from('phone_verifications').upsert({
        phone_number: cleanPhone,
        verification_code: verificationCode,
        expires_at: expiresAt.toISOString(),
        verified: false
      });

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Verification code sent (dev mode)',
          code: verificationCode, // Only for development!
          useVerifyApi: false
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use Messages API as fallback
    console.log('[SMS 2FA] Using Twilio Messages API (fallback)');
    
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Store verification code
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 5);

    const { error: storageError } = await supabase
      .from('phone_verifications')
      .upsert({
        phone_number: cleanPhone,
        verification_code: verificationCode,
        expires_at: expiresAt.toISOString(),
        verified: false
      });

    if (storageError) {
      console.error('[SMS 2FA] Error storing code:', storageError);
      throw new Error('Failed to store verification code');
    }

    const message = language === 'en' 
      ? `Your verification code is: ${verificationCode}. Valid for 5 minutes.`
      : language === 'es'
      ? `Tu código de verificación es: ${verificationCode}. Válido por 5 minutos.`
      : `Seu código de verificação é: ${verificationCode}. Válido por 5 minutos.`;

    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const msgBody = new URLSearchParams({
      To: formattedPhone,
      From: fromNumber,
      Body: message
    });

    const response = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${accountSid}:${authToken}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: msgBody.toString()
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('[SMS 2FA] Twilio Messages error:', errorData);
      throw new Error('Failed to send SMS');
    }

    console.log('[SMS 2FA] SMS sent successfully via Messages API');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Verification code sent successfully',
        useVerifyApi: false
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[SMS 2FA] Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Failed to send verification code' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});