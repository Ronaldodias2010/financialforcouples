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
import * as React from 'https://esm.sh/react@18.3.1';

interface PaymentGracePeriodESProps {
  userName: string;
  customerPortalUrl: string;
}

export const PaymentGracePeriodES = ({ userName, customerPortalUrl }: PaymentGracePeriodESProps) => (
  <Html>
    <Head />
    <Preview>Período de gracia de 24h - Tus datos están seguros</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoContainer}>
          <Img
            src="https://couplesfinancials.com/lovable-uploads/couples-financials-logo-new.png"
            width="120"
            height="40"
            alt="Couples Financials"
            style={logo}
          />
        </Section>
        
        <Heading style={h1}>⚠️ Período de Gracia Activado</Heading>
        
        <Text style={text}>¡Hola, {userName}!</Text>
        
        <Text style={text}>
          Tu acceso premium ha sido temporalmente suspendido debido al fallo en el pago, pero tenemos buenas noticias:
        </Text>

        <Section style={safetyBox}>
          <Text style={safetyText}>
            🛡️ <strong>¡Tus datos están 100% seguros!</strong><br />
            Mantenemos toda tu información financiera protegida por 90 días.
          </Text>
        </Section>

        <Text style={text}>
          <strong>¿Qué pasa ahora?</strong>
        </Text>
        
        <Text style={timelineText}>
          ⏰ <strong>Próximas 24 horas:</strong> Tiempo para resolver el pago<br />
          🔒 <strong>Después de 24h:</strong> Acceso cambiado al plan Essential<br />
          🛡️ <strong>Próximos 90 días:</strong> Tus datos permanecen seguros<br />
          ✅ <strong>Pago resuelto:</strong> Acceso premium restaurado inmediatamente
        </Text>

        <Section style={buttonContainer}>
          <Button style={button} href={customerPortalUrl}>
            Resolver Pago Ahora
          </Button>
        </Section>

        <Text style={text}>
          <strong>Qué puedes hacer aún en el plan Essential:</strong>
        </Text>
        
        <Text style={essentialList}>
          ✅ Añadir transacciones manualmente<br />
          ✅ Ver reportes básicos<br />
          ✅ Gestionar categorías<br />
          ✅ Acceder a tus datos históricos
        </Text>

        <Hr style={hr} />

        <Section style={urgencyBox}>
          <Text style={urgencyText}>
            🚨 <strong>Acción recomendada:</strong><br />
            Resuelve el pago en las próximas 24h para mantener todos tus beneficios premium activos.
          </Text>
        </Section>

        <Text style={footer}>
          ¿Necesitas ayuda? Nuestro equipo está aquí para ti en{' '}
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

const safetyBox = {
  backgroundColor: '#10B981',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 0',
  textAlign: 'center' as const,
};

const safetyText = {
  color: '#000000',
  fontSize: '16px',
  fontWeight: '500',
  margin: '0',
};

const timelineText = {
  color: '#d1d5db',
  fontSize: '15px',
  lineHeight: '28px',
  margin: '20px 0',
  paddingLeft: '8px',
};

const essentialList = {
  color: '#d1d5db',
  fontSize: '15px',
  lineHeight: '24px',
  margin: '16px 0',
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
  maxWidth: '250px',
};

const urgencyBox = {
  backgroundColor: '#F59E0B',
  borderRadius: '8px',
  padding: '16px',
  margin: '24px 0',
  textAlign: 'center' as const,
};

const urgencyText = {
  color: '#000000',
  fontSize: '15px',
  fontWeight: '500',
  margin: '0',
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

export default PaymentGracePeriodES;