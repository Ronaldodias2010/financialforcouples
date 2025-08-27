import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
  categories: any[];
  recurringExpenses: any[];
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
    };
    partner?: {
      transactions: any[];
      accounts: any[];
      cards: any[];
      investments: any[];
    };
    combined: {
      transactions: any[];
      accounts: any[];
      cards: any[];
      investments: any[];
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

    // Generate financial context
    const financialContext = generateFinancialContext(financialData);
    console.log('Financial context generated');

    // Prepare messages for OpenAI
    const messages: ChatMessage[] = [
      {
        role: 'user',
        content: `Você é um consultor financeiro especialista especializado em atendimento personalizado para casais e indivíduos. 

IMPORTANTE: Analise o contexto do relacionamento e seja inteligente na interpretação das solicitações:

${financialContext}

PERGUNTA DO USUÁRIO: ${message}

INSTRUÇÕES ESPECÍFICAS DE INTERPRETAÇÃO:
- Se o usuário fizer uma pergunta ambígua sobre "saldo", "gastos", "receitas" e ele for parte de um casal, pergunte especificamente se ele quer ver dados próprios, do parceiro, ou combinados
- Use sempre os nomes reais dos usuários para personalizar as respostas
- Para usuários individuais, sempre forneça dados próprios sem perguntar sobre outros
- Seja prático e ofereça recomendações acionáveis baseadas nos dados reais

Forneça uma resposta detalhada, personalizada e profissional.`
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
  
  const [
    { data: transactions = [] },
    { data: accounts = [] },
    { data: cards = [] },
    { data: investments = [] },
    { data: categories = [] },
    { data: recurringExpenses = [] }
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
    supabase.from('categories').select('*').in('user_id', userIds),
    supabase.from('recurring_expenses').select('*').in('user_id', userIds).eq('is_active', true)
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
        investments: investments.filter(i => i.user_id === userId)
      },
      partner: {
        transactions: transactions.filter(t => t.user_id === partnerUserId),
        accounts: accounts.filter(a => a.user_id === partnerUserId),
        cards: cards.filter(c => c.user_id === partnerUserId),
        investments: investments.filter(i => i.user_id === partnerUserId)
      },
      combined: {
        transactions,
        accounts,
        cards,
        investments
      }
    };
  }

  return {
    transactions,
    accounts,
    cards,
    investments,
    categories,
    recurringExpenses,
    relationshipInfo,
    segmentedData
  };
}

function generateFinancialContext(data: FinancialData): string {
  const { transactions, accounts, cards, investments, categories, recurringExpenses, relationshipInfo, segmentedData } = data;

  let context = '';

  // Get today's date for analyzing daily transactions
  const today = new Date().toISOString().split('T')[0];
  const todayTransactions = transactions.filter(t => t.transaction_date === today);
  const todayIncome = todayTransactions.filter(t => t.type === 'income');
  const todayExpenses = todayTransactions.filter(t => t.type === 'expense');

  // Add relationship context for intelligent interpretation
  if (relationshipInfo) {
    context += `
INFORMAÇÕES DO RELACIONAMENTO:
- Status: ${relationshipInfo.isCouple ? 'CASAL_ATIVO' : 'USUÁRIO_INDIVIDUAL'}
- Nome do usuário atual: ${relationshipInfo.currentUserName}`;
    
    if (relationshipInfo.partnerName) {
      context += `
- Nome do parceiro(a): ${relationshipInfo.partnerName}`;
    }

    context += `

SALDO REAL DAS CONTAS (Valor Disponível Atualmente):
${accounts.length > 0 ? 
  accounts.map(acc => {
    const ownerName = relationshipInfo.isCouple ? 
      (acc.user_id === relationshipInfo.partnerUserId ? relationshipInfo.partnerName : relationshipInfo.currentUserName) :
      relationshipInfo.currentUserName;
    return `- ${acc.name || 'Conta'}: R$ ${Number(acc.balance || 0).toFixed(2)} (${ownerName})`;
  }).join('\n') + '\n' +
  `TOTAL SALDO REAL: R$ ${accounts.reduce((sum, acc) => sum + Number(acc.balance || 0), 0).toFixed(2)}` :
  'CONTAS: Nenhuma conta cadastrada'
}

MOVIMENTAÇÃO DO PERÍODO (Receitas e Despesas):
${transactions.filter(t => t.type === 'income').length > 0 ? 
  `RECEITAS DO PERÍODO:
${transactions.filter(t => t.type === 'income').map(t => {
    const ownerName = relationshipInfo.isCouple ? 
      (t.user_id === relationshipInfo.partnerUserId ? relationshipInfo.partnerName : relationshipInfo.currentUserName) :
      relationshipInfo.currentUserName;
    return `- ${t.description}: R$ ${Number(t.amount).toFixed(2)} (${ownerName})`;
  }).join('\n')}
TOTAL RECEITAS: R$ ${transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0).toFixed(2)}` : 
  'RECEITAS DO PERÍODO: Nenhuma receita registrada'
}

${transactions.filter(t => t.type === 'expense').length > 0 ? 
  `DESPESAS DO PERÍODO:
${transactions.filter(t => t.type === 'expense').slice(0, 10).map(t => {
    const category = categories.find(c => c.id === t.category_id);
    const ownerName = relationshipInfo.isCouple ? 
      (t.user_id === relationshipInfo.partnerUserId ? relationshipInfo.partnerName : relationshipInfo.currentUserName) :
      relationshipInfo.currentUserName;
    return `- ${t.description}: R$ ${Number(t.amount).toFixed(2)} (${category?.name || 'Sem categoria'} - ${ownerName})`;
  }).join('\n')}
${transactions.filter(t => t.type === 'expense').length > 10 ? '... (mostrando apenas as últimas 10)' : ''}
TOTAL DESPESAS: R$ ${transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0).toFixed(2)}` :
  'DESPESAS DO PERÍODO: Nenhuma despesa registrada'
}

TRANSAÇÕES DE HOJE (${today}):
${todayIncome.length > 0 ? 
  `ENTRADAS HOJE:
${todayIncome.map(t => `- ${t.description}: R$ ${Number(t.amount).toFixed(2)} (${accounts.find(a => a.id === t.account_id)?.name || 'Conta'})`).join('\n')}
TOTAL DE ENTRADAS HOJE: R$ ${todayIncome.reduce((sum, t) => sum + Number(t.amount), 0).toFixed(2)}` : 
  'ENTRADAS HOJE: Nenhuma entrada registrada hoje'
}

${todayExpenses.length > 0 ? 
  `GASTOS HOJE:
${todayExpenses.map(t => {
    const category = categories.find(c => c.id === t.category_id);
    const paymentInfo = t.account_id ? 
      (accounts.find(a => a.id === t.account_id)?.name || 'Conta') :
      (cards.find(c => c.id === t.card_id)?.name || 'Cartão');
    return `- ${t.description}: R$ ${Number(t.amount).toFixed(2)} (${category?.name || 'Sem categoria'} - ${paymentInfo})`;
  }).join('\n')}
TOTAL DE GASTOS HOJE: R$ ${todayExpenses.reduce((sum, t) => sum + Number(t.amount), 0).toFixed(2)}` :
  'GASTOS HOJE: Nenhum gasto registrado hoje'
}

INSTRUÇÕES CRÍTICAS DE INTERPRETAÇÃO:

DIFERENCIAÇÃO ENTRE SALDO REAL E MOVIMENTAÇÃO:
- "Qual meu saldo?" / "Quanto tenho na conta?" / "Saldo das contas" → Use SALDO REAL DAS CONTAS
- "Quanto movimentei?" / "Qual resultado do mês?" / "Receitas/Despesas" → Use MOVIMENTAÇÃO DO PERÍODO
- "Tenho dinheiro disponível?" → Use SALDO REAL DAS CONTAS
- "Como está minha situação financeira do mês?" → Use MOVIMENTAÇÃO DO PERÍODO

PARA PERGUNTAS OBJETIVAS SOBRE HOJE:
- Se o usuário perguntar sobre "entrou algum valor hoje", "teve receita hoje", "recebi algo hoje": responda DIRETAMENTE baseado nas ENTRADAS HOJE acima
- Se o usuário perguntar sobre "gastos de hoje", "gastei hoje", "saiu dinheiro hoje": responda DIRETAMENTE baseado nos GASTOS HOJE acima
- Para estas perguntas objetivas, seja CONCISO e DIRETO: apenas confirme sim/não e mostre os valores específicos
- Não faça análise completa automaticamente - apenas responda a pergunta específica
- Ofereça análise mais detalhada apenas se o usuário pedir explicitamente ("quer mais detalhes?", "pode analisar?")

PARA PERGUNTAS GERAIS/AMBÍGUAS:
${relationshipInfo.isCouple ? 
  `- Este usuário faz parte de um casal. Quando o usuário fizer perguntas ambíguas sobre "saldo", "gastos", "receitas" sem especificar de quem, pergunte especificamente se ele quer ver:
  1) Apenas seus dados pessoais (${relationshipInfo.currentUserName})
  2) Apenas os dados do parceiro (${relationshipInfo.partnerName})
  3) Dados combinados de ambos
  
- Use os nomes reais nas interações para personalizar as respostas
- Ofereça insights comparativos entre os parceiros quando apropriado` :
  '- Este é um usuário individual. Sempre forneça dados próprios sem perguntar sobre outros usuários'
}

`;
  }

  // Calculate metrics for combined data - MOVIMENTAÇÃO DO PERÍODO (sem incluir saldos de contas)
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  // SALDO REAL DAS CONTAS (separado da movimentação)
  const totalAccountBalance = accounts
    .reduce((sum, a) => sum + Number(a.balance), 0);

  const totalInvestments = investments
    .reduce((sum, i) => sum + Number(i.current_value), 0);

  const cardDebt = cards
    .reduce((sum, c) => sum + Number(c.current_balance || 0), 0);

  // Add segmented data for couples
  if (segmentedData && relationshipInfo?.isCouple) {
    // Current user metrics - MOVIMENTAÇÃO SEPARADA (sem incluir saldos como receita)
    const userIncome = segmentedData.currentUser.transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const userExpenses = segmentedData.currentUser.transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    // SALDO REAL DAS CONTAS DO USUÁRIO (separado)
    const userAccountBalance = segmentedData.currentUser.accounts
      .reduce((sum, a) => sum + Number(a.balance), 0);
    const userInvestments = segmentedData.currentUser.investments
      .reduce((sum, i) => sum + Number(i.current_value), 0);

    // Partner metrics - MOVIMENTAÇÃO SEPARADA (sem incluir saldos como receita)
    const partnerIncome = segmentedData.partner!.transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const partnerExpenses = segmentedData.partner!.transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    // SALDO REAL DAS CONTAS DO PARCEIRO (separado)
    const partnerAccountBalance = segmentedData.partner!.accounts
      .reduce((sum, a) => sum + Number(a.balance), 0);
    const partnerInvestments = segmentedData.partner!.investments
      .reduce((sum, i) => sum + Number(i.current_value), 0);

    context += `

DADOS FINANCEIROS SEGMENTADOS POR USUÁRIO:

${relationshipInfo.currentUserName.toUpperCase()} - MOVIMENTAÇÃO DO PERÍODO:
- Receitas: R$ ${userIncome.toFixed(2)}
- Despesas: R$ ${userExpenses.toFixed(2)}
- Saldo Líquido da Movimentação: R$ ${(userIncome - userExpenses).toFixed(2)}

${relationshipInfo.currentUserName.toUpperCase()} - SALDO REAL DAS CONTAS:
- Total em Contas: R$ ${userAccountBalance.toFixed(2)}
- Investimentos: R$ ${userInvestments.toFixed(2)}

${relationshipInfo.partnerName?.toUpperCase()} - MOVIMENTAÇÃO DO PERÍODO:
- Receitas: R$ ${partnerIncome.toFixed(2)}
- Despesas: R$ ${partnerExpenses.toFixed(2)}
- Saldo Líquido da Movimentação: R$ ${(partnerIncome - partnerExpenses).toFixed(2)}
${relationshipInfo.partnerName?.toUpperCase()} - SALDO REAL DAS CONTAS:
- Total em Contas: R$ ${partnerAccountBalance.toFixed(2)}
- Investimentos: R$ ${partnerInvestments.toFixed(2)}

DADOS COMBINADOS DO CASAL:

MOVIMENTAÇÃO COMBINADA DO PERÍODO:
- Receitas Totais: R$ ${totalIncome.toFixed(2)}
- Despesas Totais: R$ ${totalExpenses.toFixed(2)}
- Saldo Líquido da Movimentação: R$ ${(totalIncome - totalExpenses).toFixed(2)}

SALDO REAL COMBINADO:
- Total em Contas: R$ ${totalAccountBalance.toFixed(2)}
- Total em Investimentos: R$ ${totalInvestments.toFixed(2)}
- Dívida em Cartões: R$ ${cardDebt.toFixed(2)}`;
  }

  // Expense by category
  const expensesByCategory = transactions
    .filter(t => t.type === 'expense' && t.category_id)
    .reduce((acc, t) => {
      const category = categories.find(c => c.id === t.category_id);
      const categoryName = category?.name || 'Outros';
      acc[categoryName] = (acc[categoryName] || 0) + Number(t.amount);
      return acc;
    }, {} as Record<string, number>);

  } else {
    // Single user data
    context += `

MOVIMENTAÇÃO DO PERÍODO:
- Total de Receitas: R$ ${totalIncome.toFixed(2)}
- Total de Despesas: R$ ${totalExpenses.toFixed(2)}
- Saldo Líquido da Movimentação: R$ ${(totalIncome - totalExpenses).toFixed(2)}

SALDO REAL DAS CONTAS:
- Saldo em Contas: R$ ${totalAccountBalance.toFixed(2)}
- Investimentos: R$ ${totalInvestments.toFixed(2)}
- Dívida em Cartões: R$ ${cardDebt.toFixed(2)}
`;
  }

  context += `

DETALHES DAS CONTAS (${accounts.length}):
${accounts.map(a => `- ${a.name}: R$ ${Number(a.balance).toFixed(2)} (${a.currency})`).join('\n')}

DETALHES DOS CARTÕES (${cards.length}):
${cards.map(c => `- ${c.name}: Limite R$ ${Number(c.credit_limit || 0).toFixed(2)}, Usado R$ ${Number(c.current_balance || 0).toFixed(2)}`).join('\n')}

GASTOS POR CATEGORIA:
${Object.entries(expensesByCategory)
  .sort(([,a], [,b]) => b - a)
  .slice(0, 10)
  .map(([cat, amount]) => `- ${cat}: R$ ${amount.toFixed(2)}`)
  .join('\n')}

GASTOS RECORRENTES (${recurringExpenses.length}):
${recurringExpenses.map(r => `- ${r.name}: R$ ${Number(r.amount).toFixed(2)} a cada ${r.frequency_days} dias`).join('\n')}

INVESTIMENTOS (${investments.length}):
${investments.map(i => `- ${i.name}: R$ ${Number(i.current_value).toFixed(2)} (${i.type})`).join('\n')}
`;

  return context;
}

async function saveToAIHistory(supabase: any, userId: string, entryType: string, message: string) {
  try {
    await supabase
      .from('ai_history')
      .insert({
        user_id: userId,
        entry_type: entryType,
        message: message.substring(0, 5000) // Increased limit to capture full recommendations
      });
  } catch (error) {
    console.error('Error saving to AI history:', error);
  }
}