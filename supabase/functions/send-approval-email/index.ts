import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ApprovalRequest {
  applicationId: string;
  partnerName: string;
  partnerEmail: string;
  referralCode: string;
  rewardAmount: number;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { applicationId, partnerName, partnerEmail, referralCode, rewardAmount }: ApprovalRequest = await req.json();

    console.log('Sending approval email:', { partnerName, partnerEmail, referralCode });

    const emailResponse = await resend.emails.send({
      from: "Couples Financials <noreply@couplesfinancials.com.br>",
      to: [partnerEmail],
      subject: "🎉 Sua solicitação de parceria foi aprovada!",
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="color: #059669; margin: 0;">Parabéns, ${partnerName}!</h1>
            <p style="font-size: 18px; color: #374151; margin: 16px 0;">Sua solicitação de parceria foi aprovada!</p>
          </div>
          
          <div style="background: #f0fdf4; padding: 24px; border-radius: 8px; margin-bottom: 24px; border: 1px solid #bbf7d0;">
            <h2 style="color: #059669; margin: 0 0 16px 0;">Seu Código de Indicação</h2>
            <div style="background: white; padding: 16px; border-radius: 6px; text-align: center; margin: 16px 0;">
              <span style="font-size: 24px; font-weight: bold; color: #059669; letter-spacing: 2px;">${referralCode}</span>
            </div>
            <p style="margin: 16px 0 0 0; color: #166534; font-size: 14px;">
              Este é seu código exclusivo para compartilhar com sua audiência.
            </p>
          </div>

          <div style="background: #fffbeb; padding: 24px; border-radius: 8px; margin-bottom: 24px; border: 1px solid #fde68a;">
            <h3 style="color: #92400e; margin: 0 0 16px 0;">💰 Como Funciona a Recompensa</h3>
            <ul style="color: #92400e; margin: 0; padding-left: 20px;">
              <li>Para cada pessoa que se cadastrar usando seu código e efetuar o pagamento</li>
              <li>Você receberá <strong>R$ ${rewardAmount.toFixed(2)}</strong> de comissão</li>
              <li>O pagamento será processado após a confirmação do pagamento do usuário</li>
              <li>Você receberá um relatório mensal com seus ganhos</li>
            </ul>
          </div>

          <div style="background: #f1f5f9; padding: 24px; border-radius: 8px; margin-bottom: 24px;">
            <h3 style="color: #1e293b; margin: 0 0 16px 0;">📝 Como Usar Seu Código</h3>
            <ol style="color: #475569; margin: 0; padding-left: 20px;">
              <li>Compartilhe seu código <strong>${referralCode}</strong> com sua audiência</li>
              <li>Oriente para acessarem: <strong>couplesfinancials.com.br</strong></li>
              <li>No cadastro, eles devem inserir seu código na seção "Código Promocional"</li>
              <li>Acompanhe seus resultados no painel que enviaremos mensalmente</li>
            </ol>
          </div>

          <div style="background: #e0f2fe; padding: 20px; border-radius: 8px; border-left: 4px solid #0284c7;">
            <h4 style="color: #0369a1; margin: 0 0 8px 0;">📞 Suporte e Dúvidas</h4>
            <p style="margin: 0; color: #0369a1; font-size: 14px;">
              Entre em contato conosco: <strong>contato@couplesfinancials.com.br</strong><br>
              Estamos aqui para ajudar você a ter sucesso em nossa parceria!
            </p>
          </div>

          <div style="text-align: center; margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 14px; margin: 0;">
              Obrigado por fazer parte da família Couples Financials! 🚀
            </p>
          </div>
        </div>
      `,
    });

    console.log("Approval email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Email de aprovação enviado com sucesso!' 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-approval-email function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Erro interno do servidor',
        success: false 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);