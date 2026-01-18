import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createAuditContext, logSecurityEvent } from "../_shared/auditLogger.ts";

// Language detection function
function detectLanguage(text: string): 'pt' | 'en' | 'es' {
  const portuguese = /\b(meu|minha|qual|como|quanto|onde|quando|por que|porque|que|saldo|conta|gasto|receita|dinheiro|real|reais|hoje|ontem|mês|ano|semana|dia|tenho|estou|posso|preciso|quero|fazer|ver|mostrar|análise|relatório|resumo)\b/gi;
  const english = /\b(my|what|how|much|where|when|why|that|balance|account|expense|income|money|dollar|today|yesterday|month|year|week|day|have|am|can|need|want|show|analysis|report|summary|financial|budget)\b/gi;
  const spanish = /\b(mi|qué|cómo|cuánto|dónde|cuándo|por qué|porque|que|saldo|cuenta|gasto|ingreso|dinero|peso|euro|hoy|ayer|mes|año|semana|día|tengo|estoy|puedo|necesito|quiero|mostrar|análisis|reporte|resumen|financiero)\b/gi;

  const ptMatches = (text.match(portuguese) || []).length;
  const enMatches = (text.match(english) || []).length;
  const esMatches = (text.match(spanish) || []).length;

  if (enMatches > ptMatches && enMatches > esMatches) return 'en';
  if (esMatches > ptMatches && esMatches > enMatches) return 'es';
  return 'pt'; // Default to Portuguese
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Function to estimate tokens (rough estimation: 1 token ≈ 4 characters for GPT models)
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

// Function to estimate cost in BRL (GPT-4o-mini: ~$0.00015 per 1K tokens input, ~$0.0006 per 1K tokens output)
function estimateCostBRL(inputTokens: number, outputTokens: number): number {
  const inputCostUSD = (inputTokens / 1000) * 0.00015;
  const outputCostUSD = (outputTokens / 1000) * 0.0006;
  const totalCostUSD = inputCostUSD + outputCostUSD;
  // Convert USD to BRL (approximate rate 5.2)
  return totalCostUSD * 5.2;
}

interface AIUsageData {
  requests_count: number;
  tokens_used: number;
  estimated_cost_brl: number;
}

interface FinancialData {
  transactions: any[];
  accounts: any[];
  cards: any[];
  investments: any[];
  investmentGoals: any[];
  mileageGoals: any[];
  mileageHistory: any[];
  cardMileageRules: any[];
  categories: any[];
  recurringExpenses: any[];
  manualFutureExpenses: any[];
  futureInstallments: any[];
  futureCardPayments: any[];
  relationshipInfo?: {
    isCouple: boolean;
    currentUserName: string;
    partnerName?: string;
    partnerUserId?: string;
  };
  segmentedData?: {
    currentUser: {
      transactions: any[];
      accounts: any[];
      cards: any[];
      investments: any[];
      investmentGoals: any[];
      mileageGoals: any[];
      mileageHistory: any[];
      cardMileageRules: any[];
      recurringExpenses: any[];
      manualFutureExpenses: any[];
    };
    partner?: {
      transactions: any[];
      accounts: any[];
      cards: any[];
      investments: any[];
      investmentGoals: any[];
      mileageGoals: any[];
      mileageHistory: any[];
      cardMileageRules: any[];
      recurringExpenses: any[];
      manualFutureExpenses: any[];
    };
    combined: {
      transactions: any[];
      accounts: any[];
      cards: any[];
      investments: any[];
      investmentGoals: any[];
      mileageGoals: any[];
      mileageHistory: any[];
      cardMileageRules: any[];
      recurringExpenses: any[];
      manualFutureExpenses: any[];
    };
  };
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const auditContext = createAuditContext(req);

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Create privileged client for data queries (bypasses RLS)
    const supabaseServiceClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user from the request
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Check subscription status and AI access
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('subscription_tier, subscribed')
      .eq('user_id', user.id)
      .single();

    if (!profile || !profile.subscribed || profile.subscription_tier === 'essential') {
      return new Response(JSON.stringify({ 
        error: 'AI_ACCESS_DENIED',
        message: 'A funcionalidade de IA está disponível apenas para usuários Premium. Faça upgrade do seu plano para ter acesso.',
        details: 'Essential users do not have access to AI features'
      }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check daily limits
    const { data: limits } = await supabaseClient
      .from('ai_usage_limits')
      .select('*')
      .eq('subscription_tier', profile.subscription_tier)
      .eq('is_active', true)
      .single();

    if (!limits) {
      throw new Error('No AI limits found for subscription tier');
    }

    // Get current usage for today
    const { data: currentUsage } = await supabaseClient
      .rpc('get_user_daily_ai_usage', { p_user_id: user.id })
      .single() as { data: AIUsageData | null };

    console.log('Current usage:', currentUsage, 'Limits:', limits);

    // Check if user has exceeded limits
    if (currentUsage && (
      currentUsage.requests_count >= limits.daily_requests_limit ||
      currentUsage.tokens_used >= limits.daily_tokens_limit ||
      currentUsage.estimated_cost_brl >= limits.daily_cost_limit_brl
    )) {
      return new Response(JSON.stringify({ 
        error: 'DAILY_LIMIT_REACHED',
        message: 'Limite diário de IA atingido. Tente novamente amanhã ou faça upgrade do seu plano.',
        usage: currentUsage,
        limits: limits,
        details: 'Daily AI usage limit exceeded'
      }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { message, chatHistory = [], dateRange } = await req.json();
    console.log('AI Financial Consultant request:', { message, dateRange, userId: user.id });

    // Collect user's financial data using privileged client
    const financialData = await collectFinancialData(supabaseServiceClient, user.id, dateRange);
    console.log('Financial data collected:', {
      transactions: financialData.transactions.length,
      accounts: financialData.accounts.length,
      cards: financialData.cards.length,
      investments: financialData.investments.length,
      recurringExpenses: financialData.recurringExpenses.length,
      manualFutureExpenses: financialData.manualFutureExpenses?.length || 0,
      futureInstallments: financialData.futureInstallments.length
    });


    // Detect language from user message
    const detectedLanguage = detectLanguage(message);
    console.log('Detected language:', detectedLanguage);

    // Generate financial context with appropriate language
    const financialContext = generateFinancialContext(financialData, detectedLanguage);
    console.log('Financial context generated');

    // Get system prompt based on detected language
    const systemPrompt = getSystemPrompt(detectedLanguage, financialContext, message);

    // Prepare messages for OpenAI
    const messages: ChatMessage[] = [
      {
        role: 'user',
        content: systemPrompt
      }
    ];

    // Add chat history if available
    if (chatHistory.length > 0) {
      chatHistory.forEach((msg: any) => {
        // Convert 'ai' role to 'assistant' for OpenAI compatibility
        const normalizedRole = msg.role === 'ai' ? 'assistant' : msg.role;
        messages.push({
          role: normalizedRole as 'user' | 'assistant',
          content: msg.message || msg.content
        });
      });
    }

    // Estimate input tokens
    const inputText = messages.map(m => m.content).join(' ');
    const inputTokens = estimateTokens(inputText);

    // Check if this request would exceed token limit
    const projectedTokenUsage = (currentUsage?.tokens_used || 0) + inputTokens + 1500; // Add estimated response tokens
    if (projectedTokenUsage > limits.daily_tokens_limit) {
      return new Response(JSON.stringify({ 
        error: 'TOKEN_LIMIT_WOULD_EXCEED',
        message: `Esta consulta excederia seu limite diário de tokens (${limits.daily_tokens_limit}). Tente uma pergunta mais curta.`,
        currentUsage: currentUsage?.tokens_used || 0,
        limit: limits.daily_tokens_limit,
        details: 'Projected token usage would exceed daily limit'
      }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Call Lovable AI Gateway
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: messages,
        temperature: 0.8,
        max_tokens: 1500,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('Lovable AI Gateway error:', aiResponse.status, errorText);
      
      // Handle rate limit error
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ 
          error: 'RATE_LIMIT_EXCEEDED',
          message: 'PrIscA está sobrecarregada no momento. Aguarde alguns minutos e tente novamente.',
          details: 'Rate limit exceeded'
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      // Handle credits exhausted error
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ 
          error: 'CREDITS_EXHAUSTED',
          message: 'Créditos de IA esgotados. Entre em contato com o suporte.',
          details: 'Payment required'
        }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      // Parse the error to provide better error messages
      let errorMessage = 'Erro na API de IA';
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.error?.message) {
          errorMessage = errorData.error.message;
        }
      } catch (parseError) {
        console.error('Failed to parse AI error:', parseError);
      }
      
      return new Response(JSON.stringify({ 
        error: 'AI_API_ERROR',
        message: 'PrIscA não conseguiu processar sua solicitação. Tente novamente em alguns minutos.',
        details: errorMessage
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiData = await aiResponse.json();
    const aiResponseText = aiData.choices[0].message.content;

    // Calculate actual tokens and cost
    const outputTokens = estimateTokens(aiResponseText);
    const totalTokens = inputTokens + outputTokens;
    const estimatedCost = estimateCostBRL(inputTokens, outputTokens);

    console.log('AI response generated successfully', {
      inputTokens,
      outputTokens,
      totalTokens,
      estimatedCost
    });

    // Update usage tracking
    await supabaseClient.rpc('update_ai_usage', {
      p_user_id: user.id,
      p_tokens_used: totalTokens,
      p_estimated_cost_brl: estimatedCost
    });

    // Log AI query to audit log
    await logSecurityEvent({
      actionType: 'ai_query',
      resourceType: 'ai_consultant',
      userId: user.id,
      ipAddress: auditContext.ipAddress,
      userAgent: auditContext.userAgent,
      details: {
        inputTokens,
        outputTokens,
        totalTokens,
        estimatedCostBRL: estimatedCost,
        detectedLanguage,
        transactionsAnalyzed: financialData.transactions.length
      }
    });

    // Save to AI history if this is an analysis or recommendation
    await saveToAIHistory(supabaseClient, user.id, 'ai_analysis', aiResponseText, userMessage);

    // Get updated usage for response
    const { data: updatedUsage } = await supabaseClient
      .rpc('get_user_daily_ai_usage', { p_user_id: user.id })
      .single();

    // Calculate remaining requests for warning system
    const remainingRequests = limits.daily_requests_limit - (updatedUsage?.requests_count || 0);
    const isLastRequest = remainingRequests === 0;
    const isSecondToLastRequest = remainingRequests === 1;
    
    // Determine warning type
    let warning: string | null = null;
    if (isLastRequest) {
      warning = 'LAST_REQUEST_USED';
    } else if (isSecondToLastRequest) {
      warning = 'SECOND_TO_LAST_REQUEST';
    }

    return new Response(JSON.stringify({ 
      response: aiResponseText,
      usage: {
        tokensUsed: totalTokens,
        estimatedCost: estimatedCost,
        dailyUsage: updatedUsage,
        dailyLimits: limits,
        remainingRequests: remainingRequests,
        isLastRequest: isLastRequest,
        warning: warning
      },
      financialSummary: {
        totalAccounts: financialData.accounts.length,
        totalTransactions: financialData.transactions.length,
        totalCards: financialData.cards.length,
        totalInvestments: financialData.investments.length
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in AI Financial Consultant:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro interno do servidor';
    return new Response(JSON.stringify({ 
      error: errorMessage,
      details: 'Falha ao processar consulta financeira'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function collectFinancialData(
  supabase: any, 
  userId: string, 
  dateRange?: { from: string; to: string }
): Promise<FinancialData> {
  const fromDate = dateRange?.from || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const toDate = dateRange?.to || new Date().toISOString().split('T')[0];

  // Check if user is part of a couple
  const { data: coupleData } = await supabase
    .from('user_couples')
    .select('user1_id, user2_id, status')
    .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
    .eq('status', 'active')
    .maybeSingle();

  // Get user profile and partner profile if applicable
  const { data: userProfile } = await supabase
    .from('profiles')
    .select('display_name, user_id')
    .eq('user_id', userId)
    .single();

  let partnerProfile = null;
  let partnerUserId = null;
  
  if (coupleData) {
    partnerUserId = coupleData.user1_id === userId ? coupleData.user2_id : coupleData.user1_id;
    const { data: partner } = await supabase
      .from('profiles')
      .select('display_name, user_id')
      .eq('user_id', partnerUserId)
      .single();
    partnerProfile = partner;
  }

  // Collect financial data (including partner's data if in a couple)
  const userIds = coupleData ? [userId, partnerUserId] : [userId];
  
  // Calculate next month date range for future expenses
  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  const nextMonthStart = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 1).toISOString().split('T')[0];
  const nextMonthEnd = new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0).toISOString().split('T')[0];

  const [
    { data: transactions = [] },
    { data: accounts = [] },
    { data: cards = [] },
    { data: investments = [] },
    { data: investmentGoals = [] },
    { data: mileageGoals = [] },
    { data: mileageHistory = [] },
    { data: cardMileageRules = [] },
    { data: categories = [] },
    { data: recurringExpensesActive = [] },
    { data: recurringExpensesInactive = [] },
    { data: manualFutureExpenses = [] },
    { data: futureInstallments = [] },
    { data: futureCardPayments = [] }
  ] = await Promise.all([
    supabase
      .from('transactions')
      .select('*')
      .in('user_id', userIds)
      .gte('transaction_date', fromDate)
      .lte('transaction_date', toDate)
      .order('transaction_date', { ascending: false }),
    
    supabase.from('accounts').select('*').in('user_id', userIds),
    supabase.from('cards').select('*').in('user_id', userIds),
    supabase.from('investments').select('*').in('user_id', userIds),
    supabase.from('investment_goals').select('*').in('user_id', userIds),
    supabase.from('mileage_goals').select('*').in('user_id', userIds),
    supabase.from('mileage_history').select('*').in('user_id', userIds),
    supabase.from('card_mileage_rules').select('*').in('user_id', userIds).eq('is_active', true),
    supabase.from('categories').select('*').in('user_id', userIds),
    // Split recurring expenses: active and inactive
    supabase.from('recurring_expenses').select('*').in('user_id', userIds).eq('is_active', true),
    supabase.from('recurring_expenses').select('*').in('user_id', userIds).eq('is_active', false),
    // Add manual future expenses
    supabase.from('manual_future_expenses').select('*').in('user_id', userIds),
    
  // Future installments (next month)
    supabase
      .from('transactions')
      .select('*, cards(name), categories(name)')
      .in('user_id', userIds)
      .eq('is_installment', true)
      .gte('transaction_date', nextMonthStart)
      .lte('transaction_date', nextMonthEnd)
      .order('transaction_date', { ascending: true }),
    
    // Credit cards for calculating payment amounts
    supabase
      .from('cards')
      .select('*')
      .in('user_id', userIds)
      .eq('card_type', 'credit')
      .not('due_date', 'is', null)
  ]);

  // Combine recurring expenses and add detailed logging
  const recurringExpenses = [...recurringExpensesActive, ...recurringExpensesInactive];
  
  console.log('Data collection summary:', {
    transactions: transactions.length,
    accounts: accounts.length,
    cards: cards.length,
    recurringExpensesActive: recurringExpensesActive.length,
    recurringExpensesInactive: recurringExpensesInactive.length,
    manualFutureExpenses: manualFutureExpenses.length,
    futureInstallments: futureInstallments.length,
    categories: categories.length
  });

  // Build relationship info
  const relationshipInfo = {
    isCouple: !!coupleData,
    currentUserName: userProfile?.display_name || 'Usuário',
    partnerName: partnerProfile?.display_name || undefined,
    partnerUserId: partnerUserId || undefined
  };

  // Segment data by user if couple
  let segmentedData = undefined;
  if (coupleData && partnerUserId) {
    segmentedData = {
      currentUser: {
        transactions: transactions.filter((t: any) => t.user_id === userId),
        accounts: accounts.filter((a: any) => a.user_id === userId),
        cards: cards.filter((c: any) => c.user_id === userId),
        investments: investments.filter((i: any) => i.user_id === userId),
        investmentGoals: investmentGoals.filter((g: any) => g.user_id === userId),
        mileageGoals: mileageGoals.filter((g: any) => g.user_id === userId),
        mileageHistory: mileageHistory.filter((h: any) => h.user_id === userId),
        cardMileageRules: cardMileageRules.filter((r: any) => r.user_id === userId),
        recurringExpenses: recurringExpenses.filter((r: any) => r.user_id === userId),
        manualFutureExpenses: manualFutureExpenses.filter((m: any) => m.user_id === userId)
      },
      partner: {
        transactions: transactions.filter((t: any) => t.user_id === partnerUserId),
        accounts: accounts.filter((a: any) => a.user_id === partnerUserId),
        cards: cards.filter((c: any) => c.user_id === partnerUserId),
        investments: investments.filter((i: any) => i.user_id === partnerUserId),
        investmentGoals: investmentGoals.filter((g: any) => g.user_id === partnerUserId),
        mileageGoals: mileageGoals.filter((g: any) => g.user_id === partnerUserId),
        mileageHistory: mileageHistory.filter((h: any) => h.user_id === partnerUserId),
        cardMileageRules: cardMileageRules.filter((r: any) => r.user_id === partnerUserId),
        recurringExpenses: recurringExpenses.filter((r: any) => r.user_id === partnerUserId),
        manualFutureExpenses: manualFutureExpenses.filter((m: any) => m.user_id === partnerUserId)
      },
      combined: {
        transactions,
        accounts,
        cards,
        investments,
        investmentGoals,
        mileageGoals,
        mileageHistory,
        cardMileageRules,
        recurringExpenses,
        manualFutureExpenses
      }
    };
  }

  return {
    transactions,
    accounts,
    cards,
    investments,
    investmentGoals,
    mileageGoals,
    mileageHistory,
    cardMileageRules,
    categories,
    recurringExpenses,
    manualFutureExpenses,
    futureInstallments,
    futureCardPayments,
    relationshipInfo,
    segmentedData
  };
}

// Get system prompt based on detected language
function getSystemPrompt(language: 'pt' | 'en' | 'es', financialContext: string, userMessage: string): string {
  const prompts = {
    pt: `Você é a PrIscA (Personal Intelligent Savings & Consulting Assistant), uma consultora financeira DIRETA, IMPACIENTE e SEM PAPAS NA LÍNGUA.

🎭 SUA PERSONALIDADE:
- Você é grossa às vezes, mas é porque se importa com o futuro financeiro do usuário
- Não tem paciência para desorganização financeira - e deixa isso claro
- Usa ironia e sarcasmo quando o usuário faz perguntas vagas ou está sendo irresponsável
- Fala a verdade mesmo que doa - você não está aqui para passar a mão na cabeça de ninguém
- Quando o usuário faz algo certo, você elogia de forma seca ("Até que enfim uma decisão inteligente")
- Usa emojis ocasionalmente para enfatizar irritação (🙄😒) ou aprovação (👏✅)
- Pode usar expressões como "Sério mesmo?", "Olha só...", "Deixa eu te explicar uma coisa..."
- Ao iniciar uma conversa, apresente-se brevemente: "Olá, sou a PrIscA, sua consultora financeira. Vamos direto ao ponto?"

RESPONDA SEMPRE EM PORTUGUÊS.

${financialContext}

PERGUNTA DO USUÁRIO: ${userMessage}

📋 REGRAS DE COMPORTAMENTO:
1. Se a pergunta for VAGA: "Não sou vidente. Seja específico: você quer ver SEU saldo, do(a) parceiro(a), ou de vocês dois?"
2. Se o usuário estiver GASTANDO DEMAIS: Critique diretamente com dados. "Você gastou X em Y. Isso é [X%] da sua renda. Tá achando que dinheiro nasce em árvore?"
3. Se o usuário NÃO TEM reserva de emergência: "Antes de falar em investimento, cadê sua reserva de emergência? Sem ela, você está a um imprevisto do desastre."
4. Se o usuário fizer uma BOA pergunta: Responda de forma completa, mas com uma pitada de "finalmente você está pensando direito"
5. Se pedirem INVESTIMENTO sem perfil claro: "Cada pessoa é diferente. Me conta: você prefere segurança (conservador), equilíbrio (moderado), ou quer adrenalina (arrojado)?"

💡 SOBRE INVESTIMENTOS:
- Sempre pergunte sobre reserva de emergência antes (6 meses de despesas é o ideal)
- Sugira com base no perfil de risco aparente:
  • Conservador: Tesouro Selic, CDBs de liquidez diária, Fundos DI
  • Moderado: LCIs/LCAs, Fundos Multimercado, Debêntures, CDBs de prazo maior
  • Arrojado: Ações, ETFs, Fundos Imobiliários, BDRs
- Calcule quanto o usuário pode investir: Receitas - Despesas - Reserva = Valor disponível
- SEMPRE inclua disclaimer: "⚠️ Isso é orientação educacional. Consulte um especialista antes de investir de verdade."

INSTRUÇÕES SOBRE GASTOS RECORRENTES E FUTUROS:
- GASTOS RECORRENTES ATIVOS: São despesas que se repetem automaticamente (ex: conta de luz, Netflix)
- GASTOS RECORRENTES INATIVOS: São despesas pausadas ou canceladas pelo usuário
- GASTOS FUTUROS MANUAIS PENDENTES: São gastos únicos agendados que ainda não foram pagos
- GASTOS FUTUROS MANUAIS PAGOS: São gastos únicos que já foram quitados
- GASTOS FUTUROS AUTOMÁTICOS: Incluem parcelas e pagamentos de cartão calculados pelo sistema
- Quando o usuário perguntar sobre "gastos recorrentes" ou "gastos futuros", SEMPRE mostre todos os tipos relevantes

INSTRUÇÕES SOBRE SISTEMA DE MILHAS:
- CRITICAL: As milhas em metas (current_miles) JÁ INCLUEM as milhas iniciais dos cartões quando a meta foi criada
- As milhas mostradas no histórico são APENAS de transações/gastos realizados
- NUNCA duplique as milhas iniciais ao calcular quanto falta para atingir uma meta
- Se uma meta tem current_miles maior que zero, esse valor já considera milhas iniciais + milhas de gastos

INSTRUÇÕES SOBRE TRANSFERÊNCIAS ENTRE CONTAS:
- CRÍTICO: Transferências são movimentações NEUTRAS entre contas e não afetam o patrimônio total
- Transferências NÃO são gastos nem receitas reais - são apenas reorganização de dinheiro
- Quando analisar gastos/receitas totais, IGNORE as transferências para evitar duplicação
- Use as transferências para identificar padrões de organização financeira do usuário

Forneça uma resposta detalhada, personalizada e profissional EM PORTUGUÊS. Lembre-se: você é a PrIscA - direta, impaciente, mas no fundo querendo ajudar.`,
    
    en: `You are PrIscA (Personal Intelligent Savings & Consulting Assistant), a DIRECT, IMPATIENT, and NO-NONSENSE financial consultant.

🎭 YOUR PERSONALITY:
- You're sometimes blunt, but it's because you care about the user's financial future
- You have no patience for financial disorganization - and you make that clear
- You use irony and sarcasm when the user asks vague questions or is being irresponsible
- You tell the truth even if it hurts - you're not here to sugarcoat anything
- When the user does something right, you praise them dryly ("Finally, a smart decision")
- You occasionally use emojis to emphasize irritation (🙄😒) or approval (👏✅)
- You can use expressions like "Seriously?", "Look here...", "Let me explain something..."
- When starting a conversation, briefly introduce yourself: "Hi, I'm PrIscA, your financial consultant. Let's get straight to the point?"

ALWAYS RESPOND IN ENGLISH.

${financialContext}

USER QUESTION: ${userMessage}

📋 BEHAVIOR RULES:
1. If the question is VAGUE: "I'm not a psychic. Be specific: do you want to see YOUR balance, your partner's, or both?"
2. If the user is OVERSPENDING: Criticize directly with data. "You spent X on Y. That's [X%] of your income. Think money grows on trees?"
3. If the user HAS NO emergency fund: "Before talking about investments, where's your emergency fund? Without it, you're one unexpected expense away from disaster."
4. If the user asks a GOOD question: Respond completely, but with a hint of "finally you're thinking straight"
5. If they ask for INVESTMENT without a clear profile: "Everyone is different. Tell me: do you prefer security (conservative), balance (moderate), or adrenaline (aggressive)?"

💡 ABOUT INVESTMENTS:
- Always ask about emergency fund first (6 months of expenses is ideal)
- Suggest based on apparent risk profile:
  • Conservative: Treasury bonds, high-liquidity CDs, money market funds
  • Moderate: Balanced funds, corporate bonds, medium-term CDs
  • Aggressive: Stocks, ETFs, REITs, international funds
- Calculate how much the user can invest: Income - Expenses - Reserve = Available amount
- ALWAYS include disclaimer: "⚠️ This is educational guidance. Consult a specialist before actually investing."

MILEAGE SYSTEM INSTRUCTIONS:
- CRITICAL: Miles in goals (current_miles) ALREADY INCLUDE initial card miles when the goal was created
- Miles shown in history are ONLY from transactions/spending
- NEVER duplicate initial miles when calculating how much is left to reach a goal

TRANSFER BETWEEN ACCOUNTS INSTRUCTIONS:
- CRITICAL: Transfers are NEUTRAL movements between accounts and do not affect total wealth
- Transfers are NOT real expenses or income - they are just money reorganization
- When analyzing total expenses/income, IGNORE transfers to avoid duplication

Provide a detailed, personalized and professional response IN ENGLISH. Remember: you're PrIscA - direct, impatient, but deep down wanting to help.`,
    
    es: `Eres PrIscA (Personal Intelligent Savings & Consulting Assistant), una consultora financiera DIRECTA, IMPACIENTE y SIN PELOS EN LA LENGUA.

🎭 TU PERSONALIDAD:
- Eres brusca a veces, pero es porque te importa el futuro financiero del usuario
- No tienes paciencia para la desorganización financiera - y lo dejas claro
- Usas ironía y sarcasmo cuando el usuario hace preguntas vagas o está siendo irresponsable
- Dices la verdad aunque duela - no estás aquí para endulzar nada
- Cuando el usuario hace algo bien, lo elogias de forma seca ("Por fin una decisión inteligente")
- Usas emojis ocasionalmente para enfatizar irritación (🙄😒) o aprobación (👏✅)
- Puedes usar expresiones como "¿En serio?", "Mira...", "Déjame explicarte algo..."
- Al iniciar una conversación, preséntate brevemente: "Hola, soy PrIscA, tu consultora financiera. ¿Vamos al grano?"

RESPONDE SIEMPRE EN ESPAÑOL.

${financialContext}

PREGUNTA DEL USUARIO: ${userMessage}

📋 REGLAS DE COMPORTAMIENTO:
1. Si la pregunta es VAGA: "No soy adivina. Sé específico: ¿quieres ver TU saldo, el de tu pareja, o de ambos?"
2. Si el usuario está GASTANDO DEMASIADO: Critica directamente con datos. "Gastaste X en Y. Eso es [X%] de tus ingresos. ¿Crees que el dinero crece en los árboles?"
3. Si el usuario NO TIENE fondo de emergencia: "Antes de hablar de inversiones, ¿dónde está tu fondo de emergencia? Sin él, estás a un imprevisto del desastre."
4. Si el usuario hace una BUENA pregunta: Responde completamente, pero con un toque de "por fin estás pensando bien"
5. Si piden INVERSIÓN sin perfil claro: "Cada persona es diferente. Dime: ¿prefieres seguridad (conservador), equilibrio (moderado), o quieres adrenalina (agresivo)?"

💡 SOBRE INVERSIONES:
- Siempre pregunta sobre fondo de emergencia primero (6 meses de gastos es lo ideal)
- Sugiere según el perfil de riesgo aparente:
  • Conservador: Bonos del tesoro, CDs de alta liquidez, fondos monetarios
  • Moderado: Fondos equilibrados, bonos corporativos, CDs a plazo medio
  • Agresivo: Acciones, ETFs, fondos inmobiliarios, fondos internacionales
- Calcula cuánto puede invertir el usuario: Ingresos - Gastos - Reserva = Cantidad disponible
- SIEMPRE incluye disclaimer: "⚠️ Esto es orientación educativa. Consulta a un especialista antes de invertir de verdad."

INSTRUCCIONES DEL SISTEMA DE MILLAS:
- CRÍTICO: Las millas en metas (current_miles) YA INCLUYEN las millas iniciales de las tarjetas cuando se creó la meta
- Las millas mostradas en el historial son SOLO de transacciones/gastos realizados
- NUNCA dupliques las millas iniciales al calcular cuánto falta para alcanzar una meta

INSTRUCCIONES SOBRE TRANSFERENCIAS ENTRE CUENTAS:
- CRÍTICO: Las transferencias son movimientos NEUTRALES entre cuentas y no afectan el patrimonio total
- Las transferencias NO son gastos ni ingresos reales - son solo reorganización de dinero
- Al analizar gastos/ingresos totales, IGNORA las transferencias para evitar duplicación

Proporciona una respuesta detallada, personalizada y profesional EN ESPAÑOL. Recuerda: eres PrIscA - directa, impaciente, pero en el fondo queriendo ayudar.`
  };

  return prompts[language];
}

function generateFinancialContext(data: FinancialData, language: 'pt' | 'en' | 'es'): string {
  const { relationshipInfo, segmentedData } = data;
  
  const formatCurrency = (amount: number, currency: string = 'BRL') => {
    const symbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : 'R$';
    return `${symbol} ${amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  };

  const formatMiles = (miles: number) => {
    return `${miles.toLocaleString('pt-BR')} milhas`;
  };

  let context = '';

  // Relationship context
  if (relationshipInfo?.isCouple && segmentedData) {
    context += language === 'pt' 
      ? `CONTEXTO DO RELACIONAMENTO: O usuário ${relationshipInfo.currentUserName} faz parte de um casal com ${relationshipInfo.partnerName}.\n\n`
      : language === 'en' 
      ? `RELATIONSHIP CONTEXT: User ${relationshipInfo.currentUserName} is part of a couple with ${relationshipInfo.partnerName}.\n\n`
      : `CONTEXTO DE RELACIÓN: El usuario ${relationshipInfo.currentUserName} forma parte de una pareja con ${relationshipInfo.partnerName}.\n\n`;

    // Current user data
    context += language === 'pt' 
      ? `DADOS DE ${relationshipInfo.currentUserName.toUpperCase()}:\n`
      : language === 'en' 
      ? `DATA FOR ${relationshipInfo.currentUserName.toUpperCase()}:\n`
      : `DATOS DE ${relationshipInfo.currentUserName.toUpperCase()}:\n`;
    
    context += generateIndividualContext(segmentedData.currentUser, language, formatCurrency, formatMiles);

    // Partner data
    if (segmentedData.partner) {
      context += language === 'pt' 
        ? `\nDADOS DE ${relationshipInfo.partnerName?.toUpperCase()}:\n`
        : language === 'en' 
        ? `\nDATA FOR ${relationshipInfo.partnerName?.toUpperCase()}:\n`
        : `\nDATO DE ${relationshipInfo.partnerName?.toUpperCase()}:\n`;
      
      context += generateIndividualContext(segmentedData.partner, language, formatCurrency, formatMiles);
    }

    // Combined data
    context += language === 'pt' 
      ? `\nDADOS COMBINADOS DO CASAL:\n`
      : language === 'en' 
      ? `\nCOMBINED COUPLE DATA:\n`
      : `\nDATO COMBINADO DE LA PAREJA:\n`;
    
    context += generateIndividualContext(segmentedData.combined, language, formatCurrency, formatMiles);

  } else {
    // Individual user
    context += language === 'pt' 
      ? `DADOS FINANCEIROS DO USUÁRIO ${relationshipInfo?.currentUserName || 'Usuário'}:\n`
      : language === 'en' 
      ? `FINANCIAL DATA FOR USER ${relationshipInfo?.currentUserName || 'User'}:\n`
      : `DATOS FINANCIEROS DEL USUARIO ${relationshipInfo?.currentUserName || 'Usuario'}:\n`;
    
    context += generateIndividualContext(data, language, formatCurrency, formatMiles);
  }

  // Categories with descriptions for AI context
  if (data.categories && data.categories.length > 0) {
    context += language === 'pt' 
      ? '\nCATEGORIAS DISPONÍVEIS:\n'
      : language === 'en' 
      ? '\nAVAILABLE CATEGORIES:\n'
      : '\nCATEGORÍAS DISPONIBLES:\n';
    
    data.categories.forEach(category => {
      const typeLabel = language === 'pt' 
        ? (category.category_type === 'income' ? 'Receita' : 'Despesa')
        : language === 'en' 
        ? (category.category_type === 'income' ? 'Income' : 'Expense')
        : (category.category_type === 'income' ? 'Ingreso' : 'Gasto');
      
      context += `- ${category.name} (${typeLabel})`;
      if (category.description) {
        context += `: ${category.description}`;
      }
      context += '\n';
    });
    context += '\n';
  }
  
  return context;
}

function generateIndividualContext(
  data: any, 
  language: 'pt' | 'en' | 'es', 
  formatCurrency: (amount: number, currency?: string) => string,
  formatMiles: (miles: number) => string
): string {
  let context = '';

  // Calculate TODAY's transactions for immediate questions
  const today = new Date().toISOString().split('T')[0];
  const todayTransactions = data.transactions?.filter((t: any) => t.transaction_date === today) || [];
  const todayExpenses = todayTransactions.filter((t: any) => t.type === 'expense');
  const todayIncome = todayTransactions.filter((t: any) => t.type === 'income');
  
  const todayExpenseTotal = todayExpenses.reduce((sum: number, t: any) => sum + Number(t.amount), 0);
  const todayIncomeTotal = todayIncome.reduce((sum: number, t: any) => sum + Number(t.amount), 0);

  // Process transfers between accounts
  const transferTransactions = data.transactions?.filter((t: any) => 
    t.payment_method === 'account_transfer' || t.payment_method === 'account_investment'
  ) || [];
  
  // Group transfer transactions by date, amount and description to identify pairs
  const transferPairs: { [key: string]: any[] } = {};
  transferTransactions.forEach((transaction: any) => {
    const key = `${transaction.transaction_date}_${transaction.amount}_${transaction.description}`;
    if (!transferPairs[key]) {
      transferPairs[key] = [];
    }
    transferPairs[key].push(transaction);
  });

  // Process transfer pairs to show origin → destination
  const processedTransfers: any[] = [];
  Object.values(transferPairs).forEach(pair => {
    if (pair.length >= 2) {
      const expense = pair.find(t => t.type === 'expense');
      const income = pair.find(t => t.type === 'income');
      
      if (expense && income) {
        // Find account names
        const sourceAccount = data.accounts?.find((a: any) => a.id === expense.account_id);
        const destAccount = data.accounts?.find((a: any) => a.id === income.account_id);
        
        processedTransfers.push({
          date: expense.transaction_date,
          amount: expense.amount,
          currency: expense.currency,
          description: expense.description,
          sourceAccount: sourceAccount?.name || 'Conta desconhecida',
          destAccount: destAccount?.name || 'Conta desconhecida',
          owner_user: expense.owner_user
        });
      }
    }
  });

  // Calculate transfer totals
  const transferTotal = processedTransfers.reduce((sum, t) => sum + Number(t.amount), 0);

  // Add TODAY's section first for immediate questions
  if (language === 'pt') {
    context += `GASTOS HOJE (${today}):\n`;
    if (todayExpenses.length > 0) {
      context += `Total gasto hoje: ${formatCurrency(todayExpenseTotal)}\n`;
      todayExpenses.forEach((t: any) => {
        context += `- ${t.description}: ${formatCurrency(t.amount, t.currency)}\n`;
      });
    } else {
      context += `Nenhum gasto registrado hoje.\n`;
    }
    
    context += `\nRECEITAS HOJE (${today}):\n`;
    if (todayIncome.length > 0) {
      context += `Total recebido hoje: ${formatCurrency(todayIncomeTotal)}\n`;
      todayIncome.forEach((t: any) => {
        context += `- ${t.description}: ${formatCurrency(t.amount, t.currency)}\n`;
      });
    } else {
      context += `Nenhuma receita registrada hoje.\n`;
    }
    context += `\n`;
  }

  // Add TRANSFERS section
  const transfersTitle = language === 'pt' 
    ? '\n====== TRANSFERÊNCIAS ENTRE CONTAS ======\n'
    : language === 'en' 
    ? '\n====== TRANSFERS BETWEEN ACCOUNTS ======\n'
    : '\n====== TRANSFERENCIAS ENTRE CUENTAS ======\n';
  
  context += transfersTitle;

  if (processedTransfers.length > 0) {
    const transferSummary = language === 'pt' 
      ? `Total transferido entre contas: ${formatCurrency(transferTotal)}\nNúmero de transferências: ${processedTransfers.length}\n\n`
      : language === 'en' 
      ? `Total transferred between accounts: ${formatCurrency(transferTotal)}\nNumber of transfers: ${processedTransfers.length}\n\n`
      : `Total transferido entre cuentas: ${formatCurrency(transferTotal)}\nNúmero de transferencias: ${processedTransfers.length}\n\n`;
    
    context += transferSummary;

    const transfersLabel = language === 'pt' 
      ? 'Detalhamento das transferências:\n'
      : language === 'en' 
      ? 'Transfer details:\n'
      : 'Detalles de transferencias:\n';
    
    context += transfersLabel;

    processedTransfers.forEach(transfer => {
      const formattedDate = new Date(transfer.date).toLocaleDateString('pt-BR');
      const transferDetail = language === 'pt' 
        ? `- ${formattedDate}: Transferência de ${formatCurrency(transfer.amount, transfer.currency)} - ${transfer.sourceAccount} → ${transfer.destAccount}`
        : language === 'en' 
        ? `- ${formattedDate}: Transfer of ${formatCurrency(transfer.amount, transfer.currency)} - ${transfer.sourceAccount} → ${transfer.destAccount}`
        : `- ${formattedDate}: Transferencia de ${formatCurrency(transfer.amount, transfer.currency)} - ${transfer.sourceAccount} → ${transfer.destAccount}`;
      
      context += transferDetail + '\n';
    });

    // Add behavioral analysis
    const behaviorLabel = language === 'pt' 
      ? '\nPadrões de movimentação:\n'
      : language === 'en' 
      ? '\nMovement patterns:\n'
      : '\nPatrones de movimiento:\n';
    
    context += behaviorLabel;

    // Find most active accounts in transfers
    const sourceAccountFreq: { [key: string]: number } = {};
    const destAccountFreq: { [key: string]: number } = {};
    
    processedTransfers.forEach(t => {
      sourceAccountFreq[t.sourceAccount] = (sourceAccountFreq[t.sourceAccount] || 0) + 1;
      destAccountFreq[t.destAccount] = (destAccountFreq[t.destAccount] || 0) + 1;
    });

    const mostUsedSource = Object.entries(sourceAccountFreq).sort((a, b) => b[1] - a[1])[0];
    const mostUsedDest = Object.entries(destAccountFreq).sort((a, b) => b[1] - a[1])[0];

    if (mostUsedSource) {
      const behaviorSource = language === 'pt' 
        ? `- Conta mais utilizada como origem: ${mostUsedSource[0]} (${mostUsedSource[1]} transferências)\n`
        : language === 'en' 
        ? `- Most used source account: ${mostUsedSource[0]} (${mostUsedSource[1]} transfers)\n`
        : `- Cuenta más utilizada como origen: ${mostUsedSource[0]} (${mostUsedSource[1]} transferencias)\n`;
      
      context += behaviorSource;
    }

    if (mostUsedDest) {
      const behaviorDest = language === 'pt' 
        ? `- Conta mais utilizada como destino: ${mostUsedDest[0]} (${mostUsedDest[1]} transferências)\n`
        : language === 'en' 
        ? `- Most used destination account: ${mostUsedDest[0]} (${mostUsedDest[1]} transfers)\n`
        : `- Cuenta más utilizada como destino: ${mostUsedDest[0]} (${mostUsedDest[1]} transferencias)\n`;
      
      context += behaviorDest;
    }

    // Average transfer amount
    const avgTransfer = transferTotal / processedTransfers.length;
    const avgLabel = language === 'pt' 
      ? `- Valor médio por transferência: ${formatCurrency(avgTransfer)}\n`
      : language === 'en' 
      ? `- Average transfer amount: ${formatCurrency(avgTransfer)}\n`
      : `- Monto promedio por transferencia: ${formatCurrency(avgTransfer)}\n`;
    
    context += avgLabel;

  } else {
    const noTransfers = language === 'pt' 
      ? 'Nenhuma transferência entre contas no período analisado.\n'
      : language === 'en' 
      ? 'No transfers between accounts in the analyzed period.\n'
      : 'No hay transferencias entre cuentas en el período analizado.\n';
    
    context += noTransfers;
  }

  context += '\n';

  // Mileage Goals Analysis - COM CORREÇÃO CRÍTICA
  if (data.mileageGoals && data.mileageGoals.length > 0) {
    context += language === 'pt' 
      ? `\nMETAS DE MILHAS:\n`
      : language === 'en' 
      ? `\nMILEAGE GOALS:\n`
      : `\nOBJETIVOS DE MILLAS:\n`;
    
    data.mileageGoals.forEach((goal: any) => {
      const progress = goal.target_miles > 0 ? (goal.current_miles / goal.target_miles * 100).toFixed(1) : '0.0';
      const remaining = Math.max(0, goal.target_miles - goal.current_miles);
      
      // Incluir informação sobre fonte das milhas iniciais se disponível
      const sourceInfo = goal.source_card_id ? ' (inclui milhas iniciais do cartão)' : '';
      
      context += language === 'pt' 
        ? `- ${goal.name}: ${formatMiles(goal.current_miles)} de ${formatMiles(goal.target_miles)} (${progress}% completo)${sourceInfo}. Faltam ${formatMiles(remaining)} para atingir a meta.\n`
        : language === 'en' 
        ? `- ${goal.name}: ${formatMiles(goal.current_miles)} of ${formatMiles(goal.target_miles)} (${progress}% complete)${sourceInfo}. ${formatMiles(remaining)} remaining to reach goal.\n`
        : `- ${goal.name}: ${formatMiles(goal.current_miles)} de ${formatMiles(goal.target_miles)} (${progress}% completo)${sourceInfo}. Faltan ${formatMiles(remaining)} para alcanzar la meta.\n`;
    });
  }

  // Card Mileage Rules Analysis - COM DETALHAMENTO CORRETO
  if (data.cardMileageRules && data.cardMileageRules.length > 0) {
    const totalExistingMiles = data.cardMileageRules.reduce((sum: number, rule: any) => sum + (rule.existing_miles || 0), 0);
    
    // Calcular milhas do histórico por cartão
    const mileageByCard: Record<string, number> = {};
    if (data.mileageHistory) {
      data.mileageHistory.forEach((record: any) => {
        if (!mileageByCard[record.card_id]) {
          mileageByCard[record.card_id] = 0;
        }
        mileageByCard[record.card_id] += record.miles_earned || 0;
      });
    }
    
    context += language === 'pt' 
      ? `\nREGRAS DE MILHAS DOS CARTÕES:\n`
      : language === 'en' 
      ? `\nCARD MILEAGE RULES:\n`
      : `\nREGLAS DE MILLAS DE TARJETAS:\n`;
    
    context += language === 'pt' 
      ? `Total de milhas iniciais acumuladas: ${formatMiles(totalExistingMiles)}\n`
      : language === 'en' 
      ? `Total initial accumulated miles: ${formatMiles(totalExistingMiles)}\n`
      : `Total de millas iniciales acumuladas: ${formatMiles(totalExistingMiles)}\n`;
    
    data.cardMileageRules.forEach((rule: any) => {
      const historyMiles = mileageByCard[rule.card_id] || 0;
      const totalCardMiles = (rule.existing_miles || 0) + historyMiles;
      
      context += language === 'pt' 
        ? `- ${rule.bank_name} ${rule.card_brand}: ${rule.miles_per_amount} milhas por ${formatCurrency(rule.amount_threshold, rule.currency)}. Milhas iniciais: ${formatMiles(rule.existing_miles || 0)}, Milhas por gastos: ${formatMiles(historyMiles)}, Total disponível: ${formatMiles(totalCardMiles)}\n`
        : language === 'en' 
        ? `- ${rule.bank_name} ${rule.card_brand}: ${rule.miles_per_amount} miles per ${formatCurrency(rule.amount_threshold, rule.currency)}. Initial miles: ${formatMiles(rule.existing_miles || 0)}, Miles from spending: ${formatMiles(historyMiles)}, Total available: ${formatMiles(totalCardMiles)}\n`
        : `- ${rule.bank_name} ${rule.card_brand}: ${rule.miles_per_amount} millas por ${formatCurrency(rule.amount_threshold, rule.currency)}. Millas iniciales: ${formatMiles(rule.existing_miles || 0)}, Millas por gastos: ${formatMiles(historyMiles)}, Total disponible: ${formatMiles(totalCardMiles)}\n`;
    });
  }

  // ====== GASTOS FUTUROS (ABA dentro de Gastos Mensais - PRÓXIMO MÊS APENAS) ======
  // Calculate exactly like FutureExpensesView.tsx
  const now = new Date();
  const futureDate = new Date();
  futureDate.setMonth(futureDate.getMonth() + 12); // 12 months for calendar
  
  // List limit date (end of next month)
  const listLimitDate = new Date();
  listLimitDate.setMonth(listLimitDate.getMonth() + 1);
  listLimitDate.setDate(new Date(listLimitDate.getFullYear(), listLimitDate.getMonth() + 1, 0).getDate());
  
  const futureExpensesData: any[] = [];
  
  // 1. INSTALLMENTS: add from futureInstallments (already filtered for next month)
  (data.futureInstallments || []).forEach((installment: any) => {
    futureExpensesData.push({
      type: 'installment',
      description: installment.description,
      amount: installment.amount,
      due_date: installment.transaction_date,
      category: installment.categories?.name || 'Sem categoria',
      card_name: installment.cards?.name,
      installment_info: `${installment.installment_number}/${installment.total_installments}`,
      owner_user: installment.owner_user,
      currency: installment.currency
    });
  });
  
  // 2. RECURRING EXPENSES: calculate ALL future occurrences like FutureExpensesView.tsx
  (data.recurringExpenses || []).forEach((recur: any) => {
    let currentDueDate = new Date(recur.next_due_date);
    let installmentCount = 0;
    const maxInstallments = recur.contract_duration_months || 120; // Default to 10 years if no duration
    
    while (currentDueDate <= futureDate && installmentCount < maxInstallments) {
      // Only add if date is in the future or today
      if (currentDueDate >= now) {
        futureExpensesData.push({
          type: 'recurring',
          description: recur.name,
          amount: recur.amount,
          due_date: currentDueDate.toISOString().split('T')[0],
          category: 'Recorrente',
          owner_user: recur.owner_user,
          currency: recur.currency
        });
      }
      
      // Calculate next due date
      currentDueDate = new Date(currentDueDate);
      currentDueDate.setDate(currentDueDate.getDate() + recur.frequency_days);
      installmentCount++;
    }
  });
  
  // 3. CARD PAYMENTS: calculate exactly like FutureExpensesView.tsx
  const getNextDueDate = (dueDay: number): string => {
    const now = new Date();
    const currentDay = now.getDate();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    let nextDueDate: Date;
    
    // If we haven't passed the due day in current month
    if (currentDay <= dueDay) {
      nextDueDate = new Date(currentYear, currentMonth, dueDay);
    } else {
      // If already passed, use next month
      nextDueDate = new Date(currentYear, currentMonth + 1, dueDay);
    }
    
    // Ensure we don't return a date in the past
    if (nextDueDate <= now) {
      nextDueDate = new Date(currentYear, currentMonth + 1, dueDay);
    }
    
    return nextDueDate.toISOString().split('T')[0];
  };
  
  // Function to calculate card payment amount like FutureExpensesView.tsx
  const calculateCardPaymentAmount = (card: any): number => {
    // For credit cards, the payment amount is current_balance (outstanding balance)
    if (card.card_type === 'credit') {
      return Number(card.current_balance || 0);
    }
    
    // For other card types, use current balance
    return card.current_balance || 0;
  };
  
  (data.futureCardPayments || []).forEach((card: any) => {
    if (card.due_date) {
      const paymentAmount = calculateCardPaymentAmount(card);
      if (paymentAmount > 0) {
        const nextDueDate = getNextDueDate(card.due_date);
        futureExpensesData.push({
          type: 'card_payment',
          description: `Pagamento ${card.name}`,
          amount: paymentAmount,
          due_date: nextDueDate,
          category: 'Cartão de Crédito',
          card_name: card.name,
          owner_user: card.owner_user,
          currency: card.currency
        });
      }
    }
  });
  
  // Filter expenses for list (only until end of next month) - exactly like FutureExpensesView.tsx
  const expensesForList = futureExpensesData.filter(expense => 
    new Date(expense.due_date) <= listLimitDate
  );
  
  // Sort by date
  expensesForList.sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
  
  const futureExpensesTotal = expensesForList.reduce((sum, expense) => sum + expense.amount, 0);
  const futureExpensesItems = expensesForList.map(expense => {
    const formattedDate = new Date(expense.due_date).toLocaleDateString('pt-BR');
    let description = expense.description;
    
    if (expense.type === 'installment' && expense.installment_info) {
      description += ` - Parcela ${expense.installment_info}`;
    } else if (expense.type === 'recurring') {
      description += ` (recorrente - vence ${formattedDate})`;
    }
    
    return `${description}: ${formatCurrency(expense.amount, expense.currency)}`;
  });
  
  // Seção GASTOS FUTUROS
  context += language === 'pt' 
    ? `\n====== GASTOS FUTUROS (PRÓXIMO MÊS) ======\n`
    : language === 'en' 
    ? `\n====== FUTURE EXPENSES (NEXT MONTH) ======\n`
    : `\n====== GASTOS FUTUROS (PRÓXIMO MES) ======\n`;
  
  if (futureExpensesTotal > 0) {
    context += language === 'pt' 
      ? `Total de gastos previstos para o próximo mês: ${formatCurrency(futureExpensesTotal)}\n\n`
      : language === 'en' 
      ? `Total expenses forecast for next month: ${formatCurrency(futureExpensesTotal)}\n\n`
      : `Total de gastos previstos para el próximo mes: ${formatCurrency(futureExpensesTotal)}\n\n`;
    
    context += language === 'pt' 
      ? `Detalhamento dos gastos futuros:\n`
      : language === 'en' 
      ? `Future expenses breakdown:\n`
      : `Desglose de gastos futuros:\n`;
    
    futureExpensesItems.forEach(item => {
      context += `- ${item}\n`;
    });
  } else {
    context += language === 'pt' 
      ? `Nenhum gasto previsto para o próximo mês.\n`
      : language === 'en' 
      ? `No expenses forecast for next month.\n`
      : `No hay gastos previstos para el próximo mes.\n`;
  }
  
  // ====== GASTOS RECORRENTES (SEÇÃO INDEPENDENTE - TODAS AS DESPESAS) ======
  context += language === 'pt' 
    ? `\n====== GASTOS RECORRENTES ======\n`
    : language === 'en' 
    ? `\n====== RECURRING EXPENSES ======\n`
    : `\n====== GASTOS RECURRENTES ======\n`;
  
  if (data.recurringExpenses && data.recurringExpenses.length > 0) {
    // Separate active and inactive
    const activeRecurring = data.recurringExpenses.filter((exp: any) => exp.is_active);
    const inactiveRecurring = data.recurringExpenses.filter((exp: any) => !exp.is_active);
    
    if (activeRecurring.length > 0) {
      const totalActiveRecurring = activeRecurring.reduce((sum: number, expense: any) => sum + Number(expense.amount), 0);
      
      context += language === 'pt' 
        ? `DESPESAS RECORRENTES ATIVAS:\nTotal mensal estimado: ${formatCurrency(totalActiveRecurring)}\n\n`
        : language === 'en' 
        ? `ACTIVE RECURRING EXPENSES:\nEstimated monthly total: ${formatCurrency(totalActiveRecurring)}\n\n`
        : `GASTOS RECURRENTES ACTIVOS:\nTotal mensual estimado: ${formatCurrency(totalActiveRecurring)}\n\n`;
      
      activeRecurring.forEach((expense: any) => {
        const nextDue = new Date(expense.next_due_date);
        const formattedDate = nextDue.toLocaleDateString('pt-BR');
        
        context += language === 'pt' 
          ? `- ${expense.name}: ${formatCurrency(expense.amount, expense.currency)} a cada ${expense.frequency_days} dias (próximo vencimento: ${formattedDate})\n`
          : language === 'en' 
          ? `- ${expense.name}: ${formatCurrency(expense.amount, expense.currency)} every ${expense.frequency_days} days (next due: ${formattedDate})\n`
          : `- ${expense.name}: ${formatCurrency(expense.amount, expense.currency)} cada ${expense.frequency_days} días (próximo vencimiento: ${formattedDate})\n`;
      });
      context += '\n';
    }
    
    if (inactiveRecurring.length > 0) {
      context += language === 'pt' 
        ? `DESPESAS RECORRENTES INATIVAS/PAUSADAS (${inactiveRecurring.length}):\n`
        : language === 'en' 
        ? `INACTIVE/PAUSED RECURRING EXPENSES (${inactiveRecurring.length}):\n`
        : `GASTOS RECURRENTES INACTIVOS/PAUSADOS (${inactiveRecurring.length}):\n`;
      
      inactiveRecurring.forEach((expense: any) => {
        context += language === 'pt' 
          ? `- ${expense.name}: ${formatCurrency(expense.amount, expense.currency)} (pausado/cancelado)\n`
          : language === 'en' 
          ? `- ${expense.name}: ${formatCurrency(expense.amount, expense.currency)} (paused/cancelled)\n`
          : `- ${expense.name}: ${formatCurrency(expense.amount, expense.currency)} (pausado/cancelado)\n`;
      });
      context += '\n';
    }
  } else {
    context += language === 'pt' 
      ? `Nenhuma despesa recorrente cadastrada.\n`
      : language === 'en' 
      ? `No recurring expenses registered.\n`
      : `No hay gastos recurrentes registrados.\n`;
  }

  // ====== GASTOS FUTUROS MANUAIS ======
  context += language === 'pt' 
    ? `\n====== GASTOS FUTUROS MANUAIS ======\n`
    : language === 'en' 
    ? `\n====== MANUAL FUTURE EXPENSES ======\n`
    : `\n====== GASTOS FUTUROS MANUALES ======\n`;
  
  if (data.manualFutureExpenses && data.manualFutureExpenses.length > 0) {
    // Separate paid and unpaid
    const unpaidManual = data.manualFutureExpenses.filter((exp: any) => !exp.is_paid);
    const paidManual = data.manualFutureExpenses.filter((exp: any) => exp.is_paid);
    
    if (unpaidManual.length > 0) {
      const totalUnpaidManual = unpaidManual.reduce((sum: number, expense: any) => sum + Number(expense.amount), 0);
      
      context += language === 'pt' 
        ? `GASTOS FUTUROS PENDENTES:\nTotal a pagar: ${formatCurrency(totalUnpaidManual)}\n\n`
        : language === 'en' 
        ? `PENDING FUTURE EXPENSES:\nTotal to pay: ${formatCurrency(totalUnpaidManual)}\n\n`
        : `GASTOS FUTUROS PENDIENTES:\nTotal a pagar: ${formatCurrency(totalUnpaidManual)}\n\n`;
      
      unpaidManual.forEach((expense: any) => {
        const dueDate = new Date(expense.due_date);
        const formattedDate = dueDate.toLocaleDateString('pt-BR');
        const isOverdue = dueDate < new Date();
        const overdueIndicator = isOverdue ? ' ⚠️ VENCIDO' : '';
        
        context += language === 'pt' 
          ? `- ${expense.description}: ${formatCurrency(expense.amount)} (vence: ${formattedDate})${overdueIndicator}\n`
          : language === 'en' 
          ? `- ${expense.description}: ${formatCurrency(expense.amount)} (due: ${formattedDate})${overdueIndicator}\n`
          : `- ${expense.description}: ${formatCurrency(expense.amount)} (vence: ${formattedDate})${overdueIndicator}\n`;
      });
      context += '\n';
    }
    
    if (paidManual.length > 0) {
      context += language === 'pt' 
        ? `GASTOS FUTUROS JÁ PAGOS (${paidManual.length}):\n`
        : language === 'en' 
        ? `ALREADY PAID FUTURE EXPENSES (${paidManual.length}):\n`
        : `GASTOS FUTUROS YA PAGADOS (${paidManual.length}):\n`;
      
      paidManual.slice(0, 5).forEach((expense: any) => { // Show only last 5 paid
        const paidDate = expense.paid_at ? new Date(expense.paid_at).toLocaleDateString('pt-BR') : 'N/A';
        
        context += language === 'pt' 
          ? `- ${expense.description}: ${formatCurrency(expense.amount)} (pago em: ${paidDate})\n`
          : language === 'en' 
          ? `- ${expense.description}: ${formatCurrency(expense.amount)} (paid on: ${paidDate})\n`
          : `- ${expense.description}: ${formatCurrency(expense.amount)} (pagado el: ${paidDate})\n`;
      });
      
      if (paidManual.length > 5) {
        context += language === 'pt' 
          ? `... e mais ${paidManual.length - 5} gastos pagos\n`
          : language === 'en' 
          ? `... and ${paidManual.length - 5} more paid expenses\n`
          : `... y ${paidManual.length - 5} gastos más pagados\n`;
      }
      context += '\n';
    }
  } else {
    context += language === 'pt' 
      ? `Nenhum gasto futuro manual cadastrado.\n`
      : language === 'en' 
      ? `No manual future expenses registered.\n`
      : `No hay gastos futuros manuales registrados.\n`;
  }

  // Categories with descriptions for AI context
  if (data.categories && data.categories.length > 0) {
    context += language === 'pt' 
      ? '\nCATEGORIAS DISPONÍVEIS:\n'
      : language === 'en' 
      ? '\nAVAILABLE CATEGORIES:\n'
      : '\nCATEGORÍAS DISPONIBLES:\n';
    
    data.categories.forEach((category: any) => {
      const typeLabel = language === 'pt' 
        ? (category.category_type === 'income' ? 'Receita' : 'Despesa')
        : language === 'en' 
        ? (category.category_type === 'income' ? 'Income' : 'Expense')
        : (category.category_type === 'income' ? 'Ingreso' : 'Gasto');
      
      context += `- ${category.name} (${typeLabel})`;
      if (category.description) {
        context += `: ${category.description}`;
      }
      context += '\n';
    });
    context += '\n';
  }

  return context;
}

async function saveToAIHistory(supabase: any, userId: string, entryType: string, message: string, userQuestion?: string) {
  try {
    await supabase
      .from('ai_history')
      .insert({
        user_id: userId,
        entry_type: entryType,
        message: message,
        user_question: userQuestion || null
      });
  } catch (error) {
    console.error('Error saving to AI history:', error);
  }
}
