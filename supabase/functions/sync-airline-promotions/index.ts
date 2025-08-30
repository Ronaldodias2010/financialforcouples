import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AirlinePromotion {
  airline_code: string;
  airline_name: string;
  title: string;
  description: string;
  promotion_type: string;
  miles_required?: number;
  bonus_percentage?: number;
  discount_percentage?: number;
  route_from?: string;
  route_to?: string;
  promotion_url?: string;
  start_date: string;
  end_date: string;
  external_promotion_id?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('🚀 Starting airline promotions sync...');

    // Simulate fetching data from various airline APIs
    // In a real implementation, you would make actual API calls to:
    // - LATAM Pass API
    // - GOL Smiles API  
    // - Azul TudoAzul API
    // - Avianca LifeMiles API
    // - MaxMilhas/123milhas aggregator APIs

    const mockPromotions: AirlinePromotion[] = [
      {
        external_promotion_id: 'TRANSFER_BONUS_2024_01',
        airline_code: 'LATAM',
        airline_name: 'LATAM Airlines',
        title: 'Super Transferência com 120% de Bônus',
        description: 'Transfira pontos de cartões de crédito e ganhe 120% de bônus nas suas milhas LATAM Pass.',
        promotion_type: 'transfer_bonus',
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        bonus_percentage: 120,
        promotion_url: 'https://www.latam.com/br/pt/latam-pass/transferir-pontos'
      },
      {
        external_promotion_id: 'BUY_MILES_2024_01', 
        airline_code: 'GOL',
        airline_name: 'GOL Linhas Aéreas',
        title: 'Compre Milhas com 60% OFF',
        description: 'Compre milhas Smiles com até 60% de desconto por tempo limitado.',
        promotion_type: 'buy_miles',
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        discount_percentage: 60,
        promotion_url: 'https://www.smiles.com.br/comprar-milhas'
      },
      {
        external_promotion_id: 'ROUTE_SP_LISBOA_2024',
        airline_code: 'TAP',
        airline_name: 'TAP Air Portugal', 
        title: 'São Paulo → Lisboa por 35.000 pontos',
        description: 'Voe para Lisboa usando apenas 35.000 pontos + taxas na classe econômica.',
        promotion_type: 'route_discount',
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        route_from: 'São Paulo',
        route_to: 'Lisboa',
        miles_required: 35000,
        promotion_url: 'https://www.tap.pt/pt/tap-miles-and-go'
      },
      {
        external_promotion_id: 'ROUTE_BOG_MIAMI_2024',
        airline_code: 'AVIANCA',
        airline_name: 'Avianca',
        title: 'Bogotá → Miami por 25.000 milhas',
        description: 'Promoção especial para voos Bogotá-Miami na classe econômica.',
        promotion_type: 'route_discount', 
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        route_from: 'Bogotá',
        route_to: 'Miami',
        miles_required: 25000,
        promotion_url: 'https://www.avianca.com/br/pt/lifemiles/'
      },
      {
        external_promotion_id: 'ROUTE_RIO_PARIS_2024',
        airline_code: 'AIR_FRANCE',
        airline_name: 'Air France',
        title: 'Rio → Paris Premium por 85.000 pontos',
        description: 'Voe na classe Premium Economy do Rio para Paris com desconto especial.',
        promotion_type: 'route_discount',
        start_date: new Date().toISOString().split('T')[0], 
        end_date: new Date(Date.now() + 150 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        route_from: 'Rio de Janeiro',
        route_to: 'Paris',
        miles_required: 85000,
        promotion_url: 'https://www.airfrance.com.br/flying-blue'
      },
      {
        external_promotion_id: 'AZUL_TURBO_2024',
        airline_code: 'AZUL',
        airline_name: 'Azul Linhas Aéreas',
        title: 'TudoAzul Turbo - Dobro de Pontos',
        description: 'Acumule pontos em dobro em todos os voos Azul por tempo limitado.',
        promotion_type: 'double_points',
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        bonus_percentage: 100,
        promotion_url: 'https://www.tudoazul.com'
      },
      {
        external_promotion_id: 'AMERICAN_STATUS_2024',
        airline_code: 'AMERICAN',
        airline_name: 'American Airlines',
        title: 'Status Match Especial',
        description: 'Equivalência de status para membros de outros programas com bônus de 50% nas milhas.',
        promotion_type: 'status_match',
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        bonus_percentage: 50,
        promotion_url: 'https://www.aa.com/aadvantage'
      },
      {
        external_promotion_id: 'UNITED_MILEAGEPLUS_2024',
        airline_code: 'UNITED',
        airline_name: 'United Airlines',
        title: 'São Paulo → Nova York por 40.000 milhas',
        description: 'Tarifa promocional para voos São Paulo - Nova York na classe econômica.',
        promotion_type: 'route_discount',
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 75 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        route_from: 'São Paulo',
        route_to: 'Nova York',
        miles_required: 40000,
        promotion_url: 'https://www.united.com/mileageplus'
      }
    ];

    console.log(`📥 Processing ${mockPromotions.length} promotions...`);

    let insertedCount = 0;
    let updatedCount = 0;
    let errorCount = 0;

    for (const promotion of mockPromotions) {
      try {
        // Check if promotion already exists
        const { data: existingPromo } = await supabase
          .from('airline_promotions')
          .select('id')
          .eq('external_promotion_id', promotion.external_promotion_id)
          .single();

        if (existingPromo) {
          // Update existing promotion
          const { error: updateError } = await supabase
            .from('airline_promotions')
            .update({
              ...promotion,
              last_synced_at: new Date().toISOString()
            })
            .eq('id', existingPromo.id);

          if (updateError) {
            console.error(`❌ Error updating promotion ${promotion.external_promotion_id}:`, updateError);
            errorCount++;
          } else {
            console.log(`✅ Updated promotion: ${promotion.title}`);
            updatedCount++;
          }
        } else {
          // Insert new promotion
          const { error: insertError } = await supabase
            .from('airline_promotions')
            .insert({
              ...promotion,
              last_synced_at: new Date().toISOString()
            });

          if (insertError) {
            console.error(`❌ Error inserting promotion ${promotion.external_promotion_id}:`, insertError);
            errorCount++;
          } else {
            console.log(`🆕 Inserted new promotion: ${promotion.title}`);
            insertedCount++;
          }
        }
      } catch (error) {
        console.error(`❌ Error processing promotion ${promotion.external_promotion_id}:`, error);
        errorCount++;
      }
    }

    // Mark expired promotions as inactive
    const { error: expireError } = await supabase
      .from('airline_promotions')
      .update({ is_active: false })
      .lt('end_date', new Date().toISOString().split('T')[0])
      .eq('is_active', true);

    if (expireError) {
      console.error('❌ Error marking expired promotions:', expireError);
    } else {
      console.log('🗓️ Marked expired promotions as inactive');
    }

    // Check for users eligible for new promotions
    await checkEligibleUsers(supabase);

    const summary = {
      success: true,
      processed: mockPromotions.length,
      inserted: insertedCount,
      updated: updatedCount,
      errors: errorCount,
      timestamp: new Date().toISOString()
    };

    console.log('🎉 Sync completed:', summary);

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('💥 Fatal error in sync process:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function checkEligibleUsers(supabase: any) {
  try {
    console.log('🔍 Checking for eligible users...');

    // Get all active route promotions that require specific miles
    const { data: routePromotions, error: promoError } = await supabase
      .from('airline_promotions')
      .select('id, title, miles_required, airline_name')
      .eq('is_active', true)
      .eq('promotion_type', 'route_promotion')
      .not('miles_required', 'is', null);

    if (promoError) {
      console.error('❌ Error fetching route promotions:', promoError);
      return;
    }

    if (!routePromotions?.length) {
      console.log('📋 No route promotions with mile requirements found');
      return;
    }

    console.log(`🎯 Found ${routePromotions.length} route promotions to check`);

    // Get all users with their total miles
    const { data: users, error: usersError } = await supabase
      .from('card_mileage_rules')
      .select('user_id')
      .eq('is_active', true);

    if (usersError) {
      console.error('❌ Error fetching users:', usersError);
      return;
    }

    const uniqueUsers = [...new Set(users?.map(u => u.user_id) || [])];
    console.log(`👥 Checking ${uniqueUsers.length} unique users`);

    let notificationsCreated = 0;

    for (const userId of uniqueUsers) {
      try {
        // Calculate user's total miles
        const { data: historyMiles } = await supabase
          .from('mileage_history')
          .select('miles_earned')
          .eq('user_id', userId);

        const { data: existingMiles } = await supabase
          .from('card_mileage_rules')
          .select('existing_miles')
          .eq('user_id', userId)
          .eq('is_active', true);

        const totalHistoryMiles = historyMiles?.reduce((sum, record) => sum + (record.miles_earned || 0), 0) || 0;
        const totalExistingMiles = existingMiles?.reduce((sum, rule) => sum + (rule.existing_miles || 0), 0) || 0;
        const userTotalMiles = totalHistoryMiles + totalExistingMiles;

        // Check each promotion
        for (const promotion of routePromotions) {
          if (userTotalMiles >= promotion.miles_required) {
            // Check if we already notified this user about this promotion
            const { data: existingNotification } = await supabase
              .from('user_promotion_notifications')
              .select('id')
              .eq('user_id', userId)
              .eq('promotion_id', promotion.id)
              .eq('notification_type', 'eligible')
              .single();

            if (!existingNotification) {
              // Create notification
              const { error: notifError } = await supabase
                .from('user_promotion_notifications')
                .insert({
                  user_id: userId,
                  promotion_id: promotion.id,
                  notification_type: 'eligible',
                  user_miles_at_notification: userTotalMiles
                });

              if (notifError) {
                console.error(`❌ Error creating notification for user ${userId}:`, notifError);
              } else {
                console.log(`🔔 Created notification for user ${userId} - ${promotion.title}`);
                notificationsCreated++;
              }
            }
          }
        }
      } catch (error) {
        console.error(`❌ Error processing user ${userId}:`, error);
      }
    }

    console.log(`🔔 Created ${notificationsCreated} new notifications`);
  } catch (error) {
    console.error('❌ Error in checkEligibleUsers:', error);
  }
}