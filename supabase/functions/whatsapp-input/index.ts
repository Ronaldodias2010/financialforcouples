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

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const url = new URL(req.url);
    
    // POST: Criar novo input do WhatsApp
    if (req.method === 'POST') {
      const body = await req.json();
      const { 
        phone_number, 
        raw_message, 
        whatsapp_message_id,
        source = 'whatsapp'
      } = body;

      console.log('[whatsapp-input] POST - Creating new input:', { phone_number, raw_message: raw_message?.substring(0, 50) });

      // Validações
      if (!phone_number) {
        return new Response(
          JSON.stringify({ success: false, error: 'phone_number é obrigatório' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!raw_message) {
        return new Response(
          JSON.stringify({ success: false, error: 'raw_message é obrigatório' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Buscar user_id pelo phone_number
      const { data: mapping, error: mappingError } = await supabase
        .from('whatsapp_user_mappings')
        .select('user_id, is_verified')
        .eq('phone_number', phone_number)
        .single();

      if (mappingError || !mapping) {
        console.log('[whatsapp-input] Phone not registered:', phone_number);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Número não cadastrado. Acesse o app para vincular seu WhatsApp.',
            code: 'PHONE_NOT_REGISTERED'
          }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!mapping.is_verified) {
        console.log('[whatsapp-input] Phone not verified:', phone_number);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Número não verificado. Complete a verificação no app.',
            code: 'PHONE_NOT_VERIFIED'
          }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verificar duplicação por whatsapp_message_id
      if (whatsapp_message_id) {
        const { data: existing } = await supabase
          .from('incoming_financial_inputs')
          .select('id')
          .eq('user_id', mapping.user_id)
          .eq('whatsapp_message_id', whatsapp_message_id)
          .single();

        if (existing) {
          console.log('[whatsapp-input] Duplicate message:', whatsapp_message_id);
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: 'Mensagem já processada',
              code: 'DUPLICATE_MESSAGE',
              input_id: existing.id
            }),
            { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      // Criar input
      const { data: input, error: insertError } = await supabase
        .from('incoming_financial_inputs')
        .insert({
          user_id: mapping.user_id,
          raw_message,
          whatsapp_message_id,
          source,
          status: 'pending',
          ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
          user_agent: req.headers.get('user-agent')
        })
        .select('id, status, created_at')
        .single();

      if (insertError) {
        console.error('[whatsapp-input] Insert error:', insertError);
        throw insertError;
      }

      console.log('[whatsapp-input] Input created:', input.id);

      return new Response(
        JSON.stringify({ 
          success: true, 
          input_id: input.id,
          status: input.status,
          message: 'Input criado com sucesso. Aguardando processamento da IA.'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // PATCH: Atualizar input com dados da IA
    if (req.method === 'PATCH') {
      const body = await req.json();
      const { 
        input_id,
        amount,
        transaction_type,
        category_hint,
        account_hint,
        card_hint,
        description_hint,
        transaction_date,
        confidence_score,
        auto_confirm = true
      } = body;

      console.log('[whatsapp-input] PATCH - Updating input:', { input_id, amount, confidence_score });

      if (!input_id) {
        return new Response(
          JSON.stringify({ success: false, error: 'input_id é obrigatório' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verificar se input existe e não foi processado
      const { data: existingInput, error: fetchError } = await supabase
        .from('incoming_financial_inputs')
        .select('id, status, processed_at')
        .eq('id', input_id)
        .single();

      if (fetchError || !existingInput) {
        return new Response(
          JSON.stringify({ success: false, error: 'Input não encontrado' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (existingInput.processed_at) {
        return new Response(
          JSON.stringify({ success: false, error: 'Input já foi processado' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Determinar novo status
      let newStatus = existingInput.status;
      if (auto_confirm && confidence_score && confidence_score >= 0.85 && amount && transaction_type) {
        newStatus = 'confirmed';
      }

      // Atualizar input
      const updateData: Record<string, unknown> = {};
      if (amount !== undefined) updateData.amount = amount;
      if (transaction_type !== undefined) updateData.transaction_type = transaction_type;
      if (category_hint !== undefined) updateData.category_hint = category_hint;
      if (account_hint !== undefined) updateData.account_hint = account_hint;
      if (card_hint !== undefined) updateData.card_hint = card_hint;
      if (description_hint !== undefined) updateData.description_hint = description_hint;
      if (transaction_date !== undefined) updateData.transaction_date = transaction_date;
      if (confidence_score !== undefined) updateData.confidence_score = confidence_score;
      updateData.status = newStatus;

      const { data: updated, error: updateError } = await supabase
        .from('incoming_financial_inputs')
        .update(updateData)
        .eq('id', input_id)
        .select('id, status, amount, transaction_type, confidence_score')
        .single();

      if (updateError) {
        console.error('[whatsapp-input] Update error:', updateError);
        throw updateError;
      }

      console.log('[whatsapp-input] Input updated:', updated);

      return new Response(
        JSON.stringify({ 
          success: true, 
          input: updated,
          auto_confirmed: newStatus === 'confirmed',
          message: newStatus === 'confirmed' 
            ? 'Input confirmado automaticamente. Pronto para processamento.'
            : 'Input atualizado. Aguardando confirmação manual.'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // GET: Buscar status de um input
    if (req.method === 'GET') {
      const input_id = url.searchParams.get('input_id');
      const phone_number = url.searchParams.get('phone_number');

      if (input_id) {
        const { data, error } = await supabase
          .from('incoming_financial_inputs')
          .select('*')
          .eq('id', input_id)
          .single();

        if (error || !data) {
          return new Response(
            JSON.stringify({ success: false, error: 'Input não encontrado' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ success: true, input: data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (phone_number) {
        // Buscar inputs recentes do usuário
        const { data: mapping } = await supabase
          .from('whatsapp_user_mappings')
          .select('user_id')
          .eq('phone_number', phone_number)
          .single();

        if (!mapping) {
          return new Response(
            JSON.stringify({ success: false, error: 'Número não cadastrado' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { data: inputs } = await supabase
          .from('incoming_financial_inputs')
          .select('id, status, amount, transaction_type, created_at, processed_at')
          .eq('user_id', mapping.user_id)
          .order('created_at', { ascending: false })
          .limit(10);

        return new Response(
          JSON.stringify({ success: true, inputs: inputs || [] }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: false, error: 'input_id ou phone_number é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: 'Método não suportado' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[whatsapp-input] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
