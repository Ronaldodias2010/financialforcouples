import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Helper: Validar se é um UUID válido
function isValidUUID(str: string | null | undefined): boolean {
  if (!str) return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

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

    // ========================================
    // PASSO 1: Buscar input completo do banco
    // ========================================
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

    console.log('[process-financial-input] Input loaded:', {
      id: input.id,
      amount: input.amount,
      transaction_type: input.transaction_type,
      payment_method: input.payment_method,
      card_hint: input.card_hint,
      account_hint: input.account_hint,
      category_hint: input.category_hint,
      resolved_card_id: input.resolved_card_id,
      resolved_account_id: input.resolved_account_id,
      resolved_category_id: input.resolved_category_id,
      status: input.status
    });

    // Verificar se já foi processado
    if (input.processed_at) {
      console.log('[process-financial-input] Already processed:', input_id);
      return new Response(
        JSON.stringify({ 
          success: true, 
          status: 'processed',
          transaction_id: input.transaction_id,
          message: 'Transação já foi processada anteriormente'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
          hint: 'Use force_confirm: true para forçar confirmação'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ========================================
    // PASSO 2: RESOLVER HINTS → IDs (NA EDGE)
    // ========================================
    console.log('[process-financial-input] Resolving hints to UUIDs...');

    let resolved_category_id: string | null = input.resolved_category_id;
    let resolved_card_id: string | null = input.resolved_card_id;
    let resolved_account_id: string | null = input.resolved_account_id;

    // 2.1 Resolver CATEGORIA se não tiver UUID válido
    if (!isValidUUID(resolved_category_id) && input.category_hint) {
      console.log('[process-financial-input] Resolving category from hint:', input.category_hint);
      
      const { data: category } = await supabase
        .from('categories')
        .select('id')
        .eq('user_id', input.user_id)
        .ilike('name', `%${input.category_hint}%`)
        .is('deleted_at', null)
        .limit(1)
        .single();

      if (category?.id) {
        resolved_category_id = category.id;
        console.log('[process-financial-input] Category resolved:', resolved_category_id);
      }
    }

    // 2.2 Resolver CARTÃO se payment_method = credit_card (busca inteligente COM PRIORIZAÇÃO POR TIPO)
    if (input.payment_method === 'credit_card') {
      if (!isValidUUID(resolved_card_id) && input.card_hint) {
        console.log('[process-financial-input] Resolving card from hint:', input.card_hint);
        
        // Palavras genéricas a ignorar na busca
        const stopWords = ['banco', 'cartão', 'cartao', 'card', 'de', 'do', 'da', 'credito', 'crédito'];
        
        // Extrair palavras relevantes do hint
        const words = input.card_hint.trim().toLowerCase().split(/\s+/)
          .filter((w: string) => w.length > 2 && !stopWords.includes(w));
        
        console.log('[process-financial-input] Card search keywords:', words);
        
        // Buscar todos os cartões do usuário COM TIPO
        const { data: cards } = await supabase
          .from('cards')
          .select('id, name, card_type')
          .eq('user_id', input.user_id)
          .is('deleted_at', null);
        
        if (cards && cards.length > 0) {
          // Separar cartões por tipo
          const creditCards = cards.filter((c: { card_type: string }) => c.card_type === 'credit');
          const debitCards = cards.filter((c: { card_type: string }) => c.card_type === 'debit');
          
          console.log('[process-financial-input] Cards by type - Credit:', creditCards.length, 'Debit:', debitCards.length);
          
          // Função de busca reutilizável
          const findCardInList = (cardList: typeof cards) => {
            // Primeiro: busca exata
            let match = cardList.find((card: { id: string; name: string; card_type: string }) => 
              card.name.toLowerCase() === input.card_hint.trim().toLowerCase()
            );
            
            // Segundo: busca por substring completa
            if (!match) {
              match = cardList.find((card: { id: string; name: string; card_type: string }) => 
                card.name.toLowerCase().includes(input.card_hint.trim().toLowerCase())
              );
            }
            
            // Terceiro: hint dentro do nome do cartão
            if (!match) {
              match = cardList.find((card: { id: string; name: string; card_type: string }) => 
                input.card_hint.trim().toLowerCase().includes(card.name.toLowerCase())
              );
            }
            
            // Quarto: busca por palavras-chave
            if (!match && words.length > 0) {
              match = cardList.find((card: { id: string; name: string; card_type: string }) => {
                const cardName = card.name.toLowerCase();
                return words.some((word: string) => cardName.includes(word));
              });
            }
            
            return match;
          };
          
          // PRIORIZAR CARTÕES DE CRÉDITO (já que payment_method é credit_card)
          let match = findCardInList(creditCards);
          
          if (match) {
            console.log('[process-financial-input] Found CREDIT card match:', match.name);
          } else {
            // Se não encontrar crédito, tentar débito como fallback
            match = findCardInList(debitCards);
            if (match) {
              console.log('[process-financial-input] WARNING: Only found DEBIT card match:', match.name, '(payment_method is credit_card)');
            }
          }
          
          if (match) {
            resolved_card_id = match.id;
            console.log('[process-financial-input] Card resolved:', input.card_hint, '->', match.name, '(type:', match.card_type, ')');
          } else {
            console.log('[process-financial-input] Card not found for hint:', input.card_hint, 'Available:', cards.map((c: { name: string; card_type: string }) => `${c.name} (${c.card_type})`));
          }
        }
      }

      // Se ainda não tem card_id, buscar cartão padrão (apenas crédito)
      if (!isValidUUID(resolved_card_id)) {
        console.log('[process-financial-input] No card found, searching default CREDIT card...');
        
        const { data: defaultCard } = await supabase
          .from('cards')
          .select('id, name')
          .eq('user_id', input.user_id)
          .eq('card_type', 'credit')
          .is('deleted_at', null)
          .limit(1)
          .single();

        if (defaultCard?.id) {
          resolved_card_id = defaultCard.id;
          console.log('[process-financial-input] Default credit card used:', defaultCard.name, resolved_card_id);
        }
      }
    }

    // 2.3 Resolver CONTA se payment_method != credit_card
    if (input.payment_method !== 'credit_card') {
      if (!isValidUUID(resolved_account_id) && input.account_hint) {
        console.log('[process-financial-input] Resolving account from hint:', input.account_hint);
        
        const { data: account } = await supabase
          .from('accounts')
          .select('id')
          .eq('user_id', input.user_id)
          .ilike('name', `%${input.account_hint}%`)
          .is('deleted_at', null)
          .limit(1)
          .single();

        if (account?.id) {
          resolved_account_id = account.id;
          console.log('[process-financial-input] Account resolved:', resolved_account_id);
        }
      }

      // Se ainda não tem account_id, buscar conta padrão
      if (!isValidUUID(resolved_account_id)) {
        console.log('[process-financial-input] No account found, searching default account...');
        
        const { data: defaultAccount } = await supabase
          .from('accounts')
          .select('id')
          .eq('user_id', input.user_id)
          .is('deleted_at', null)
          .order('created_at', { ascending: true })
          .limit(1)
          .single();

        if (defaultAccount?.id) {
          resolved_account_id = defaultAccount.id;
          console.log('[process-financial-input] Default account used:', resolved_account_id);
        }
      }
    }

    // ========================================
    // PASSO 3: VALIDAÇÕES OBRIGATÓRIAS
    // ========================================
    console.log('[process-financial-input] Validating resolved IDs...');

    // 3.1 Categoria é obrigatória para WhatsApp
    if (input.source === 'whatsapp' && !isValidUUID(resolved_category_id)) {
      console.log('[process-financial-input] WhatsApp input missing category');
      return new Response(
        JSON.stringify({ 
          success: false, 
          status: 'error',
          error: 'Categoria é obrigatória para transações via WhatsApp',
          error_code: 'CATEGORY_REQUIRED',
          hint: input.category_hint 
            ? `Categoria "${input.category_hint}" não foi encontrada. Crie a categoria ou use um nome existente.`
            : 'Informe a categoria na mensagem (ex: "gastei 50 em alimentação")'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3.2 Determinar resource_id baseado no payment_method
    let resource_id: string | null = null;
    let resource_type: 'card' | 'account' | null = null;

    if (input.payment_method === 'credit_card') {
      if (!isValidUUID(resolved_card_id)) {
        console.error('[process-financial-input] CRITICAL: No valid card_id for credit_card payment');
        return new Response(
          JSON.stringify({ 
            success: false, 
            status: 'error',
            error: 'Cartão de crédito não encontrado',
            error_code: 'CARD_NOT_FOUND',
            hint: input.card_hint 
              ? `Cartão "${input.card_hint}" não foi encontrado. Verifique o nome ou cadastre o cartão.`
              : 'Nenhum cartão de crédito cadastrado para este usuário.'
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      resource_id = resolved_card_id;
      resource_type = 'card';
    } else {
      // Para pix, débito, dinheiro → usa conta
      if (!isValidUUID(resolved_account_id)) {
        console.error('[process-financial-input] CRITICAL: No valid account_id for non-credit payment');
        return new Response(
          JSON.stringify({ 
            success: false, 
            status: 'error',
            error: 'Conta não encontrada',
            error_code: 'ACCOUNT_NOT_FOUND',
            hint: input.account_hint 
              ? `Conta "${input.account_hint}" não foi encontrada. Verifique o nome ou cadastre a conta.`
              : 'Nenhuma conta cadastrada para este usuário.'
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      resource_id = resolved_account_id;
      resource_type = 'account';
    }

    console.log('[process-financial-input] Resource resolved:', { resource_id, resource_type });

    // ========================================
    // PASSO 4: ATUALIZAR INPUT COM IDs RESOLVIDOS
    // ========================================
    const { error: updateError } = await supabase
      .from('incoming_financial_inputs')
      .update({
        resolved_category_id,
        resolved_card_id,
        resolved_account_id,
        status: 'confirmed'
      })
      .eq('id', input_id);

    if (updateError) {
      console.error('[process-financial-input] Update error:', updateError);
      throw updateError;
    }

    console.log('[process-financial-input] Input updated with resolved IDs');

    // ========================================
    // PASSO 5: CRIAR TRANSAÇÃO
    // ========================================
    console.log('[process-financial-input] Creating transaction...');

    const transactionDate = input.transaction_date || new Date().toISOString().split('T')[0];
    const description = input.description_hint || input.raw_message || 'Transação via WhatsApp';

    // Criar transação (owner_user é definido automaticamente pelo trigger set_owner_user_on_insert)
    const transactionData: any = {
      user_id: input.user_id,
      amount: Math.abs(input.amount),
      type: input.transaction_type,
      description: description,
      transaction_date: transactionDate,
      category_id: resolved_category_id,
      payment_method: input.payment_method || 'pix',
      currency: input.currency || 'BRL',
      status: 'completed'
    };

    // Adicionar card_id ou account_id conforme o tipo
    if (resource_type === 'card') {
      transactionData.card_id = resource_id;
    } else {
      transactionData.account_id = resource_id;
    }

    console.log('[process-financial-input] Transaction data:', transactionData);

    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .insert(transactionData)
      .select('id')
      .single();

    if (transactionError) {
      console.error('[process-financial-input] Transaction insert error:', transactionError);
      throw transactionError;
    }

    console.log('[process-financial-input] Transaction created:', transaction.id);

    // ========================================
    // PASSO 6: ATUALIZAR SALDO (se for conta)
    // ========================================
    if (resource_type === 'account' && resolved_account_id) {
      const balanceChange = input.transaction_type === 'income' 
        ? Math.abs(input.amount) 
        : -Math.abs(input.amount);

      const { error: balanceError } = await supabase.rpc('update_account_balance', {
        p_account_id: resolved_account_id,
        p_amount: balanceChange
      });

      if (balanceError) {
        console.warn('[process-financial-input] Balance update warning:', balanceError);
        // Não falhar por causa disso, a transação já foi criada
      } else {
        console.log('[process-financial-input] Account balance updated');
      }
    }

    // ========================================
    // PASSO 7: ATUALIZAR SALDO DO CARTÃO (se for cartão)
    // ========================================
    if (resource_type === 'card' && resolved_card_id && input.transaction_type === 'expense') {
      const { error: cardBalanceError } = await supabase
        .from('cards')
        .update({ 
          current_balance: supabase.rpc('get_card_balance', { p_card_id: resolved_card_id })
        })
        .eq('id', resolved_card_id);

      // Alternativa: incrementar diretamente
      const { data: currentCard } = await supabase
        .from('cards')
        .select('current_balance')
        .eq('id', resolved_card_id)
        .single();

      if (currentCard) {
        const newBalance = (currentCard.current_balance || 0) + Math.abs(input.amount);
        await supabase
          .from('cards')
          .update({ current_balance: newBalance })
          .eq('id', resolved_card_id);
        
        console.log('[process-financial-input] Card balance updated:', newBalance);
      }
    }

    // ========================================
    // PASSO 8: CRIAR REGISTRO NO CASH FLOW (se for conta)
    // ========================================
    if (resource_type === 'account' && resolved_account_id) {
      const { data: accountData } = await supabase
        .from('accounts')
        .select('balance, name')
        .eq('id', resolved_account_id)
        .single();

      if (accountData) {
        const balanceChange = input.transaction_type === 'income' 
          ? Math.abs(input.amount) 
          : -Math.abs(input.amount);

        const cashFlowData = {
          user_id: input.user_id,
          transaction_id: transaction.id,
          account_id: resolved_account_id,
          account_name: accountData.name,
          category_id: resolved_category_id,
          amount: Math.abs(input.amount),
          movement_type: input.transaction_type,
          movement_date: transactionDate,
          description: description,
          balance_before: accountData.balance - balanceChange,
          balance_after: accountData.balance,
          currency: input.currency || 'BRL',
          owner_user: input.owner_user || 'user1',
          payment_method: input.payment_method || 'pix'
        };

        const { error: cashFlowError } = await supabase
          .from('cash_flow_history')
          .insert(cashFlowData);

        if (cashFlowError) {
          console.warn('[process-financial-input] Cash flow insert warning:', cashFlowError);
        } else {
          console.log('[process-financial-input] Cash flow record created');
        }
      }
    }

    // ========================================
    // PASSO 9: MARCAR INPUT COMO PROCESSADO
    // ========================================
    const { error: finalUpdateError } = await supabase
      .from('incoming_financial_inputs')
      .update({
        status: 'processed',
        processed_at: new Date().toISOString(),
        transaction_id: transaction.id
      })
      .eq('id', input_id);

    if (finalUpdateError) {
      console.error('[process-financial-input] Final update error:', finalUpdateError);
      // Não falhar, transação já foi criada
    }

    console.log('[process-financial-input] SUCCESS - Transaction created:', transaction.id);

    // ========================================
    // RESPOSTA FINAL
    // ========================================
    return new Response(
      JSON.stringify({ 
        success: true, 
        status: 'processed',
        transaction_id: transaction.id,
        message: `Transação de ${input.transaction_type === 'expense' ? 'despesa' : 'receita'} criada com sucesso`,
        details: {
          amount: input.amount,
          category_id: resolved_category_id,
          resource_type,
          resource_id
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[process-financial-input] Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        status: 'error',
        error: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
