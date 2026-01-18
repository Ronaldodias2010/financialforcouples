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
    const { phoneNumber, language = 'pt', userId } = await req.json();

    if (!phoneNumber) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'missing_phone',
          message: 'Phone number is required' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }

    // Clean phone number (remove spaces, dashes, etc.)
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    const formattedPhone = cleanPhone.startsWith('+') ? cleanPhone : `+${cleanPhone}`;

    // Validate E.164 format
    const e164Regex = /^\+[1-9]\d{1,14}$/;
    if (!e164Regex.test(formattedPhone)) {
      console.error('[SMS 2FA] Invalid phone format:', formattedPhone);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'invalid_phone_format',
          message: language === 'en'
            ? 'Phone number must be in E.164 format (e.g., +5511999999999)'
            : language === 'es'
            ? 'El número de teléfono debe estar en formato E.164 (ej: +5511999999999)'
            : 'Número de telefone deve estar no formato E.164 (ex: +5511999999999)'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }

    console.log('[SMS 2FA] Sending verification to:', formattedPhone);

    // Initialize Supabase client for logging errors
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Helper function to log SMS errors to database
    const logSmsError = async (errorCode: string, errorMessage: string) => {
      try {
        if (userId) {
          await supabase
            .from('user_2fa_settings')
            .update({
              last_sms_error_code: errorCode,
              last_sms_error_message: errorMessage,
              last_notification_at: new Date().toISOString(),
              last_notification_channel: 'sms_failed'
            })
            .eq('user_id', userId);
        } else {
          // Try to find by phone number
          await supabase
            .from('user_2fa_settings')
            .update({
              last_sms_error_code: errorCode,
              last_sms_error_message: errorMessage,
              last_notification_at: new Date().toISOString(),
              last_notification_channel: 'sms_failed'
            })
            .eq('phone_number', formattedPhone);
        }
        console.log('[SMS 2FA] Error logged to database:', errorCode, errorMessage);
      } catch (logError) {
        console.error('[SMS 2FA] Failed to log error to database:', logError);
      }
    };

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
        
        const errorCode = String(responseData.code || 'UNKNOWN');
        const errorMessage = responseData.message || 'Unknown Twilio error';
        
        // Log the error to database for tracking
        await logSmsError(errorCode, errorMessage);
        
        // Return structured error WITHOUT suggesting email fallback
        // The frontend should decide how to handle this based on user preference
        return new Response(
          JSON.stringify({
            success: false,
            error: 'sms_failed',
            error_code: errorCode,
            error_message: errorMessage,
            // IMPORTANT: Do NOT include fallback suggestion - respect user preference
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200, // Return 200 so frontend can handle the error gracefully
          }
        );
      }

      console.log('[SMS 2FA] Verification sent successfully, status:', responseData.status);

      // Log successful send
      if (userId) {
        await supabase
          .from('user_2fa_settings')
          .update({
            last_notification_channel: 'sms',
            last_notification_at: new Date().toISOString(),
            last_sms_error_code: null,
            last_sms_error_message: null
          })
          .eq('user_id', userId);
      }

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
      await logSmsError('STORAGE_ERROR', 'Failed to store verification code');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'sms_failed',
          error_code: 'STORAGE_ERROR',
          error_message: 'Failed to store verification code'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
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
      
      const errorCode = String(errorData.code || 'MESSAGES_ERROR');
      const errorMessage = errorData.message || 'Failed to send SMS';
      
      await logSmsError(errorCode, errorMessage);
      
      return new Response(
        JSON.stringify({
          success: false,
          error: 'sms_failed',
          error_code: errorCode,
          error_message: errorMessage
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    console.log('[SMS 2FA] SMS sent successfully via Messages API');

    // Log successful send
    if (userId) {
      await supabase
        .from('user_2fa_settings')
        .update({
          last_notification_channel: 'sms',
          last_notification_at: new Date().toISOString(),
          last_sms_error_code: null,
          last_sms_error_message: null
        })
        .eq('user_id', userId);
    }

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
        success: false,
        error: 'sms_failed',
        error_code: 'EXCEPTION',
        error_message: error instanceof Error ? error.message : 'Failed to send verification code' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 // Return 200 so frontend can handle gracefully
      }
    );
  }
});
