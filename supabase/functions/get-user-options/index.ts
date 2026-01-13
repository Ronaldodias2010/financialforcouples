import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// ============================================================
// FUNÇÃO DE NORMALIZAÇÃO DE TELEFONE (CANÔNICA)
// Formato: somente números, com código do país, sem "+"
// Exemplo: 5511994433352
// ============================================================
function normalizePhone(rawPhone: string): string {
  if (!rawPhone) return '';
  
  // Remove TUDO que não é número
  let phone = rawPhone.replace(/\D/g, '');
  
  // Remove zeros à esquerda
  phone = phone.replace(/^0+/, '');
  
  // Se começar com 55 (Brasil) e tiver 12-13 dígitos, está correto
  // Se NÃO começar com 55 e tiver 10-11 dígitos, adicionar 55
  if (!phone.startsWith('55') && phone.length >= 10 && phone.length <= 11) {
    phone = '55' + phone;
  }
  
  return phone;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'GET') {
    return new Response(
      JSON.stringify({ success: false, error: 'Apenas GET é suportado' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const url = new URL(req.url);
    const phone_number = url.searchParams.get('phone') || url.searchParams.get('phone_number');
    const user_id = url.searchParams.get('user_id');

    // Normalizar telefone ANTES de qualquer operação
    const normalizedPhone = normalizePhone(phone_number || '');

    console.log('[get-user-options] Request:', { 
      phone_number_raw: phone_number, 
      phone_number_normalized: normalizedPhone,
      user_id 
    });

    let targetUserId = user_id;

    // Se phone_number foi passado, buscar user_id na tabela profiles
    if (phone_number && !user_id) {
      // Tentar busca exata primeiro
      let profile = null;
      let profileError = null;

      const { data: exactMatch, error: exactError } = await supabase
        .from('profiles')
        .select('user_id, whatsapp_verified_at')
        .eq('phone_number', normalizedPhone)
        .maybeSingle();

      if (exactMatch) {
        profile = exactMatch;
        console.log('[get-user-options] Found profile by exact match:', normalizedPhone);
      } else {
        // Tentar variações: sem código do país (11 dígitos)
        const phoneVariations = [
          normalizedPhone,
          normalizedPhone.startsWith('55') ? normalizedPhone.slice(2) : normalizedPhone,
          normalizedPhone.startsWith('55') ? '0' + normalizedPhone.slice(2) : normalizedPhone,
        ];
        
        console.log('[get-user-options] Trying phone variations:', phoneVariations);
        
        for (const variation of phoneVariations) {
          const { data: varMatch } = await supabase
            .from('profiles')
            .select('user_id, whatsapp_verified_at')
            .eq('phone_number', variation)
            .maybeSingle();
          
          if (varMatch) {
            profile = varMatch;
            console.log('[get-user-options] Found profile by variation:', variation);
            break;
          }
        }
        
        if (!profile) {
          profileError = exactError;
        }
      }

      if (profileError || !profile) {
        console.log('[get-user-options] Phone not registered:', normalizedPhone);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Número não cadastrado',
            code: 'PHONE_NOT_REGISTERED'
          }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!profile.whatsapp_verified_at) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'WhatsApp não verificado',
            code: 'WHATSAPP_NOT_VERIFIED'
          }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      targetUserId = profile.user_id;
    }

    if (!targetUserId) {
      return new Response(
        JSON.stringify({ success: false, error: 'phone ou user_id é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar opções via função SQL
    const { data: options, error: optionsError } = await supabase
      .rpc('get_user_financial_options', { p_user_id: targetUserId });

    if (optionsError) {
      console.error('[get-user-options] RPC error:', optionsError);
      throw optionsError;
    }

    console.log('[get-user-options] Options found:', {
      categories: options?.categories?.length || 0,
      accounts: options?.accounts?.length || 0,
      cards: options?.cards?.length || 0
    });

    // Formatar resposta amigável para o WhatsApp
    const formattedResponse = {
      success: true,
      user_id: targetUserId,
      options: options,
      formatted: {
        categories: (options?.categories || []).map((c: { name: string; type: string }) => 
          `${c.name} (${c.type === 'expense' ? 'Despesa' : 'Receita'})`
        ),
        accounts: (options?.accounts || []).map((a: { name: string; type: string }) => 
          `${a.name} (${a.type})`
        ),
        cards: (options?.cards || []).map((c: { name: string; type: string }) => 
          `${c.name} (${c.type === 'credit' ? 'Crédito' : 'Débito'})`
        )
      },
      hints: {
        example_expense: 'Gastei 50 reais no mercado no cartão Nubank',
        example_income: 'Recebi 1000 reais de salário na conta Itaú',
        supported_types: ['expense (gasto/despesa)', 'income (receita/ganho)']
      }
    };

    return new Response(
      JSON.stringify(formattedResponse),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[get-user-options] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
