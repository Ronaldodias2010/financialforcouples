import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();

    if (!email) {
      throw new Error("Email é obrigatório");
    }

    const emailResponse = await resend.emails.send({
      from: "Financial App <contato@couplesfinancials.com>",
      to: [email],
      subject: "Teste de Email - Financial App",
      html: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
          <h1 style="color: #333; text-align: center;">Email de Teste ✅</h1>
          
          <p>Olá!</p>
          
          <p>Este é um email de teste do <strong>Financial App</strong> para confirmar que o sistema de envio de emails está funcionando corretamente.</p>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #28a745; margin-top: 0;">✅ Configuração Confirmada</h3>
            <p style="margin-bottom: 0;">Sua integração com o Resend está funcionando perfeitamente!</p>
          </div>
          
          <p>Agora você pode:</p>
          <ul>
            <li>Enviar convites para outros usuários</li>
            <li>Receber notificações por email</li>
            <li>Usar todas as funcionalidades de email do sistema</li>
          </ul>
          
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            Enviado em: ${new Date().toLocaleString('pt-BR')}
          </p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
          <p style="color: #999; font-size: 12px; text-align: center;">
            Financial App - Controle financeiro inteligente para casais
          </p>
        </div>
      `,
    });

    console.log("Test email sent successfully:", emailResponse);

    return new Response(JSON.stringify({
      success: true,
      message: "Email de teste enviado com sucesso!",
      emailResponse
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in test-email function:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);