import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FinancialData {
  transactions: any[];
  accounts: any[];
  cards: any[];
  investments: any[];
  categories: any[];
  recurringExpenses: any[];
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
        content: `Você é um consultor financeiro especialista. Analise os dados financeiros do usuário e responda de forma profissional e útil.

DADOS FINANCEIROS DO USUÁRIO:
${financialContext}

PERGUNTA DO USUÁRIO: ${message}

Forneça uma resposta detalhada, com insights específicos baseados nos dados reais do usuário. Seja prático e ofereça recomendações acionáveis.`
      }
    ];

    // Add chat history if available
    if (chatHistory.length > 0) {
      chatHistory.forEach((msg: ChatMessage) => {
        messages.push(msg);
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

    console.log('AI response generated successfully');

    // Save to AI history if this is an analysis or recommendation
    await saveToAIHistory(supabaseClient, user.id, 'ai_analysis', aiResponse);

    return new Response(JSON.stringify({ 
      response: aiResponse,
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
      .gte('transaction_date', fromDate)
      .lte('transaction_date', toDate)
      .order('transaction_date', { ascending: false }),
    
    supabase.from('accounts').select('*'),
    supabase.from('cards').select('*'),
    supabase.from('investments').select('*'),
    supabase.from('categories').select('*'),
    supabase.from('recurring_expenses').select('*').eq('is_active', true)
  ]);

  return {
    transactions,
    accounts,
    cards,
    investments,
    categories,
    recurringExpenses
  };
}

function generateFinancialContext(data: FinancialData): string {
  const { transactions, accounts, cards, investments, categories, recurringExpenses } = data;

  // Calculate key metrics
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalAccountBalance = accounts
    .reduce((sum, a) => sum + Number(a.balance), 0);

  const totalInvestments = investments
    .reduce((sum, i) => sum + Number(i.current_value), 0);

  // Expense by category
  const expensesByCategory = transactions
    .filter(t => t.type === 'expense' && t.category_id)
    .reduce((acc, t) => {
      const category = categories.find(c => c.id === t.category_id);
      const categoryName = category?.name || 'Outros';
      acc[categoryName] = (acc[categoryName] || 0) + Number(t.amount);
      return acc;
    }, {} as Record<string, number>);

  // Card debt analysis
  const cardDebt = cards
    .reduce((sum, c) => sum + Number(c.current_balance || 0), 0);

  const context = `
RESUMO FINANCEIRO:
- Receitas no período: R$ ${totalIncome.toFixed(2)}
- Gastos no período: R$ ${totalExpenses.toFixed(2)}
- Saldo líquido: R$ ${(totalIncome - totalExpenses).toFixed(2)}
- Saldo total em contas: R$ ${totalAccountBalance.toFixed(2)}
- Total em investimentos: R$ ${totalInvestments.toFixed(2)}
- Dívidas em cartões: R$ ${cardDebt.toFixed(2)}

CONTAS BANCÁRIAS (${accounts.length}):
${accounts.map(a => `- ${a.name}: R$ ${Number(a.balance).toFixed(2)} (${a.currency})`).join('\n')}

CARTÕES (${cards.length}):
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
        message: message.substring(0, 1000) // Limit message length
      });
  } catch (error) {
    console.error('Error saving to AI history:', error);
  }
}