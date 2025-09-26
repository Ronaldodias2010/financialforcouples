import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
  Button,
  Hr,
  Img,
} from 'https://esm.sh/@react-email/components@0.0.22';
import * as React from 'npm:react@18.3.1';

interface PaymentReminderESProps {
  userName: string;
  customerPortalUrl: string;
  daysRemaining: number;
}

export const PaymentReminderES = ({ userName, customerPortalUrl, daysRemaining }: PaymentReminderESProps) => (
  <Html>
    <Head />
    <Preview>{daysRemaining === 3 ? 'Tu suscripción premium se renueva en 3 días' : 'Tu suscripción premium se renueva mañana'}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoContainer}>
          <Img
            src="https://app.couplesfinancials.com/lovable-uploads/1f5e0469-b056-4cf9-9583-919702fa8736.png"
            width="120"
            height="40"
            alt="Couples Financials"
            style={logo}
          />
        </Section>
        
        <Heading style={h1}>⏰ Recordatorio de Renovación</Heading>
        
        <Text style={text}>¡Hola, {userName}!</Text>
        
        <Text style={text}>
          Tu suscripción premium de Couples Financials se renovará en{' '}
          <strong>{daysRemaining === 3 ? '3 días' : 'mañana'}</strong>.
        </Text>

        <Section style={infoBox}>
          <Text style={infoText}>
            ✅ ¡Todo está en orden! Tu facturación se procesará automáticamente.
          </Text>
        </Section>

        <Text style={text}>
          <strong>Continúa disfrutando de tus beneficios premium:</strong>
        </Text>
        
        <Text style={benefitsList}>
          🎤 <strong>Entrada por voz:</strong> Añade transacciones hablando<br />
          🤖 <strong>IA Financiera:</strong> Consultoría personalizada<br />
          📊 <strong>Análisis Avanzados:</strong> Reportes detallados<br />
          🏆 <strong>Metas de Millas:</strong> Maximiza tus puntos<br />
          💰 <strong>Metas de Inversión:</strong> Alcanza tus objetivos<br />
          🚀 <strong>Soporte Prioritario:</strong> Atención exclusiva
        </Text>

        <Section style={buttonContainer}>
          <Button style={button} href={customerPortalUrl}>
            Gestionar Suscripción
          </Button>
        </Section>

        <Hr style={hr} />

        <Text style={text}>
          ¿Necesitas algo? Asegúrate de que tus datos de pago estén actualizados para evitar cualquier interrupción en tu acceso premium.
        </Text>

        <Text style={footer}>
          ¿Alguna pregunta? Contáctanos en{' '}
          <Link href="mailto:support@couplesfinancials.com" style={link}>
            support@couplesfinancials.com
          </Link>
        </Text>
      </Container>
    </Body>
  </Html>
);

const main = {
  backgroundColor: '#0f0f23',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  maxWidth: '580px',
};

const logoContainer = {
  textAlign: 'center' as const,
  marginBottom: '32px',
};

const logo = {
  margin: '0 auto',
};

const h1 = {
  color: '#ffffff',
  fontSize: '28px',
  fontWeight: 'bold',
  textAlign: 'center' as const,
  margin: '30px 0',
};

const text = {
  color: '#ffffff',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '16px 0',
};

const infoBox = {
  backgroundColor: '#10B981',
  borderRadius: '8px',
  padding: '16px',
  margin: '24px 0',
};

const infoText = {
  color: '#000000',
  fontSize: '16px',
  fontWeight: '500',
  margin: '0',
  textAlign: 'center' as const,
};

const benefitsList = {
  color: '#d1d5db',
  fontSize: '15px',
  lineHeight: '28px',
  margin: '20px 0',
  paddingLeft: '8px',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#F59E0B',
  borderRadius: '8px',
  color: '#000000',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '16px 32px',
  margin: '0 auto',
  maxWidth: '200px',
};

const hr = {
  borderColor: '#374151',
  margin: '32px 0',
};

const link = {
  color: '#F59E0B',
  textDecoration: 'underline',
};

const footer = {
  color: '#9CA3AF',
  fontSize: '12px',
  lineHeight: '22px',
  marginTop: '32px',
  textAlign: 'center' as const,
};

export default PaymentReminderES;