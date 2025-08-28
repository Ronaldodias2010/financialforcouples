import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
      .single();

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

    // Collect user's financial data
    const financialData = await collectFinancialData(supabaseClient, user.id, dateRange);
    console.log('Financial data collected:', {
      transactions: financialData.transactions.length,
      accounts: financialData.accounts.length,
      cards: financialData.cards.length,
      investments: financialData.investments.length
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
      chatHistory.forEach((msg: ChatMessage) => {
        messages.push(msg);
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

    // Call OpenAI API
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: messages,
        temperature: 0.7,
        max_tokens: 1500,
      }),
    });

    if (!openAIResponse.ok) {
      const errorText = await openAIResponse.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${openAIResponse.status}`);
    }

    const aiData = await openAIResponse.json();
    const aiResponse = aiData.choices[0].message.content;

    // Calculate actual tokens and cost
    const outputTokens = estimateTokens(aiResponse);
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

    // Save to AI history if this is an analysis or recommendation
    await saveToAIHistory(supabaseClient, user.id, 'ai_analysis', aiResponse);

    // Get updated usage for response
    const { data: updatedUsage } = await supabaseClient
      .rpc('get_user_daily_ai_usage', { p_user_id: user.id })
      .single();

    return new Response(JSON.stringify({ 
      response: aiResponse,
      usage: {
        tokensUsed: totalTokens,
        estimatedCost: estimatedCost,
        dailyUsage: updatedUsage,
        dailyLimits: limits
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
    return new Response(JSON.stringify({ 
      error: error.message || 'Erro interno do servidor',
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
    { data: recurringExpenses = [] },
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
    supabase.from('recurring_expenses').select('*').in('user_id', userIds).eq('is_active', true),
    
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
        transactions: transactions.filter(t => t.user_id === userId),
        accounts: accounts.filter(a => a.user_id === userId),
        cards: cards.filter(c => c.user_id === userId),
        investments: investments.filter(i => i.user_id === userId),
        investmentGoals: investmentGoals.filter(g => g.user_id === userId),
        mileageGoals: mileageGoals.filter(g => g.user_id === userId),
        mileageHistory: mileageHistory.filter(h => h.user_id === userId),
        cardMileageRules: cardMileageRules.filter(r => r.user_id === userId)
      },
      partner: {
        transactions: transactions.filter(t => t.user_id === partnerUserId),
        accounts: accounts.filter(a => a.user_id === partnerUserId),
        cards: cards.filter(c => c.user_id === partnerUserId),
        investments: investments.filter(i => i.user_id === partnerUserId),
        investmentGoals: investmentGoals.filter(g => g.user_id === partnerUserId),
        mileageGoals: mileageGoals.filter(g => g.user_id === partnerUserId),
        mileageHistory: mileageHistory.filter(h => h.user_id === partnerUserId),
        cardMileageRules: cardMileageRules.filter(r => r.user_id === partnerUserId)
      },
      combined: {
        transactions,
        accounts,
        cards,
        investments,
        investmentGoals,
        mileageGoals,
        mileageHistory,
        cardMileageRules
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
    futureInstallments,
    futureCardPayments,
    relationshipInfo,
    segmentedData
  };
}

// Get system prompt based on detected language
function getSystemPrompt(language: 'pt' | 'en' | 'es', financialContext: string, userMessage: string): string {
  const prompts = {
    pt: `Você é um consultor financeiro especialista especializado em atendimento personalizado para casais e indivíduos. 

IMPORTANTE: Analise o contexto do relacionamento e seja inteligente na interpretação das solicitações. RESPONDA SEMPRE EM PORTUGUÊS.

${financialContext}

PERGUNTA DO USUÁRIO: ${userMessage}

INSTRUÇÕES ESPECÍFICAS DE INTERPRETAÇÃO:
- Se o usuário fizer uma pergunta ambígua sobre "saldo", "gastos", "receitas" e ele for parte de um casal, pergunte especificamente se ele quer ver dados próprios, do parceiro, ou combinados
- Use sempre os nomes reais dos usuários para personalizar as respostas
- Para usuários individuais, sempre forneça dados próprios sem perguntar sobre outros
- Seja prático e ofereça recomendações acionáveis baseadas nos dados reais

INSTRUÇÕES SOBRE SISTEMA DE MILHAS:
- CRITICAL: As milhas em metas (current_miles) JÁ INCLUEM as milhas iniciais dos cartões quando a meta foi criada
- As milhas mostradas no histórico são APENAS de transações/gastos realizados
- NUNCA duplique as milhas iniciais ao calcular quanto falta para atingir uma meta
- Se uma meta tem current_miles maior que zero, esse valor já considera milhas iniciais + milhas de gastos

Forneça uma resposta detalhada, personalizada e profissional EM PORTUGUÊS.`,
    
    en: `You are an expert financial consultant specialized in personalized service for couples and individuals.

IMPORTANT: Analyze the relationship context and be intelligent in interpreting requests. ALWAYS RESPOND IN ENGLISH.

${financialContext}

USER QUESTION: ${userMessage}

SPECIFIC INTERPRETATION INSTRUCTIONS:
- If the user asks an ambiguous question about "balance", "expenses", "income" and they are part of a couple, ask specifically if they want to see their own data, their partner's, or combined
- Always use real user names to personalize responses
- For individual users, always provide their own data without asking about others
- Be practical and offer actionable recommendations based on real data

MILEAGE SYSTEM INSTRUCTIONS:
- CRITICAL: Miles in goals (current_miles) ALREADY INCLUDE initial card miles when the goal was created
- Miles shown in history are ONLY from transactions/spending
- NEVER duplicate initial miles when calculating how much is left to reach a goal
- If a goal has current_miles greater than zero, this value already considers initial miles + spending miles

Provide a detailed, personalized and professional response IN ENGLISH.`,
    
    es: `Eres un consultor financiero experto especializado en atención personalizada para parejas e individuos.

IMPORTANTE: Analiza el contexto de la relación y sé inteligente en la interpretación de las solicitudes. RESPONDE SIEMPRE EN ESPAÑOL.

${financialContext}

PREGUNTA DEL USUARIO: ${userMessage}

INSTRUCCIONES ESPECÍFICAS DE INTERPRETACIÓN:
- Si el usuario hace una pregunta ambigua sobre "saldo", "gastos", "ingresos" y forma parte de una pareja, pregunta específicamente si quiere ver sus propios datos, los de su pareja, o combinados
- Usa siempre los nombres reales de los usuarios para personalizar las respuestas
- Para usuarios individuales, siempre proporciona sus propios datos sin preguntar sobre otros
- Sé práctico y ofrece recomendaciones accionables basadas en datos reales

INSTRUCCIONES DEL SISTEMA DE MILLAS:
- CRÍTICO: Las millas en metas (current_miles) YA INCLUYEN las millas iniciales de las tarjetas cuando se creó la meta
- Las millas mostradas en el historial son SOLO de transacciones/gastos realizados
- NUNCA dupliques las millas iniciales al calcular cuánto falta para alcanzar una meta
- Si una meta tiene current_miles mayor que cero, este valor ya considera millas iniciales + millas de gastos

Proporciona una respuesta detallada, personalizada y profesional EN ESPAÑOL.`
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
  const todayTransactions = data.transactions?.filter(t => t.transaction_date === today) || [];
  const todayExpenses = todayTransactions.filter(t => t.type === 'expense');
  const todayIncome = todayTransactions.filter(t => t.type === 'income');
  
  const todayExpenseTotal = todayExpenses.reduce((sum, t) => sum + Number(t.amount), 0);
  const todayIncomeTotal = todayIncome.reduce((sum, t) => sum + Number(t.amount), 0);

  // Add TODAY's section first for immediate questions
  if (language === 'pt') {
    context += `GASTOS HOJE (${today}):\n`;
    if (todayExpenses.length > 0) {
      context += `Total gasto hoje: ${formatCurrency(todayExpenseTotal)}\n`;
      todayExpenses.forEach(t => {
        context += `- ${t.description}: ${formatCurrency(t.amount, t.currency)}\n`;
      });
    } else {
      context += `Nenhum gasto registrado hoje.\n`;
    }
    
    context += `\nRECEITAS HOJE (${today}):\n`;
    if (todayIncome.length > 0) {
      context += `Total recebido hoje: ${formatCurrency(todayIncomeTotal)}\n`;
      todayIncome.forEach(t => {
        context += `- ${t.description}: ${formatCurrency(t.amount, t.currency)}\n`;
      });
    } else {
      context += `Nenhuma receita registrada hoje.\n`;
    }
    context += `\n`;
  }

  // Mileage Goals Analysis - COM CORREÇÃO CRÍTICA
  if (data.mileageGoals && data.mileageGoals.length > 0) {
    context += language === 'pt' 
      ? `\nMETAS DE MILHAS:\n`
      : language === 'en' 
      ? `\nMILEAGE GOALS:\n`
      : `\nOBJETIVOS DE MILLAS:\n`;
    
    data.mileageGoals.forEach(goal => {
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
    const totalExistingMiles = data.cardMileageRules.reduce((sum, rule) => sum + (rule.existing_miles || 0), 0);
    
    // Calcular milhas do histórico por cartão
    const mileageByCard: Record<string, number> = {};
    if (data.mileageHistory) {
      data.mileageHistory.forEach(record => {
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
    
    data.cardMileageRules.forEach(rule => {
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
  
  const futureExpensesData = [];
  
  // 1. INSTALLMENTS: add from futureInstallments (already filtered for next month)
  (data.futureInstallments || []).forEach(installment => {
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
  (data.recurringExpenses || []).forEach(recur => {
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
    // For credit cards, calculate: Total Limit - Available Limit
    if (card.card_type === 'credit') {
      const totalLimit = Number(card.credit_limit || 0);
      const availableLimit = Number(card.initial_balance || 0);
      return totalLimit - availableLimit;
    }
    
    // For other card types, use current balance
    return card.current_balance || 0;
  };
  
  (data.futureCardPayments || []).forEach(card => {
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
  
  // ====== GASTOS RECORRENTES (SEÇÃO INDEPENDENTE - TODAS AS DESPESAS ATIVAS) ======
  context += language === 'pt' 
    ? `\n====== GASTOS RECORRENTES (TODAS AS DESPESAS ATIVAS) ======\n`
    : language === 'en' 
    ? `\n====== RECURRING EXPENSES (ALL ACTIVE EXPENSES) ======\n`
    : `\n====== GASTOS RECURRENTES (TODOS LOS GASTOS ACTIVOS) ======\n`;
  
  if (data.recurringExpenses && data.recurringExpenses.length > 0) {
    const totalAllRecurring = data.recurringExpenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
    
    context += language === 'pt' 
      ? `Total mensal estimado de todas as despesas recorrentes: ${formatCurrency(totalAllRecurring)}\n\n`
      : language === 'en' 
      ? `Estimated monthly total of all recurring expenses: ${formatCurrency(totalAllRecurring)}\n\n`
      : `Total mensual estimado de todos los gastos recurrentes: ${formatCurrency(totalAllRecurring)}\n\n`;
    
    context += language === 'pt' 
      ? `Lista completa de despesas recorrentes ativas:\n`
      : language === 'en' 
      ? `Complete list of active recurring expenses:\n`
      : `Lista completa de gastos recurrentes activos:\n`;
    
    data.recurringExpenses.forEach(expense => {
      const nextDue = new Date(expense.next_due_date);
      const formattedDate = nextDue.toLocaleDateString('pt-BR');
      
      context += language === 'pt' 
        ? `- ${expense.name}: ${formatCurrency(expense.amount, expense.currency)} a cada ${expense.frequency_days} dias (próximo vencimento: ${formattedDate})\n`
        : language === 'en' 
        ? `- ${expense.name}: ${formatCurrency(expense.amount, expense.currency)} every ${expense.frequency_days} days (next due: ${formattedDate})\n`
        : `- ${expense.name}: ${formatCurrency(expense.amount, expense.currency)} cada ${expense.frequency_days} días (próximo vencimiento: ${formattedDate})\n`;
    });
  } else {
    context += language === 'pt' 
      ? `Nenhuma despesa recorrente ativa cadastrada.\n`
      : language === 'en' 
      ? `No active recurring expenses registered.\n`
      : `No hay gastos recurrentes activos registrados.\n`;
  }

  return context;
}

async function saveToAIHistory(supabase: any, userId: string, entryType: string, message: string) {
  try {
    await supabase
      .from('ai_history')
      .insert({
        user_id: userId,
        entry_type: entryType,
        message: message
      });
  } catch (error) {
    console.error('Error saving to AI history:', error);
  }
}
