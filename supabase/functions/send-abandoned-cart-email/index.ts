import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";
import { renderAsync } from "npm:@react-email/components@0.0.22";
import { AbandonedCartEmailPT } from "./_templates/abandoned-cart-email-pt.tsx";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper logging function
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[ABANDONED-CART-EMAIL] ${step}${detailsStr}`);
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY is not set");
    }
    logStep("Resend API key verified");

    const resend = new Resend(resendApiKey);

    // Parse request body
    const body = await req.json();
    const { customerName, customerEmail, selectedPlan, checkoutUrl } = body;
    
    logStep("Request data", { customerName, customerEmail, selectedPlan });

    if (!customerName || !customerEmail || !selectedPlan) {
      throw new Error("Missing required fields: customerName, customerEmail, selectedPlan");
    }

    // Render the email template
    logStep("Rendering email template");
    const emailHtml = await renderAsync(
      AbandonedCartEmailPT({
        customerName,
        customerEmail,
        selectedPlan,
        checkoutUrl: checkoutUrl || "https://elxttabdtddlavhseipz.lovableproject.com"
      })
    );

    // Send the email
    logStep("Sending email", { to: customerEmail });
    const emailResponse = await resend.emails.send({
      from: "Couples Financials <no-reply@elxttabdtddlavhseipz.lovableproject.com>",
      to: [customerEmail],
      subject: "🚀 Não perca sua chance de ter o Premium - Couples Financials",
      html: emailHtml,
    });

    logStep("Email sent successfully", { emailId: emailResponse.data?.id });

    return new Response(
      JSON.stringify({ 
        success: true, 
        emailId: emailResponse.data?.id,
        message: "Email enviado com sucesso" 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        success: false 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);