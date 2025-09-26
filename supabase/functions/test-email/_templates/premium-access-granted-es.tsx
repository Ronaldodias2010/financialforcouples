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

interface PremiumAccessGrantedEmailProps {
  user_email: string;
  start_date: string;
  end_date: string;
  temp_password: string;
  login_url: string;
  days_duration: number;
}

export const PremiumAccessGrantedEmailES: React.FC<PremiumAccessGrantedEmailProps> = ({
  user_email,
  start_date,
  end_date,
  temp_password,
  login_url = "https://www.couplesfinancials.com/auth",
  days_duration
}) => {
  const startDate = new Date(start_date);
  const endDate = new Date(end_date);
  const formattedStartDate = startDate.toLocaleDateString('es-ES');
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
            🎁 ¡Acceso Premium Concedido!
          </Heading>
          
          <Text style={text}>
            ¡Buenas noticias! El administrador de Couples Financials te ha concedido acceso premium gratuito a nuestra plataforma.
          </Text>
          
          <Section style={accessInfoSection}>
            <Heading style={accessInfoHeading}>📋 Detalles de tu Acceso Premium:</Heading>
            
            <Text style={accessInfoText}>
              <strong>📧 Email:</strong> {user_email}
            </Text>
            
            <Text style={accessInfoText}>
              <strong>🔑 Contraseña Temporal:</strong> <span style={passwordStyle}>{temp_password}</span>
            </Text>
            
            <Text style={accessInfoText}>
              <strong>📅 Período de Acceso:</strong> {formattedStartDate} hasta {formattedEndDate}
            </Text>
            
            <Text style={accessInfoText}>
              <strong>⏰ Duración:</strong> {days_duration} días de acceso completo
            </Text>
          </Section>
          
          <Section style={featuresSection}>
            <Heading style={featuresHeading}>✨ Lo que puedes hacer con Premium:</Heading>
            <Text style={featureText}>💰 Sistema completo de gestión financiera para parejas</Text>
            <Text style={featureText}>📊 Reportes avanzados e insights de gastos</Text>
            <Text style={featureText}>🤖 Consultoría financiera personalizada con IA</Text>
            <Text style={featureText}>✈️ Sistema de millaje y promociones exclusivas</Text>
            <Text style={featureText}>💳 Control completo de tarjetas y cuentas</Text>
            <Text style={featureText}>📈 Dashboard avanzado de inversiones</Text>
            <Text style={featureText}>🎯 Metas financieras y planificación</Text>
          </Section>
          
          <Section style={buttonSection}>
            <Button style={button} href={login_url}>
              🚀 Acceder a Mi Cuenta Premium
            </Button>
          </Section>
          
          <Hr style={hr} />
          
          <Text style={importantText}>
            <strong>🔐 Importante:</strong> Por favor cambia tu contraseña temporal después del primer inicio de sesión para mantener tu cuenta segura.
          </Text>
          
          <Text style={helpText}>
            <strong>¿Necesitas ayuda?</strong><br />
            Nuestro equipo está siempre disponible para ayudarte. Contáctanos a través del 
            soporte dentro de la plataforma o por email contato@couplesfinancials.com.
          </Text>
          
          <Text style={footerText}>
            ¡Disfruta tu experiencia premium!<br />
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

const accessInfoSection = {
  padding: '24px',
  backgroundColor: '#f0f9ff',
  margin: '24px',
  borderRadius: '8px',
  border: '1px solid #0ea5e9',
};

const accessInfoHeading = {
  fontSize: '20px',
  fontWeight: '600',
  color: '#0369a1',
  margin: '0 0 16px',
};

const accessInfoText = {
  fontSize: '15px',
  lineHeight: '1.4',
  color: '#0369a1',
  margin: '8px 0',
};

const passwordStyle = {
  backgroundColor: '#fee2e2',
  padding: '4px 8px',
  borderRadius: '4px',
  fontFamily: 'monospace',
  fontWeight: 'bold',
  color: '#dc2626',
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

const importantText = {
  fontSize: '14px',
  lineHeight: '1.4',
  color: '#dc2626',
  padding: '16px 24px',
  backgroundColor: '#fef2f2',
  margin: '0 24px 16px',
  borderRadius: '6px',
  border: '1px solid #fecaca',
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