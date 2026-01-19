import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// ============================================================
// LANGUAGE DETECTION PATTERNS
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
// RESPONSE MESSAGES (MULTI-LANGUAGE)
// ============================================================
const RESPONSE_MESSAGES = {
  pt: {
    expenseRecorded: (amountOriginal: string, currencyOriginal: string, amountConverted: string, currencyConverted: string, rate: number | null, category: string) => {
      if (rate && currencyOriginal !== currencyConverted) {
        return `💳 Gasto registrado\n${currencyOriginal} ${amountOriginal} → ${currencyConverted} ${amountConverted} (câmbio ${rate.toFixed(4)})\n📁 ${category}`;
      }
      return `💳 Gasto registrado\n${currencyConverted} ${amountConverted}\n📁 ${category}`;
    },
    incomeRecorded: (amountOriginal: string, currencyOriginal: string, amountConverted: string, currencyConverted: string, rate: number | null, category: string) => {
      if (rate && currencyOriginal !== currencyConverted) {
        return `💰 Receita registrada\n${currencyOriginal} ${amountOriginal} → ${currencyConverted} ${amountConverted} (câmbio ${rate.toFixed(4)})\n📁 ${category}`;
      }
      return `💰 Receita registrada\n${currencyConverted} ${amountConverted}\n📁 ${category}`;
    }
  },
  en: {
    expenseRecorded: (amountOriginal: string, currencyOriginal: string, amountConverted: string, currencyConverted: string, rate: number | null, category: string) => {
      if (rate && currencyOriginal !== currencyConverted) {
        return `💳 Expense recorded\n${currencyOriginal} ${amountOriginal} → ${currencyConverted} ${amountConverted} (exchange rate ${rate.toFixed(4)})\n📁 ${category}`;
      }
      return `💳 Expense recorded\n${currencyConverted} ${amountConverted}\n📁 ${category}`;
    },
    incomeRecorded: (amountOriginal: string, currencyOriginal: string, amountConverted: string, currencyConverted: string, rate: number | null, category: string) => {
      if (rate && currencyOriginal !== currencyConverted) {
        return `💰 Income recorded\n${currencyOriginal} ${amountOriginal} → ${currencyConverted} ${amountConverted} (exchange rate ${rate.toFixed(4)})\n📁 ${category}`;
      }
      return `💰 Income recorded\n${currencyConverted} ${amountConverted}\n📁 ${category}`;
    }
  },
  es: {
    expenseRecorded: (amountOriginal: string, currencyOriginal: string, amountConverted: string, currencyConverted: string, rate: number | null, category: string) => {
      if (rate && currencyOriginal !== currencyConverted) {
        return `💳 Gasto registrado\n${currencyOriginal} ${amountOriginal} → ${currencyConverted} ${amountConverted} (cambio ${rate.toFixed(4)})\n📁 ${category}`;
      }
      return `💳 Gasto registrado\n${currencyConverted} ${amountConverted}\n📁 ${category}`;
    },
    incomeRecorded: (amountOriginal: string, currencyOriginal: string, amountConverted: string, currencyConverted: string, rate: number | null, category: string) => {
      if (rate && currencyOriginal !== currencyConverted) {
        return `💰 Ingreso registrado\n${currencyOriginal} ${amountOriginal} → ${currencyConverted} ${amountConverted} (cambio ${rate.toFixed(4)})\n📁 ${category}`;
      }
      return `💰 Ingreso registrado\n${currencyConverted} ${amountConverted}\n📁 ${category}`;
    }
  }
};

// ============================================================
// HELPER FUNCTIONS
// ============================================================

// Detect language from message
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

// Format currency for display
function formatCurrencyDisplay(amount: number, currency: string): string {
  const symbols: Record<string, string> = { BRL: 'R$', USD: '$', EUR: '€' };
  const symbol = symbols[currency] || currency;
  return `${symbol} ${amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Helper: Validar se é um UUID válido
function isValidUUID(str: string | null | undefined): boolean {
  if (!str) return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
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
// CURRENCY CONVERSION FUNCTIONS
// ============================================================

interface ExchangeRate {
  base_currency: string;
  target_currency: string;
  rate: number;
}

// Get exchange rate from database
async function getExchangeRate(
  supabase: any,
  fromCurrency: string,
  toCurrency: string
): Promise<number | null> {
  if (fromCurrency === toCurrency) return 1;
  
  console.log(`[process-financial-input] Looking up exchange rate: ${fromCurrency} -> ${toCurrency}`);
  
  // Rates are stored as BRL -> target currency
  // So if we need USD -> BRL, we need 1 / (BRL -> USD rate)
  
  if (fromCurrency === 'BRL') {
    // BRL -> target currency (direct lookup)
    const { data, error } = await supabase
      .from('exchange_rates')
      .select('rate')
      .eq('base_currency', 'BRL')
      .eq('target_currency', toCurrency)
      .single();
    
    if (error || !data) {
      console.warn('[process-financial-input] Exchange rate not found:', error);
      return null;
    }
    
    console.log(`[process-financial-input] Found rate BRL -> ${toCurrency}: ${data.rate}`);
    return data.rate;
  } else if (toCurrency === 'BRL') {
    // target currency -> BRL (inverse of BRL -> source)
    const { data, error } = await supabase
      .from('exchange_rates')
      .select('rate')
      .eq('base_currency', 'BRL')
      .eq('target_currency', fromCurrency)
      .single();
    
    if (error || !data) {
      console.warn('[process-financial-input] Exchange rate not found:', error);
      return null;
    }
    
    // Inverse: if BRL -> USD is 0.18, then USD -> BRL is 1/0.18 = 5.55
    const inverseRate = 1 / data.rate;
    console.log(`[process-financial-input] Found inverse rate ${fromCurrency} -> BRL: ${inverseRate} (from ${data.rate})`);
    return inverseRate;
  } else {
    // Cross-rate: USD -> EUR = (USD -> BRL) * (BRL -> EUR)
    const { data: rateFrom } = await supabase
      .from('exchange_rates')
      .select('rate')
      .eq('base_currency', 'BRL')
      .eq('target_currency', fromCurrency)
      .single();
    
    const { data: rateTo } = await supabase
      .from('exchange_rates')
      .select('rate')
      .eq('base_currency', 'BRL')
      .eq('target_currency', toCurrency)
      .single();
    
    if (!rateFrom || !rateTo) {
      console.warn('[process-financial-input] Cross-rate not found');
      return null;
    }
    
    // Cross rate: (1/rateFrom) * rateTo
    const crossRate = rateTo.rate / rateFrom.rate;
    console.log(`[process-financial-input] Cross rate ${fromCurrency} -> ${toCurrency}: ${crossRate}`);
    return crossRate;
  }
}

// Convert amount between currencies
function convertCurrency(
  amount: number,
  rate: number
): number {
  // Work with cents to avoid floating point errors
  const amountCents = Math.round(amount * 100);
  const resultCents = Math.round(amountCents * rate);
  return resultCents / 100;
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

    // 2.1 Resolver CATEGORIA se não tiver UUID válido (BUSCAR POR KEYWORDS DAS TAGS - MULTI-IDIOMA)
    if (!isValidUUID(resolved_category_id) && input.category_hint) {
      console.log('[process-financial-input] Resolving category from hint:', input.category_hint);
      const searchTerm = input.category_hint.trim().toLowerCase();
      
      // 1) PRIMEIRO: Buscar tag por KEYWORDS em TODOS OS IDIOMAS (pt, en, es)
      // Isso encontra "food" nas keywords_en, "comida" nas keywords_pt, etc.
      let tagMatches: any[] = [];
      
      // Buscar em keywords_pt
      const { data: tagByKeywordPt } = await supabase
        .from('category_tags')
        .select('id, name_pt, name_en, name_es, keywords_pt, keywords_en, keywords_es')
        .contains('keywords_pt', [searchTerm]);
      
      if (tagByKeywordPt && tagByKeywordPt.length > 0) {
        console.log('[process-financial-input] Found tag via KEYWORDS_PT:', tagByKeywordPt.map((t: any) => t.name_pt));
        tagMatches = tagByKeywordPt;
      }
      
      // Se não encontrou, buscar em keywords_en
      if (tagMatches.length === 0) {
        const { data: tagByKeywordEn } = await supabase
          .from('category_tags')
          .select('id, name_pt, name_en, name_es, keywords_pt, keywords_en, keywords_es')
          .contains('keywords_en', [searchTerm]);
        
        if (tagByKeywordEn && tagByKeywordEn.length > 0) {
          console.log('[process-financial-input] Found tag via KEYWORDS_EN:', tagByKeywordEn.map((t: any) => t.name_en));
          tagMatches = tagByKeywordEn;
        }
      }
      
      // Se não encontrou, buscar em keywords_es
      if (tagMatches.length === 0) {
        const { data: tagByKeywordEs } = await supabase
          .from('category_tags')
          .select('id, name_pt, name_en, name_es, keywords_pt, keywords_en, keywords_es')
          .contains('keywords_es', [searchTerm]);
        
        if (tagByKeywordEs && tagByKeywordEs.length > 0) {
          console.log('[process-financial-input] Found tag via KEYWORDS_ES:', tagByKeywordEs.map((t: any) => t.name_es));
          tagMatches = tagByKeywordEs;
        }
      }
      
      // 2) FALLBACK: Buscar tag por nome parcial em todos os idiomas
      if (tagMatches.length === 0) {
        console.log('[process-financial-input] No keyword match, trying name ilike in all languages...');
        
        // Tentar por name_pt
        let { data: tagByName } = await supabase
          .from('category_tags')
          .select('id, name_pt, name_en, name_es')
          .ilike('name_pt', `%${searchTerm}%`);
        
        if (!tagByName || tagByName.length === 0) {
          // Tentar por name_en
          const { data: tagByNameEn } = await supabase
            .from('category_tags')
            .select('id, name_pt, name_en, name_es')
            .ilike('name_en', `%${searchTerm}%`);
          tagByName = tagByNameEn;
        }
        
        if (!tagByName || tagByName.length === 0) {
          // Tentar por name_es
          const { data: tagByNameEs } = await supabase
            .from('category_tags')
            .select('id, name_pt, name_en, name_es')
            .ilike('name_es', `%${searchTerm}%`);
          tagByName = tagByNameEs;
        }
        
        if (tagByName && tagByName.length > 0) {
          console.log('[process-financial-input] Found tag via NAME (multi-lang):', tagByName.map((t: any) => t.name_pt || t.name_en));
          tagMatches = tagByName;
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
          console.log('[process-financial-input] Found default category via tag:', defaultCategoryId);
          
          // 4) Mapear para categoria do usuário via default_category_id
          const { data: userCategory } = await supabase
            .from('categories')
            .select('id, name')
            .eq('user_id', input.user_id)
            .eq('default_category_id', defaultCategoryId)
            .is('deleted_at', null)
            .limit(1)
            .single();
          
          if (userCategory) {
            resolved_category_id = userCategory.id;
            console.log('[process-financial-input] Category resolved via TAG/KEYWORD (multi-lang):', searchTerm, '->', userCategory.name);
          }
        }
      }
      
      // 5) FALLBACK: Busca direta pelo nome da categoria do usuário
      if (!resolved_category_id) {
        console.log('[process-financial-input] Tag search failed, trying direct name match...');
        
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
          console.log('[process-financial-input] Category resolved by NAME:', resolved_category_id);
        }
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
          
          // Função de busca reutilizável COM NORMALIZAÇÃO DE ACENTOS
          const findCardInList = (cardList: typeof cards) => {
            const normalizedHint = normalizeText(input.card_hint);
            
            // Primeiro: busca exata normalizada
            let match = cardList.find((card: { id: string; name: string; card_type: string }) => 
              normalizeText(card.name) === normalizedHint
            );
            
            // Segundo: busca por substring completa normalizada
            if (!match) {
              match = cardList.find((card: { id: string; name: string; card_type: string }) => 
                normalizeText(card.name).includes(normalizedHint)
              );
            }
            
            // Terceiro: hint normalizado contém nome normalizado do cartão
            if (!match) {
              match = cardList.find((card: { id: string; name: string; card_type: string }) => 
                normalizedHint.includes(normalizeText(card.name))
              );
            }
            
            // Quarto: busca por palavras-chave normalizadas
            if (!match && words.length > 0) {
              const normalizedWords = words.map((w: string) => normalizeText(w));
              match = cardList.find((card: { id: string; name: string; card_type: string }) => {
                const cardName = normalizeText(card.name);
                return normalizedWords.some((word: string) => cardName.includes(word));
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
    // PASSO 4.5: DETECTAR MOEDAS E CONVERTER SE NECESSÁRIO
    // (Precisa vir antes da validação de saldo)
    // ========================================
    const detectedLanguage = detectLanguage(input.raw_message || '');
    console.log('[process-financial-input] Detected language:', detectedLanguage);
    
    // Moeda original do gasto (extraída pela IA)
    const originalCurrency = input.currency || 'BRL';
    const originalAmount = Math.abs(input.amount);
    
    // Buscar moeda da conta/cartão destino
    let targetCurrency = 'BRL';
    let targetResourceName = '';
    
    if (resource_type === 'account' && resolved_account_id) {
      const { data: accountCurrencyData } = await supabase
        .from('accounts')
        .select('currency, name')
        .eq('id', resolved_account_id)
        .single();
      
      if (accountCurrencyData) {
        targetCurrency = accountCurrencyData.currency || 'BRL';
        targetResourceName = accountCurrencyData.name;
      }
    } else if (resource_type === 'card' && resolved_card_id) {
      const { data: cardCurrencyData } = await supabase
        .from('cards')
        .select('currency, name')
        .eq('id', resolved_card_id)
        .single();
      
      if (cardCurrencyData) {
        targetCurrency = cardCurrencyData.currency || 'BRL';
        targetResourceName = cardCurrencyData.name;
      }
    }
    
    console.log('[process-financial-input] Currency check:', { 
      originalCurrency, 
      targetCurrency, 
      resourceName: targetResourceName 
    });
    
    // Converter moeda se necessário
    let finalAmount = originalAmount;
    let exchangeRateUsed: number | null = null;
    let amountOriginal: number | null = null;
    let currencyOriginal: string | null = null;
    
    if (originalCurrency !== targetCurrency) {
      console.log('[process-financial-input] Currency conversion needed:', originalCurrency, '->', targetCurrency);
      
      const rate = await getExchangeRate(supabase, originalCurrency, targetCurrency);
      
      if (rate) {
        exchangeRateUsed = rate;
        amountOriginal = originalAmount;
        currencyOriginal = originalCurrency;
        finalAmount = convertCurrency(originalAmount, rate);
        
        console.log('[process-financial-input] Conversion result:', {
          originalAmount,
          originalCurrency,
          rate,
          finalAmount,
          targetCurrency
        });
      } else {
        console.warn('[process-financial-input] Exchange rate not found, using original amount');
      }
    }

    // ========================================
    // PASSO 4.6: VALIDAR SALDO DA CONTA (se for despesa e usar conta)
    // Agora usando o valor CONVERTIDO
    // ========================================
    if (resource_type === 'account' && resolved_account_id && input.transaction_type === 'expense') {
      console.log('[process-financial-input] Validating account balance for expense...');
      
      const { data: accountData, error: accountError } = await supabase
        .from('accounts')
        .select('balance, name, currency, overdraft_limit')
        .eq('id', resolved_account_id)
        .single();

      if (accountError || !accountData) {
        console.error('[process-financial-input] Could not fetch account for balance check:', accountError);
        return new Response(
          JSON.stringify({ 
            success: false, 
            status: 'error',
            error: 'Não foi possível verificar o saldo da conta.',
            error_code: 'ACCOUNT_FETCH_ERROR',
            hint: 'Tente novamente ou verifique se a conta existe.'
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Calcular saldo disponível (saldo atual + limite de cheque especial)
      const currentBalance = accountData.balance || 0;
      const overdraftLimit = accountData.overdraft_limit || 0;
      const availableBalance = currentBalance + overdraftLimit;
      // Usar valor CONVERTIDO para validação de saldo
      const transactionAmount = finalAmount;

      console.log('[process-financial-input] Balance check (converted amount):', { 
        currentBalance, 
        overdraftLimit, 
        availableBalance, 
        transactionAmount,
        accountName: accountData.name,
        originalAmount: amountOriginal,
        originalCurrency: currencyOriginal
      });

      if (transactionAmount > availableBalance) {
        console.log('[process-financial-input] INSUFFICIENT_BALANCE - Rejecting transaction');
        
        const formattedBalance = formatCurrencyDisplay(currentBalance, accountData.currency || 'BRL');
        const formattedAvailable = formatCurrencyDisplay(availableBalance, accountData.currency || 'BRL');
        const formattedAmount = formatCurrencyDisplay(transactionAmount, targetCurrency);

        return new Response(
          JSON.stringify({ 
            success: false, 
            status: 'error',
            error: `Saldo insuficiente na conta "${accountData.name}".`,
            error_code: 'INSUFFICIENT_BALANCE',
            hint: `Saldo atual: ${formattedBalance}. Disponível (com limite): ${formattedAvailable}. Valor da transação: ${formattedAmount}.`,
            details: {
              account_name: accountData.name,
              current_balance: currentBalance,
              available_balance: availableBalance,
              requested_amount: transactionAmount,
              currency: accountData.currency || 'BRL'
            }
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }



    // ========================================
    // PASSO 6: CRIAR TRANSAÇÃO
    // ========================================
    console.log('[process-financial-input] Creating transaction...');

    const transactionDate = input.transaction_date || new Date().toISOString().split('T')[0];
    const description = input.description_hint || input.raw_message || 'Transação via WhatsApp';

    // Criar transação (owner_user é definido automaticamente pelo trigger set_owner_user_on_insert)
    const transactionData: any = {
      user_id: input.user_id,
      amount: finalAmount, // Valor convertido (ou original se mesma moeda)
      type: input.transaction_type,
      description: description,
      transaction_date: transactionDate,
      category_id: resolved_category_id,
      payment_method: input.payment_method || 'pix',
      currency: targetCurrency, // Moeda da conta/cartão
      status: 'completed',
      // Campos de rastreamento de conversão
      amount_original: amountOriginal,
      currency_original: currencyOriginal,
      exchange_rate_used: exchangeRateUsed
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
    // PASSO 7: ATUALIZAR SALDO (se for conta)
    // ========================================
    if (resource_type === 'account' && resolved_account_id) {
      const balanceChange = input.transaction_type === 'income' 
        ? finalAmount 
        : -finalAmount;

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
    // PASSO 8: ATUALIZAR SALDO DO CARTÃO (se for cartão)
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
        const newBalance = (currentCard.current_balance || 0) + finalAmount;
        await supabase
          .from('cards')
          .update({ current_balance: newBalance })
          .eq('id', resolved_card_id);
        
        console.log('[process-financial-input] Card balance updated:', newBalance);
      }
    }

    // ========================================
    // PASSO 9: CRIAR REGISTRO NO CASH FLOW (se for conta)
    // ========================================
    if (resource_type === 'account' && resolved_account_id) {
      const { data: accountData } = await supabase
        .from('accounts')
        .select('balance, name')
        .eq('id', resolved_account_id)
        .single();

      if (accountData) {
        const balanceChange = input.transaction_type === 'income' 
          ? finalAmount 
          : -finalAmount;

        const cashFlowData = {
          user_id: input.user_id,
          transaction_id: transaction.id,
          account_id: resolved_account_id,
          account_name: accountData.name,
          category_id: resolved_category_id,
          amount: finalAmount,
          movement_type: input.transaction_type,
          movement_date: transactionDate,
          description: description,
          balance_before: accountData.balance - balanceChange,
          balance_after: accountData.balance,
          currency: targetCurrency,
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
    // PASSO 10: MARCAR INPUT COMO PROCESSADO
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
    // PASSO 11: BUSCAR NOME DA CATEGORIA
    // ========================================
    let categoryName = 'Sem categoria';
    if (resolved_category_id) {
      const { data: categoryData } = await supabase
        .from('categories')
        .select('name')
        .eq('id', resolved_category_id)
        .single();
      
      if (categoryData) {
        categoryName = categoryData.name;
      }
    }

    // ========================================
    // RESPOSTA FINAL (MULTI-IDIOMA)
    // ========================================
    const msgs = RESPONSE_MESSAGES[detectedLanguage];
    const formattedOriginal = formatCurrencyDisplay(originalAmount, originalCurrency);
    const formattedConverted = formatCurrencyDisplay(finalAmount, targetCurrency);
    
    let responseMessage: string;
    if (input.transaction_type === 'income') {
      responseMessage = msgs.incomeRecorded(
        formattedOriginal.split(' ')[1] || formattedOriginal, // Amount without symbol
        originalCurrency,
        formattedConverted.split(' ')[1] || formattedConverted,
        targetCurrency,
        exchangeRateUsed,
        categoryName
      );
    } else {
      responseMessage = msgs.expenseRecorded(
        formattedOriginal.split(' ')[1] || formattedOriginal,
        originalCurrency,
        formattedConverted.split(' ')[1] || formattedConverted,
        targetCurrency,
        exchangeRateUsed,
        categoryName
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        status: 'processed',
        transaction_id: transaction.id,
        message: responseMessage,
        language: detectedLanguage,
        details: {
          amount: finalAmount,
          amount_original: amountOriginal,
          currency: targetCurrency,
          currency_original: currencyOriginal,
          exchange_rate: exchangeRateUsed,
          category_id: resolved_category_id,
          category_name: categoryName,
          resource_type,
          resource_id,
          transaction_type: input.transaction_type
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
