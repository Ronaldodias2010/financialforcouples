import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// ============================================================
// MENSAGENS MULTI-IDIOMA
// ============================================================
const MESSAGES = {
  pt: {
    phoneNotRegistered: '❌ Número não cadastrado. Acesse o app para vincular seu WhatsApp.',
    processingError: '❌ Ocorreu um erro ao processar sua mensagem. Tente novamente.',
    unknownIntent: '🤔 Não entendi sua mensagem. Você pode:\n\n📝 *Registrar:* "Gastei 50 no uber"\n📊 *Consultar:* "Qual meu saldo?" ou "Gastos do mês"',
    transactionRecorded: (amount: string, category: string, description: string) => 
      `✅ Transação registrada!\n\n💸 Despesa: ${amount}\n📁 Categoria: ${category}\n📝 ${description}`,
    incomeRecorded: (amount: string, category: string, description: string) => 
      `✅ Receita registrada!\n\n💰 Valor: ${amount}\n📁 Categoria: ${category}\n📝 ${description}`,
    waitingUserInput: (question: string) => `🔍 Preciso de mais informações:\n\n${question}`,
    categoryRequired: '⚠️ Não consegui identificar a categoria.\n\nPor favor, reformule incluindo a categoria.\nExemplo: "gastei 50 em alimentação"',
    conversationCancelled: '🔄 Conversa cancelada. Você pode iniciar uma nova transação.',
    conversationExpired: '⏰ Conversa expirada por inatividade. Você pode iniciar uma nova transação.'
  },
  en: {
    phoneNotRegistered: '❌ Number not registered. Access the app to link your WhatsApp.',
    processingError: '❌ An error occurred while processing your message. Please try again.',
    unknownIntent: '🤔 I didn\'t understand your message. You can:\n\n📝 *Record:* "Spent 30 on groceries"\n📊 *Query:* "What\'s my balance?" or "Monthly expenses"',
    transactionRecorded: (amount: string, category: string, description: string) => 
      `✅ Transaction recorded!\n\n💸 Expense: ${amount}\n📁 Category: ${category}\n📝 ${description}`,
    incomeRecorded: (amount: string, category: string, description: string) => 
      `✅ Income recorded!\n\n💰 Amount: ${amount}\n📁 Category: ${category}\n📝 ${description}`,
    waitingUserInput: (question: string) => `🔍 I need more information:\n\n${question}`,
    categoryRequired: '⚠️ I couldn\'t identify the category.\n\nPlease rephrase including the category.\nExample: "spent 50 on food"',
    conversationCancelled: '🔄 Conversation cancelled. You can start a new transaction.',
    conversationExpired: '⏰ Conversation expired due to inactivity. You can start a new transaction.'
  },
  es: {
    phoneNotRegistered: '❌ Número no registrado. Accede a la app para vincular tu WhatsApp.',
    processingError: '❌ Ocurrió un error al procesar tu mensaje. Intenta de nuevo.',
    unknownIntent: '🤔 No entendí tu mensaje. Puedes:\n\n📝 *Registrar:* "Gasté 50 en uber"\n📊 *Consultar:* "¿Cuál es mi saldo?" o "Gastos del mes"',
    transactionRecorded: (amount: string, category: string, description: string) => 
      `✅ ¡Transacción registrada!\n\n💸 Gasto: ${amount}\n📁 Categoría: ${category}\n📝 ${description}`,
    incomeRecorded: (amount: string, category: string, description: string) => 
      `✅ ¡Ingreso registrado!\n\n💰 Valor: ${amount}\n📁 Categoría: ${category}\n📝 ${description}`,
    waitingUserInput: (question: string) => `🔍 Necesito más información:\n\n${question}`,
    categoryRequired: '⚠️ No pude identificar la categoría.\n\nPor favor, reformula incluyendo la categoría.\nEjemplo: "gasté 50 en comida"',
    conversationCancelled: '🔄 Conversación cancelada. Puedes iniciar una nueva transacción.',
    conversationExpired: '⏰ Conversación expirada por inactividad. Puedes iniciar una nueva transacción.'
  }
};

// ============================================================
// LANGUAGE DETECTION (Copiado de detect-message-intent)
// ============================================================
const LANGUAGE_PATTERNS = {
  pt: {
    words: ['gastei', 'paguei', 'comprei', 'recebi', 'transferi', 'depositei', 'saquei', 'qual', 'quanto', 'meu', 'minha', 'meus', 'minhas', 'hoje', 'ontem', 'amanhã', 'reais', 'cartão', 'conta', 'saldo', 'despesas', 'gastos', 'receitas', 'mês', 'mes', 'semana', 'categoria', 'categorias', 'total', 'resumo', 'olá', 'oi', 'bom dia', 'boa tarde', 'boa noite', 'obrigado', 'obrigada', 'por favor', 'já', 'não', 'sim', 'como', 'onde', 'porque', 'porquê'],
    patterns: [/r\$\s*[\d.,]+/i, /\d+\s*reais/i, /\bno\b/, /\bna\b/, /\bdo\b/, /\bda\b/, /\bde\b/, /ção\b/, /ções\b/]
  },
  en: {
    words: ['spent', 'paid', 'bought', 'received', 'transferred', 'deposited', 'withdrew', 'what', 'how', 'much', 'my', 'mine', 'today', 'yesterday', 'tomorrow', 'dollars', 'card', 'account', 'balance', 'expenses', 'spending', 'income', 'month', 'week', 'category', 'categories', 'total', 'summary', 'hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening', 'thank you', 'thanks', 'please', 'already', 'not', 'yes', 'where', 'why', 'because', 'the', 'this', 'that', 'with', 'from', 'for'],
    patterns: [/\$\s*[\d.,]+/, /\d+\s*dollars?/i, /\bthe\b/i, /\bwith\b/i, /\bfor\b/i, /\bfrom\b/i, /tion\b/, /ing\b/]
  },
  es: {
    words: ['gasté', 'pagué', 'compré', 'recibí', 'transferí', 'deposité', 'retiré', 'cuál', 'cuánto', 'mi', 'mis', 'hoy', 'ayer', 'mañana', 'pesos', 'euros', 'tarjeta', 'cuenta', 'saldo', 'gastos', 'ingresos', 'mes', 'semana', 'categoría', 'categorías', 'total', 'resumen', 'hola', 'buenos días', 'buenas tardes', 'buenas noches', 'gracias', 'por favor', 'ya', 'no', 'sí', 'como', 'donde', 'porque', 'qué', 'cómo', 'dónde', 'cuándo'],
    patterns: [/€\s*[\d.,]+/, /\d+\s*pesos?/i, /\d+\s*euros?/i, /\bel\b/, /\bla\b/, /\blos\b/, /\blas\b/, /ción\b/, /ciones\b/]
  }
};

// ============================================================
// INTENT PATTERNS (Copiado de detect-message-intent)
// ============================================================
const QUERY_PATTERNS = {
  balance: {
    pt: [/qual\s*(é\s*)?(o\s*)?meu\s*saldo/i, /saldo\s*(da|das|do|dos)?\s*(conta|contas)?/i, /quanto\s*tenho/i, /tenho\s*quanto/i],
    en: [/what('s|\s*is)?\s*my\s*balance/i, /balance\s*(of)?\s*(my)?\s*(account)?/i, /how\s*much\s*(do\s*)?i\s*have/i],
    es: [/cuál\s*es\s*mi\s*saldo/i, /saldo\s*(de\s*)?(mi\s*)?(cuenta)?/i, /cuánto\s*tengo/i]
  },
  monthly_expenses: {
    pt: [/gastos?\s*(do|deste|esse|nesse)?\s*mês/i, /despesas?\s*(do|deste|esse|nesse)?\s*mês/i, /quanto\s*(eu\s*)?gastei\s*(esse|nesse|no|este|neste)?\s*mês/i, /gastei\s*quanto\s*(esse|nesse|no)?\s*mês/i],
    en: [/expenses?\s*(this|for\s*this)?\s*month/i, /spending\s*(this|for\s*this)?\s*month/i, /how\s*much\s*(did\s*)?i\s*spen[dt]\s*(this)?\s*month/i, /monthly\s*expenses?/i],
    es: [/gastos?\s*(de\s*)?(este|ese)?\s*mes/i, /cuánto\s*gasté\s*(este|ese)?\s*mes/i, /gastos\s*mensuales/i]
  },
  monthly_income: {
    pt: [/receitas?\s*(do|deste|esse|nesse)?\s*mês/i, /recebimentos?\s*(do|deste|esse|nesse)?\s*mês/i, /quanto\s*(eu\s*)?recebi\s*(esse|nesse|no)?\s*mês/i, /ganhos?\s*(do)?\s*mês/i],
    en: [/income\s*(this|for\s*this)?\s*month/i, /earnings?\s*(this|for\s*this)?\s*month/i, /how\s*much\s*(did\s*)?i\s*(earn|receive)[d]?\s*(this)?\s*month/i, /monthly\s*income/i],
    es: [/ingresos?\s*(de\s*)?(este|ese)?\s*mes/i, /cuánto\s*recibí\s*(este|ese)?\s*mes/i, /ingresos\s*mensuales/i]
  },
  category_summary: {
    pt: [/gastos?\s*por\s*categoria/i, /resumo\s*(por)?\s*categoria/i, /categorias?\s*(com\s*)?mais\s*gastos?/i, /onde\s*(mais\s*)?gastei/i, /top\s*categorias?/i],
    en: [/expenses?\s*by\s*category/i, /spending\s*by\s*category/i, /summary\s*by\s*category/i, /where\s*(do\s*)?i\s*spend\s*(the)?\s*most/i, /top\s*categories?/i],
    es: [/gastos?\s*por\s*categoría/i, /resumen\s*por\s*categoría/i, /dónde\s*más\s*gasté/i, /top\s*categorías?/i]
  },
  recent_transactions: {
    pt: [/últimas?\s*transações?/i, /últimas?\s*movimentações?/i, /transações?\s*recentes?/i, /últimos?\s*gastos?/i, /últimas?\s*despesas?/i, /o\s*que\s*gastei\s*recentemente/i],
    en: [/last\s*transactions?/i, /recent\s*transactions?/i, /latest\s*(transactions?|expenses?|spending)/i, /what\s*(did\s*)?i\s*spen[dt]\s*recently/i],
    es: [/últimas?\s*transacciones?/i, /transacciones?\s*recientes?/i, /últimos?\s*gastos?/i, /qué\s*gasté\s*recientemente/i]
  },
  summary: {
    pt: [/resumo\s*(financeiro)?/i, /visão\s*geral/i, /como\s*(estou|estão)\s*(minhas?\s*)?(finanças|gastos|contas)?/i],
    en: [/financial\s*summary/i, /overview/i, /how\s*(are|is)\s*my\s*(finances?|spending|accounts?)/i],
    es: [/resumen\s*(financiero)?/i, /visión\s*general/i, /cómo\s*(están|está)\s*mis?\s*(finanzas?|gastos?|cuentas?)?/i]
  }
};

const RECORD_PATTERNS = {
  expense: {
    pt: [/gastei/i, /paguei/i, /comprei/i, /saquei/i],
    en: [/spent/i, /paid/i, /bought/i, /withdrew/i],
    es: [/gasté/i, /pagué/i, /compré/i, /retiré/i]
  },
  income: {
    pt: [/recebi/i, /ganhei/i, /entrou/i, /depositei/i],
    en: [/received/i, /earned/i, /got paid/i, /deposited/i],
    es: [/recibí/i, /gané/i, /me pagaron/i, /deposité/i]
  },
  transfer: {
    pt: [/transferi/i, /passei/i, /mandei/i],
    en: [/transferred/i, /sent/i, /wired/i],
    es: [/transferí/i, /envié/i, /mandé/i]
  }
};

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function normalizePhone(rawPhone: string): string {
  if (!rawPhone) return '';
  let phone = rawPhone.replace(/\D/g, '');
  phone = phone.replace(/^0+/, '');
  if (!phone.startsWith('55') && phone.length >= 10 && phone.length <= 11) {
    phone = '55' + phone;
  }
  return phone;
}

function detectLanguage(message: string): 'pt' | 'en' | 'es' {
  const msgLower = message.toLowerCase();
  const scores = { pt: 0, en: 0, es: 0 };
  
  for (const [lang, config] of Object.entries(LANGUAGE_PATTERNS)) {
    const langKey = lang as 'pt' | 'en' | 'es';
    
    for (const word of config.words) {
      const regex = new RegExp(`\\b${word}\\b`, 'i');
      if (regex.test(msgLower)) {
        scores[langKey] += 2;
      }
    }
    
    for (const pattern of config.patterns) {
      if (pattern.test(msgLower)) {
        scores[langKey] += 1;
      }
    }
  }
  
  const maxScore = Math.max(scores.pt, scores.en, scores.es);
  if (maxScore === 0) return 'pt';
  
  if (scores.en > scores.pt && scores.en > scores.es) return 'en';
  if (scores.es > scores.pt && scores.es > scores.en) return 'es';
  return 'pt';
}

function detectQueryIntent(message: string, language: 'pt' | 'en' | 'es'): { isQuery: boolean; queryType: string | null } {
  const msgLower = message.toLowerCase();
  
  for (const [queryType, patterns] of Object.entries(QUERY_PATTERNS)) {
    const langPatterns = patterns[language as keyof typeof patterns] || patterns.pt;
    for (const pattern of langPatterns) {
      if (pattern.test(msgLower)) {
        return { isQuery: true, queryType };
      }
    }
  }
  
  const questionIndicators = {
    pt: [/^qual/i, /^quanto/i, /^como/i, /^onde/i, /\?$/],
    en: [/^what/i, /^how/i, /^where/i, /\?$/],
    es: [/^cuál/i, /^cuánto/i, /^cómo/i, /^dónde/i, /\?$/]
  };
  
  const indicators = questionIndicators[language] || questionIndicators.pt;
  for (const pattern of indicators) {
    if (pattern.test(msgLower)) {
      return { isQuery: true, queryType: 'general' };
    }
  }
  
  return { isQuery: false, queryType: null };
}

function detectRecordIntent(message: string, language: 'pt' | 'en' | 'es'): { isRecord: boolean; transactionType: string | null } {
  const msgLower = message.toLowerCase();
  
  for (const [transactionType, patterns] of Object.entries(RECORD_PATTERNS)) {
    const langPatterns = patterns[language as keyof typeof patterns] || patterns.pt;
    for (const pattern of langPatterns) {
      if (pattern.test(msgLower)) {
        const hasValue = /[\$€R\$]?\s*[\d.,]+|[\d.,]+\s*(reais|dollars?|euros?|pesos?)/i.test(msgLower);
        if (hasValue) {
          return { isRecord: true, transactionType };
        }
      }
    }
  }
  
  return { isRecord: false, transactionType: null };
}

function formatCurrency(amount: number, currency: string = 'BRL'): string {
  const symbols: Record<string, string> = { BRL: 'R$', USD: '$', EUR: '€' };
  const symbol = symbols[currency] || currency;
  return `${symbol} ${amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ============================================================
// INTERNAL EDGE FUNCTION CALLERS
// ============================================================

async function callWhatsappQuery(
  userId: string, 
  queryType: string, 
  language: string
): Promise<{ success: boolean; response: string }> {
  console.log('[router] Calling whatsapp-query:', { userId, queryType, language });
  
  const response = await fetch(`${SUPABASE_URL}/functions/v1/whatsapp-query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
    },
    body: JSON.stringify({
      user_id: userId,
      query_type: queryType,
      language: language
    })
  });
  
  const data = await response.json();
  console.log('[router] whatsapp-query response:', { success: data.success, responseLength: data.response?.length });
  
  return {
    success: data.success,
    response: data.response || data.error || 'Error processing query'
  };
}

async function callWhatsappInput(
  phoneNumber: string, 
  message: string, 
  whatsappMessageId: string
): Promise<any> {
  console.log('[router] Calling whatsapp-input POST:', { phoneNumber, messagePreview: message.substring(0, 50) });
  
  const response = await fetch(`${SUPABASE_URL}/functions/v1/whatsapp-input`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
    },
    body: JSON.stringify({
      phone_number: phoneNumber,
      raw_message: message,
      whatsapp_message_id: whatsappMessageId,
      source: 'whatsapp'
    })
  });
  
  const data = await response.json();
  console.log('[router] whatsapp-input response:', { 
    success: data.success, 
    status: data.status, 
    inputId: data.input_id,
    code: data.code
  });
  
  return data;
}

async function callProcessFinancialInput(inputId: string): Promise<any> {
  console.log('[router] Calling process-financial-input:', { inputId });
  
  const response = await fetch(`${SUPABASE_URL}/functions/v1/process-financial-input`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
    },
    body: JSON.stringify({
      input_id: inputId,
      force_confirm: true
    })
  });
  
  const data = await response.json();
  console.log('[router] process-financial-input response:', { 
    success: data.success, 
    status: data.status,
    transactionId: data.transaction_id,
    error: data.error
  });
  
  return data;
}

// ============================================================
// MAIN HANDLER
// ============================================================
serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ success: false, error: 'Only POST is supported' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const body = await req.json();
    
    const { 
      phone_number, 
      message, 
      whatsapp_message_id 
    } = body;

    console.log('[router] Received request:', { 
      phone_number: phone_number?.substring(0, 8) + '...', 
      messagePreview: message?.substring(0, 50),
      whatsapp_message_id 
    });

    // ========================================
    // PASSO 1: VALIDAÇÕES
    // ========================================
    if (!phone_number) {
      return new Response(
        JSON.stringify({ success: false, error: 'phone_number is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!message) {
      return new Response(
        JSON.stringify({ success: false, error: 'message is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ========================================
    // PASSO 2: DETECTAR IDIOMA E INTENÇÃO
    // ========================================
    const language = detectLanguage(message);
    const msgs = MESSAGES[language];
    
    console.log('[router] Detected language:', language);

    // ========================================
    // PASSO 3: BUSCAR USUÁRIO PELO TELEFONE
    // ========================================
    const normalizedPhone = normalizePhone(phone_number);
    
    // Buscar perfil do usuário
    let profile = null;
    
    // Tentar busca exata
    const { data: exactMatch } = await supabase
      .from('profiles')
      .select('user_id, display_name, phone_number')
      .eq('phone_number', normalizedPhone)
      .maybeSingle();

    if (exactMatch) {
      profile = exactMatch;
    } else {
      // Tentar variações
      const phoneVariations = [
        normalizedPhone,
        normalizedPhone.startsWith('55') ? normalizedPhone.slice(2) : normalizedPhone,
        normalizedPhone.startsWith('55') ? '0' + normalizedPhone.slice(2) : normalizedPhone,
      ];
      
      for (const variation of phoneVariations) {
        const { data: varMatch } = await supabase
          .from('profiles')
          .select('user_id, display_name, phone_number')
          .eq('phone_number', variation)
          .maybeSingle();
        
        if (varMatch) {
          profile = varMatch;
          break;
        }
      }
    }

    if (!profile) {
      console.log('[router] Phone not registered:', normalizedPhone);
      return new Response(
        JSON.stringify({ 
          success: true, 
          action: 'reply',
          response: msgs.phoneNotRegistered,
          language,
          intent: 'error',
          error_code: 'PHONE_NOT_REGISTERED'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[router] User found:', { userId: profile.user_id.substring(0, 8), name: profile.display_name });

    // ========================================
    // PASSO 4: CLASSIFICAR INTENÇÃO
    // ========================================
    const queryResult = detectQueryIntent(message, language);
    const recordResult = detectRecordIntent(message, language);

    console.log('[router] Intent detection:', { 
      isQuery: queryResult.isQuery, 
      queryType: queryResult.queryType,
      isRecord: recordResult.isRecord,
      transactionType: recordResult.transactionType
    });

    // ========================================
    // PASSO 5A: PROCESSAR QUERY (CONSULTA)
    // ========================================
    if (queryResult.isQuery) {
      console.log('[router] Processing QUERY intent:', queryResult.queryType);
      
      const queryResponse = await callWhatsappQuery(
        profile.user_id, 
        queryResult.queryType || 'general', 
        language
      );
      
      return new Response(
        JSON.stringify({
          success: true,
          action: 'reply',
          response: queryResponse.response,
          language,
          intent: 'query',
          query_type: queryResult.queryType,
          user_id: profile.user_id
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ========================================
    // PASSO 5B: PROCESSAR RECORD (REGISTRO)
    // ========================================
    if (recordResult.isRecord) {
      console.log('[router] Processing RECORD intent:', recordResult.transactionType);
      
      // 5B.1: Criar/atualizar input via whatsapp-input
      const inputResult = await callWhatsappInput(
        phone_number, 
        message, 
        whatsapp_message_id || `router-${Date.now()}`
      );
      
      // Verificar erros do whatsapp-input
      if (!inputResult.success) {
        console.log('[router] whatsapp-input failed:', inputResult.error);
        return new Response(
          JSON.stringify({
            success: true,
            action: 'reply',
            response: inputResult.code === 'PHONE_NOT_REGISTERED' 
              ? msgs.phoneNotRegistered 
              : msgs.processingError,
            language,
            intent: 'record',
            error_code: inputResult.code
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Status handlers
      const status = inputResult.status;
      
      // Se já foi processado anteriormente
      if (status === 'processed') {
        return new Response(
          JSON.stringify({
            success: true,
            action: 'reply',
            response: language === 'en' 
              ? '✅ This transaction was already recorded.'
              : language === 'es'
              ? '✅ Esta transacción ya fue registrada.'
              : '✅ Esta transação já foi registrada.',
            language,
            intent: 'record',
            status: 'processed',
            transaction_id: inputResult.transaction_id
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Se está aguardando mais informações do usuário
      if (status === 'waiting_user_input') {
        // O input foi atualizado com a resposta do usuário
        // Tentar processar agora
        console.log('[router] Input waiting for more data, attempting to process...');
        
        const processResult = await callProcessFinancialInput(inputResult.input_id);
        
        if (processResult.success && processResult.status === 'processed') {
          // Transação criada com sucesso!
          const amount = formatCurrency(processResult.amount || 0, processResult.currency || 'BRL');
          const category = processResult.category_name || 'Sem categoria';
          const description = processResult.description || message.substring(0, 30);
          
          const responseMsg = processResult.transaction_type === 'income'
            ? msgs.incomeRecorded(amount, category, description)
            : msgs.transactionRecorded(amount, category, description);
          
          return new Response(
            JSON.stringify({
              success: true,
              action: 'reply',
              response: responseMsg,
              language,
              intent: 'record',
              status: 'processed',
              transaction_id: processResult.transaction_id,
              user_id: profile.user_id
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        // Se ainda precisa de mais dados
        if (processResult.error_code === 'CATEGORY_REQUIRED') {
          return new Response(
            JSON.stringify({
              success: true,
              action: 'reply',
              response: msgs.categoryRequired,
              language,
              intent: 'record',
              status: 'waiting_user_input',
              input_id: inputResult.input_id
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        // Outra pergunta pendente
        const question = processResult.question || processResult.error || '';
        return new Response(
          JSON.stringify({
            success: true,
            action: 'reply',
            response: msgs.waitingUserInput(question),
            language,
            intent: 'record',
            status: 'waiting_user_input',
            input_id: inputResult.input_id
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Se input foi criado com status 'received' ou 'confirmed'
      if (status === 'received' || status === 'confirmed') {
        console.log('[router] Input created/confirmed, processing...');
        
        const processResult = await callProcessFinancialInput(inputResult.input_id);
        
        if (processResult.success && processResult.status === 'processed') {
          const amount = formatCurrency(processResult.amount || 0, processResult.currency || 'BRL');
          const category = processResult.category_name || 'Sem categoria';
          const description = processResult.description || message.substring(0, 30);
          
          const responseMsg = processResult.transaction_type === 'income'
            ? msgs.incomeRecorded(amount, category, description)
            : msgs.transactionRecorded(amount, category, description);
          
          return new Response(
            JSON.stringify({
              success: true,
              action: 'reply',
              response: responseMsg,
              language,
              intent: 'record',
              status: 'processed',
              transaction_id: processResult.transaction_id,
              user_id: profile.user_id
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        // Erro no processamento
        if (processResult.error_code === 'CATEGORY_REQUIRED') {
          return new Response(
            JSON.stringify({
              success: true,
              action: 'reply',
              response: msgs.categoryRequired,
              language,
              intent: 'record',
              status: 'waiting_user_input',
              input_id: inputResult.input_id
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        // Outro erro
        console.log('[router] Process failed:', processResult.error);
        return new Response(
          JSON.stringify({
            success: true,
            action: 'reply',
            response: msgs.processingError,
            language,
            intent: 'record',
            status: 'error',
            error: processResult.error
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Status especiais
      if (status === 'cancelled') {
        return new Response(
          JSON.stringify({
            success: true,
            action: 'reply',
            response: msgs.conversationCancelled,
            language,
            intent: 'record',
            status: 'cancelled'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (status === 'expired') {
        return new Response(
          JSON.stringify({
            success: true,
            action: 'reply',
            response: msgs.conversationExpired,
            language,
            intent: 'record',
            status: 'expired'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // ========================================
    // PASSO 5C: INTENÇÃO DESCONHECIDA
    // ========================================
    console.log('[router] Unknown intent, returning help message');
    
    return new Response(
      JSON.stringify({
        success: true,
        action: 'reply',
        response: msgs.unknownIntent,
        language,
        intent: 'unknown',
        user_id: profile.user_id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[router] Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Internal error',
        response: MESSAGES.pt.processingError
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
