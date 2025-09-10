import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role key
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const startTime = new Date();
    console.log(`🔄 [${startTime.toISOString()}] Starting daily recurring expenses processing...`);

    // Get info about recurring expenses to be processed
    const { data: expensesInfo, error: infoError } = await supabase
      .from('recurring_expenses')
      .select('id, name, user_id, amount, next_due_date, remaining_installments')
      .eq('is_active', true)
      .eq('is_completed', false)
      .lte('next_due_date', new Date().toISOString().split('T')[0])
      .gt('remaining_installments', 0);

    if (infoError) {
      console.error('❌ Error fetching recurring expenses info:', infoError);
    } else {
      console.log(`📊 Found ${(expensesInfo || []).length} recurring expenses to process:`);
      (expensesInfo || []).forEach(exp => {
        console.log(`  - ${exp.name}: R$ ${exp.amount} (${exp.remaining_installments} installments left, due: ${exp.next_due_date})`);
      });
    }

    // Call the database function to process recurring expenses
    const { data, error } = await supabase.rpc('process_recurring_expenses_daily');

    if (error) {
      console.error('❌ Error processing recurring expenses:', error);
      return new Response(JSON.stringify({ 
        error: 'Failed to process recurring expenses', 
        details: error.message,
        timestamp: startTime.toISOString()
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify what was created in manual_future_expenses
    const { data: createdExpenses, error: verifyError } = await supabase
      .from('manual_future_expenses')
      .select('id, description, amount, due_date')
      .gte('created_at', startTime.toISOString());

    if (verifyError) {
      console.warn('⚠️ Could not verify created manual future expenses:', verifyError);
    } else {
      console.log(`✅ Created ${(createdExpenses || []).length} new manual future expenses:`);
      (createdExpenses || []).forEach(exp => {
        console.log(`  + ${exp.description}: R$ ${exp.amount} (due: ${exp.due_date})`);
      });
    }

    const endTime = new Date();
    const processingTime = endTime.getTime() - startTime.getTime();
    
    console.log(`✅ [${endTime.toISOString()}] Successfully processed recurring expenses in ${processingTime}ms`);

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Recurring expenses processed successfully',
      timestamp: endTime.toISOString(),
      processingTimeMs: processingTime,
      expensesFound: (expensesInfo || []).length,
      expensesCreated: (createdExpenses || []).length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('💥 Unexpected error in process-recurring-expenses:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error', 
      details: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});