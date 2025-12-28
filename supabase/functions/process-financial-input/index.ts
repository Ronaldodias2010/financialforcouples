import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ success: false, error: 'Apenas POST é suportado' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const body = await req.json();
    const { input_id, force_confirm = false } = body;

    console.log('[process-financial-input] Processing input:', input_id);

    if (!input_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'input_id é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar input atual
    const { data: input, error: fetchError } = await supabase
      .from('incoming_financial_inputs')
      .select('*')
      .eq('id', input_id)
      .single();

    if (fetchError || !input) {
      console.error('[process-financial-input] Input not found:', input_id);
      return new Response(
        JSON.stringify({ success: false, error: 'Input não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar se já foi processado
    if (input.processed_at) {
      console.log('[process-financial-input] Already processed:', input_id);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Input já foi processado',
          transaction_id: input.transaction_id
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Se force_confirm e status não é confirmed, confirmar primeiro
    if (force_confirm && input.status !== 'confirmed') {
      console.log('[process-financial-input] Force confirming input:', input_id);
      
      // Validar dados mínimos
      if (!input.amount || input.amount <= 0) {
        return new Response(
          JSON.stringify({ success: false, error: 'Valor inválido. Não é possível confirmar.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (!input.transaction_type || !['expense', 'income'].includes(input.transaction_type)) {
        return new Response(
          JSON.stringify({ success: false, error: 'Tipo de transação inválido. Use expense ou income.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { error: confirmError } = await supabase
        .from('incoming_financial_inputs')
        .update({ status: 'confirmed' })
        .eq('id', input_id);

      if (confirmError) {
        console.error('[process-financial-input] Confirm error:', confirmError);
        throw confirmError;
      }
    } else if (input.status !== 'confirmed') {
      console.log('[process-financial-input] Not confirmed:', input.status);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Input não está confirmado. Status atual: ${input.status}`,
          current_status: input.status,
          hint: 'Use force_confirm: true para forçar confirmação, ou confirme via PATCH no whatsapp-input'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // PASSO 1: Resolver hints → IDs
    console.log('[process-financial-input] Resolving hints...');
    const { data: resolveResult, error: resolveError } = await supabase
      .rpc('resolve_financial_hints', { p_input_id: input_id });

    if (resolveError) {
      console.error('[process-financial-input] Resolve error:', resolveError);
      throw resolveError;
    }

    console.log('[process-financial-input] Resolve result:', resolveResult);

    // PASSO 1.5: Validação específica para WhatsApp - categoria é obrigatória
    // Re-buscar input com IDs resolvidos
    const { data: resolvedInput, error: refetchError } = await supabase
      .from('incoming_financial_inputs')
      .select('resolved_category_id, category_hint, source')
      .eq('id', input_id)
      .single();

    if (refetchError) {
      console.error('[process-financial-input] Refetch error:', refetchError);
      throw refetchError;
    }

    // Para inputs do WhatsApp, categoria é obrigatória
    if (resolvedInput.source === 'whatsapp' && !resolvedInput.resolved_category_id) {
      console.log('[process-financial-input] WhatsApp input missing category');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Categoria é obrigatória para transações via WhatsApp',
          error_code: 'CATEGORY_REQUIRED',
          hint: resolvedInput.category_hint 
            ? `Categoria "${resolvedInput.category_hint}" não foi encontrada. Crie a categoria ou use um nome existente.`
            : 'Informe a categoria na mensagem (ex: "gastei 50 em alimentação")',
          resolved_hints: resolveResult
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // PASSO 2: Criar transação via função CAIXA-FORTE
    console.log('[process-financial-input] Creating transaction...');
    const { data: createResult, error: createError } = await supabase
      .rpc('create_transaction_from_input', { p_input_id: input_id });

    if (createError) {
      console.error('[process-financial-input] Create error:', createError);
      throw createError;
    }

    console.log('[process-financial-input] Create result:', createResult);

    if (!createResult.success) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: createResult.error,
          resolved_hints: resolveResult
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Sucesso!
    return new Response(
      JSON.stringify({ 
        success: true, 
        transaction_id: createResult.transaction_id,
        message: createResult.message,
        resolved_hints: resolveResult
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[process-financial-input] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
