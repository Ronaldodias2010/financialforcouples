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
    
    // POST: Criar novo input do WhatsApp (IDEMPOTENTE com UPSERT)
    if (req.method === 'POST') {
      const body = await req.json();
      const { 
        phone_number, 
        raw_message, 
        whatsapp_message_id,
        source = 'whatsapp'
      } = body;

      console.log('[whatsapp-input] POST - Creating new input:', { 
        phone_number, 
        raw_message: raw_message?.substring(0, 50),
        whatsapp_message_id 
      });

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

      // Normalizar número de telefone (remover espaços, traços, parênteses)
      const normalizedPhone = phone_number.replace(/[\s\-\(\)]/g, '');

      // Buscar user_id pelo phone_number na tabela profiles
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, display_name, phone_number, whatsapp_verified_at')
        .eq('phone_number', normalizedPhone)
        .single();

      if (profileError || !profile) {
        console.log('[whatsapp-input] Phone not registered:', normalizedPhone);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Número não cadastrado. Acesse o app para vincular seu WhatsApp.',
            code: 'PHONE_NOT_REGISTERED'
          }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!profile.whatsapp_verified_at) {
        console.log('[whatsapp-input] WhatsApp not verified:', normalizedPhone);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'WhatsApp não verificado. Complete a verificação no app.',
            code: 'WHATSAPP_NOT_VERIFIED'
          }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // =====================================================
      // IDEMPOTÊNCIA: Usar UPSERT com onConflict
      // Se whatsapp_message_id já existe, retorna o existente
      // =====================================================
      
      const inputData = {
        user_id: profile.user_id,
        raw_message,
        whatsapp_message_id,
        source,
        status: 'pending',
        ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
        user_agent: req.headers.get('user-agent')
      };

      // Se tem whatsapp_message_id, usar UPSERT para idempotência
      if (whatsapp_message_id) {
        // Primeiro verificar se já existe
        const { data: existing } = await supabase
          .from('incoming_financial_inputs')
          .select('id, status, created_at, processed_at, transaction_id')
          .eq('user_id', profile.user_id)
          .eq('whatsapp_message_id', whatsapp_message_id)
          .single();

        if (existing) {
          console.log('[whatsapp-input] IDEMPOTENT: Returning existing input:', existing.id);
          return new Response(
            JSON.stringify({ 
              success: true, 
              input_id: existing.id,
              user_id: profile.user_id,
              user_name: profile.display_name,
              status: existing.status,
              already_exists: true,
              processed: !!existing.processed_at,
              transaction_id: existing.transaction_id,
              message: 'Input já existe. Retornando dados existentes.'
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      // Criar novo input
      const { data: input, error: insertError } = await supabase
        .from('incoming_financial_inputs')
        .insert(inputData)
        .select('id, status, created_at')
        .single();

      if (insertError) {
        // Se erro de duplicação (constraint violation), buscar existente
        if (insertError.code === '23505') {
          console.log('[whatsapp-input] Duplicate detected via constraint, fetching existing...');
          const { data: existing } = await supabase
            .from('incoming_financial_inputs')
            .select('id, status, created_at, processed_at, transaction_id')
            .eq('user_id', profile.user_id)
            .eq('whatsapp_message_id', whatsapp_message_id)
            .single();

          if (existing) {
            return new Response(
              JSON.stringify({ 
                success: true, 
                input_id: existing.id,
                user_id: profile.user_id,
                user_name: profile.display_name,
                status: existing.status,
                already_exists: true,
                processed: !!existing.processed_at,
                transaction_id: existing.transaction_id,
                message: 'Input já existe. Retornando dados existentes.'
              }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        }
        console.error('[whatsapp-input] Insert error:', insertError);
        throw insertError;
      }

      console.log('[whatsapp-input] Input created:', input.id);

      return new Response(
        JSON.stringify({ 
          success: true, 
          input_id: input.id,
          user_id: profile.user_id,
          user_name: profile.display_name,
          status: input.status,
          already_exists: false,
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
        currency,
        transaction_type,
        category_hint,
        account_hint,
        card_hint,
        description_hint,
        transaction_date,
        confidence_score,
        payment_method,
        owner_user,
        auto_confirm = true
      } = body;

      console.log('[whatsapp-input] PATCH - Updating input:', { input_id, amount, confidence_score, payment_method });

      if (!input_id) {
        return new Response(
          JSON.stringify({ success: false, error: 'input_id é obrigatório' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verificar se input existe e não foi processado
      const { data: existingInput, error: fetchError } = await supabase
        .from('incoming_financial_inputs')
        .select('id, status, processed_at, transaction_id')
        .eq('id', input_id)
        .single();

      if (fetchError || !existingInput) {
        return new Response(
          JSON.stringify({ success: false, error: 'Input não encontrado' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // IDEMPOTÊNCIA: Se já processado, retornar sucesso com dados existentes
      if (existingInput.processed_at) {
        console.log('[whatsapp-input] IDEMPOTENT: Input already processed:', input_id);
        return new Response(
          JSON.stringify({ 
            success: true, 
            input: existingInput,
            already_processed: true,
            transaction_id: existingInput.transaction_id,
            message: 'Input já foi processado anteriormente.'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Determinar novo status baseado na confiança e campos obrigatórios
      let newStatus = existingInput.status;
      const hasRequiredFields = amount && transaction_type && payment_method;
      
      if (auto_confirm && confidence_score && confidence_score >= 0.85 && hasRequiredFields) {
        newStatus = 'confirmed';
      } else if (hasRequiredFields) {
        newStatus = 'needs_confirmation';
      } else {
        // Campos faltando - aguardando input do usuário
        newStatus = 'pending';
      }

      // Atualizar input
      const updateData: Record<string, unknown> = {
        status: newStatus,
        updated_at: new Date().toISOString()
      };
      
      if (amount !== undefined) updateData.amount = amount;
      if (currency !== undefined) updateData.currency = currency;
      if (transaction_type !== undefined) updateData.transaction_type = transaction_type;
      if (category_hint !== undefined) updateData.category_hint = category_hint;
      if (account_hint !== undefined) updateData.account_hint = account_hint;
      if (card_hint !== undefined) updateData.card_hint = card_hint;
      if (description_hint !== undefined) updateData.description_hint = description_hint;
      if (transaction_date !== undefined) updateData.transaction_date = transaction_date;
      if (confidence_score !== undefined) updateData.confidence_score = confidence_score;
      if (payment_method !== undefined) updateData.payment_method = payment_method;
      if (owner_user !== undefined) updateData.owner_user = owner_user;

      const { data: updated, error: updateError } = await supabase
        .from('incoming_financial_inputs')
        .update(updateData)
        .eq('id', input_id)
        .select('id, status, amount, transaction_type, confidence_score, payment_method')
        .single();

      if (updateError) {
        console.error('[whatsapp-input] Update error:', updateError);
        throw updateError;
      }

      console.log('[whatsapp-input] Input updated:', updated);

      // Retornar campos faltantes se não estiver completo
      const missingFields: string[] = [];
      if (!amount) missingFields.push('amount');
      if (!transaction_type) missingFields.push('transaction_type');
      if (!payment_method) missingFields.push('payment_method');
      if (payment_method === 'credit_card' && !card_hint) missingFields.push('card_hint');
      if ((payment_method === 'debit_card' || payment_method === 'pix') && !account_hint) missingFields.push('account_hint');

      return new Response(
        JSON.stringify({ 
          success: true, 
          input: updated,
          auto_confirmed: newStatus === 'confirmed',
          complete: missingFields.length === 0,
          missing_fields: missingFields,
          message: newStatus === 'confirmed' 
            ? 'Input confirmado automaticamente. Pronto para processamento.'
            : missingFields.length > 0
              ? `Campos faltando: ${missingFields.join(', ')}`
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
        // Normalizar número
        const normalizedPhone = phone_number.replace(/[\s\-\(\)]/g, '');
        
        // Buscar inputs recentes do usuário via profiles
        const { data: profile } = await supabase
          .from('profiles')
          .select('user_id')
          .eq('phone_number', normalizedPhone)
          .single();

        if (!profile) {
          return new Response(
            JSON.stringify({ success: false, error: 'Número não cadastrado' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { data: inputs } = await supabase
          .from('incoming_financial_inputs')
          .select('id, status, amount, transaction_type, payment_method, created_at, processed_at, transaction_id')
          .eq('user_id', profile.user_id)
          .order('created_at', { ascending: false })
          .limit(10);

        return new Response(
          JSON.stringify({ success: true, inputs: inputs || [], user_id: profile.user_id }),
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
