import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CodeUsageNotification {
  codeUsed: string;
  partnerEmail: string;
  partnerName?: string;
  newUserEmail: string;
  rewardAmount: number;
  rewardCurrency?: string;
  transactionDate: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      codeUsed, 
      partnerEmail, 
      partnerName = 'Parceiro',
      newUserEmail, 
      rewardAmount, 
      rewardCurrency = 'BRL',
      transactionDate 
    }: CodeUsageNotification = await req.json();

    console.log('📬 Sending code usage notification:', { 
      codeUsed, 
      partnerEmail, 
      newUserEmail, 
      rewardAmount 
    });

    const formattedDate = new Date(transactionDate).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const emailResponse = await resend.emails.send({
      from: "Couples Financials <noreply@couplesfinancials.com>",
      to: [partnerEmail],
      subject: `💰 Seu código ${codeUsed} foi usado! Nova comissão disponível`,
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="color: #059669; margin: 0;">🎉 Parabéns, ${partnerName}!</h1>
            <p style="font-size: 18px; color: #374151; margin: 16px 0;">Seu código de indicação foi usado!</p>
          </div>
          
          <div style="background: #f0fdf4; padding: 24px; border-radius: 8px; margin-bottom: 24px; border: 1px solid #bbf7d0;">
            <h2 style="color: #059669; margin: 0 0 16px 0;">💰 Nova Comissão Registrada</h2>
            <div style="background: white; padding: 20px; border-radius: 6px; margin: 16px 0;">
              <div style="display: grid; gap: 12px;">
                <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px;">
                  <span style="color: #6b7280; font-weight: 500;">Código Usado:</span>
                  <span style="color: #059669; font-weight: bold; font-size: 18px;">${codeUsed}</span>
                </div>
                <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px;">
                  <span style="color: #6b7280; font-weight: 500;">Novo Usuário:</span>
                  <span style="color: #374151; font-weight: 500;">${newUserEmail}</span>
                </div>
                <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px;">
                  <span style="color: #6b7280; font-weight: 500;">Data do Cadastro:</span>
                  <span style="color: #374151; font-weight: 500;">${formattedDate}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding-top: 8px;">
                  <span style="color: #6b7280; font-weight: 500;">Comissão a Receber:</span>
                  <span style="color: #059669; font-weight: bold; font-size: 20px;">
                    ${rewardCurrency === 'USD' ? '$' : 'R$'} ${rewardAmount.toFixed(2).replace('.', ',')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div style="background: #fffbeb; padding: 24px; border-radius: 8px; margin-bottom: 24px; border: 1px solid #fde68a;">
            <h3 style="color: #92400e; margin: 0 0 16px 0;">📊 Como Funciona o Pagamento</h3>
            <ul style="color: #92400e; margin: 0; padding-left: 20px;">
              <li>Sua comissão será processada após 30 dias da data do cadastro</li>
              <li>Isso garante que o período de reembolso tenha passado</li>
              <li>Você receberá um relatório mensal com todas suas comissões</li>
              <li>O pagamento será feito via PIX ou transferência bancária</li>
            </ul>
          </div>

          <div style="background: #f1f5f9; padding: 24px; border-radius: 8px; margin-bottom: 24px;">
            <h3 style="color: #1e293b; margin: 0 0 16px 0;">🚀 Continue Compartilhando</h3>
            <p style="color: #475569; margin: 0 0 12px 0;">
              Quanto mais pessoas usarem seu código <strong>${codeUsed}</strong>, maior será sua renda mensal!
            </p>
            <p style="color: #475569; margin: 0;">
              Lembre sua audiência de acessar <strong>couplesfinancials.com</strong> e usar seu código no cadastro.
            </p>
          </div>

          <div style="background: #e0f2fe; padding: 20px; border-radius: 8px; border-left: 4px solid #0284c7;">
            <h4 style="color: #0369a1; margin: 0 0 8px 0;">📞 Dúvidas ou Suporte</h4>
            <p style="margin: 0; color: #0369a1; font-size: 14px;">
              Entre em contato: <strong>contato@couplesfinancials.com</strong><br>
              Estamos aqui para apoiar seu sucesso!
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

    console.log("Code usage notification sent successfully:", emailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Notificação de uso do código enviada com sucesso!' 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in notify-code-usage function:", error);
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