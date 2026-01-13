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

      // =====================================================
      // CONVERSATION-AWARE: Detectar conversa pendente
      // Se existe input em waiting_user_input → continuar conversa
      // Caso contrário → criar novo input
      // =====================================================
      const { data: pendingInput, error: pendingError } = await supabase
        .from('incoming_financial_inputs')
        .select('id, status, raw_message, amount, currency, transaction_type, category_hint, account_hint, card_hint, description_hint, transaction_date, payment_method, owner_user, resolved_category_id, resolved_account_id, resolved_card_id, confidence_score')
        .eq('user_id', profile.user_id)
        .eq('status', 'waiting_user_input')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (pendingError) {
        console.error('[whatsapp-input] Error checking pending input:', pendingError);
        // Não bloquear - continuar com criação de novo input
      }

      if (pendingInput) {
        // =====================================================
        // CONTINUAR CONVERSA EXISTENTE
        // Anexar nova mensagem ao input pendente
        // =====================================================
        console.log('[whatsapp-input] CONVERSATION-AWARE: Found pending input:', pendingInput.id);
        console.log('[whatsapp-input] Continuing conversation with new message:', raw_message?.substring(0, 50));

        // Atualizar raw_message com a resposta do usuário (concatenar ou substituir)
        const updatedRawMessage = pendingInput.raw_message 
          ? `${pendingInput.raw_message}\n---\nResposta do usuário: ${raw_message}`
          : raw_message;

        // Atualizar o input existente com a nova mensagem
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
        // A IA deve usar PATCH para atualizar com os dados extraídos
        return new Response(
          JSON.stringify({ 
            success: true, 
            status: 'continuing_conversation',
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

      // =====================================================
      // RESOLVER CATEGORIA POR TAGS (KEYWORDS) OU NOME
      // =====================================================
      if (category_hint) {
        const searchTerm = category_hint.trim().toLowerCase();
        console.log('[whatsapp-input] Resolving category from hint:', searchTerm);
        
        // 1) BUSCAR TAG que contenha o termo (ex: "livro" → tag "livros")
        const { data: tagMatches } = await supabase
          .from('category_tags')
          .select('id, name_pt')
          .ilike('name_pt', `%${searchTerm}%`);
        
        if (tagMatches && tagMatches.length > 0) {
          console.log('[whatsapp-input] Found matching tags:', tagMatches.map((t: { name_pt: string }) => t.name_pt));
          
          // 2) Buscar category_tag_relations para encontrar default_category_id
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
            
            // 3) Mapear para categoria do usuário via default_category_id
            const { data: userCategory } = await supabase
              .from('categories')
              .select('id, name')
              .eq('user_id', existingInput.user_id)
              .eq('default_category_id', defaultCategoryId)
              .is('deleted_at', null)
              .limit(1)
              .single();
            
            if (userCategory) {
              resolved_category_id = userCategory.id;
              console.log('[whatsapp-input] Category resolved via TAG:', searchTerm, '->', userCategory.name);
            }
          }
        }
        
        // 4) FALLBACK: Busca direta pelo nome da categoria
        if (!resolved_category_id) {
          console.log('[whatsapp-input] Tag search failed, trying direct name match...');
          
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
            console.log('[whatsapp-input] Category resolved by NAME:', category_hint, '->', category.name);
          } else {
            console.log('[whatsapp-input] Category not found for hint:', category_hint);
          }
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
      // Tentar resolver card_hint → card_id (busca inteligente COM PRIORIZAÇÃO)
      // =====================================================
      type CardWithType = { id: string; name: string; card_type: string; account_id: string | null };
      
      if (card_hint && userCards && userCards.length > 0) {
        // Palavras genéricas a ignorar na busca
        const stopWords = ['banco', 'cartão', 'cartao', 'card', 'de', 'do', 'da', 'credito', 'crédito', 'debito', 'débito'];
        
        // Extrair palavras relevantes do hint
        const words = card_hint.trim().toLowerCase().split(/\s+/)
          .filter((w: string) => w.length > 2 && !stopWords.includes(w));
        
        console.log('[whatsapp-input] Card search keywords:', words);
        
        // Separar cartões por tipo
        const creditCards = userCards.filter((c: CardWithType) => c.card_type === 'credit');
        const debitCards = userCards.filter((c: CardWithType) => c.card_type === 'debit');
        
        console.log('[whatsapp-input] Cards by type - Credit:', creditCards.length, 'Debit:', debitCards.length);
        
        // Função de busca reutilizável
        const findCardInList = (cardList: typeof userCards) => {
          // Primeiro: busca exata
          let match = cardList.find((card: CardWithType) => 
            card.name.toLowerCase() === card_hint.trim().toLowerCase()
          );
          
          // Segundo: busca por substring completa (hint no nome)
          if (!match) {
            match = cardList.find((card: CardWithType) => 
              card.name.toLowerCase().includes(card_hint.trim().toLowerCase())
            );
          }
          
          // Terceiro: hint dentro do nome do cartão
          if (!match) {
            match = cardList.find((card: CardWithType) => 
              card_hint.trim().toLowerCase().includes(card.name.toLowerCase())
            );
          }
          
          // Quarto: busca por palavras-chave do hint no nome do cartão
          if (!match && words.length > 0) {
            match = cardList.find((card: CardWithType) => {
              const cardName = card.name.toLowerCase();
              return words.some((word: string) => cardName.includes(word));
            });
          }
          
          return match;
        };
        
        let match: CardWithType | undefined;
        
        // LÓGICA BASEADA EM payment_method
        if (payment_method === 'credit_card') {
          // Priorizar cartões de crédito
          match = findCardInList(creditCards);
          if (!match) {
            match = findCardInList(debitCards);
            if (match) {
              console.log('[whatsapp-input] WARNING: Only found DEBIT card for credit payment:', match.name);
            }
          }
        } else if (payment_method === 'debit_card') {
          // Priorizar cartões de débito
          match = findCardInList(debitCards);
          if (!match) {
            match = findCardInList(creditCards);
            if (match) {
              console.log('[whatsapp-input] WARNING: Only found CREDIT card for debit payment:', match.name);
            }
          }
        } else {
          // payment_method indefinido - buscar em todos mas verificar ambiguidade
          const creditMatch = findCardInList(creditCards);
          const debitMatch = findCardInList(debitCards);
          
          // Se encontrou match em ambos tipos, temos ambiguidade
          if (creditMatch && debitMatch) {
            console.log('[whatsapp-input] AMBIGUITY: Found cards in both types:', creditMatch.name, '(credit)', debitMatch.name, '(debit)');
            // NÃO resolver - deixar para perguntar ao usuário
            match = undefined;
          } else {
            match = creditMatch || debitMatch;
          }
        }
        
        if (match) {
          resolved_card_id = match.id;
          console.log('[whatsapp-input] Card resolved:', card_hint, '->', match.name, '(', match.card_type, ')');
          
          // Se for cartão de débito, resolver conta associada
          if (match.card_type === 'debit' && match.account_id) {
            resolved_account_id = match.account_id;
            console.log('[whatsapp-input] Debit card linked account:', resolved_account_id);
          }
        } else {
          console.log('[whatsapp-input] Card not found or ambiguous for hint:', card_hint, 'Available:', userCards.map((c: CardWithType) => `${c.name} (${c.card_type})`));
        }
      } else if (card_hint && (!userCards || userCards.length === 0)) {
        console.log('[whatsapp-input] No cards found for user');
      }

      // =====================================================
      // DETERMINAR STATUS BASEADO EM RESOLUÇÃO
      // =====================================================
      const isWhatsApp = existingInput.source === 'whatsapp';
      
      // Verificar campos obrigatórios
      const needsCard = payment_method === 'credit_card';
      const needsAccount = payment_method === 'debit_card' || payment_method === 'pix' || payment_method === 'cash';

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

      // Campos básicos obrigatórios
      if (!amount) {
        questions.push({ 
          field: 'amount', 
          question: 'Qual o valor da transação?',
          type: 'text'
        });
      }
      if (!transaction_type) {
        questions.push({ 
          field: 'transaction_type', 
          question: 'É uma despesa ou receita?',
          options: ['despesa', 'receita'],
          type: 'selection'
        });
      }
      // =====================================================
      // LÓGICA PARA CARTÃO AMBÍGUO (sem payment_method definido)
      // =====================================================
      if (card_hint && !payment_method && !resolved_card_id && userCards && userCards.length > 0) {
        // Verificar se existem cartões de ambos tipos que correspondem ao hint
        const creditCards = userCards.filter((c: CardWithType) => c.card_type === 'credit');
        const debitCards = userCards.filter((c: CardWithType) => c.card_type === 'debit');
        
        // Função de busca simplificada para verificar match
        const hasMatchInList = (cardList: typeof userCards) => {
          const searchLower = card_hint.trim().toLowerCase();
          return cardList.some((card: CardWithType) => 
            card.name.toLowerCase().includes(searchLower) ||
            searchLower.includes(card.name.toLowerCase())
          );
        };
        
        const hasCreditMatch = hasMatchInList(creditCards);
        const hasDebitMatch = hasMatchInList(debitCards);
        
        if (hasCreditMatch && hasDebitMatch) {
          console.log('[whatsapp-input] Card type ambiguity detected - need to ask user');
          questions.push({ 
            field: 'payment_method', 
            question: `"${card_hint}" - é cartão de crédito ou débito?`,
            options: ['cartão de crédito', 'cartão de débito'],
            type: 'selection'
          });
        } else if (!hasCreditMatch && !hasDebitMatch) {
          // Sem match, perguntar forma de pagamento
          questions.push({ 
            field: 'payment_method', 
            question: 'Qual a forma de pagamento?',
            options: ['PIX', 'cartão de crédito', 'cartão de débito', 'dinheiro'],
            type: 'selection'
          });
        }
      } else if (!payment_method) {
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
      if (!resolved_category_id) {
        console.log('[whatsapp-input] CATEGORY NOT RESOLVED - will ask user (no "Outros" fallback)');
        
        if (!category_hint) {
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
          console.log('[whatsapp-input] Category hint provided but not resolved:', category_hint);
          const suggestedText = `Não encontrei a categoria "${category_hint}" nas suas tags. ${frequentCategories.length > 0 ? 'Escolha uma: ' + frequentCategories.join(', ') : 'Qual categoria deseja usar?'}`;
          questions.push({ 
            field: 'category', 
            question: suggestedText, 
            hint: category_hint,
            suggestions: frequentCategories,
            type: frequentCategories.length > 0 ? 'selection' : 'text'
          });
        }
      } else {
        console.log('[whatsapp-input] Category resolved successfully:', resolved_category_id);
      }

      // Cartão - se necessário
      if (needsCard) {
        const cardNames = userCards?.map((c: { name: string }) => c.name) || [];
        
        if (!card_hint) {
          questions.push({ 
            field: 'card', 
            question: cardNames.length > 0 
              ? `Qual cartão de crédito? Opções: ${cardNames.join(', ')}`
              : 'Qual cartão de crédito foi usado?',
            options: cardNames,
            type: cardNames.length > 0 ? 'selection' : 'text'
          });
        } else if (!resolved_card_id) {
          const suggestedText = cardNames.length > 0
            ? `Não encontrei "${card_hint}". Seus cartões: ${cardNames.join(', ')}. Qual usar?`
            : `Não encontrei o cartão "${card_hint}". Qual cartão deseja usar?`;
          questions.push({ 
            field: 'card', 
            question: suggestedText, 
            hint: card_hint,
            options: cardNames,
            type: cardNames.length > 0 ? 'selection' : 'text'
          });
        }
      }

      // Conta - se necessária
      if (needsAccount) {
        const accountNames = userAccounts?.map((a: { name: string }) => a.name) || [];
        
        if (!account_hint) {
          questions.push({ 
            field: 'account', 
            question: accountNames.length > 0
              ? `Qual conta foi usada? Opções: ${accountNames.join(', ')}`
              : 'Qual conta foi usada?',
            options: accountNames,
            type: accountNames.length > 0 ? 'selection' : 'text'
          });
        } else if (!resolved_account_id) {
          const suggestedText = accountNames.length > 0
            ? `Não encontrei "${account_hint}". Suas contas: ${accountNames.join(', ')}. Qual usar?`
            : `Não encontrei a conta "${account_hint}". Qual conta deseja usar?`;
          questions.push({ 
            field: 'account', 
            question: suggestedText, 
            hint: account_hint,
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
      // LOG DETALHADO DE RESOLUÇÃO
      // =====================================================
      console.log('[whatsapp-input] Resolution summary:', {
        input_id,
        hints: { category_hint, card_hint, account_hint },
        resolved: { 
          category: resolved_category_id ? 'OK' : (category_hint ? 'FAILED' : 'NO_HINT'),
          card: resolved_card_id ? 'OK' : (needsCard ? (card_hint ? 'FAILED' : 'NO_HINT') : 'N/A'),
          account: resolved_account_id ? 'OK' : (needsAccount ? (account_hint ? 'FAILED' : 'NO_HINT') : 'N/A')
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
