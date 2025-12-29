import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// ============================================================
// STATUS OFICIAIS (Contrato Semântico)
// ============================================================
// received           → input criado ou reutilizado, pronto para IA
// waiting_user_input → faltam dados obrigatórios
// confirmed          → todos os dados resolvidos, pronto para processar
// processed          → transação já criada
// duplicate          → mensagem duplicada sem ação necessária
// error              → erro inesperado
// ============================================================

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const url = new URL(req.url);
    
    // =========================================================
    // POST: Criar novo input do WhatsApp (IDEMPOTENTE)
    // =========================================================
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
          JSON.stringify({ success: false, status: 'error', error: 'phone_number é obrigatório' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!raw_message) {
        return new Response(
          JSON.stringify({ success: false, status: 'error', error: 'raw_message é obrigatório' }),
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
            status: 'error',
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
            status: 'error',
            error: 'WhatsApp não verificado. Complete a verificação no app.',
            code: 'WHATSAPP_NOT_VERIFIED'
          }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // =====================================================
      // IDEMPOTÊNCIA: Se whatsapp_message_id já existe
      // =====================================================
      if (whatsapp_message_id) {
        const { data: existing } = await supabase
          .from('incoming_financial_inputs')
          .select('id, status, created_at, processed_at, transaction_id')
          .eq('user_id', profile.user_id)
          .eq('whatsapp_message_id', whatsapp_message_id)
          .single();

        if (existing) {
          // Se já tem transaction_id → status "processed"
          if (existing.transaction_id) {
            console.log('[whatsapp-input] IDEMPOTENT: Already processed:', existing.id);
            return new Response(
              JSON.stringify({ 
                success: true, 
                status: 'processed',
                input_id: existing.id,
                transaction_id: existing.transaction_id
              }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
          
          // Se não tem transaction_id → status "received" (pronto para IA)
          console.log('[whatsapp-input] IDEMPOTENT: Returning existing input:', existing.id);
          return new Response(
            JSON.stringify({ 
              success: true, 
              status: 'received',
              input_id: existing.id,
              user_id: profile.user_id,
              user_name: profile.display_name
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      // Criar novo input com status "received"
      const inputData = {
        user_id: profile.user_id,
        raw_message,
        whatsapp_message_id,
        source,
        status: 'received',
        ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
        user_agent: req.headers.get('user-agent')
      };

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
            // Se já processado → "processed"
            if (existing.transaction_id) {
              return new Response(
                JSON.stringify({ 
                  success: true, 
                  status: 'processed',
                  input_id: existing.id,
                  transaction_id: existing.transaction_id
                }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
              );
            }
            // Se não processado → "received"
            return new Response(
              JSON.stringify({ 
                success: true, 
                status: 'received',
                input_id: existing.id,
                user_id: profile.user_id,
                user_name: profile.display_name
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
          status: 'received',
          input_id: input.id,
          user_id: profile.user_id,
          user_name: profile.display_name
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // =========================================================
    // PATCH: Atualizar input com dados da IA
    // =========================================================
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
        owner_user
      } = body;

      console.log('[whatsapp-input] PATCH - Updating input:', { input_id, amount, confidence_score, payment_method, category_hint });

      if (!input_id) {
        return new Response(
          JSON.stringify({ success: false, status: 'error', error: 'input_id é obrigatório' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verificar se input existe
      const { data: existingInput, error: fetchError } = await supabase
        .from('incoming_financial_inputs')
        .select('id, status, processed_at, transaction_id, user_id, source')
        .eq('id', input_id)
        .single();

      if (fetchError || !existingInput) {
        return new Response(
          JSON.stringify({ success: false, status: 'error', error: 'Input não encontrado' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // IDEMPOTÊNCIA: Se já processado, retornar "processed"
      if (existingInput.transaction_id) {
        console.log('[whatsapp-input] IDEMPOTENT: Input already processed:', input_id);
        return new Response(
          JSON.stringify({ 
            success: true, 
            status: 'processed',
            input_id: existingInput.id,
            transaction_id: existingInput.transaction_id
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // =====================================================
      // RESOLUÇÃO ANTECIPADA DE HINTS
      // =====================================================
      let resolved_category_id: string | null = null;
      let resolved_account_id: string | null = null;
      let resolved_card_id: string | null = null;

      // Tentar resolver category_hint → category_id
      if (category_hint) {
        const { data: category } = await supabase
          .from('categories')
          .select('id, name')
          .eq('user_id', existingInput.user_id)
          .is('deleted_at', null)
          .ilike('name', `%${category_hint.trim()}%`)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (category) {
          resolved_category_id = category.id;
          console.log('[whatsapp-input] Category resolved:', category_hint, '->', category.name);
        } else {
          console.log('[whatsapp-input] Category not found for hint:', category_hint);
        }
      }

      // Tentar resolver account_hint → account_id
      if (account_hint) {
        const { data: account } = await supabase
          .from('accounts')
          .select('id, name')
          .eq('user_id', existingInput.user_id)
          .is('deleted_at', null)
          .eq('is_active', true)
          .ilike('name', `%${account_hint.trim()}%`)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (account) {
          resolved_account_id = account.id;
          console.log('[whatsapp-input] Account resolved:', account_hint, '->', account.name);
        } else {
          console.log('[whatsapp-input] Account not found for hint:', account_hint);
        }
      }

      // Tentar resolver card_hint → card_id
      if (card_hint) {
        const { data: card } = await supabase
          .from('cards')
          .select('id, name')
          .eq('user_id', existingInput.user_id)
          .is('deleted_at', null)
          .ilike('name', `%${card_hint.trim()}%`)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (card) {
          resolved_card_id = card.id;
          console.log('[whatsapp-input] Card resolved:', card_hint, '->', card.name);
        } else {
          console.log('[whatsapp-input] Card not found for hint:', card_hint);
        }
      }

      // =====================================================
      // DETERMINAR STATUS BASEADO EM RESOLUÇÃO
      // =====================================================
      const isWhatsApp = existingInput.source === 'whatsapp';
      
      // Verificar campos obrigatórios
      const needsCard = payment_method === 'credit_card';
      const needsAccount = payment_method === 'debit_card' || payment_method === 'pix' || payment_method === 'cash';

      // Construir lista de campos faltantes e perguntas
      const questions: { field: string; question: string; hint?: string }[] = [];

      // Campos básicos obrigatórios
      if (!amount) {
        questions.push({ field: 'amount', question: 'Qual o valor?' });
      }
      if (!transaction_type) {
        questions.push({ field: 'transaction_type', question: 'É uma despesa ou receita?' });
      }
      if (!payment_method) {
        questions.push({ field: 'payment_method', question: 'Qual a forma de pagamento? (PIX, cartão de crédito, débito, dinheiro)' });
      }

      // =====================================================
      // REGRA WHATSAPP: Categoria é OBRIGATÓRIA
      // Sem resolved_category_id = SEMPRE waiting_user_input
      // =====================================================
      if (isWhatsApp) {
        if (!category_hint) {
          questions.push({ field: 'category', question: 'Qual a categoria desse gasto?' });
        } else if (!resolved_category_id) {
          // Categoria não resolvida = perguntar
          const suggestedText = confidence_score && confidence_score >= 0.85 
            ? `Classifiquei como "${category_hint}". Está correto? (ou informe outra categoria)`
            : `Não encontrei a categoria "${category_hint}". Qual categoria deseja usar?`;
          questions.push({ field: 'category', question: suggestedText, hint: category_hint });
        }
      }

      // Cartão - se necessário
      if (needsCard) {
        if (!card_hint) {
          questions.push({ field: 'card', question: 'Qual cartão de crédito foi usado?' });
        } else if (!resolved_card_id) {
          const suggestedText = confidence_score && confidence_score >= 0.85 
            ? `Registrei no cartão "${card_hint}". Está correto?`
            : `Não encontrei o cartão "${card_hint}". Qual cartão deseja usar?`;
          questions.push({ field: 'card', question: suggestedText, hint: card_hint });
        }
      }

      // Conta - se necessária
      if (needsAccount) {
        if (!account_hint) {
          questions.push({ field: 'account', question: 'Qual conta foi usada?' });
        } else if (!resolved_account_id) {
          const suggestedText = confidence_score && confidence_score >= 0.85 
            ? `Registrei na conta "${account_hint}". Está correto?`
            : `Não encontrei a conta "${account_hint}". Qual conta deseja usar?`;
          questions.push({ field: 'account', question: suggestedText, hint: account_hint });
        }
      }

      // =====================================================
      // DETERMINAR STATUS FINAL
      // =====================================================
      let newStatus: string;
      
      if (questions.length > 0) {
        // Faltam dados obrigatórios
        newStatus = 'waiting_user_input';
      } else {
        // Todos os dados completos e resolvidos
        newStatus = 'confirmed';
      }

      console.log('[whatsapp-input] Status decision:', { 
        newStatus, 
        questionsCount: questions.length,
        resolved_category_id,
        resolved_account_id,
        resolved_card_id
      });

      // =====================================================
      // ATUALIZAR INPUT COM DADOS E IDs RESOLVIDOS
      // =====================================================
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
      
      // Salvar IDs resolvidos
      if (resolved_category_id) updateData.resolved_category_id = resolved_category_id;
      if (resolved_account_id) updateData.resolved_account_id = resolved_account_id;
      if (resolved_card_id) updateData.resolved_card_id = resolved_card_id;

      const { error: updateError } = await supabase
        .from('incoming_financial_inputs')
        .update(updateData)
        .eq('id', input_id);

      if (updateError) {
        console.error('[whatsapp-input] Update error:', updateError);
        throw updateError;
      }

      console.log('[whatsapp-input] Input updated with status:', newStatus);

      // =====================================================
      // RESPOSTA SIMPLIFICADA (Contrato Semântico)
      // =====================================================
      if (newStatus === 'waiting_user_input') {
        return new Response(
          JSON.stringify({ 
            success: true, 
            status: 'waiting_user_input',
            input_id: input_id,
            questions: questions,
            next_question: questions[0]?.field
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Status: confirmed
      return new Response(
        JSON.stringify({ 
          success: true, 
          status: 'confirmed',
          input_id: input_id
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // =========================================================
    // GET: Buscar status de um input
    // =========================================================
    if (req.method === 'GET') {
      const input_id = url.searchParams.get('input_id');
      const phone_number = url.searchParams.get('phone_number');

      if (input_id) {
        const { data, error } = await supabase
          .from('incoming_financial_inputs')
          .select('id, status, transaction_id')
          .eq('id', input_id)
          .single();

        if (error || !data) {
          return new Response(
            JSON.stringify({ success: false, status: 'error', error: 'Input não encontrado' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            status: data.status,
            input_id: data.id,
            transaction_id: data.transaction_id
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (phone_number) {
        const normalizedPhone = phone_number.replace(/[\s\-\(\)]/g, '');
        
        const { data: profile } = await supabase
          .from('profiles')
          .select('user_id')
          .eq('phone_number', normalizedPhone)
          .single();

        if (!profile) {
          return new Response(
            JSON.stringify({ success: false, status: 'error', error: 'Número não cadastrado' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { data: inputs } = await supabase
          .from('incoming_financial_inputs')
          .select('id, status, transaction_id, created_at')
          .eq('user_id', profile.user_id)
          .order('created_at', { ascending: false })
          .limit(10);

        return new Response(
          JSON.stringify({ success: true, inputs: inputs || [] }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: false, status: 'error', error: 'input_id ou phone_number é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, status: 'error', error: 'Método não suportado' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[whatsapp-input] Error:', error);
    return new Response(
      JSON.stringify({ success: false, status: 'error', error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
