import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
  Section,
  Button,
} from 'npm:@react-email/components@0.0.22';
import * as React from 'npm:react@18.3.1';

interface PremiumGracePeriodProps {
  userName: string;
  expirationDate: string;
}

export const PremiumGracePeriodES = ({
  userName,
  expirationDate,
}: PremiumGracePeriodProps) => (
  <Html>
    <Head />
    <Preview>Tu acceso premium expiró - Datos seguros por 90 días</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>🛡️ Período de Gracia - Tus Datos Están Seguros</Heading>
        
        <Text style={text}>Hola {userName},</Text>
        
        <Text style={text}>
          Tu acceso premium expiró el {new Date(expirationDate).toLocaleDateString('es-ES')}, ¡pero tenemos buenas noticias para ti!
        </Text>

        <Section style={infoBox}>
          <Text style={infoTitle}>
            🛡️ <strong>¡Tus datos están completamente seguros!</strong>
          </Text>
          <Text style={infoText}>
            Mantendremos toda tu información financiera, historial de transacciones y configuraciones <strong>almacenadas de forma segura por 90 días</strong> desde la fecha de expiración.
          </Text>
        </Section>

        <Text style={text}>
          <strong>Esto significa que tienes hasta el {new Date(new Date(expirationDate).getTime() + 90 * 24 * 60 * 60 * 1000).toLocaleDateString('es-ES')} para renovar</strong> y recuperar todo tu historial sin perder nada!
        </Text>

        <Section style={benefitsBox}>
          <Text style={benefitsTitle}>🎯 Al renovar, recuperas inmediatamente:</Text>
          <ul style={benefitsList}>
            <li>Todo tu historial financiero</li>
            <li>Análisis e informes personalizados</li>
            <li>Configuraciones de pareja</li>
            <li>Metas y objetivos financieros</li>
            <li>Categorías personalizadas</li>
            <li>Todos los datos de inversiones</li>
          </ul>
        </Section>

        <Text style={text}>
          Durante este período de gracia, puedes renovar tu acceso premium en cualquier momento y continuar donde lo dejaste, como si nada hubiera pasado.
        </Text>

        <Section style={buttonContainer}>
          <Button style={button} href="https://app.example.com/subscription">
            💎 Recuperar Acceso Premium
          </Button>
        </Section>

        <Section style={urgentBox}>
          <Text style={urgentTitle}>⏰ <strong>Importante:</strong></Text>
          <Text style={urgentText}>
            Después de 90 días (el {new Date(new Date(expirationDate).getTime() + 90 * 24 * 60 * 60 * 1000).toLocaleDateString('es-ES')}), tus datos serán eliminados permanentemente de nuestro sistema por razones de privacidad y cumplimiento.
          </Text>
        </Section>

        <Text style={text}>
          <strong>¿Tienes dudas o necesitas ayuda para renovar?</strong> Nuestro equipo está listo para asistirte en el proceso. ¡Contáctanos!
        </Text>

        <Text style={footerText}>
          ¡Valoramos mucho tu confianza en nuestro sistema y esperamos tenerte de vuelta pronto!
        </Text>

        <Text style={signature}>
          Con esperanza de reencuentro,<br />
          <strong>Equipo Couples Financials</strong>
        </Text>
      </Container>
    </Body>
  </Html>
);

export default PremiumGracePeriodES;

const main = {
  backgroundColor: '#f0f9ff',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  border: '2px solid #0ea5e9',
};

const h1 = {
  color: '#0ea5e9',
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

const infoBox = {
  backgroundColor: '#f0fdf4',
  border: '2px solid #16a34a',
  borderRadius: '8px',
  margin: '24px 40px',
  padding: '20px',
};

const infoTitle = {
  color: '#166534',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0 0 12px 0',
  textAlign: 'center' as const,
};

const infoText = {
  color: '#166534',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0',
  textAlign: 'center' as const,
};

const benefitsBox = {
  backgroundColor: '#fefce8',
  border: '2px solid #eab308',
  borderRadius: '8px',
  margin: '24px 40px',
  padding: '20px',
};

const benefitsTitle = {
  color: '#a16207',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '0 0 12px 0',
};

const benefitsList = {
  color: '#a16207',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '0',
  paddingLeft: '20px',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#0ea5e9',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 28px',
  border: 'none',
  boxShadow: '0 4px 8px rgba(14, 165, 233, 0.3)',
};

const urgentBox = {
  backgroundColor: '#fef3c7',
  border: '2px solid #f59e0b',
  borderRadius: '8px',
  margin: '24px 40px',
  padding: '16px',
};

const urgentTitle = {
  color: '#92400e',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '0 0 8px 0',
};

const urgentText = {
  color: '#92400e',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '0',
};

const footerText = {
  color: '#0ea5e9',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '32px 0 16px 0',
  padding: '0 40px',
  fontWeight: '600',
  textAlign: 'center' as const,
};

const signature = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '16px 0',
  padding: '0 40px',
  textAlign: 'center' as const,
};