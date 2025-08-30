import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[VALIDATE-PROMO-CODE] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    logStep("Function started");

    const { code, country = 'BR' } = await req.json();
    if (!code) {
      throw new Error("Código promocional é obrigatório");
    }

    logStep("Validating promo code", { code, country });

    // Get promo code details
    const { data: promoCode, error: promoError } = await supabaseClient
      .from('promo_codes')
      .select('*')
      .eq('code', code.toUpperCase())
      .eq('is_active', true)
      .single();

    if (promoError || !promoCode) {
      logStep("Promo code not found", { code, error: promoError });
      return new Response(JSON.stringify({ 
        valid: false, 
        message: "Código promocional inválido ou expirado" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Check if expired
    if (promoCode.expiry_date && new Date(promoCode.expiry_date) < new Date()) {
      logStep("Promo code expired", { code, expiry_date: promoCode.expiry_date });
      return new Response(JSON.stringify({ 
        valid: false, 
        message: "Código promocional expirado" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Check if max uses reached
    if (promoCode.current_uses >= promoCode.max_uses) {
      logStep("Promo code max uses reached", { code, current_uses: promoCode.current_uses, max_uses: promoCode.max_uses });
      return new Response(JSON.stringify({ 
        valid: false, 
        message: "Código promocional esgotado" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Check if valid for country
    if (!promoCode.valid_for_countries.includes(country)) {
      logStep("Promo code not valid for country", { code, country, valid_countries: promoCode.valid_for_countries });
      return new Response(JSON.stringify({ 
        valid: false, 
        message: "Código promocional não válido para sua região" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    logStep("Promo code validated successfully", { 
      code, 
      discount_type: promoCode.discount_type,
      discount_value: promoCode.discount_value,
      stripe_price_id: promoCode.stripe_price_id
    });

    return new Response(JSON.stringify({
      valid: true,
      code: promoCode.code,
      discount_type: promoCode.discount_type,
      discount_value: promoCode.discount_value,
      stripe_price_id: promoCode.stripe_price_id,
      message: promoCode.discount_type === 'fixed_price' 
        ? `Preço especial: R$ ${promoCode.discount_value.toFixed(2)}`
        : `Desconto aplicado: ${promoCode.discount_value}%`
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in validate-promo-code", { message: errorMessage });
    return new Response(JSON.stringify({ 
      valid: false, 
      error: errorMessage 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});