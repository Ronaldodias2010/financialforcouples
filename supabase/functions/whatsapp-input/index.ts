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
// expired            → conversa abandonada por timeout (>15 min)
// cancelled          → conversa cancelada pelo usuário
// superseded         → conversa substituída por nova transação
// ============================================================

// ============================================================
// TIMEOUT E RESET DE CONVERSA
// ============================================================
const CONVERSATION_TIMEOUT_MINUTES = 15;

// Comandos que o usuário pode usar para cancelar/reiniciar conversa
const RESET_COMMANDS = ['cancelar', 'reiniciar', 'nova', 'começar de novo', 'limpar', 'cancel', 'reset', 'novo'];

/**
 * Verifica se a mensagem contém um comando de reset
 */
function isResetCommand(message: string): boolean {
  const msg = message.toLowerCase().trim();
  return RESET_COMMANDS.some(cmd => msg.includes(cmd));
}

/**
 * Detecta se a mensagem é uma nova transação (não continuação da conversa anterior)
 * Indicadores:
 * - Começa com saudação + padrão de transação
 * - Menciona valor E cartão/conta diferente do existente
 */
function isNewTransaction(newMessage: string, existingData: any): boolean {
  const msg = newMessage.toLowerCase().trim();
  
  // Saudações indicam início de nova conversa
  const startsWithGreeting = /^(ol[aá]|oi|hey|bom dia|boa tarde|boa noite|couples|ola couples|olá couples)/i.test(msg);
  
  // Padrões de nova transação (gastei/paguei/comprei + valor)
  const hasTransactionPattern = /(gastei|paguei|comprei|recebi|transferi|depositei|saquei).*(r\$|\d+[,\.]\d{2}|\d+\s*reais)/i.test(msg);
  
  // Se começa com saudação E tem padrão de transação → nova transação
  if (startsWithGreeting && hasTransactionPattern) {
    console.log('[whatsapp-input] Detected new transaction: greeting + transaction pattern');
    return true;
  }
  
  // Se tem padrão de nova transação completa (verbo + valor)
  if (hasTransactionPattern && existingData) {
    const existingCard = existingData.card_hint?.toLowerCase() || '';
    const existingAccount = existingData.account_hint?.toLowerCase() || '';
    
    // Lista de cartões/contas comuns para detecção
    const cardPatterns = /(nubank|inter|c6|itau|bradesco|santander|mercadopago|picpay|bb|caixa|sicoob|sicredi|original|next|neon|pan|btg|xp|rico|clear|modal|safra|banrisul|ame|pagbank|pagseguro)/i;
    const mentionedCard = msg.match(cardPatterns);
    
    // Se menciona um cartão diferente do existente → nova transação
    if (mentionedCard && existingCard && !msg.includes(existingCard)) {
      console.log('[whatsapp-input] Detected new transaction: different card mentioned', { mentioned: mentionedCard[0], existing: existingCard });
      return true;
    }
  }
  
  return false;
}

// ============================================================
// FUNÇÃO DE NORMALIZAÇÃO DE TEXTO (REMOVE ACENTOS E ESPECIAIS)
// Converte "Itaú Pão de Açúcar" → "itau pao de acucar"
// ============================================================
function normalizeText(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacríticos (acentos)
    .replace(/[^a-z0-9\s]/g, '')     // Remove caracteres especiais
    .trim();
}

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

// ============================================================
// SMART CARD RESOLUTION HELPERS
// ============================================================

/**
 * Extrai tipo de cartão (crédito/débito) do hint do usuário
 * Ex: "crédito Sicredi" → 'credit', "débito Nubank" → 'debit'
 */
function extractCardTypeFromHint(hint: string): 'credit' | 'debit' | null {
  if (!hint) return null;
  const hintLower = hint.toLowerCase();
  
  // Padrões para crédito
  if (/\b(cr[eé]dito|credit)\b/i.test(hintLower)) {
    return 'credit';
  }
  
  // Padrões para débito
  if (/\b(d[eé]bito|debit)\b/i.test(hintLower)) {
    return 'debit';
  }
  
  return null;
}

/**
 * Remove palavras de tipo do hint para busca mais limpa
 * Ex: "crédito Sicredi" → "sicredi", "cartão Nubank Black" → "nubank black"
 */
function cleanCardHint(hint: string): string {
  if (!hint) return '';
  return hint
    .toLowerCase()
    .replace(/\b(cart[aã]o|de|do|da|no|na|cr[eé]dito|d[eé]bito|credit|debit|card)\b/gi, '')
    .trim()
    .replace(/\s+/g, ' ')
    .trim();
}

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

      // Normalizar telefone ANTES de qualquer operação
      const normalizedPhone = normalizePhone(phone_number);

      console.log('[whatsapp-input] POST - Creating new input:', { 
        phone_number_raw: phone_number,
        phone_number_normalized: normalizedPhone,
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

      // Buscar user_id pelo phone_number na tabela profiles
      // Estratégia: buscar pelo telefone normalizado OU por variações comuns
      let profile = null;
      let profileError = null;

      // Tentar busca exata primeiro
      const { data: exactMatch, error: exactError } = await supabase
        .from('profiles')
        .select('user_id, display_name, phone_number, whatsapp_verified_at')
        .eq('phone_number', normalizedPhone)
        .maybeSingle();

      if (exactMatch) {
        profile = exactMatch;
        console.log('[whatsapp-input] Found profile by exact match:', normalizedPhone);
      } else {
        // Tentar variações: sem código do país (11 dígitos) ou com 0 na frente
        const phoneVariations = [
          normalizedPhone,
          normalizedPhone.startsWith('55') ? normalizedPhone.slice(2) : normalizedPhone, // sem 55
          normalizedPhone.startsWith('55') ? '0' + normalizedPhone.slice(2) : normalizedPhone, // 0 + DDD
        ];
        
        console.log('[whatsapp-input] Trying phone variations:', phoneVariations);
        
        for (const variation of phoneVariations) {
          const { data: varMatch } = await supabase
            .from('profiles')
            .select('user_id, display_name, phone_number, whatsapp_verified_at')
            .eq('phone_number', variation)
            .maybeSingle();
          
          if (varMatch) {
            profile = varMatch;
            console.log('[whatsapp-input] Found profile by variation:', variation);
            break;
          }
        }
        
        if (!profile) {
          profileError = exactError;
        }
      }

      if (profileError || !profile) {
        console.log('[whatsapp-input] Phone not registered. Tried:', normalizedPhone);
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

      // NOTA: Removida verificação de whatsapp_verified_at
      // Agora basta ter o telefone cadastrado no perfil para usar a integração

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

      // =====================================================
      // CONVERSATION-AWARE: Detectar conversa pendente
      // Se existe input em waiting_user_input → continuar conversa
      // Caso contrário → criar novo input
      // =====================================================
      let { data: pendingInput, error: pendingError } = await supabase
        .from('incoming_financial_inputs')
        .select('id, status, raw_message, amount, currency, transaction_type, category_hint, account_hint, card_hint, description_hint, transaction_date, payment_method, owner_user, resolved_category_id, resolved_account_id, resolved_card_id, confidence_score, updated_at')
        .eq('user_id', profile.user_id)
        .eq('status', 'waiting_user_input')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (pendingError) {
        console.error('[whatsapp-input] Error checking pending input:', pendingError);
        // Não bloquear - continuar com criação de novo input
      }

      // =====================================================
      // VERIFICAR CONDIÇÕES DE RESET DE CONVERSA
      // 1. Timeout de 15 minutos
      // 2. Comando de reset do usuário
      // 3. Detecção de nova transação
      // =====================================================
      if (pendingInput) {
        const lastUpdated = new Date(pendingInput.updated_at);
        const minutesElapsed = (Date.now() - lastUpdated.getTime()) / (1000 * 60);

        // Regra 1: Timeout de 15 minutos
        if (minutesElapsed > CONVERSATION_TIMEOUT_MINUTES) {
          console.log(`[whatsapp-input] TIMEOUT: Expiring stale conversation (${minutesElapsed.toFixed(1)} min):`, pendingInput.id);
          await supabase
            .from('incoming_financial_inputs')
            .update({ status: 'expired', updated_at: new Date().toISOString() })
            .eq('id', pendingInput.id);
          pendingInput = null; // Forçar criação de novo input
        }
        // Regra 2: Comando de reset do usuário
        else if (isResetCommand(raw_message)) {
          console.log('[whatsapp-input] RESET: User cancelled conversation:', pendingInput.id);
          await supabase
            .from('incoming_financial_inputs')
            .update({ status: 'cancelled', updated_at: new Date().toISOString() })
            .eq('id', pendingInput.id);
          pendingInput = null; // Forçar criação de novo input
        }
        // Regra 3: Detecção de nova transação
        else if (isNewTransaction(raw_message, pendingInput)) {
          console.log('[whatsapp-input] SUPERSEDE: Detected new transaction, replacing old:', pendingInput.id);
          await supabase
            .from('incoming_financial_inputs')
            .update({ status: 'superseded', updated_at: new Date().toISOString() })
            .eq('id', pendingInput.id);
          pendingInput = null; // Forçar criação de novo input
        }
      }

      if (pendingInput) {
        // =====================================================
        // CONTINUAR CONVERSA EXISTENTE (conversa ainda válida)
        // Reutilizar input pendente, manter status waiting_user_input
        // =====================================================
        console.log('[whatsapp-input] CONVERSATION-AWARE: Continuing pending input:', pendingInput.id);
        console.log('[whatsapp-input] Continuing conversation with new message:', raw_message?.substring(0, 50));

        // Atualizar raw_message com a resposta do usuário (concatenar)
        // Limitar histórico a 5 mensagens para evitar acúmulo excessivo
        const existingMessages = pendingInput.raw_message?.split('\n---\n') || [];
        const maxMessages = 5;
        let updatedRawMessage: string;
        
        if (existingMessages.length >= maxMessages) {
          // Manter apenas as últimas N-1 mensagens + nova
          const recentMessages = existingMessages.slice(-(maxMessages - 1));
          updatedRawMessage = `${recentMessages.join('\n---\n')}\n---\nResposta do usuário: ${raw_message}`;
        } else {
          updatedRawMessage = pendingInput.raw_message 
            ? `${pendingInput.raw_message}\n---\nResposta do usuário: ${raw_message}`
            : raw_message;
        }

        // Atualizar o input existente com a nova mensagem
        // Status permanece waiting_user_input até que todos os dados sejam confirmados
        const { error: updateError } = await supabase
          .from('incoming_financial_inputs')
          .update({
            raw_message: updatedRawMessage,
            updated_at: new Date().toISOString()
          })
          .eq('id', pendingInput.id);

        if (updateError) {
          console.error('[whatsapp-input] Error updating pending input:', updateError);
          throw updateError;
        }

        // Retornar o input pendente para a IA processar
        // Status: waiting_user_input (contrato válido)
        return new Response(
          JSON.stringify({ 
            success: true, 
            status: 'waiting_user_input',
            input_id: pendingInput.id,
            user_id: profile.user_id,
            user_name: profile.display_name,
            existing_data: {
              amount: pendingInput.amount,
              currency: pendingInput.currency,
              transaction_type: pendingInput.transaction_type,
              category_hint: pendingInput.category_hint,
              account_hint: pendingInput.account_hint,
              card_hint: pendingInput.card_hint,
              description_hint: pendingInput.description_hint,
              transaction_date: pendingInput.transaction_date,
              payment_method: pendingInput.payment_method,
              owner_user: pendingInput.owner_user,
              resolved_category_id: pendingInput.resolved_category_id,
              resolved_account_id: pendingInput.resolved_account_id,
              resolved_card_id: pendingInput.resolved_card_id
            },
            original_message: pendingInput.raw_message,
            user_response: raw_message
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('[whatsapp-input] No pending conversation found - creating new input');

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

      // Verificar se input existe E CARREGAR ESTADO COMPLETO
      const { data: existingInput, error: fetchError } = await supabase
        .from('incoming_financial_inputs')
        .select('id, status, processed_at, transaction_id, user_id, source, amount, currency, transaction_type, category_hint, account_hint, card_hint, description_hint, transaction_date, payment_method, owner_user, resolved_category_id, resolved_account_id, resolved_card_id, confidence_score')
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
      // MERGE DE ESTADO CONVERSACIONAL
      // Preservar dados existentes, atualizar apenas campos novos
      // NUNCA sobrescrever valores válidos com null/undefined
      // =====================================================
      const mergeField = <T>(newValue: T | undefined | null, existingValue: T | null): T | null => {
        // Se newValue é undefined ou null, manter valor existente
        if (newValue === undefined || newValue === null) {
          return existingValue;
        }
        // Se newValue é string vazia, manter valor existente
        if (typeof newValue === 'string' && newValue.trim() === '') {
          return existingValue;
        }
        // Caso contrário, usar novo valor
        return newValue;
      };

      // Estado merged - combina dados existentes com novos
      const mergedState = {
        amount: mergeField(amount, existingInput.amount),
        currency: mergeField(currency, existingInput.currency),
        transaction_type: mergeField(transaction_type, existingInput.transaction_type),
        category_hint: mergeField(category_hint, existingInput.category_hint),
        account_hint: mergeField(account_hint, existingInput.account_hint),
        card_hint: mergeField(card_hint, existingInput.card_hint),
        description_hint: mergeField(description_hint, existingInput.description_hint),
        transaction_date: mergeField(transaction_date, existingInput.transaction_date),
        payment_method: mergeField(payment_method, existingInput.payment_method),
        owner_user: mergeField(owner_user, existingInput.owner_user),
        confidence_score: mergeField(confidence_score, existingInput.confidence_score),
        // IDs resolvidos também devem ser preservados
        resolved_category_id: existingInput.resolved_category_id,
        resolved_account_id: existingInput.resolved_account_id,
        resolved_card_id: existingInput.resolved_card_id,
      };

      console.log('[whatsapp-input] MERGE STATE - Before:', {
        amount: existingInput.amount,
        category_hint: existingInput.category_hint,
        account_hint: existingInput.account_hint,
        card_hint: existingInput.card_hint,
        payment_method: existingInput.payment_method,
        resolved_category_id: existingInput.resolved_category_id,
        resolved_account_id: existingInput.resolved_account_id,
        resolved_card_id: existingInput.resolved_card_id
      });
      console.log('[whatsapp-input] MERGE STATE - New data from AI:', {
        amount, category_hint, account_hint, card_hint, payment_method
      });
      console.log('[whatsapp-input] MERGE STATE - After merge:', mergedState);

      // =====================================================
      // RESOLUÇÃO ANTECIPADA DE HINTS
      // =====================================================
      let resolved_category_id: string | null = null;
      let resolved_account_id: string | null = null;
      let resolved_card_id: string | null = null;

      // =====================================================
      // RESOLVER CATEGORIA POR KEYWORDS DAS TAGS OU NOME
      // Usar mergedState.category_hint em vez de category_hint raw
      // =====================================================
      if (mergedState.category_hint && !mergedState.resolved_category_id) {
        const searchTerm = mergedState.category_hint.trim().toLowerCase();
        console.log('[whatsapp-input] Resolving category from merged hint:', searchTerm);
        
        // 1) PRIMEIRO: Buscar tag por KEYWORDS_PT (match exato no array)
        // Isso encontra "ifood" nas keywords ["ifood", "delivery", "comida"]
        const { data: tagByKeyword } = await supabase
          .from('category_tags')
          .select('id, name_pt, keywords_pt')
          .contains('keywords_pt', [searchTerm]);
        
        let tagMatches = tagByKeyword;
        
        if (tagByKeyword && tagByKeyword.length > 0) {
          console.log('[whatsapp-input] Found tag via KEYWORDS_PT:', tagByKeyword.map((t: { name_pt: string }) => t.name_pt));
        } else {
          // 2) FALLBACK: Buscar tag por nome parcial (ex: "livro" → tag "livros")
          console.log('[whatsapp-input] No keyword match, trying name_pt ilike...');
          const { data: tagByName } = await supabase
            .from('category_tags')
            .select('id, name_pt, keywords_pt')
            .ilike('name_pt', `%${searchTerm}%`);
          
          tagMatches = tagByName;
          if (tagByName && tagByName.length > 0) {
            console.log('[whatsapp-input] Found tag via NAME_PT:', tagByName.map((t: { name_pt: string }) => t.name_pt));
          }
        }
        
        if (tagMatches && tagMatches.length > 0) {
          // 3) Buscar category_tag_relations para encontrar default_category_id
          const tagIds = tagMatches.map((t: { id: string }) => t.id);
          const { data: relations } = await supabase
            .from('category_tag_relations')
            .select('category_id')
            .in('tag_id', tagIds)
            .eq('is_active', true)
            .limit(1);
          
          if (relations && relations.length > 0) {
            const defaultCategoryId = relations[0].category_id;
            console.log('[whatsapp-input] Found default category via tag:', defaultCategoryId);
            
            // 4) Mapear para categoria do usuário via default_category_id
            const { data: userCategory } = await supabase
              .from('categories')
              .select('id, name')
              .eq('user_id', existingInput.user_id)
              .eq('default_category_id', defaultCategoryId)
              .is('deleted_at', null)
              .limit(1)
              .single();
            
            if (userCategory) {
              mergedState.resolved_category_id = userCategory.id;
              console.log('[whatsapp-input] Category resolved via TAG/KEYWORD:', searchTerm, '->', userCategory.name);
            }
          }
        }
        
        // 4) FALLBACK: Busca direta pelo nome da categoria
        if (!mergedState.resolved_category_id) {
          console.log('[whatsapp-input] Tag search failed, trying direct name match...');
          
          const { data: category } = await supabase
            .from('categories')
            .select('id, name')
            .eq('user_id', existingInput.user_id)
            .is('deleted_at', null)
            .ilike('name', `%${mergedState.category_hint.trim()}%`)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          if (category) {
            mergedState.resolved_category_id = category.id;
            console.log('[whatsapp-input] Category resolved by NAME:', mergedState.category_hint, '->', category.name);
          } else {
            console.log('[whatsapp-input] Category not found for hint:', mergedState.category_hint);
          }
        }
      }

      // Tentar resolver account_hint → account_id (usar mergedState)
      if (mergedState.account_hint && !mergedState.resolved_account_id) {
        const { data: account } = await supabase
          .from('accounts')
          .select('id, name')
          .eq('user_id', existingInput.user_id)
          .is('deleted_at', null)
          .eq('is_active', true)
          .ilike('name', `%${mergedState.account_hint.trim()}%`)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (account) {
          mergedState.resolved_account_id = account.id;
          console.log('[whatsapp-input] Account resolved:', mergedState.account_hint, '->', account.name);
        } else {
          console.log('[whatsapp-input] Account not found for hint:', mergedState.account_hint);
        }
      }

      // =====================================================
      // Buscar dados auxiliares para melhorar perguntas
      // =====================================================
      const { data: userCards } = await supabase
        .from('cards')
        .select('id, name, card_type, account_id')
        .eq('user_id', existingInput.user_id)
        .is('deleted_at', null);
      
      const { data: userAccounts } = await supabase
        .from('accounts')
        .select('id, name')
        .eq('user_id', existingInput.user_id)
        .is('deleted_at', null)
        .eq('is_active', true);

      // Buscar categorias frequentes do usuário (últimas 50 transações)
      const { data: recentTransactions } = await supabase
        .from('transactions')
        .select('category_id, categories!inner(name)')
        .eq('user_id', existingInput.user_id)
        .not('category_id', 'is', null)
        .order('created_at', { ascending: false })
        .limit(50);

      // Extrair top 5 categorias mais usadas
      const categoryFrequency: Record<string, number> = {};
      recentTransactions?.forEach((t: { categories: { name: string } }) => {
        const catName = t.categories?.name;
        if (catName) {
          categoryFrequency[catName] = (categoryFrequency[catName] || 0) + 1;
        }
      });
      const frequentCategories = Object.entries(categoryFrequency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name]) => name);

      // =====================================================
      // SMART CARD RESOLUTION - Resolver automaticamente quando possível
      // Evita perguntas desnecessárias usando contexto do tipo
      // =====================================================
      type CardWithType = { id: string; name: string; card_type: string; account_id: string | null };
      
      if (mergedState.card_hint && !mergedState.resolved_card_id && userCards && userCards.length > 0) {
        // PASSO 1: Extrair tipo do hint (se usuário disse "crédito Sicredi")
        const hintCardType = extractCardTypeFromHint(mergedState.card_hint);
        console.log('[whatsapp-input] SMART RESOLUTION - Hint card type:', hintCardType);
        
        // PASSO 2: Limpar hint removendo palavras de tipo
        const cleanedHint = cleanCardHint(mergedState.card_hint);
        console.log('[whatsapp-input] Cleaned hint:', cleanedHint, '(original:', mergedState.card_hint, ')');
        
        // Palavras relevantes para busca
        const stopWords = ['banco', 'bank'];
        const words = cleanedHint.split(/\s+/)
          .filter((w: string) => w.length > 2 && !stopWords.includes(w));
        
        console.log('[whatsapp-input] Card search keywords:', words);
        
        // Separar cartões por tipo
        const creditCards = userCards.filter((c: CardWithType) => c.card_type === 'credit');
        const debitCards = userCards.filter((c: CardWithType) => c.card_type === 'debit');
        
        console.log('[whatsapp-input] Cards by type - Credit:', creditCards.length, 'Debit:', debitCards.length);
        
        // PASSO 3: Determinar tipo efetivo (hint > payment_method > null)
        const effectiveCardType = hintCardType || 
          (mergedState.payment_method === 'credit_card' ? 'credit' : 
           mergedState.payment_method === 'debit_card' ? 'debit' : null);
        
        console.log('[whatsapp-input] Effective card type:', effectiveCardType);
        
        // Função que retorna TODOS os matches (não só o primeiro)
        const findAllCardsInList = (cardList: CardWithType[], searchHint: string): CardWithType[] => {
          const normalizedHint = normalizeText(searchHint);
          const searchWords = searchHint.split(/\s+/)
            .filter((w: string) => w.length > 2)
            .map((w: string) => normalizeText(w));
          
          return cardList.filter((card: CardWithType) => {
            const cardName = normalizeText(card.name);
            
            // Match exato
            if (cardName === normalizedHint) return true;
            
            // Hint contido no nome do cartão
            if (cardName.includes(normalizedHint)) return true;
            
            // Nome do cartão contido no hint
            if (normalizedHint.includes(cardName)) return true;
            
            // Match por palavras-chave (todas as palavras do hint devem estar no nome)
            if (searchWords.length > 0 && searchWords.some((word: string) => cardName.includes(word))) {
              return true;
            }
            
            return false;
          });
        };
        
        // Função de busca que retorna primeiro match (para compatibilidade)
        const findCardInList = (cardList: CardWithType[]): CardWithType | undefined => {
          const matches = findAllCardsInList(cardList, cleanedHint);
          return matches.length > 0 ? matches[0] : undefined;
        };
        
        let match: CardWithType | undefined;
        let isSmartResolution = false;
        
        // PASSO 4: Lógica inteligente baseada em tipo efetivo
        if (effectiveCardType === 'credit') {
          // Tipo definido como CRÉDITO - buscar apenas em cartões de crédito
          const allMatches = findAllCardsInList(creditCards, cleanedHint);
          
          if (allMatches.length === 1) {
            // ÚNICO MATCH → RESOLVER AUTOMATICAMENTE
            match = allMatches[0];
            isSmartResolution = true;
            console.log('[whatsapp-input] SMART RESOLVE: Only 1 credit card matches:', match.name);
          } else if (allMatches.length > 1) {
            // MÚLTIPLOS MATCHES no mesmo tipo → Usar primeiro (nomes similares)
            match = allMatches[0];
            console.log('[whatsapp-input] Multiple credit matches, using first:', allMatches.map(c => c.name));
          } else {
            // Sem match em crédito, tentar débito como fallback
            match = findCardInList(debitCards);
            if (match) {
              console.log('[whatsapp-input] WARNING: Only found DEBIT card for credit hint:', match.name);
            }
          }
        } else if (effectiveCardType === 'debit') {
          // Tipo definido como DÉBITO - buscar apenas em cartões de débito
          const allMatches = findAllCardsInList(debitCards, cleanedHint);
          
          if (allMatches.length === 1) {
            // ÚNICO MATCH → RESOLVER AUTOMATICAMENTE
            match = allMatches[0];
            isSmartResolution = true;
            console.log('[whatsapp-input] SMART RESOLVE: Only 1 debit card matches:', match.name);
          } else if (allMatches.length > 1) {
            // MÚLTIPLOS MATCHES no mesmo tipo → Usar primeiro
            match = allMatches[0];
            console.log('[whatsapp-input] Multiple debit matches, using first:', allMatches.map(c => c.name));
          } else {
            // Sem match em débito, tentar crédito como fallback
            match = findCardInList(creditCards);
            if (match) {
              console.log('[whatsapp-input] WARNING: Only found CREDIT card for debit hint:', match.name);
            }
          }
        } else {
          // SEM TIPO DEFINIDO - buscar em ambos com lógica inteligente
          const creditMatches = findAllCardsInList(creditCards, cleanedHint);
          const debitMatches = findAllCardsInList(debitCards, cleanedHint);
          
          console.log('[whatsapp-input] Matches found - Credit:', creditMatches.length, 'Debit:', debitMatches.length);
          
          // Se só tem matches em um tipo → RESOLVER AUTOMATICAMENTE
          if (creditMatches.length > 0 && debitMatches.length === 0) {
            // Só encontrou cartões de crédito
            match = creditMatches[0];
            isSmartResolution = creditMatches.length === 1;
            console.log('[whatsapp-input] SMART RESOLVE: Only credit cards match, using:', match.name);
          } else if (debitMatches.length > 0 && creditMatches.length === 0) {
            // Só encontrou cartões de débito
            match = debitMatches[0];
            isSmartResolution = debitMatches.length === 1;
            console.log('[whatsapp-input] SMART RESOLVE: Only debit cards match, using:', match.name);
          } else if (creditMatches.length > 0 && debitMatches.length > 0) {
            // AMBIGUIDADE REAL: matches em ambos tipos
            console.log('[whatsapp-input] AMBIGUITY: Found cards in both types:',
              'Credit:', creditMatches.map(c => c.name),
              'Debit:', debitMatches.map(c => c.name));
            // NÃO resolver - deixar para perguntar ao usuário
            match = undefined;
          }
        }
        
        if (match) {
          mergedState.resolved_card_id = match.id;
          
          // Se resolvido via hint de tipo, atualizar payment_method também
          if (isSmartResolution && hintCardType) {
            if (hintCardType === 'credit' && !mergedState.payment_method) {
              mergedState.payment_method = 'credit_card';
              console.log('[whatsapp-input] SMART: Also setting payment_method to credit_card');
            } else if (hintCardType === 'debit' && !mergedState.payment_method) {
              mergedState.payment_method = 'debit_card';
              console.log('[whatsapp-input] SMART: Also setting payment_method to debit_card');
            }
          }
          
          console.log('[whatsapp-input] Card resolved:', mergedState.card_hint, '->', match.name, '(', match.card_type, ')', isSmartResolution ? '[SMART]' : '');
          
          // Se for cartão de débito, resolver conta associada
          if (match.card_type === 'debit' && match.account_id) {
            mergedState.resolved_account_id = match.account_id;
            console.log('[whatsapp-input] Debit card linked account:', mergedState.resolved_account_id);
          }
        } else {
          console.log('[whatsapp-input] Card not found or ambiguous for hint:', mergedState.card_hint, 
            'Available:', userCards.map((c: CardWithType) => `${c.name} (${c.card_type})`));
        }
      } else if (mergedState.card_hint && (!userCards || userCards.length === 0)) {
        console.log('[whatsapp-input] No cards found for user');
      }

      // =====================================================
      // DETERMINAR STATUS BASEADO EM RESOLUÇÃO (USANDO mergedState)
      // =====================================================
      const isWhatsApp = existingInput.source === 'whatsapp';
      
      // Verificar campos obrigatórios BASEADO NO ESTADO MERGED
      const needsCard = mergedState.payment_method === 'credit_card';
      const needsAccount = mergedState.payment_method === 'debit_card' || mergedState.payment_method === 'pix' || mergedState.payment_method === 'cash';

      // Interface melhorada para perguntas
      interface QuestionItem {
        field: string;
        question: string;
        hint?: string;
        options?: string[];
        suggestions?: string[];
        type?: 'text' | 'selection' | 'confirmation';
      }
      
      const questions: QuestionItem[] = [];

      // =====================================================
      // VALIDAÇÃO BASEADA NO ESTADO COMPLETO ACUMULADO
      // =====================================================

      // Campos básicos obrigatórios - verificar mergedState
      if (!mergedState.amount) {
        questions.push({ 
          field: 'amount', 
          question: 'Qual o valor da transação?',
          type: 'text'
        });
      }
      if (!mergedState.transaction_type) {
        questions.push({ 
          field: 'transaction_type', 
          question: 'É uma despesa ou receita?',
          options: ['despesa', 'receita'],
          type: 'selection'
        });
      }
      
      // =====================================================
      // LÓGICA PARA CARTÃO AMBÍGUO (sem payment_method definido)
      // Usar a mesma lógica inteligente de limpeza de hint
      // =====================================================
      if (mergedState.card_hint && !mergedState.payment_method && !mergedState.resolved_card_id && userCards && userCards.length > 0) {
        // Se já tinha tipo no hint, não deveria chegar aqui (já resolveu acima)
        // Mas verificar novamente para garantir
        const hintCardType = extractCardTypeFromHint(mergedState.card_hint);
        
        if (hintCardType) {
          // Hint tinha tipo explícito mas não resolveu = sem cartões do tipo
          console.log('[whatsapp-input] Card type explicit in hint but not resolved - asking for payment method');
          questions.push({ 
            field: 'payment_method', 
            question: 'Qual a forma de pagamento?',
            options: ['PIX', 'cartão de crédito', 'cartão de débito', 'dinheiro'],
            type: 'selection'
          });
        } else {
          // Verificar se existem cartões de ambos tipos que correspondem ao hint limpo
          const cleanedHint = cleanCardHint(mergedState.card_hint);
          const creditCards = userCards.filter((c: CardWithType) => c.card_type === 'credit');
          const debitCards = userCards.filter((c: CardWithType) => c.card_type === 'debit');
          
          // Função de busca usando hint limpo
          const countMatchesInList = (cardList: typeof userCards): number => {
            const normalizedHint = normalizeText(cleanedHint);
            const words = cleanedHint.split(/\s+/).filter((w: string) => w.length > 2).map((w: string) => normalizeText(w));
            
            return cardList.filter((card: CardWithType) => {
              const cardName = normalizeText(card.name);
              // Match por substring ou palavras
              return cardName.includes(normalizedHint) || 
                     normalizedHint.includes(cardName) ||
                     (words.length > 0 && words.some((word: string) => cardName.includes(word)));
            }).length;
          };
          
          const creditMatchCount = countMatchesInList(creditCards);
          const debitMatchCount = countMatchesInList(debitCards);
          
          console.log('[whatsapp-input] Ambiguity check - Credit matches:', creditMatchCount, 'Debit matches:', debitMatchCount);
          
          if (creditMatchCount > 0 && debitMatchCount > 0) {
            console.log('[whatsapp-input] Card type ambiguity detected - need to ask user');
            questions.push({ 
              field: 'payment_method', 
              question: `"${mergedState.card_hint}" - é cartão de crédito ou débito?`,
              options: ['cartão de crédito', 'cartão de débito'],
              type: 'selection'
            });
          } else if (creditMatchCount === 0 && debitMatchCount === 0) {
            // Sem match, perguntar forma de pagamento
            questions.push({ 
              field: 'payment_method', 
              question: 'Qual a forma de pagamento?',
              options: ['PIX', 'cartão de crédito', 'cartão de débito', 'dinheiro'],
              type: 'selection'
            });
          }
          // Se só tem match em um tipo, já foi resolvido acima - não precisa perguntar
        }
      } else if (!mergedState.payment_method && !mergedState.resolved_card_id) {
        questions.push({ 
          field: 'payment_method', 
          question: 'Qual a forma de pagamento?',
          options: ['PIX', 'cartão de crédito', 'cartão de débito', 'dinheiro'],
          type: 'selection'
        });
      }

      // =====================================================
      // REGRA CRÍTICA: Categoria OBRIGATÓRIA
      // Sem resolved_category_id = SEMPRE waiting_user_input
      // NUNCA usar "Outros" como fallback automático
      // =====================================================
      if (!mergedState.resolved_category_id) {
        console.log('[whatsapp-input] CATEGORY NOT RESOLVED - will ask user (no "Outros" fallback)');
        
        if (!mergedState.category_hint) {
          // Sem hint da IA - inferir do contexto ou perguntar com sugestões
          const rawLower = body.raw_message?.toLowerCase() || '';
          const contextHints: string[] = [];
          
          // Inferência básica do contexto da mensagem
          if (/lanchonete|padaria|restaurante|almoço|jantar|pizza|hamburguer|comida/i.test(rawLower)) {
            contextHints.push('Alimentação');
          }
          if (/uber|99|taxi|gasolina|combustível|estacionamento|onibus|metrô/i.test(rawLower)) {
            contextHints.push('Transporte');
          }
          if (/mercado|supermercado|açougue|feira|hortifruti/i.test(rawLower)) {
            contextHints.push('Compras');
          }
          if (/farmácia|remédio|médico|consulta|hospital/i.test(rawLower)) {
            contextHints.push('Saúde');
          }
          if (/livro|curso|escola|faculdade|estudo|aula/i.test(rawLower)) {
            contextHints.push('Educação');
          }
          if (/netflix|spotify|cinema|show|teatro|lazer|diversão/i.test(rawLower)) {
            contextHints.push('Entretenimento');
          }
          
          const allSuggestions = [...new Set([...contextHints, ...frequentCategories])].slice(0, 5);
          
          questions.push({ 
            field: 'category', 
            question: allSuggestions.length > 0 
              ? `Em qual categoria classificar? Sugestões: ${allSuggestions.join(', ')}`
              : 'Qual a categoria desse gasto?',
            suggestions: allSuggestions,
            type: allSuggestions.length > 0 ? 'selection' : 'text'
          });
        } else {
          // Tinha hint mas não resolveu = perguntar com sugestões
          console.log('[whatsapp-input] Category hint provided but not resolved:', mergedState.category_hint);
          const suggestedText = `Não encontrei a categoria "${mergedState.category_hint}" nas suas tags. ${frequentCategories.length > 0 ? 'Escolha uma: ' + frequentCategories.join(', ') : 'Qual categoria deseja usar?'}`;
          questions.push({ 
            field: 'category', 
            question: suggestedText, 
            hint: mergedState.category_hint,
            suggestions: frequentCategories,
            type: frequentCategories.length > 0 ? 'selection' : 'text'
          });
        }
      } else {
        console.log('[whatsapp-input] Category resolved successfully:', mergedState.resolved_category_id);
      }

      // Cartão - se necessário (usar mergedState)
      if (needsCard) {
        const cardNames = userCards?.map((c: { name: string }) => c.name) || [];
        
        if (!mergedState.card_hint) {
          questions.push({ 
            field: 'card', 
            question: cardNames.length > 0 
              ? `Qual cartão de crédito? Opções: ${cardNames.join(', ')}`
              : 'Qual cartão de crédito foi usado?',
            options: cardNames,
            type: cardNames.length > 0 ? 'selection' : 'text'
          });
        } else if (!mergedState.resolved_card_id) {
          const suggestedText = cardNames.length > 0
            ? `Não encontrei "${mergedState.card_hint}". Seus cartões: ${cardNames.join(', ')}. Qual usar?`
            : `Não encontrei o cartão "${mergedState.card_hint}". Qual cartão deseja usar?`;
          questions.push({ 
            field: 'card', 
            question: suggestedText, 
            hint: mergedState.card_hint,
            options: cardNames,
            type: cardNames.length > 0 ? 'selection' : 'text'
          });
        }
      }

      // Conta - se necessária (usar mergedState)
      if (needsAccount) {
        const accountNames = userAccounts?.map((a: { name: string }) => a.name) || [];
        
        if (!mergedState.account_hint) {
          questions.push({ 
            field: 'account', 
            question: accountNames.length > 0
              ? `Qual conta foi usada? Opções: ${accountNames.join(', ')}`
              : 'Qual conta foi usada?',
            options: accountNames,
            type: accountNames.length > 0 ? 'selection' : 'text'
          });
        } else if (!mergedState.resolved_account_id) {
          const suggestedText = accountNames.length > 0
            ? `Não encontrei "${mergedState.account_hint}". Suas contas: ${accountNames.join(', ')}. Qual usar?`
            : `Não encontrei a conta "${mergedState.account_hint}". Qual conta deseja usar?`;
          questions.push({ 
            field: 'account', 
            question: suggestedText, 
            hint: mergedState.account_hint,
            options: accountNames,
            type: accountNames.length > 0 ? 'selection' : 'text'
          });
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

      // =====================================================
      // LOG DETALHADO DE RESOLUÇÃO (usando mergedState)
      // =====================================================
      console.log('[whatsapp-input] Resolution summary:', {
        input_id,
        mergedHints: { 
          category_hint: mergedState.category_hint, 
          card_hint: mergedState.card_hint, 
          account_hint: mergedState.account_hint 
        },
        resolved: { 
          category: mergedState.resolved_category_id ? 'OK' : (mergedState.category_hint ? 'FAILED' : 'NO_HINT'),
          card: mergedState.resolved_card_id ? 'OK' : (needsCard ? (mergedState.card_hint ? 'FAILED' : 'NO_HINT') : 'N/A'),
          account: mergedState.resolved_account_id ? 'OK' : (needsAccount ? (mergedState.account_hint ? 'FAILED' : 'NO_HINT') : 'N/A')
        },
        availableOptions: {
          cards: userCards?.length || 0,
          accounts: userAccounts?.length || 0,
          frequentCategories: frequentCategories.length
        },
        questions: questions.map(q => ({ field: q.field, hasOptions: !!q.options?.length })),
        finalStatus: newStatus
      });

      // =====================================================
      // ATUALIZAR INPUT COM ESTADO MERGED COMPLETO
      // Garantir que todos os dados acumulados são salvos
      // =====================================================
      const updateData: Record<string, unknown> = {
        status: newStatus,
        updated_at: new Date().toISOString(),
        // SALVAR TODO O ESTADO MERGED (não apenas novos valores)
        amount: mergedState.amount,
        currency: mergedState.currency,
        transaction_type: mergedState.transaction_type,
        category_hint: mergedState.category_hint,
        account_hint: mergedState.account_hint,
        card_hint: mergedState.card_hint,
        description_hint: mergedState.description_hint,
        transaction_date: mergedState.transaction_date,
        payment_method: mergedState.payment_method,
        owner_user: mergedState.owner_user,
        confidence_score: mergedState.confidence_score,
        // IDs resolvidos
        resolved_category_id: mergedState.resolved_category_id,
        resolved_account_id: mergedState.resolved_account_id,
        resolved_card_id: mergedState.resolved_card_id
      };

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
        const firstQuestion = questions[0];
        return new Response(
          JSON.stringify({ 
            success: true, 
            status: 'waiting_user_input',
            input_id: input_id,
            questions: questions,
            next_question: firstQuestion ? {
              field: firstQuestion.field,
              question: firstQuestion.question,
              type: firstQuestion.type || 'text',
              options: firstQuestion.options,
              suggestions: firstQuestion.suggestions,
              priority: 1
            } : null
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
