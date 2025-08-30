import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🧪 Testando envio de email para parceiro aprovado');

    // Enviar email de aprovação
    const { error: approvalError } = await supabase.functions.invoke('send-approval-email', {
      body: {
        applicationId: 'test-id',
        partnerName: 'Ronaldo Dias',
        partnerEmail: 'ronadias2010@gmail.com',
        referralCode: 'TESTCODE2024',
        rewardAmount: 10.00,
        rewardType: 'monetary',
        rewardCurrency: 'BRL'
      }
    });

    if (approvalError) {
      console.error('Erro no email de aprovação:', approvalError);
    } else {
      console.log('✅ Email de aprovação enviado com sucesso');
    }

    // Enviar notificação de uso do código
    const { error: usageError } = await supabase.functions.invoke('notify-code-usage', {
      body: {
        codeUsed: 'TESTCODE2024',
        partnerEmail: 'ronadias2010@gmail.com',
        partnerName: 'Ronaldo Dias',
        newUserEmail: 'usuario.teste@gmail.com',
        rewardAmount: 10.00,
        rewardCurrency: 'BRL',
        transactionDate: new Date().toISOString()
      }
    });

    if (usageError) {
      console.error('Erro no email de notificação:', usageError);
    } else {
      console.log('✅ Email de notificação enviado com sucesso');
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Emails de teste enviados',
      approvalSent: !approvalError,
      usageNotificationSent: !usageError
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Erro no teste de emails:", error);
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