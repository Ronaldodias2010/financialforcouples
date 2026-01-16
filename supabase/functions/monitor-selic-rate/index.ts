import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// BCB API Series codes
const BCB_SERIES = {
  SELIC: 432,      // SELIC Meta (taxa anual)
  CDI: 4389,       // CDI (taxa anual)  
  IPCA: 433,       // IPCA (12 meses)
};

interface MarketRate {
  indicator: string;
  value: number;
  previous_value: number | null;
  variation: number | null;
  unit: string;
  source: string;
  bcb_series: number | null;
  rate_date: string;
}

interface BCBResponse {
  valor: string;
  data: string;
}

// Fetch rate from BCB API
async function fetchBCBRate(seriesCode: number): Promise<number | null> {
  try {
    const url = `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${seriesCode}/dados/ultimos/1?formato=json`;
    console.log(`📊 Fetching BCB series ${seriesCode}...`);
    
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' }
    });
    
    if (!response.ok) {
      console.error(`❌ BCB API error for series ${seriesCode}:`, response.status);
      return null;
    }
    
    const data: BCBResponse[] = await response.json();
    if (data && data.length > 0) {
      const value = parseFloat(data[0].valor.replace(',', '.'));
      console.log(`✅ BCB series ${seriesCode}: ${value}`);
      return value;
    }
    return null;
  } catch (error) {
    console.error(`❌ Error fetching BCB series ${seriesCode}:`, error);
    return null;
  }
}

// Calculate investment impact for a user
function calculateInvestmentImpact(
  investments: any[],
  oldRate: number,
  newRate: number
): { totalValue: number; monthlyDiff: number; affectedInvestments: any[] } {
  const affectedTypes = ['CDB', 'Renda Fixa', 'Tesouro Direto', 'LCI', 'LCA', 'Tesouro SELIC', 'CDB 100% CDI', 'CDB 110% CDI'];
  
  const affectedInvestments = investments.filter(inv => 
    affectedTypes.some(type => inv.type?.toLowerCase().includes(type.toLowerCase()) || 
                               inv.name?.toLowerCase().includes(type.toLowerCase()))
  );
  
  let totalValue = 0;
  let monthlyDiffTotal = 0;
  
  affectedInvestments.forEach(inv => {
    const value = inv.current_value || inv.amount || 0;
    totalValue += value;
    
    // Calculate monthly yield difference
    const oldMonthly = (value * (oldRate / 100)) / 12;
    const newMonthly = (value * (newRate / 100)) / 12;
    monthlyDiffTotal += newMonthly - oldMonthly;
  });
  
  return {
    totalValue,
    monthlyDiff: monthlyDiffTotal,
    affectedInvestments: affectedInvestments.map(inv => ({
      id: inv.id,
      name: inv.name,
      type: inv.type,
      value: inv.current_value || inv.amount
    }))
  };
}

// Determine notification urgency based on investment value
function getUrgency(totalValue: number): 'low' | 'medium' | 'high' {
  if (totalValue >= 50000) return 'high';
  if (totalValue >= 10000) return 'medium';
  return 'low';
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 Starting SELIC rate monitor...');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    const today = new Date().toISOString().split('T')[0];
    
    // Fetch current SELIC from BCB
    const currentSelic = await fetchBCBRate(BCB_SERIES.SELIC);
    const currentCDI = await fetchBCBRate(BCB_SERIES.CDI);
    const currentIPCA = await fetchBCBRate(BCB_SERIES.IPCA);
    
    if (currentSelic === null) {
      console.error('❌ Failed to fetch SELIC rate from BCB');
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to fetch SELIC rate' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
    
    console.log(`📈 Current rates - SELIC: ${currentSelic}%, CDI: ${currentCDI}%, IPCA: ${currentIPCA}%`);
    
    // Get previous SELIC value
    const { data: previousRate } = await supabase
      .from('market_rates')
      .select('value, recorded_at')
      .eq('indicator', 'selic')
      .order('recorded_at', { ascending: false })
      .limit(1)
      .single();
    
    const previousSelic = previousRate?.value || null;
    const selicChanged = previousSelic !== null && Math.abs(currentSelic - previousSelic) >= 0.01;
    
    console.log(`📊 Previous SELIC: ${previousSelic}, Changed: ${selicChanged}`);
    
    // Prepare rates to upsert
    const ratesToUpsert: MarketRate[] = [];
    
    // SELIC
    ratesToUpsert.push({
      indicator: 'selic',
      value: currentSelic,
      previous_value: previousSelic,
      variation: previousSelic ? currentSelic - previousSelic : null,
      unit: '% a.a.',
      source: 'BCB',
      bcb_series: BCB_SERIES.SELIC,
      rate_date: today
    });
    
    // CDI
    if (currentCDI !== null) {
      ratesToUpsert.push({
        indicator: 'cdi',
        value: currentCDI,
        previous_value: null,
        variation: null,
        unit: '% a.a.',
        source: 'BCB',
        bcb_series: BCB_SERIES.CDI,
        rate_date: today
      });
      
      // Derived CDB rates
      ratesToUpsert.push({
        indicator: 'cdb_100',
        value: currentCDI,
        previous_value: null,
        variation: null,
        unit: '% a.a.',
        source: 'calculated',
        bcb_series: null,
        rate_date: today
      });
      
      ratesToUpsert.push({
        indicator: 'cdb_110',
        value: currentCDI * 1.10,
        previous_value: null,
        variation: null,
        unit: '% a.a.',
        source: 'calculated',
        bcb_series: null,
        rate_date: today
      });
      
      ratesToUpsert.push({
        indicator: 'cdb_120',
        value: currentCDI * 1.20,
        previous_value: null,
        variation: null,
        unit: '% a.a.',
        source: 'calculated',
        bcb_series: null,
        rate_date: today
      });
      
      // LCI/LCA (90% CDI, tax-free)
      ratesToUpsert.push({
        indicator: 'lci_lca',
        value: currentCDI * 0.90,
        previous_value: null,
        variation: null,
        unit: '% a.a.',
        source: 'calculated',
        bcb_series: null,
        rate_date: today
      });
    }
    
    // IPCA
    if (currentIPCA !== null) {
      ratesToUpsert.push({
        indicator: 'ipca',
        value: currentIPCA,
        previous_value: null,
        variation: null,
        unit: '% (12m)',
        source: 'BCB',
        bcb_series: BCB_SERIES.IPCA,
        rate_date: today
      });
      
      // Tesouro IPCA+ (IPCA + ~6%)
      ratesToUpsert.push({
        indicator: 'tesouro_ipca',
        value: currentIPCA + 6.0,
        previous_value: null,
        variation: null,
        unit: '% a.a.',
        source: 'calculated',
        bcb_series: null,
        rate_date: today
      });
    }
    
    // Tesouro SELIC
    ratesToUpsert.push({
      indicator: 'tesouro_selic',
      value: currentSelic,
      previous_value: null,
      variation: null,
      unit: '% a.a.',
      source: 'calculated',
      bcb_series: null,
      rate_date: today
    });
    
    // Upsert all rates
    for (const rate of ratesToUpsert) {
      const { error: upsertError } = await supabase
        .from('market_rates')
        .upsert(rate, { onConflict: 'indicator,rate_date' });
      
      if (upsertError) {
        console.error(`❌ Error upserting rate ${rate.indicator}:`, upsertError);
      } else {
        console.log(`✅ Upserted rate: ${rate.indicator} = ${rate.value}`);
      }
    }
    
    // If SELIC changed, create notifications for users with affected investments
    let notificationsCreated = 0;
    
    if (selicChanged && previousSelic !== null) {
      console.log('📢 SELIC changed! Creating user notifications...');
      
      // Get all users with investments
      const { data: usersWithInvestments, error: usersError } = await supabase
        .from('investments')
        .select('user_id')
        .is('deleted_at', null);
      
      if (usersError) {
        console.error('❌ Error fetching users with investments:', usersError);
      } else {
        // Get unique user IDs
        const userIds = [...new Set(usersWithInvestments?.map(u => u.user_id) || [])];
        console.log(`👥 Found ${userIds.length} users with investments`);
        
        for (const userId of userIds) {
          // Get user's investments
          const { data: userInvestments } = await supabase
            .from('investments')
            .select('id, name, type, amount, current_value')
            .eq('user_id', userId)
            .is('deleted_at', null);
          
          if (!userInvestments || userInvestments.length === 0) continue;
          
          const impact = calculateInvestmentImpact(userInvestments, previousSelic, currentSelic);
          
          if (impact.totalValue > 0) {
            const isIncrease = currentSelic > previousSelic;
            const variation = Math.abs(currentSelic - previousSelic).toFixed(2);
            const monthlyImpact = Math.abs(impact.monthlyDiff).toFixed(2);
            
            const title = isIncrease 
              ? `📈 SELIC subiu para ${currentSelic.toFixed(2)}% a.a.`
              : `📉 SELIC caiu para ${currentSelic.toFixed(2)}% a.a.`;
            
            const message = isIncrease
              ? `Ótima notícia! Seus ${impact.affectedInvestments.length} investimento(s) em renda fixa (total: R$ ${impact.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}) terão rendimento mensal estimado de +R$ ${monthlyImpact} a mais.`
              : `Atenção: Seus ${impact.affectedInvestments.length} investimento(s) em renda fixa (total: R$ ${impact.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}) terão rendimento mensal estimado de -R$ ${monthlyImpact}. Considere diversificar para investimentos prefixados.`;
            
            const { error: notifError } = await supabase
              .from('user_financial_notifications')
              .insert({
                user_id: userId,
                notification_type: 'selic_change',
                title,
                message,
                metadata: {
                  previous_rate: previousSelic,
                  current_rate: currentSelic,
                  variation: isIncrease ? `+${variation}` : `-${variation}`,
                  total_affected_value: impact.totalValue,
                  monthly_impact: isIncrease ? `+${monthlyImpact}` : `-${monthlyImpact}`,
                  affected_investments: impact.affectedInvestments
                },
                urgency: getUrgency(impact.totalValue),
                is_read: false
              });
            
            if (notifError) {
              console.error(`❌ Error creating notification for user ${userId}:`, notifError);
            } else {
              notificationsCreated++;
            }
          }
        }
      }
    }
    
    console.log(`✅ SELIC monitor completed. Rates updated: ${ratesToUpsert.length}, Notifications created: ${notificationsCreated}`);
    
    return new Response(
      JSON.stringify({
        success: true,
        rates: {
          selic: currentSelic,
          cdi: currentCDI,
          ipca: currentIPCA
        },
        selic_changed: selicChanged,
        previous_selic: previousSelic,
        rates_updated: ratesToUpsert.length,
        notifications_created: notificationsCreated,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('❌ SELIC monitor error:', error);
    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
