import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
};

// ============================================================
// LANGUAGE DETECTION PATTERNS
// ============================================================
const LANGUAGE_PATTERNS = {
  pt: {
    // Portuguese indicators
    words: ['gastei', 'paguei', 'comprei', 'recebi', 'transferi', 'depositei', 'saquei', 'qual', 'quanto', 'meu', 'minha', 'meus', 'minhas', 'hoje', 'ontem', 'amanhã', 'reais', 'cartão', 'conta', 'saldo', 'despesas', 'gastos', 'receitas', 'mês', 'mes', 'semana', 'categoria', 'categorias', 'total', 'resumo', 'olá', 'oi', 'bom dia', 'boa tarde', 'boa noite', 'obrigado', 'obrigada', 'por favor', 'já', 'não', 'sim', 'como', 'onde', 'porque', 'porquê'],
    patterns: [/r\$\s*[\d.,]+/i, /\d+\s*reais/i, /\bno\b/, /\bna\b/, /\bdo\b/, /\bda\b/, /\bde\b/, /ção\b/, /ções\b/]
  },
  en: {
    // English indicators
    words: ['spent', 'paid', 'bought', 'received', 'transferred', 'deposited', 'withdrew', 'what', 'how', 'much', 'my', 'mine', 'today', 'yesterday', 'tomorrow', 'dollars', 'card', 'account', 'balance', 'expenses', 'spending', 'income', 'month', 'week', 'category', 'categories', 'total', 'summary', 'hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening', 'thank you', 'thanks', 'please', 'already', 'not', 'yes', 'where', 'why', 'because', 'the', 'this', 'that', 'with', 'from', 'for'],
    patterns: [/\$\s*[\d.,]+/, /\d+\s*dollars?/i, /\bthe\b/i, /\bwith\b/i, /\bfor\b/i, /\bfrom\b/i, /tion\b/, /ing\b/]
  },
  es: {
    // Spanish indicators
    words: ['gasté', 'pagué', 'compré', 'recibí', 'transferí', 'deposité', 'retiré', 'cuál', 'cuánto', 'mi', 'mis', 'hoy', 'ayer', 'mañana', 'pesos', 'euros', 'tarjeta', 'cuenta', 'saldo', 'gastos', 'ingresos', 'mes', 'semana', 'categoría', 'categorías', 'total', 'resumen', 'hola', 'buenos días', 'buenas tardes', 'buenas noches', 'gracias', 'por favor', 'ya', 'no', 'sí', 'como', 'donde', 'porque', 'qué', 'cómo', 'dónde', 'cuándo'],
    patterns: [/€\s*[\d.,]+/, /\d+\s*pesos?/i, /\d+\s*euros?/i, /\bel\b/, /\bla\b/, /\blos\b/, /\blas\b/, /ción\b/, /ciones\b/]
  }
};

// ============================================================
// INTENT PATTERNS
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

/**
 * Detect the language of the message
 */
function detectLanguage(message: string): 'pt' | 'en' | 'es' {
  const msgLower = message.toLowerCase();
  const scores = { pt: 0, en: 0, es: 0 };
  
  // Check word matches
  for (const [lang, config] of Object.entries(LANGUAGE_PATTERNS)) {
    const langKey = lang as 'pt' | 'en' | 'es';
    
    // Word matches
    for (const word of config.words) {
      const regex = new RegExp(`\\b${word}\\b`, 'i');
      if (regex.test(msgLower)) {
        scores[langKey] += 2;
      }
    }
    
    // Pattern matches
    for (const pattern of config.patterns) {
      if (pattern.test(msgLower)) {
        scores[langKey] += 1;
      }
    }
  }
  
  console.log('[detect-intent] Language scores:', scores);
  
  // Return the language with highest score, default to Portuguese
  const maxScore = Math.max(scores.pt, scores.en, scores.es);
  if (maxScore === 0) return 'pt'; // Default
  
  if (scores.en > scores.pt && scores.en > scores.es) return 'en';
  if (scores.es > scores.pt && scores.es > scores.en) return 'es';
  return 'pt';
}

/**
 * Detect if the message is a query and what type
 */
function detectQueryIntent(message: string, language: 'pt' | 'en' | 'es'): { isQuery: boolean; queryType: string | null } {
  const msgLower = message.toLowerCase();
  
  // Check each query type
  for (const [queryType, patterns] of Object.entries(QUERY_PATTERNS)) {
    const langPatterns = patterns[language] || patterns.pt;
    for (const pattern of langPatterns) {
      if (pattern.test(msgLower)) {
        return { isQuery: true, queryType };
      }
    }
  }
  
  // Check if it looks like a question without specific type
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

/**
 * Detect if the message is a transaction record intent
 */
function detectRecordIntent(message: string, language: 'pt' | 'en' | 'es'): { isRecord: boolean; transactionType: string | null } {
  const msgLower = message.toLowerCase();
  
  // Check each record type
  for (const [transactionType, patterns] of Object.entries(RECORD_PATTERNS)) {
    const langPatterns = patterns[language as keyof typeof patterns] || patterns.pt;
    for (const pattern of langPatterns) {
      if (pattern.test(msgLower)) {
        // Also check if there's a value mentioned
        const hasValue = /[\$€R\$]?\s*[\d.,]+|[\d.,]+\s*(reais|dollars?|euros?|pesos?)/i.test(msgLower);
        if (hasValue) {
          return { isRecord: true, transactionType };
        }
      }
    }
  }
  
  return { isRecord: false, transactionType: null };
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
    const body = await req.json();
    const { message } = body;

    if (!message || typeof message !== 'string') {
      return new Response(
        JSON.stringify({ success: false, error: 'message is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[detect-intent] Processing message:', message.substring(0, 100));

    // 1. Detect language
    const language = detectLanguage(message);
    console.log('[detect-intent] Detected language:', language);

    // 2. Check if it's a query
    const queryResult = detectQueryIntent(message, language);
    if (queryResult.isQuery) {
      console.log('[detect-intent] Detected QUERY intent:', queryResult.queryType);
      return new Response(
        JSON.stringify({
          success: true,
          language,
          intent: 'query',
          query_type: queryResult.queryType,
          message_preview: message.substring(0, 50)
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Check if it's a record intent
    const recordResult = detectRecordIntent(message, language);
    if (recordResult.isRecord) {
      console.log('[detect-intent] Detected RECORD intent:', recordResult.transactionType);
      return new Response(
        JSON.stringify({
          success: true,
          language,
          intent: 'record',
          transaction_type: recordResult.transactionType,
          message_preview: message.substring(0, 50)
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. Unknown intent - default to record (AI will figure it out)
    console.log('[detect-intent] Unknown intent, defaulting to record');
    return new Response(
      JSON.stringify({
        success: true,
        language,
        intent: 'unknown',
        message_preview: message.substring(0, 50)
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[detect-intent] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Internal error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
