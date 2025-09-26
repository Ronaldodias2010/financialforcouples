import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
  Section,
  Button,
} from 'https://esm.sh/@react-email/components@0.0.22';
import * as React from 'https://esm.sh/react@18.3.1';

interface PremiumExpirationWarningProps {
  userName: string;
  expirationDate: string;
  daysRemaining: number;
}

export const PremiumExpirationWarningES = ({
  userName,
  expirationDate,
  daysRemaining,
}: PremiumExpirationWarningProps) => (
  <Html>
    <Head />
    <Preview>Tu acceso premium expira en {daysRemaining} día(s)</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>⏰ Aviso de Expiración Premium</Heading>
        
        <Text style={text}>Hola {userName},</Text>
        
        <Text style={text}>
          ¡Esperamos que hayas estado disfrutando todas las funciones premium de nuestro sistema financiero para parejas!
        </Text>

        <Section style={warningBox}>
          <Text style={warningText}>
            🚨 <strong>Tu acceso premium expira en {daysRemaining} día(s)</strong>
          </Text>
          <Text style={warningSubtext}>
            Fecha de expiración: {new Date(expirationDate).toLocaleDateString('es-ES')}
          </Text>
        </Section>

        <Text style={text}>
          Para continuar disfrutando todas las funciones premium, incluyendo:
        </Text>

        <ul style={list}>
          <li>Análisis financieros avanzados</li>
          <li>Informes detallados</li>
          <li>Sincronización entre parejas</li>
          <li>Soporte prioritario</li>
        </ul>

        <Text style={text}>
          <strong>Realiza el pago antes de la expiración</strong> para mantener tu acceso activo.
        </Text>

        <Section style={buttonContainer}>
          <Button style={button} href="https://app.example.com/subscription">
            💳 Renovar Premium Ahora
          </Button>
        </Section>

        <Section style={infoBox}>
          <Text style={infoText}>
            <strong>💡 ¡No te preocupes!</strong><br />
            Si no puedes renovar inmediatamente, tus datos permanecen seguros y almacenados por <strong>90 días</strong> después de la expiración, facilitando la renovación cuando sea posible.
          </Text>
        </Section>

        <Text style={footerText}>
          Si tienes alguna pregunta o necesitas ayuda, no dudes en contactarnos.
        </Text>

        <Text style={signature}>
          Saludos cordiales,<br />
          <strong>Equipo Couples Financials</strong>
        </Text>
      </Container>
    </Body>
  </Html>
);

export default PremiumExpirationWarningES;

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
};

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  textAlign: 'center' as const,
  margin: '30px 0',
};

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '16px 0',
  padding: '0 40px',
};

const warningBox = {
  backgroundColor: '#fef3c7',
  border: '2px solid #f59e0b',
  borderRadius: '8px',
  margin: '24px 40px',
  padding: '20px',
  textAlign: 'center' as const,
};

const warningText = {
  color: '#92400e',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0 0 8px 0',
};

const warningSubtext = {
  color: '#92400e',
  fontSize: '14px',
  margin: '0',
};

const list = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '16px 0',
  padding: '0 40px',
  paddingLeft: '60px',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#4f46e5',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 28px',
  border: 'none',
};

const infoBox = {
  backgroundColor: '#eff6ff',
  border: '1px solid #3b82f6',
  borderRadius: '8px',
  margin: '24px 40px',
  padding: '16px',
};

const infoText = {
  color: '#1e40af',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '0',
};

const footerText = {
  color: '#666',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '32px 0 16px 0',
  padding: '0 40px',
};

const signature = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '16px 0',
  padding: '0 40px',
};