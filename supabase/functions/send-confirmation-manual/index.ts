import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { renderAsync } from 'npm:@react-email/components@0.0.22';
import React from 'npm:react@18.3.1';

// Import the Portuguese email template
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
  Button,
  Hr,
  Img,
} from 'npm:@react-email/components@0.0.22';

interface EmailConfirmationProps {
  userEmail: string;
  loginUrl: string;
}

const EmailConfirmationPT = ({ userEmail, loginUrl }: EmailConfirmationProps) => (
  <Html>
    <Head />
    <Preview>Bem-vindo ao Couples Financials! Sua conta foi confirmada com sucesso</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img
          src="https://elxttabdtddlavhseipz.supabase.co/storage/v1/object/public/app-assets/couples-financials-logo.png"
          width="200"
          height="60"
          alt="Couples Financials"
          style={logo}
        />
        
        <Heading style={h1}>Conta Confirmada com Sucesso!</Heading>
        
        <Text style={text}>
          Olá! Sua conta no <strong>Couples Financials</strong> foi confirmada com sucesso.
        </Text>
        
        <Text style={text}>
          Email confirmado: <strong>{userEmail}</strong>
        </Text>
        
        <Text style={text}>
          Agora você pode acessar todas as funcionalidades da nossa plataforma de gestão financeira para casais.
        </Text>
        
        <Button style={button} href={loginUrl}>
          Acessar Minha Conta
        </Button>
        
        <Hr style={hr} />
        
        <Text style={subtitle}>O que você pode fazer agora:</Text>
        
        <ul style={list}>
          <li style={listItem}>Gerenciar suas contas bancárias</li>
          <li style={listItem}>Controlar gastos com cartões</li>
          <li style={listItem}>Visualizar relatórios detalhados</li>
          <li style={listItem}>Definir metas financeiras</li>
          <li style={listItem}>Acompanhar milhas e pontos</li>
          <li style={listItem}>Convidar seu parceiro(a)</li>
        </ul>
        
        <Hr style={hr} />
        
        <Text style={footer}>
          Se você não criou esta conta, pode ignorar este email com segurança.
        </Text>
        
        <Text style={footer}>
          <strong>Couples Financials</strong> - Gestão financeira inteligente para casais
        </Text>
      </Container>
    </Body>
  </Html>
);

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
};

const logo = {
  margin: '0 auto',
  marginBottom: '32px',
};

const h1 = {
  color: '#333333',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0',
  textAlign: 'center' as const,
};

const text = {
  color: '#333333',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '16px 0',
  padding: '0 40px',
};

const button = {
  backgroundColor: '#007ee6',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '12px 20px',
  margin: '32px auto',
  maxWidth: '200px',
};

const hr = {
  borderColor: '#e6ebf1',
  margin: '32px 40px',
};

const subtitle = {
  color: '#333333',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '32px 0 16px',
  padding: '0 40px',
};

const list = {
  color: '#333333',
  fontSize: '16px',
  lineHeight: '24px',
  padding: '0 40px',
  margin: '0',
};

const listItem = {
  margin: '8px 0',
};

const footer = {
  color: '#8898aa',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '16px 0',
  padding: '0 40px',
  textAlign: 'center' as const,
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ConfirmationEmailRequest {
  email: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email }: ConfirmationEmailRequest = await req.json();
    
    const loginUrl = "https://elxttabdtddlavhseipz.supabase.co/auth/v1/authorize?provider=email";

    const html = await renderAsync(
      React.createElement(EmailConfirmationPT, {
        userEmail: email,
        loginUrl: "https://your-app-url.com/auth" // Adjust this URL as needed
      })
    );

    const emailResponse = await resend.emails.send({
      from: "Couples Financials <onboarding@resend.dev>",
      to: [email],
      subject: "🎉 Conta confirmada - Bem-vindo ao Couples Financials!",
      html: html,
    });

    console.log("Confirmation email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-confirmation-manual function:", error);
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