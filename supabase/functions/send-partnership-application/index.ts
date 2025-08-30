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

interface PartnershipRequest {
  name: string;
  email: string;
  phone?: string;
  audienceType: string;
  socialMedia?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, phone, audienceType, socialMedia }: PartnershipRequest = await req.json();

    console.log('Processing partnership application:', { name, email, audienceType });
    
    // Server-side validation for required fields
    if (!name || !email || !audienceType || !socialMedia?.trim()) {
      throw new Error('Nome, email, tipo de audiência e redes sociais são campos obrigatórios');
    }

    // Store in database
    const { data: application, error: dbError } = await supabase
      .from('partnership_applications')
      .insert({
        name,
        email,
        phone: phone || null,
        audience_type: audienceType,
        social_media: socialMedia,
        status: 'pending'
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      throw new Error('Erro ao salvar solicitação');
    }

    // Send email to admin
    const emailResponse = await resend.emails.send({
      from: "Couples Financials <noreply@couplesfinancials.com>",
      to: ["contato@couplesfinancials.com.br"],
      subject: `Nova Solicitação de Parceria - ${name}`,
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
          <h2 style="color: #1f2937; margin-bottom: 24px;">Nova Solicitação de Parceria</h2>
          
          <div style="background: #f8fafc; padding: 24px; border-radius: 8px; margin-bottom: 24px;">
            <h3 style="margin: 0 0 16px 0; color: #374151;">Dados do Solicitante</h3>
            <p><strong>Nome:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            ${phone ? `<p><strong>Telefone:</strong> ${phone}</p>` : ''}
            <p><strong>Tipo de Audiência:</strong> ${audienceType}</p>
            <p><strong>Redes Sociais:</strong> ${socialMedia}</p>
          </div>

          <div style="background: #e0f2fe; padding: 16px; border-radius: 8px; border-left: 4px solid #0284c7;">
            <p style="margin: 0; font-size: 14px; color: #0369a1;">
              <strong>ID da Solicitação:</strong> ${application.id}
            </p>
            <p style="margin: 8px 0 0 0; font-size: 14px; color: #0369a1;">
              Acesse o painel administrativo para aprovar ou rejeitar esta solicitação.
            </p>
          </div>
        </div>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Solicitação enviada com sucesso!',
      applicationId: application.id 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-partnership-application function:", error);
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