import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[TRANSFER-OVERDUE] Starting automatic transfer process');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const today = new Date().toISOString().split('T')[0];
    
    // Marcar despesas manuais futuras como atrasadas
    const { data: manualOverdue, error: manualError } = await supabase
      .from('manual_future_expenses')
      .update({ 
        is_overdue: true,
        updated_at: new Date().toISOString()
      })
      .lt('due_date', today)
      .eq('is_paid', false)
      .eq('is_overdue', false)
      .select('id, description, due_date, user_id');

    if (manualError) {
      console.error('[TRANSFER-OVERDUE] Error updating manual expenses:', manualError);
    } else {
      console.log(`[TRANSFER-OVERDUE] Marked ${manualOverdue?.length || 0} manual expenses as overdue`);
    }

    // Marcar despesas recorrentes como atrasadas
    const { data: recurringOverdue, error: recurringError } = await supabase
      .from('recurring_expenses')
      .update({ 
        is_overdue: true,
        updated_at: new Date().toISOString()
      })
      .lt('next_due_date', today)
      .eq('is_active', true)
      .eq('is_completed', false)
      .eq('is_overdue', false)
      .select('id, name, next_due_date, user_id');

    if (recurringError) {
      console.error('[TRANSFER-OVERDUE] Error updating recurring expenses:', recurringError);
    } else {
      console.log(`[TRANSFER-OVERDUE] Marked ${recurringOverdue?.length || 0} recurring expenses as overdue`);
    }

    const result = {
      success: true,
      message: 'Overdue expenses transferred successfully',
      manual_expenses_updated: manualOverdue?.length || 0,
      recurring_expenses_updated: recurringOverdue?.length || 0,
      timestamp: new Date().toISOString()
    };

    console.log('[TRANSFER-OVERDUE] Process completed:', result);

    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('[TRANSFER-OVERDUE] Fatal error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
