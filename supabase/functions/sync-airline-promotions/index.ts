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
  data_source?: string;
  external_reference?: string;
  raw_price?: number;
  boarding_tax?: number;
  departure_date?: string;
  return_date?: string;
  is_round_trip?: boolean;
}

interface MoblixOffer {
  Origem: {
    Iata: string;
    Nome: string;
    Cidade: string;
    Estado: string;
    Pais: string;
    Internacional: boolean;
  };
  IataOrigem: string;
  Destino: {
    Iata: string;
    Nome: string;
    Cidade: string;
    Estado: string;
    Pais: string;
    Internacional: boolean;
  };
  IataDestino: string;
  Cia: {
    Id: number;
    Nome: string | null;
    Iata: string | null;
  };
  Ida: string;
  Volta: string;
  ValorAdulto: number;
  PontosAdulto: number;
  SoIda: boolean;
  TaxaEmbarque: number;
  Id: string;
  IdGeral: string;
}

interface MoblixApiResponse {
  Success: boolean;
  HasResult: boolean;
  ExceptionErro: string | null;
  MensagemErro: string | null;
  Data: MoblixOffer[];
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

    // Now using real Moblix API data only - no more mock data

    console.log('📥 Skipping mock promotions - using real Moblix API data only...');

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

    // Sync Moblix offers
    const moblixResult = await syncMoblixOffers(supabase);

    // Check for users eligible for new promotions
    await checkEligibleUsers(supabase);

    // Determine overall success based on Moblix results
    const overallSuccess = moblixResult?.success !== false && (moblixResult?.errors || 0) === 0;

    const summary = {
      success: overallSuccess,
      processed: moblixResult?.processed || 0,
      inserted: moblixResult?.inserted || 0,
      updated: moblixResult?.updated || 0,
      errors: moblixResult?.errors || 0,
      moblix_stats: moblixResult,
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
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function syncMoblixOffers(supabase: any) {
  try {
    console.log('🚀 Starting Moblix sync...');

    // Get Moblix API credentials
    const moblixUsername = Deno.env.get('MOBLIX_USERNAME');
    const moblixPassword = Deno.env.get('MOBLIX_PASSWORD');
    const moblixBaseUrl = Deno.env.get('MOBLIX_BASE_URL');

    if (!moblixUsername || !moblixPassword || !moblixBaseUrl) {
      console.log('⚠️ Moblix credentials not found, skipping Moblix sync');
      return { processed: 0, inserted: 0, updated: 0, errors: 0, message: 'Credentials not configured' };
    }

    console.log('🔐 Authenticating with Moblix API...');

    // Step 1: Get authentication token (following Moblix example exactly)
    const tokenResponse = await fetch(`${moblixBaseUrl}/api/Token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Origin': 'externo', // Required by Moblix API
      },
      body: new URLSearchParams({
        grant_type: 'password',
        username: moblixUsername,
        password: moblixPassword,
      }),
    });

    console.log(`🔐 Token request to: ${moblixBaseUrl}/api/Token`);
    console.log(`📊 Token response status: ${tokenResponse.status}`);

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error(`❌ Authentication failed - Status: ${tokenResponse.status}, Response: ${errorText}`);
      throw new Error(`Failed to authenticate with Moblix: ${tokenResponse.status} - ${errorText}`);
    }

    const tokenData = await tokenResponse.json();
    console.log('🔍 Token response data keys:', Object.keys(tokenData));
    const authToken = tokenData.access_token;

    if (!authToken) {
      throw new Error('No access token received from Moblix');
    }

    console.log('✅ Successfully authenticated with Moblix');

    // Step 2: Robust offers fetching with multiple URL variations
    let offersData: any = null;
    let successfulUrl = '';
    
    // URL variations to try
    const urlVariations = [
      `${moblixBaseUrl}/oferta/api/ofertas?international=false&quatidade=50&shuffle=false`,
      `${moblixBaseUrl}/oferta/api/ofertas?international=false&quantidade=50&shuffle=false`, 
      `${moblixBaseUrl}/oferta/api/ofertas?international=true&quatidade=50&shuffle=false`,
      `${moblixBaseUrl}/oferta/api/ofertas?international=true&quantidade=50&shuffle=false`
    ];

    for (const url of urlVariations) {
      try {
        console.log(`📥 Trying offers URL: ${url}`);
        
        const offersResponse = await fetch(url, {
          method: 'GET',
          headers: {
            'Origin': 'externo', // Add Origin header to offers request too
          },
          redirect: 'follow'
        });

        console.log(`📊 Offers response status: ${offersResponse.status}`);

        if (!offersResponse.ok) {
          const errorText = await offersResponse.text();
          console.error(`❌ URL failed - Status: ${offersResponse.status}, Response: ${errorText.substring(0, 200)}...`);
          continue; // Try next URL variation
        }

        const responseData = await offersResponse.json();
        
        // Log raw response structure for debugging
        console.log('🔍 Raw response structure:', {
          keys: Object.keys(responseData),
          Success: responseData.Success,
          HasResult: responseData.HasResult,
          DataType: Array.isArray(responseData.Data) ? 'array' : typeof responseData.Data,
          DataLength: Array.isArray(responseData.Data) ? responseData.Data.length : 'not array',
          ExErro: responseData.ExErro,
          ExceptionErro: responseData.ExceptionErro,
          MensagemErro: responseData.MensagemErro
        });

        // Robust response format handling
        let normalizedData: MoblixOffer[] = [];
        
        // Handle different response formats
        if (Array.isArray(responseData.Data) && responseData.Data.length > 0) {
          // Standard format with Data array
          normalizedData = responseData.Data;
          console.log(`✅ Found ${normalizedData.length} offers in Data array`);
        } else if (Array.isArray(responseData) && responseData.length > 0) {
          // Response is directly an array
          normalizedData = responseData;
          console.log(`✅ Found ${normalizedData.length} offers in root array`);
        } else if (responseData.data && Array.isArray(responseData.data) && responseData.data.length > 0) {
          // Lowercase data field
          normalizedData = responseData.data;
          console.log(`✅ Found ${normalizedData.length} offers in lowercase data field`);
        } else if (responseData.ofertas && Array.isArray(responseData.ofertas) && responseData.ofertas.length > 0) {
          // Ofertas field
          normalizedData = responseData.ofertas;
          console.log(`✅ Found ${normalizedData.length} offers in ofertas field`);
        }

        // If we found data, use this response
        if (normalizedData.length > 0) {
          offersData = {
            Success: responseData.Success !== false, // Default to true if not specified
            HasResult: responseData.HasResult !== false,
            Data: normalizedData,
            ExErro: responseData.ExErro, // Updated field name
            ExceptionErro: responseData.ExceptionErro, // Keep both for compatibility
            MensagemErro: responseData.MensagemErro
          };
          successfulUrl = url;
          console.log(`🎯 Successfully got ${normalizedData.length} offers from: ${url}`);
          
          // Log first offer structure for validation
          if (normalizedData[0]) {
            console.log('🔍 First offer sample:', {
              IdGeral: normalizedData[0].IdGeral,
              IataOrigem: normalizedData[0].IataOrigem,
              IataDestino: normalizedData[0].IataDestino,
              hasOrigem: !!normalizedData[0].Origem,
              hasDestino: !!normalizedData[0].Destino,
              hasValoradulto: !!normalizedData[0].ValorAdulto,
              hasPontosAdulto: !!normalizedData[0].PontosAdulto
            });
          }
          break; // Success, stop trying other URLs
        } else {
          console.log(`⚠️ URL returned no data: ${url}`);
          // Log raw response for debugging if no data found
          if (responseData && typeof responseData === 'object') {
            const debugText = JSON.stringify(responseData).substring(0, 500);
            console.log(`🔍 Raw response debug: ${debugText}...`);
          }
        }
        
      } catch (urlError) {
        console.error(`❌ Error with URL ${url}:`, urlError instanceof Error ? urlError.message : 'Unknown error');
        continue; // Try next URL variation
      }
    }

    // Check if any URL worked
    if (!offersData || !offersData.Data || offersData.Data.length === 0) {
      const errorMsg = 'No offers found from any URL variation';
      console.error(`❌ ${errorMsg}`);
      return {
        processed: 0,
        inserted: 0,
        updated: 0,
        errors: 1,
        error: errorMsg,
        message: 'Moblix sync failed - no data returned'
      };
    }

    console.log(`📦 Successfully fetched ${offersData.Data.length} offers from Moblix using: ${successfulUrl}`);

    // Step 3: Process offers with robust data validation
    let processedCount = 0;
    let insertedCount = 0;
    let updatedCount = 0;
    let errorCount = 0;

    for (const offer of offersData.Data) {
      try {
        // Validate required fields
        if (!offer.IdGeral || !offer.IataOrigem || !offer.IataDestino || !offer.Ida) {
          console.error(`⚠️ Skipping invalid offer - missing required fields:`, {
            IdGeral: !!offer.IdGeral,
            IataOrigem: !!offer.IataOrigem, 
            IataDestino: !!offer.IataDestino,
            Ida: !!offer.Ida
          });
          errorCount++;
          continue;
        }

        // Store raw offer data
        const { error: rawInsertError } = await supabase
          .from('moblix_offers')
          .upsert({
            external_id: offer.IdGeral,
            raw_data: offer,
            processed: false,
          }, {
            onConflict: 'external_id',
            ignoreDuplicates: false,
          });

        if (rawInsertError) {
          console.error(`❌ Error storing raw offer ${offer.IdGeral}:`, rawInsertError);
          errorCount++;
          continue;
        }

        // Robust data extraction with fallbacks
        const originCity = offer.Origem?.Cidade || offer.IataOrigem;
        const destCity = offer.Destino?.Cidade || offer.IataDestino;
        const airlineName = offer.Cia?.Nome || `Companhia Aérea (${offer.IataOrigem}/${offer.IataDestino})`;
        
        // Convert to airline_promotions format with better date handling
        const routeDescription = offer.SoIda 
          ? `Viagem de ${originCity} para ${destCity} (só ida)`
          : `Viagem de ${originCity} para ${destCity} (ida e volta)`;

        // Parse dates more carefully - Moblix uses ISO format
        const departureDate = new Date(offer.Ida);
        const isValidDeparture = !isNaN(departureDate.getTime());
        
        let returnDate = null;
        let endDate = new Date();
        
        if (!offer.SoIda && offer.Volta) {
          returnDate = new Date(offer.Volta);
          if (!isNaN(returnDate.getTime())) {
            endDate = returnDate;
          } else {
            // Fallback: 30 days from departure
            endDate = new Date(departureDate.getTime() + 30 * 24 * 60 * 60 * 1000);
          }
        } else {
          // For one-way flights, set end date to 30 days from departure
          if (isValidDeparture) {
            endDate = new Date(departureDate.getTime() + 30 * 24 * 60 * 60 * 1000);
          } else {
            endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
          }
        }

        // Ensure end_date is in the future for active promotions
        const today = new Date();
        if (endDate <= today) {
          endDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000); // +7 days minimum
        }

        const airlinePromotion: AirlinePromotion = {
          airline_code: `${offer.IataOrigem}-${offer.IataDestino}`,
          airline_name: airlineName,
          title: `${originCity} → ${destCity}`,
          description: routeDescription,
          promotion_type: 'route_promotion',
          miles_required: offer.PontosAdulto || 0,
          route_from: originCity,
          route_to: destCity,
          start_date: isValidDeparture ? departureDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
          data_source: 'moblix',
          external_reference: offer.IdGeral,
          raw_price: offer.ValorAdulto || 0,
          boarding_tax: offer.TaxaEmbarque || 0,
          departure_date: isValidDeparture ? departureDate.toISOString().split('T')[0] : undefined,
          return_date: (!offer.SoIda && returnDate && !isNaN(returnDate.getTime())) ? returnDate.toISOString().split('T')[0] : undefined,
          is_round_trip: !offer.SoIda,
        };

        // Log first few promotions for debugging
        if (processedCount < 3) {
          console.log(`🔍 Processing promotion ${processedCount + 1}:`, {
            title: airlinePromotion.title,
            miles_required: airlinePromotion.miles_required,
            start_date: airlinePromotion.start_date,
            end_date: airlinePromotion.end_date,
            raw_price: airlinePromotion.raw_price
          });
        }

        // Check if promotion already exists
        const { data: existingPromo } = await supabase
          .from('airline_promotions')
          .select('id')
          .eq('external_reference', offer.IdGeral)
          .eq('data_source', 'moblix')
          .single();

        if (existingPromo) {
          // Update existing promotion
          const { error: updateError } = await supabase
            .from('airline_promotions')
            .update({
              ...airlinePromotion,
              last_synced_at: new Date().toISOString(),
              is_active: true,
            })
            .eq('id', existingPromo.id);

          if (updateError) {
            console.error(`❌ Error updating Moblix promotion ${offer.IdGeral}:`, updateError);
            errorCount++;
          } else {
            console.log(`✅ Updated Moblix promotion: ${airlinePromotion.title}`);
            updatedCount++;
          }
        } else {
          // Insert new promotion
          const { error: insertError } = await supabase
            .from('airline_promotions')
            .insert({
              ...airlinePromotion,
              last_synced_at: new Date().toISOString(),
              is_active: true,
            });

          if (insertError) {
            console.error(`❌ Error inserting Moblix promotion ${offer.IdGeral}:`, insertError);
            errorCount++;
          } else {
            console.log(`🆕 Inserted new Moblix promotion: ${airlinePromotion.title}`);
            insertedCount++;
          }
        }

        // Mark as processed
        await supabase
          .from('moblix_offers')
          .update({ processed: true })
          .eq('external_id', offer.IdGeral);

        processedCount++;

      } catch (offerError) {
        console.error(`❌ Error processing Moblix offer ${offer?.IdGeral || 'unknown'}:`, offerError);
        errorCount++;
      }
    }

    // Deactivate old Moblix offers that are no longer available
    const currentExternalIds = offersData.Data.map((offer: any) => offer.IdGeral).filter((id: any) => id);
    
    if (currentExternalIds.length > 0) {
      const { error: deactivateError } = await supabase
        .from('airline_promotions')
        .update({ is_active: false })
        .eq('data_source', 'moblix')
        .not('external_reference', 'in', `(${currentExternalIds.map((id: any) => `'${id}'`).join(',')})`);

      if (deactivateError) {
        console.error('❌ Error deactivating old Moblix offers:', deactivateError);
      } else {
        console.log('🗓️ Deactivated old Moblix offers');
      }
    }

    // Determine success based on actual results 
    const success = (insertedCount + updatedCount) > 0 && errorCount === 0;
    const message = success 
      ? 'Moblix sync completed successfully'
      : errorCount > 0 
        ? `Moblix sync completed with ${errorCount} errors`
        : 'Moblix sync completed but no promotions were processed';

    const result = {
      processed: processedCount,
      inserted: insertedCount,
      updated: updatedCount,
      errors: errorCount,
      total_fetched: offersData.Data.length,
      successful_url: successfulUrl,
      success: success,
      message: message
    };

    console.log('🎯 Moblix sync completed:', result);
    return result;

  } catch (error) {
    console.error('💥 Error in Moblix sync:', error);
    return {
      processed: 0,
      inserted: 0,
      updated: 0,
      errors: 1,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Moblix sync failed'
    };
  }
}

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

    const uniqueUsers = [...new Set(users?.map((u: any) => u.user_id) || [])];
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

        const totalHistoryMiles = historyMiles?.reduce((sum: number, record: any) => sum + (record.miles_earned || 0), 0) || 0;
        const totalExistingMiles = existingMiles?.reduce((sum: number, rule: any) => sum + (rule.existing_miles || 0), 0) || 0;
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