import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GenerateBackupCodesRequest {
  userId: string;
}

function generateBackupCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    if (i === 4) code += '-';
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId }: GenerateBackupCodesRequest = await req.json();

    console.log('[GENERATE-BACKUP-CODES] Processing request for user:', userId);

    // Generate 10 unique backup codes
    const codes: string[] = [];
    const hashedCodes: string[] = [];
    
    for (let i = 0; i < 10; i++) {
      const code = generateBackupCode();
      codes.push(code);
      // In production, use proper hashing like bcrypt or argon2
      // For now, storing the codes directly (simplified for demo)
      hashedCodes.push(code.replace(/-/g, ''));
    }

    // Update user's 2FA settings with new backup codes
    const { error: dbError } = await supabase
      .from('user_2fa_settings')
      .upsert({
        user_id: userId,
        backup_codes: hashedCodes,
        backup_codes_used: 0,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    if (dbError) {
      console.error('[GENERATE-BACKUP-CODES] Database error:', dbError);
      throw new Error('Failed to store backup codes');
    }

    console.log('[GENERATE-BACKUP-CODES] Generated', codes.length, 'backup codes for user');

    return new Response(JSON.stringify({ 
      success: true,
      codes: codes, // Return plain text codes only once
      message: 'Backup codes generated successfully'
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("[GENERATE-BACKUP-CODES] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
