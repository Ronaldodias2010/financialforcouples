import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

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
    // Get auth header to identify the inviter
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Get the user from auth token
    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      throw new Error('Invalid authentication');
    }

    const { email, name, inviter_name }: InviteEmailRequest = await req.json();

    // Generate temporary password
    const { data: tempPassword, error: passwordError } = await supabase
      .rpc('generate_temp_password');

    if (passwordError) {
      throw new Error('Error generating temporary password');
    }

    // Create invite record in database
    const { error: inviteError } = await supabase
      .from('user_invites')
      .insert({
        inviter_user_id: user.id,
        invitee_email: email,
        invitee_name: name,
        temp_password: tempPassword,
        status: 'pending'
      });

    if (inviteError) {
      throw new Error('Error creating invite record');
    }

    // Create the login URL
    const loginUrl = `${req.headers.get("origin")}/auth`;

    const emailResponse = await resend.emails.send({
      from: "Financial App <onboarding@resend.dev>", // You'll need to change this to your verified domain
      to: [email],
      subject: `${inviter_name} convidou você para o Financial App`,
      html: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
          <h1 style="color: #333; text-align: center;">Você foi convidado!</h1>
          
          <p>Olá <strong>${name}</strong>,</p>
          
          <p><strong>${inviter_name}</strong> convidou você para usar o Financial App, uma plataforma de controle financeiro para casais.</p>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">Suas credenciais de acesso:</h3>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Senha Provisória:</strong> <span style="background-color: #e5e7eb; padding: 4px 8px; border-radius: 4px; font-family: monospace; font-size: 16px;">${tempPassword}</span></p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${loginUrl}" 
               style="background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
              Fazer Login no Financial App
            </a>
          </div>
          
          <p><strong>Instruções:</strong></p>
          <ol>
            <li>Clique no botão acima para acessar o Financial App</li>
            <li>Use seu email e a senha provisória para fazer login</li>
            <li>Após o login, você poderá alterar sua senha nas configurações</li>
            <li>Seus dados financeiros ficarão vinculados com ${inviter_name}</li>
          </ol>
          
          <p>Com o Financial App, vocês poderão:</p>
          <ul>
            <li>Gerenciar transações em conjunto</li>
            <li>Acompanhar gastos por categoria</li>
            <li>Controlar cartões e contas bancárias</li>
            <li>Visualizar relatórios financeiros</li>
          </ul>
          
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            <strong>Importante:</strong> Esta senha provisória expira em 7 dias. Se você não esperava este convite, pode ignorar este email com segurança.
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