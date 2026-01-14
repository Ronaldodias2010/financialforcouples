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
    const { phoneNumber, code, useVerifyApi = true } = await req.json();

    if (!phoneNumber || !code) {
      return new Response(
        JSON.stringify({ error: 'Phone number and code are required' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }

    // Clean phone number
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    const formattedPhone = cleanPhone.startsWith('+') ? cleanPhone : `+${cleanPhone}`;

    console.log('[SMS VERIFY] Verifying code for:', formattedPhone, 'useVerifyApi:', useVerifyApi);

    // Get Twilio credentials
    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const verifyServiceSid = Deno.env.get('TWILIO_VERIFY_SERVICE_SID');

    // If using Twilio Verify API
    if (useVerifyApi && accountSid && authToken && verifyServiceSid) {
      console.log('[SMS VERIFY] Using Twilio Verify API');
      
      const verifyCheckUrl = `https://verify.twilio.com/v2/Services/${verifyServiceSid}/VerificationCheck`;
      
      const body = new URLSearchParams({
        To: formattedPhone,
        Code: code
      });

      const response = await fetch(verifyCheckUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(`${accountSid}:${authToken}`)}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString()
      });

      const responseData = await response.json();

      if (!response.ok) {
        console.error('[SMS VERIFY] Twilio Verify Check error:', responseData);
        return new Response(
          JSON.stringify({ 
            verified: false, 
            error: responseData.message || 'Invalid verification code' 
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400 
          }
        );
      }

      const isVerified = responseData.status === 'approved';
      console.log('[SMS VERIFY] Verification status:', responseData.status);

      if (isVerified) {
        return new Response(
          JSON.stringify({ 
            verified: true, 
            message: 'Phone number verified successfully' 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        return new Response(
          JSON.stringify({ 
            verified: false, 
            error: 'Invalid or expired verification code' 
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400 
          }
        );
      }
    }

    // Fallback: Verify using database (for Messages API or dev mode)
    console.log('[SMS VERIFY] Using database verification');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get verification record
    const { data: verification, error: fetchError } = await supabase
      .from('phone_verifications')
      .select('*')
      .eq('phone_number', cleanPhone)
      .eq('verification_code', code)
      .single();

    if (fetchError || !verification) {
      console.error('[SMS VERIFY] Verification not found:', fetchError);
      return new Response(
        JSON.stringify({ 
          verified: false, 
          error: 'Invalid or expired verification code' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }

    // Check if code is expired
    const now = new Date();
    const expiresAt = new Date(verification.expires_at);

    if (now > expiresAt) {
      return new Response(
        JSON.stringify({ 
          verified: false, 
          error: 'Verification code has expired' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }

    // Check if already verified
    if (verification.verified) {
      return new Response(
        JSON.stringify({ 
          verified: false, 
          error: 'Verification code already used' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }

    // Mark as verified
    const { error: updateError } = await supabase
      .from('phone_verifications')
      .update({ 
        verified: true,
        verified_at: new Date().toISOString()
      })
      .eq('phone_number', cleanPhone)
      .eq('verification_code', code);

    if (updateError) {
      console.error('[SMS VERIFY] Error updating verification status:', updateError);
      throw new Error('Failed to verify code');
    }

    console.log('[SMS VERIFY] Verification successful');

    return new Response(
      JSON.stringify({ 
        verified: true, 
        message: 'Phone number verified successfully' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[SMS VERIFY] Error:', error);
    return new Response(
      JSON.stringify({ 
        verified: false,
        error: error instanceof Error ? error.message : 'Failed to verify code' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});