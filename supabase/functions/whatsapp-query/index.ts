import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// ============================================================
// MULTILINGUAL RESPONSE TEMPLATES
// ============================================================
const MESSAGES = {
  pt: {
    monthlyTitle: (month: string, year: number) => `📊 *Resumo do Mês - ${month} ${year}*`,
    accountBalance: '💰 Saldo das Contas',
    income: '📥 Receitas',
    expenses: '📤 Despesas',
    netResult: '📈 Resultado',
    topCategories: '🏆 Top categorias',
    recentTransactions: '📋 Últimas transações',
    noTransactions: 'Nenhuma transação encontrada neste período.',
    noAccounts: 'Nenhuma conta encontrada.',
    expense: 'Despesa',
    incomeLabel: 'Receita',
    months: ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'],
    generalQuery: 'Não entendi sua pergunta. Tente perguntar:\n• "Qual meu saldo?"\n• "Gastos do mês"\n• "Últimas transações"\n• "Resumo por categoria"',
    errorMessage: 'Ocorreu um erro ao processar sua consulta. Tente novamente.'
  },
  en: {
    monthlyTitle: (month: string, year: number) => `📊 *Monthly Summary - ${month} ${year}*`,
    accountBalance: '💰 Account Balance',
    income: '📥 Income',
    expenses: '📤 Expenses',
    netResult: '📈 Net Result',
    topCategories: '🏆 Top categories',
    recentTransactions: '📋 Recent transactions',
    noTransactions: 'No transactions found for this period.',
    noAccounts: 'No accounts found.',
    expense: 'Expense',
    incomeLabel: 'Income',
    months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    generalQuery: 'I didn\'t understand your question. Try asking:\n• "What\'s my balance?"\n• "Monthly expenses"\n• "Recent transactions"\n• "Summary by category"',
    errorMessage: 'An error occurred while processing your query. Please try again.'
  },
  es: {
    monthlyTitle: (month: string, year: number) => `📊 *Resumen del Mes - ${month} ${year}*`,
    accountBalance: '💰 Saldo de Cuentas',
    income: '📥 Ingresos',
    expenses: '📤 Gastos',
    netResult: '📈 Resultado',
    topCategories: '🏆 Top categorías',
    recentTransactions: '📋 Últimas transacciones',
    noTransactions: 'No se encontraron transacciones para este período.',
    noAccounts: 'No se encontraron cuentas.',
    expense: 'Gasto',
    incomeLabel: 'Ingreso',
    months: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
    generalQuery: 'No entendí tu pregunta. Intenta preguntar:\n• "¿Cuál es mi saldo?"\n• "Gastos del mes"\n• "Últimas transacciones"\n• "Resumen por categoría"',
    errorMessage: 'Ocurrió un error al procesar tu consulta. Intenta de nuevo.'
  }
};

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function formatCurrency(amount: number, currency: string = 'BRL'): string {
  const symbols: Record<string, string> = {
    BRL: 'R$',
    USD: '$',
    EUR: '€'
  };
  const symbol = symbols[currency] || currency;
  return `${symbol} ${amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function normalizePhone(rawPhone: string): string {
  if (!rawPhone) return '';
  let phone = rawPhone.replace(/\D/g, '');
  phone = phone.replace(/^0+/, '');
  if (!phone.startsWith('55') && phone.length >= 10 && phone.length <= 11) {
    phone = '55' + phone;
  }
  return phone;
}

// ============================================================
// QUERY HANDLERS
// ============================================================

async function getAccountBalances(supabase: any, userId: string): Promise<{ total: number; accounts: any[]; currency: string }> {
  const { data: accounts, error } = await supabase
    .from('accounts')
    .select('id, name, balance, currency')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .eq('is_active', true);

  if (error || !accounts) {
    console.error('[whatsapp-query] Error fetching accounts:', error);
    return { total: 0, accounts: [], currency: 'BRL' };
  }

  const total = accounts.reduce((sum: number, acc: any) => sum + (acc.balance || 0), 0);
  const currency = accounts[0]?.currency || 'BRL';
  
  return { total, accounts, currency };
}

async function getMonthlyTransactions(supabase: any, userId: string): Promise<{ expenses: number; income: number; transactions: any[]; currency: string }> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

  const { data: transactions, error } = await supabase
    .from('transactions')
    .select(`
      id, 
      amount, 
      transaction_type, 
      description, 
      transaction_date, 
      currency,
      categories:category_id (name)
    `)
    .eq('user_id', userId)
    .is('deleted_at', null)
    .gte('transaction_date', startOfMonth)
    .lte('transaction_date', endOfMonth)
    .order('transaction_date', { ascending: false });

  if (error || !transactions) {
    console.error('[whatsapp-query] Error fetching transactions:', error);
    return { expenses: 0, income: 0, transactions: [], currency: 'BRL' };
  }

  const expenses = transactions
    .filter((t: any) => t.transaction_type === 'expense')
    .reduce((sum: number, t: any) => sum + Math.abs(t.amount || 0), 0);
  
  const income = transactions
    .filter((t: any) => t.transaction_type === 'income')
    .reduce((sum: number, t: any) => sum + Math.abs(t.amount || 0), 0);

  const currency = transactions[0]?.currency || 'BRL';

  return { expenses, income, transactions, currency };
}

async function getCategorySummary(supabase: any, userId: string): Promise<any[]> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

  const { data: transactions, error } = await supabase
    .from('transactions')
    .select(`
      amount,
      transaction_type,
      categories:category_id (id, name)
    `)
    .eq('user_id', userId)
    .eq('transaction_type', 'expense')
    .is('deleted_at', null)
    .gte('transaction_date', startOfMonth)
    .lte('transaction_date', endOfMonth);

  if (error || !transactions) {
    console.error('[whatsapp-query] Error fetching category summary:', error);
    return [];
  }

  // Aggregate by category
  const categoryMap = new Map<string, { name: string; total: number }>();
  
  for (const t of transactions) {
    const categoryName = t.categories?.name || 'Sem categoria';
    const categoryId = t.categories?.id || 'unknown';
    const key = categoryId;
    
    if (categoryMap.has(key)) {
      categoryMap.get(key)!.total += Math.abs(t.amount || 0);
    } else {
      categoryMap.set(key, { name: categoryName, total: Math.abs(t.amount || 0) });
    }
  }

  // Sort by total descending and return top 5
  return Array.from(categoryMap.values())
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);
}

async function getRecentTransactions(supabase: any, userId: string, limit: number = 5): Promise<any[]> {
  const { data: transactions, error } = await supabase
    .from('transactions')
    .select(`
      id,
      amount,
      transaction_type,
      description,
      transaction_date,
      currency,
      categories:category_id (name)
    `)
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('transaction_date', { ascending: false })
    .limit(limit);

  if (error || !transactions) {
    console.error('[whatsapp-query] Error fetching recent transactions:', error);
    return [];
  }

  return transactions;
}

// ============================================================
// RESPONSE FORMATTERS
// ============================================================

function formatBalanceResponse(data: { total: number; accounts: any[]; currency: string }, lang: 'pt' | 'en' | 'es'): string {
  const msgs = MESSAGES[lang];
  
  if (data.accounts.length === 0) {
    return msgs.noAccounts;
  }

  let response = `${msgs.accountBalance}: ${formatCurrency(data.total, data.currency)}\n\n`;
  
  for (const acc of data.accounts.slice(0, 5)) {
    response += `• ${acc.name}: ${formatCurrency(acc.balance || 0, acc.currency)}\n`;
  }

  return response;
}

function formatMonthlySummaryResponse(
  balanceData: { total: number; currency: string },
  transactionData: { expenses: number; income: number; currency: string },
  categorySummary: any[],
  lang: 'pt' | 'en' | 'es'
): string {
  const msgs = MESSAGES[lang];
  const now = new Date();
  const monthName = msgs.months[now.getMonth()];
  const year = now.getFullYear();
  const currency = transactionData.currency || balanceData.currency || 'BRL';

  let response = msgs.monthlyTitle(monthName, year) + '\n\n';
  response += `${msgs.accountBalance}: ${formatCurrency(balanceData.total, currency)}\n`;
  response += `${msgs.income}: ${formatCurrency(transactionData.income, currency)}\n`;
  response += `${msgs.expenses}: ${formatCurrency(transactionData.expenses, currency)}\n`;
  
  const netResult = transactionData.income - transactionData.expenses;
  const netSign = netResult >= 0 ? '+' : '';
  response += `${msgs.netResult}: ${netSign}${formatCurrency(netResult, currency)}\n`;

  if (categorySummary.length > 0) {
    response += `\n${msgs.topCategories}:\n`;
    categorySummary.forEach((cat, idx) => {
      response += `${idx + 1}. ${cat.name}: ${formatCurrency(cat.total, currency)}\n`;
    });
  }

  return response;
}

function formatRecentTransactionsResponse(transactions: any[], lang: 'pt' | 'en' | 'es'): string {
  const msgs = MESSAGES[lang];
  
  if (transactions.length === 0) {
    return msgs.noTransactions;
  }

  let response = `${msgs.recentTransactions}:\n\n`;
  
  for (const t of transactions) {
    const date = new Date(t.transaction_date).toLocaleDateString(lang === 'en' ? 'en-US' : lang === 'es' ? 'es-ES' : 'pt-BR', {
      day: '2-digit',
      month: '2-digit'
    });
    const type = t.transaction_type === 'expense' ? '📤' : '📥';
    const category = t.categories?.name || '';
    const sign = t.transaction_type === 'expense' ? '-' : '+';
    
    response += `${type} ${date} | ${t.description || category} | ${sign}${formatCurrency(Math.abs(t.amount), t.currency)}\n`;
  }

  return response;
}

function formatCategorySummaryResponse(categorySummary: any[], currency: string, lang: 'pt' | 'en' | 'es'): string {
  const msgs = MESSAGES[lang];
  
  if (categorySummary.length === 0) {
    return msgs.noTransactions;
  }

  const now = new Date();
  const monthName = msgs.months[now.getMonth()];
  const year = now.getFullYear();

  let response = `${msgs.topCategories} - ${monthName} ${year}:\n\n`;
  
  categorySummary.forEach((cat, idx) => {
    response += `${idx + 1}. ${cat.name}: ${formatCurrency(cat.total, currency)}\n`;
  });

  return response;
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
      user_id,
      phone_number,
      query_type,
      language = 'pt'
    } = body;

    console.log('[whatsapp-query] Processing query:', { query_type, language, user_id: user_id?.substring(0, 8) });

    // Validate language
    const lang = ['pt', 'en', 'es'].includes(language) ? language as 'pt' | 'en' | 'es' : 'pt';
    const msgs = MESSAGES[lang];

    // Get user_id from phone_number if not provided
    let resolvedUserId = user_id;
    if (!resolvedUserId && phone_number) {
      const normalizedPhone = normalizePhone(phone_number);
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('phone_number', normalizedPhone)
        .maybeSingle();
      
      if (profile?.user_id) {
        resolvedUserId = profile.user_id;
      }
    }

    if (!resolvedUserId) {
      return new Response(
        JSON.stringify({ success: false, error: 'user_id or valid phone_number is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let responseMessage = '';

    switch (query_type) {
      case 'balance': {
        const balanceData = await getAccountBalances(supabase, resolvedUserId);
        responseMessage = formatBalanceResponse(balanceData, lang);
        break;
      }

      case 'monthly_expenses':
      case 'monthly_income':
      case 'summary': {
        const [balanceData, transactionData, categorySummary] = await Promise.all([
          getAccountBalances(supabase, resolvedUserId),
          getMonthlyTransactions(supabase, resolvedUserId),
          getCategorySummary(supabase, resolvedUserId)
        ]);
        responseMessage = formatMonthlySummaryResponse(balanceData, transactionData, categorySummary, lang);
        break;
      }

      case 'category_summary': {
        const categorySummary = await getCategorySummary(supabase, resolvedUserId);
        const { currency } = await getAccountBalances(supabase, resolvedUserId);
        responseMessage = formatCategorySummaryResponse(categorySummary, currency, lang);
        break;
      }

      case 'recent_transactions': {
        const transactions = await getRecentTransactions(supabase, resolvedUserId);
        responseMessage = formatRecentTransactionsResponse(transactions, lang);
        break;
      }

      case 'general':
      default: {
        responseMessage = msgs.generalQuery;
        break;
      }
    }

    console.log('[whatsapp-query] Response generated, length:', responseMessage.length);

    return new Response(
      JSON.stringify({
        success: true,
        query_type,
        language: lang,
        response: responseMessage,
        user_id: resolvedUserId
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[whatsapp-query] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Internal error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
