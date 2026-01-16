import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ReconciliationRequest {
  sourceType: 'account' | 'card';
  sourceId: string;
  startDate: string;
  endDate: string;
}

interface ExistingTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category_name?: string;
  payment_method?: string;
  source: 'transactions' | 'future_expenses';
}

function logStep(step: string, details?: any) {
  console.log(`[RECONCILIATION] ${step}`, details ? JSON.stringify(details) : '');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Verify user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      logStep('Auth error', { error: authError });
      return new Response(
        JSON.stringify({ error: 'Usuário não autenticado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { sourceType, sourceId, startDate, endDate }: ReconciliationRequest = await req.json();
    
    logStep('Fetching reconciliation data', { sourceType, sourceId, startDate, endDate, userId: user.id });

    // Get user's partner ID for couple data
    const { data: profile } = await supabase
      .from('profiles')
      .select('partner_user_id')
      .eq('id', user.id)
      .single();
    
    const userIds = [user.id];
    if (profile?.partner_user_id) {
      userIds.push(profile.partner_user_id);
    }

    const existingTransactions: ExistingTransaction[] = [];

    if (sourceType === 'account') {
      // Fetch transactions from the account
      const { data: transactions, error: txError } = await supabase
        .from('transactions')
        .select(`
          id,
          transaction_date,
          description,
          amount,
          transaction_type,
          payment_method,
          categories(name)
        `)
        .eq('account_id', sourceId)
        .in('user_id', userIds)
        .is('deleted_at', null)
        .gte('transaction_date', startDate)
        .lte('transaction_date', endDate)
        .order('transaction_date', { ascending: false });

      if (txError) {
        logStep('Error fetching transactions', { error: txError });
        throw txError;
      }

      logStep('Transactions fetched', { count: transactions?.length });

      // Map transactions to common format
      transactions?.forEach(tx => {
        existingTransactions.push({
          id: tx.id,
          date: tx.transaction_date,
          description: tx.description,
          amount: Math.abs(tx.amount),
          type: tx.transaction_type as 'income' | 'expense',
          category_name: (tx.categories as any)?.name,
          payment_method: tx.payment_method,
          source: 'transactions'
        });
      });

      // Also fetch future expenses that might be relevant
      const { data: futureExpenses, error: feError } = await supabase
        .from('manual_future_expenses')
        .select(`
          id,
          due_date,
          description,
          amount,
          payment_method,
          categories(name)
        `)
        .in('user_id', userIds)
        .is('deleted_at', null)
        .eq('is_paid', true)
        .gte('due_date', startDate)
        .lte('due_date', endDate);

      if (!feError && futureExpenses) {
        logStep('Future expenses fetched', { count: futureExpenses.length });
        
        futureExpenses.forEach(fe => {
          existingTransactions.push({
            id: fe.id,
            date: fe.due_date,
            description: fe.description,
            amount: Math.abs(fe.amount),
            type: 'expense',
            category_name: (fe.categories as any)?.name,
            payment_method: fe.payment_method || undefined,
            source: 'future_expenses'
          });
        });
      }

    } else if (sourceType === 'card') {
      // Fetch card info for date calculations
      const { data: card } = await supabase
        .from('cards')
        .select('closing_date, due_date')
        .eq('id', sourceId)
        .single();

      // Fetch transactions from the card
      const { data: transactions, error: txError } = await supabase
        .from('transactions')
        .select(`
          id,
          transaction_date,
          description,
          amount,
          transaction_type,
          payment_method,
          categories(name)
        `)
        .eq('card_id', sourceId)
        .in('user_id', userIds)
        .is('deleted_at', null)
        .gte('transaction_date', startDate)
        .lte('transaction_date', endDate)
        .order('transaction_date', { ascending: false });

      if (txError) {
        logStep('Error fetching card transactions', { error: txError });
        throw txError;
      }

      logStep('Card transactions fetched', { count: transactions?.length, cardInfo: card });

      transactions?.forEach(tx => {
        existingTransactions.push({
          id: tx.id,
          date: tx.transaction_date,
          description: tx.description,
          amount: Math.abs(tx.amount),
          type: tx.transaction_type as 'income' | 'expense',
          category_name: (tx.categories as any)?.name,
          payment_method: tx.payment_method,
          source: 'transactions'
        });
      });
    }

    // Fetch account/card details for context
    let sourceDetails: any = null;
    
    if (sourceType === 'account') {
      const { data } = await supabase
        .from('accounts')
        .select('id, name, account_type, balance, currency')
        .eq('id', sourceId)
        .single();
      sourceDetails = data;
    } else {
      const { data } = await supabase
        .from('cards')
        .select('id, name, card_type, credit_limit, current_balance, currency, closing_date, due_date')
        .eq('id', sourceId)
        .single();
      sourceDetails = data;
    }

    const response = {
      success: true,
      existingTransactions,
      sourceDetails,
      metadata: {
        sourceType,
        sourceId,
        startDate,
        endDate,
        totalTransactions: existingTransactions.length
      }
    };

    logStep('Reconciliation data ready', { 
      totalTransactions: existingTransactions.length,
      sourceType,
      sourceDetails: sourceDetails?.name
    });

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    logStep('Unexpected error', { error: String(error) });
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
