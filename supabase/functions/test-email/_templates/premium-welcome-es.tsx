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

export const PremiumWelcomeEmailES: React.FC<PremiumWelcomeEmailProps> = ({
  user_email,
  user_name,
  subscription_end,
  login_url = "https://www.couplesfinancials.com/auth"
}) => {
  const endDate = new Date(subscription_end);
  const formattedEndDate = endDate.toLocaleDateString('es-ES');

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
            🎉 ¡Bienvenido a Couples Financials Premium!
          </Heading>
          
          <Text style={text}>
            ¡Hola <strong>{user_name}</strong>!
          </Text>
          
          <Text style={text}>
            ¡Felicidades! Tu suscripción Premium de Couples Financials ha sido activada exitosamente. 
            Ahora tienes acceso completo a todas las funcionalidades premium de nuestra plataforma.
          </Text>
          
          <Section style={featuresSection}>
            <Heading style={featuresHeading}>✨ Tus Beneficios Premium:</Heading>
            <Text style={featureText}>💰 Sistema completo de gestión financiera para parejas</Text>
            <Text style={featureText}>📊 Reportes avanzados e insights de gastos</Text>
            <Text style={featureText}>🤖 Consultoría financiera personalizada con IA</Text>
            <Text style={featureText}>✈️ Sistema de millaje y promociones exclusivas</Text>
            <Text style={featureText}>💳 Control completo de tarjetas y cuentas</Text>
            <Text style={featureText}>📈 Dashboard avanzado de inversiones</Text>
            <Text style={featureText}>🎯 Metas financieras y planificación</Text>
          </Section>
          
          <Text style={text}>
            <strong>Tu suscripción Premium es válida hasta:</strong> {formattedEndDate}
          </Text>
          
          <Section style={buttonSection}>
            <Button pX={20} pY={12} style={button} href={login_url}>
              🚀 Comenzar a Usar Ahora
            </Button>
          </Section>
          
          <Hr style={hr} />
          
          <Text style={helpText}>
            <strong>¿Necesitas ayuda?</strong><br />
            Nuestro equipo está siempre disponible para ayudarte a aprovechar al máximo 
            tu experiencia premium. Contáctanos a través del soporte dentro de la plataforma 
            o por email contato@couplesfinancials.com.
          </Text>
          
          <Text style={footerText}>
            ¡Gracias por elegir Couples Financials Premium!<br />
            <strong>Equipo Couples Financials</strong>
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