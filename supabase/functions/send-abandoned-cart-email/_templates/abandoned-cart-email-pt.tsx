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

interface AbandonedCartEmailProps {
  customerName: string;
  customerEmail: string;
  selectedPlan: string;
  checkoutUrl: string;
}

export const AbandonedCartEmailPT = ({ 
  customerName, 
  customerEmail, 
  selectedPlan,
  checkoutUrl 
}: AbandonedCartEmailProps) => {
  const planPrice = selectedPlan === 'yearly' ? 'R$ 217,10/ano' : 'R$ 25,90/mês';
  const planName = selectedPlan === 'yearly' ? 'Plano Anual Premium' : 'Plano Mensal Premium';

  return React.createElement(
    Html,
    null,
    React.createElement(Head, null),
    React.createElement(Preview, null, "🚀 Não perca a chance de revolucionar suas finanças - Couples Financials"),
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
            src: "https://couplesfinancials.com/lovable-uploads/couples-financials-logo-new.png",
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
          `Olá ${customerName}! 👋`
        ),
        React.createElement(
          Text,
          { style: text },
          "Notamos que você estava interessado em nosso Plano Premium, mas não finalizou sua assinatura. Que tal aproveitar esta oportunidade para revolucionar sua gestão financeira?"
        ),
        React.createElement(
          'div',
          { style: planCard },
          React.createElement(
            Heading,
            { style: planTitle },
            `${planName}`
          ),
          React.createElement(
            Text,
            { style: text },
            planPrice
          )
        ),
        React.createElement(
          Text,
          { style: text },
          "Com o Plano Premium, você terá acesso a funcionalidades exclusivas que vão transformar sua experiência financeira:"
        ),
        React.createElement(
          'div',
          { style: benefitsSection },
          React.createElement(
            Text,
            { style: benefitTitle },
            "🤖 IA Inteligente"
          ),
          React.createElement(
            Text,
            { style: benefitText },
            "Nossa IA analisa seus gastos e oferece insights personalizados para otimizar suas finanças."
          ),
          React.createElement(
            Text,
            { style: benefitTitle },
            "📱 WhatsApp Inteligente"
          ),
          React.createElement(
            Text,
            { style: benefitText },
            "Registre suas transações via áudio, texto ou imagem diretamente pelo WhatsApp. Receba notificações automáticas de suas movimentações financeiras."
          ),
          React.createElement(
            Text,
            { style: benefitTitle },
            "✈️ Sistema de Milhagem Conectado"
          ),
          React.createElement(
            Text,
            { style: benefitText },
            "Conecte-se às principais companhias aéreas e acompanhe suas milhas em tempo real. Maximize seus benefícios e viaje mais!"
          ),
          React.createElement(
            Text,
            { style: benefitTitle },
            "🚀 Novos Recursos em Desenvolvimento"
          ),
          React.createElement(
            Text,
            { style: benefitText },
            "Estamos constantemente desenvolvendo novos recursos exclusivos para assinantes Premium."
          )
        ),
        React.createElement(
          Button,
          { 
            href: checkoutUrl,
            style: button 
          },
          "Finalizar Assinatura Premium"
        ),
        React.createElement(
          Text,
          { style: urgencyText },
          "⏰ Esta oferta é por tempo limitado. Não perca a oportunidade de revolucionar sua gestão financeira!"
        ),
        React.createElement(Hr, { style: hr }),
        React.createElement(
          Text,
          { style: footer },
          "Tem dúvidas? Respondemos este email ou entre em contato conosco."
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
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: '32px',
  gap: '16px',
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

const planCard = {
  backgroundColor: '#e94560',
  borderRadius: '12px',
  padding: '24px',
  textAlign: 'center' as const,
  margin: '24px 0',
};

const planTitle = {
  color: '#ffffff',
  fontSize: '20px',
  fontWeight: 'bold',
  margin: '0 0 8px 0',
};

const planPrice = {
  color: '#ffffff',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0',
};

const benefitsSection = {
  backgroundColor: '#0f1729',
  borderRadius: '12px',
  padding: '24px',
  margin: '24px 0',
};

const benefitTitle = {
  color: '#e94560',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '16px 0 8px 0',
};

const benefitText = {
  color: '#e2e8f0',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '0 0 16px 0',
};

const button = {
  backgroundColor: '#e94560',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '18px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '20px 32px',
  margin: '32px 0',
  transition: 'all 0.3s ease',
};

const urgencyText = {
  color: '#fbbf24',
  fontSize: '16px',
  fontWeight: '600',
  textAlign: 'center' as const,
  margin: '24px 0',
  padding: '16px',
  backgroundColor: '#1f2937',
  borderRadius: '8px',
  border: '2px solid #fbbf24',
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