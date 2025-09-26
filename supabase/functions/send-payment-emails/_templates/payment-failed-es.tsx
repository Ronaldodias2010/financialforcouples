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

interface PaymentFailedESProps {
  userName: string;
  customerPortalUrl: string;
}

export const PaymentFailedES = ({ userName, customerPortalUrl }: PaymentFailedESProps) => (
  <Html>
    <Head />
    <Preview>Pago fallido - Actualiza tu método de pago</Preview>
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
        
        <Heading style={h1}>🚨 Pago Fallido</Heading>
        
        <Text style={text}>¡Hola, {userName}!</Text>
        
        <Text style={text}>
          Intentamos procesar el pago de tu suscripción premium, pero desafortunadamente no pudimos completar la transacción.
        </Text>

        <Section style={warningBox}>
          <Text style={warningText}>
            ⚠️ <strong>Acción requerida:</strong> Para mantener tu acceso premium, necesitas actualizar tu método de pago en las próximas 24 horas.
          </Text>
        </Section>

        <Text style={text}>
          <strong>¿Qué pasó?</strong><br />
          Esto pudo haber ocurrido por varios motivos:
        </Text>
        
        <Text style={bulletList}>
          • Tarjeta de crédito expirada<br />
          • Información de facturación desactualizada<br />
          • Límite insuficiente<br />
          • Problema temporal con el banco
        </Text>

        <Section style={buttonContainer}>
          <Button style={button} href={customerPortalUrl}>
            Actualizar Método de Pago
          </Button>
        </Section>

        <Text style={text}>
          <strong>Tus beneficios premium:</strong>
        </Text>
        
        <Text style={benefitsList}>
          ✅ Entrada por voz<br />
          ✅ IA para Planificación Financiera<br />
          ✅ Análisis Avanzados<br />
          ✅ Soporte Prioritario<br />
          ✅ Metas de Millas e Inversiones
        </Text>

        <Hr style={hr} />

        <Text style={smallText}>
          Tienes <strong>24 horas</strong> para actualizar tu método de pago. Después de este período, tu acceso será cambiado al plan Essential, pero tus datos permanecerán seguros por 90 días.
        </Text>

        <Text style={footer}>
          ¿Necesitas ayuda? Contáctanos en{' '}
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

const warningBox = {
  backgroundColor: '#F59E0B',
  borderRadius: '8px',
  padding: '16px',
  margin: '24px 0',
};

const warningText = {
  color: '#000000',
  fontSize: '16px',
  fontWeight: '500',
  margin: '0',
  textAlign: 'center' as const,
};

const bulletList = {
  color: '#d1d5db',
  fontSize: '14px',
  lineHeight: '24px',
  margin: '16px 0',
  paddingLeft: '20px',
};

const benefitsList = {
  color: '#10B981',
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
  maxWidth: '280px',
};

const hr = {
  borderColor: '#374151',
  margin: '32px 0',
};

const link = {
  color: '#F59E0B',
  textDecoration: 'underline',
};

const smallText = {
  color: '#d1d5db',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '16px 0',
  textAlign: 'center' as const,
};

const footer = {
  color: '#9CA3AF',
  fontSize: '12px',
  lineHeight: '22px',
  marginTop: '32px',
  textAlign: 'center' as const,
};

export default PaymentFailedES;