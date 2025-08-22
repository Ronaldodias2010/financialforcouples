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

const EmailConfirmationPT = ({ userEmail, loginUrl }: EmailConfirmationProps) => 
  React.createElement(Html, null,
    React.createElement(Head),
    React.createElement(Preview, null, "Confirme seu endereço de email para ativar sua conta no Couples Financials"),
    React.createElement(Body, { style: main },
      React.createElement(Container, { style: container },
        React.createElement(Img, {
          src: "https://elxttabdtddlavhseipz.supabase.co/storage/v1/object/public/app-assets/couples-financials-logo.png",
          width: "200",
          height: "60",
          alt: "Couples Financials",
          style: logo
        }),
        
        React.createElement(Heading, { style: h1 }, "Confirme seu endereço de email"),
        
        React.createElement(Text, { style: text }, 
          "Olá! Obrigado por se cadastrar no ",
          React.createElement("strong", null, "Couples Financials"),
          ". Para ativar sua conta, confirme seu endereço de email."
        ),
        
        React.createElement(Text, { style: text },
          "Email a ser confirmado: ",
          React.createElement("strong", null, userEmail)
        ),
        
        React.createElement(Button, { style: button, href: loginUrl },
          "Confirmar Email"
        ),
        
        React.createElement(Text, { style: text },
          "Ou copie e cole este link no seu navegador:"
        ),
        
        React.createElement(Text, { style: { ...text, wordBreak: 'break-all', fontSize: '14px' } },
          loginUrl
        ),
        
        React.createElement(Hr, { style: hr }),
        
        React.createElement(Text, { style: subtitle }, "Após confirmar seu email, você poderá:"),
        
        React.createElement("ul", { style: list },
          React.createElement("li", { style: listItem }, "Gerenciar suas contas bancárias"),
          React.createElement("li", { style: listItem }, "Controlar gastos com cartões"),
          React.createElement("li", { style: listItem }, "Visualizar relatórios detalhados"),
          React.createElement("li", { style: listItem }, "Definir metas financeiras"),
          React.createElement("li", { style: listItem }, "Acompanhar milhas e pontos"),
          React.createElement("li", { style: listItem }, "Convidar seu parceiro(a)")
        ),
        
        React.createElement(Hr, { style: hr }),
        
        React.createElement(Text, { style: footer },
          "Se você não criou esta conta, pode ignorar este email com segurança."
        ),
        
        React.createElement(Text, { style: footer },
          React.createElement("strong", null, "Couples Financials"),
          " - Gestão financeira inteligente para casais"
        )
      )
    )
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
  userEmail: string;
  language?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userEmail, language = 'pt' }: ConfirmationEmailRequest = await req.json();
    
    const loginUrl = `${Deno.env.get('SUPABASE_URL')}/auth/v1/verify?type=signup&redirect_to=https://couples-financials.lovableproject.com/checkout-email-confirmation?email=${encodeURIComponent(userEmail)}`;

    const html = await renderAsync(
      React.createElement(EmailConfirmationPT, {
        userEmail: userEmail,
        loginUrl: loginUrl
      })
    );
    
    console.log("Generated HTML:", html);

    const emailResponse = await resend.emails.send({
      from: "Couples Financials <noreply@couplesfinancials.com>",
      to: [userEmail],
      subject: "🎉 Confirme seu endereço de email - Couples Financials",
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