import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface InviteEmailRequest {
  email: string;
  name: string;
  inviter_name: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, name, inviter_name }: InviteEmailRequest = await req.json();

    // Create the registration URL - this should point to your app's registration page
    const registrationUrl = `${req.headers.get("origin")}/auth?invite=true&email=${encodeURIComponent(email)}&name=${encodeURIComponent(name)}`;

    const emailResponse = await resend.emails.send({
      from: "Financial App <onboarding@resend.dev>", // You'll need to change this to your verified domain
      to: [email],
      subject: `${inviter_name} convidou você para o Financial App`,
      html: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
          <h1 style="color: #333; text-align: center;">Você foi convidado!</h1>
          
          <p>Olá <strong>${name}</strong>,</p>
          
          <p><strong>${inviter_name}</strong> convidou você para usar o Financial App, uma plataforma de controle financeiro para casais.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${registrationUrl}" 
               style="background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
              Aceitar Convite e Criar Conta
            </a>
          </div>
          
          <p>Com o Financial App, vocês poderão:</p>
          <ul>
            <li>Gerenciar transações em conjunto</li>
            <li>Acompanhar gastos por categoria</li>
            <li>Controlar cartões e contas bancárias</li>
            <li>Visualizar relatórios financeiros</li>
          </ul>
          
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            Se você não esperava este convite, pode ignorar este email com segurança.
          </p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
          <p style="color: #999; font-size: 12px; text-align: center;">
            Financial App - Controle financeiro inteligente para casais
          </p>
        </div>
      `,
    });

    console.log("Invite email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-invite function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);