import React from 'https://esm.sh/react@18.3.1';
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Button,
  Hr,
  Img,
  Heading,
} from 'https://esm.sh/@react-email/components@0.0.22';

interface PremiumWelcomeEmailProps {
  user_email: string;
  user_name: string;
  subscription_end: string;
  login_url: string;
}

export const PremiumWelcomeEmailPT: React.FC<PremiumWelcomeEmailProps> = ({
  user_email,
  user_name,
  subscription_end,
  login_url = "https://www.couplesfinancials.com/auth"
}) => {
  const endDate = new Date(subscription_end);
  const formattedEndDate = endDate.toLocaleDateString('pt-BR');

  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Img
            src="https://www.couplesfinancials.com/lovable-uploads/couples-financials-logo-pwa.png"
            width="150"
            height="150"
            alt="Couples Financials"
            style={logo}
          />
          
          <Heading style={heading}>
            🎉 Bem-vindo ao Couples Financials Premium!
          </Heading>
          
          <Text style={text}>
            Olá <strong>{user_name}</strong>!
          </Text>
          
          <Text style={text}>
            Parabéns! Sua assinatura Premium do Couples Financials foi ativada com sucesso. 
            Agora você tem acesso completo a todas as funcionalidades premium da nossa plataforma.
          </Text>
          
          <Section style={featuresSection}>
            <Heading style={featuresHeading}>✨ Seus Benefícios Premium:</Heading>
            <Text style={featureText}>💰 Sistema completo de gestão financeira para casais</Text>
            <Text style={featureText}>📊 Relatórios avançados e insights de gastos</Text>
            <Text style={featureText}>🤖 Consultoria financeira com IA personalizada</Text>
            <Text style={featureText}>✈️ Sistema de milhagem e promoções exclusivas</Text>
            <Text style={featureText}>💳 Controle completo de cartões e contas</Text>
            <Text style={featureText}>📈 Dashboard de investimentos avançado</Text>
            <Text style={featureText}>🎯 Metas financeiras e planejamento</Text>
          </Section>
          
          <Text style={text}>
            <strong>Sua assinatura Premium é válida até:</strong> {formattedEndDate}
          </Text>
          
          <Section style={buttonSection}>
            <Button pX={20} pY={12} style={button} href={login_url}>
              🚀 Começar a Usar Agora
            </Button>
          </Section>
          
          <Hr style={hr} />
          
          <Text style={helpText}>
            <strong>Precisa de ajuda?</strong><br />
            Nossa equipe está sempre disponível para ajudá-lo a aproveitar ao máximo 
            sua experiência premium. Entre em contato conosco através do suporte dentro 
            da plataforma ou pelo email contato@couplesfinancials.com.
          </Text>
          
          <Text style={footerText}>
            Obrigado por escolher o Couples Financials Premium!<br />
            <strong>Equipe Couples Financials</strong>
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  borderRadius: '8px',
  border: '1px solid #e6e8eb',
};

const logo = {
  margin: '0 auto 32px',
  display: 'block',
};

const heading = {
  fontSize: '28px',
  lineHeight: '1.3',
  fontWeight: '700',
  color: '#484848',
  textAlign: 'center' as const,
  margin: '0 0 24px',
};

const text = {
  fontSize: '16px',
  lineHeight: '1.4',
  color: '#484848',
  padding: '0 24px',
  margin: '0 0 16px',
};

const featuresSection = {
  padding: '24px',
  backgroundColor: '#f8fffe',
  margin: '24px',
  borderRadius: '8px',
  border: '1px solid #e0f2f1',
};

const featuresHeading = {
  fontSize: '20px',
  fontWeight: '600',
  color: '#2e7d32',
  margin: '0 0 16px',
};

const featureText = {
  fontSize: '15px',
  lineHeight: '1.4',
  color: '#2e7d32',
  margin: '8px 0',
};

const buttonSection = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#22c55e',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  cursor: 'pointer',
};

const hr = {
  borderColor: '#e6e8eb',
  margin: '32px 0',
};

const helpText = {
  fontSize: '14px',
  lineHeight: '1.4',
  color: '#6b7280',
  padding: '0 24px',
  margin: '0 0 24px',
};

const footerText = {
  fontSize: '14px',
  lineHeight: '1.4',
  color: '#6b7280',
  padding: '0 24px',
  margin: '0',
  textAlign: 'center' as const,
};