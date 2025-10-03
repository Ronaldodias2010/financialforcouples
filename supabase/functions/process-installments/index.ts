import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FuturePayment {
  id: string;
  user_id: string;
  original_due_date: string;
  description: string;
  amount: number;
  expense_source_type: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[process-installments] Starting automatic installment processing...');

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    
    console.log(`[process-installments] Processing payments due on or before: ${today}`);

    // Buscar parcelas futuras que já venceram e não foram processadas
    const { data: duePayments, error: fetchError } = await supabase
      .from('future_expense_payments')
      .select('id, user_id, original_due_date, description, amount, expense_source_type')
      .eq('expense_source_type', 'installment')
      .lte('original_due_date', today)
      .is('transaction_id', null)
      .order('original_due_date', { ascending: true });

    if (fetchError) {
      console.error('[process-installments] Error fetching due payments:', fetchError);
      throw fetchError;
    }

    if (!duePayments || duePayments.length === 0) {
      console.log('[process-installments] No due installments to process');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No due installments to process',
          processed: 0 
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`[process-installments] Found ${duePayments.length} due installments to process`);

    const results = {
      total: duePayments.length,
      processed: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Processar cada parcela vencida
    for (const payment of duePayments as FuturePayment[]) {
      try {
        console.log(`[process-installments] Processing payment ${payment.id}: ${payment.description}`);
        
        // Chamar função do banco para processar a parcela
        const { data: transactionId, error: processError } = await supabase
          .rpc('process_installment_payment', {
            p_future_payment_id: payment.id
          });

        if (processError) {
          console.error(`[process-installments] Error processing payment ${payment.id}:`, processError);
          results.failed++;
          results.errors.push(`${payment.description}: ${processError.message}`);
        } else {
          console.log(`[process-installments] Successfully processed payment ${payment.id} -> transaction ${transactionId}`);
          results.processed++;
        }
      } catch (error) {
        console.error(`[process-installments] Unexpected error processing payment ${payment.id}:`, error);
        results.failed++;
        results.errors.push(`${payment.description}: ${error.message}`);
      }
    }

    console.log('[process-installments] Processing complete:', results);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${results.processed} of ${results.total} installments`,
        results,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[process-installments] Fatal error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
