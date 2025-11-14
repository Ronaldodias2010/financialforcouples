import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Heading,
  Text,
  Button,
  Hr,
  Img,
} from 'https://esm.sh/@react-email/components@0.0.22';
import React from 'https://esm.sh/react@18.3.1';

interface EmailConfirmationProps {
  userEmail: string;
  loginUrl: string;
}

export const EmailConfirmationPT = ({ userEmail, loginUrl }: EmailConfirmationProps) => {
  return React.createElement(
    Html,
    null,
    React.createElement(Head, null),
    React.createElement(Preview, null, "🎉 Confirme seu endereço de email - Couples Financials"),
    React.createElement(
      Body,
      { style: main },
      React.createElement(
        Container,
        { style: container },
        React.createElement(
          'div',
          { style: header },
          React.createElement(Img, {
            src: "https://elxttabdtddlavhseipz.lovableproject.com/lovable-uploads/1f5e0469-b056-4cf9-9583-919702fa8736.png",
            width: "80",
            height: "80",
            alt: "Couples Financials",
            style: logo
          }),
          React.createElement(
            Heading,
            { style: h1 },
            "Couples Financials"
          )
        ),
        React.createElement(
          Heading,
          { style: h2 },
          "Confirme seu endereço de email"
        ),
        React.createElement(
          Text,
          { style: text },
          `Olá ${userEmail}!`
        ),
        React.createElement(
          Text,
          { style: text },
          "Obrigado por se cadastrar no Couples Financials! Para finalizar seu cadastro e começar a usar nossa plataforma, você precisa confirmar seu endereço de email."
        ),
        React.createElement(
          Button,
          { 
            href: loginUrl,
            style: button 
          },
          "Confirmar Email"
        ),
        React.createElement(
          Text,
          { style: text },
          "Ou copie e cole este link no seu navegador:"
        ),
        React.createElement(
          Text,
          { style: linkText },
          loginUrl
        ),
        React.createElement(Hr, { style: hr }),
        React.createElement(
          Text,
          { style: text },
          "Após confirmar seu email, você terá acesso a:"
        ),
        React.createElement(
          'ul',
          { style: list },
          React.createElement('li', { style: listItem }, "📊 Dashboard financeiro completo"),
          React.createElement('li', { style: listItem }, "💳 Gestão de cartões e contas"),
          React.createElement('li', { style: listItem }, "📈 Acompanhamento de investimentos"),
          React.createElement('li', { style: listItem }, "🎯 Metas financeiras"),
          React.createElement('li', { style: listItem }, "✈️ Sistema de milhas")
        ),
        React.createElement(Hr, { style: hr }),
        React.createElement(
          Text,
          { style: footer },
          "Se você não criou uma conta no Couples Financials, pode ignorar este email com segurança."
        ),
        React.createElement(
          Text,
          { style: footer },
          "© 2024 Couples Financials. Todos os direitos reservados."
        )
      )
    )
  );
};

// Styles
const main = {
  backgroundColor: '#1a1a2e',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
  minHeight: '100vh',
  padding: '20px 0',
};

const container = {
  backgroundColor: '#16213e',
  margin: '0 auto',
  padding: '40px 20px',
  maxWidth: '600px',
  borderRadius: '12px',
  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
};

const header = {
  textAlign: 'center' as const,
  marginBottom: '32px',
};

const logo = {
  borderRadius: '8px',
};

const h1 = {
  color: '#e94560',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '0',
  textAlign: 'center' as const,
};

const h2 = {
  color: '#ffffff',
  fontSize: '24px',
  fontWeight: '600',
  margin: '32px 0 24px 0',
  textAlign: 'center' as const,
};

const text = {
  color: '#e2e8f0',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '16px 0',
};

const button = {
  backgroundColor: '#e94560',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '16px 32px',
  margin: '32px 0',
  transition: 'all 0.3s ease',
};

const linkText = {
  color: '#64b5f6',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '16px 0',
  wordBreak: 'break-all' as const,
};

const list = {
  color: '#e2e8f0',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '16px 0',
  paddingLeft: '20px',
};

const listItem = {
  margin: '8px 0',
};

const hr = {
  borderColor: '#334155',
  margin: '32px 0',
};

const footer = {
  color: '#94a3b8',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '16px 0',
  textAlign: 'center' as const,
};