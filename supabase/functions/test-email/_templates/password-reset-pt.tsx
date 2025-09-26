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
  Img,
  Hr,
  Row,
  Column,
} from 'https://esm.sh/@react-email/components@0.0.22';
import * as React from 'https://esm.sh/react@18.3.1';

interface PasswordResetProps {
  userEmail: string;
  resetUrl: string;
}

export const PasswordResetPT = ({
  userEmail = 'usuario@exemplo.com',
  resetUrl = 'https://app.exemplo.com/reset-password'
}: PasswordResetProps) => (
  <Html>
    <Head />
    <Preview>🔐 Redefinir senha - Couples Financials</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Img
            src="https://i.imgur.com/q9tQzXH.png"
            width="80"
            height="80"
            alt="Couples Financials"
            style={logo}
          />
          <Heading style={h1}>Redefinir Senha 🔐</Heading>
          <Text style={tagline}>Gestão Financeira para Casais</Text>
        </Section>

        <Hr style={hr} />

        <Section style={content}>
          <Text style={greeting}>
            Olá! 👋
          </Text>
          
          <Text style={paragraph}>
            Recebemos uma solicitação para redefinir a senha da sua conta no <strong>Couples Financials</strong>. 
          </Text>

          <Text style={paragraph}>
            Não se preocupe, isso acontece com todos nós! 😅 Vamos resolver isso rapidinho! 
          </Text>

          <Section style={alertBox}>
            <Text style={alertText}>
              🚨 <strong>Importante:</strong> Este link expira em 1 hora por segurança!
            </Text>
          </Section>

          <Section style={buttonContainer}>
            <Link href={resetUrl} style={button}>
              🔑 Redefinir Minha Senha
            </Link>
          </Section>

          <Text style={paragraph}>
            Ou copie e cole este link no seu navegador:
          </Text>
          <Text style={linkText}>{resetUrl}</Text>

          <Hr style={hr} />

          <Section style={securityTips}>
            <Heading style={h2}>Dicas de Segurança 🛡️</Heading>
            <Text style={tipItem}>🔐 Use uma senha forte com letras, números e símbolos</Text>
            <Text style={tipItem}>🔄 Não reutilize senhas de outras contas</Text>
            <Text style={tipItem}>📱 Considere usar um gerenciador de senhas</Text>
            <Text style={tipItem}>🚫 Nunca compartilhe suas credenciais</Text>
          </Section>

          <Hr style={hr} />

          <Section style={helpSection}>
            <Text style={helpText}>
              🤔 <strong>Não solicitou esta alteração?</strong>
            </Text>
            <Text style={helpText}>
              Se você não solicitou a redefinição de senha, pode ignorar este email com segurança. 
              Sua conta permanece protegida! 
            </Text>
            <Text style={helpText}>
              Mas se suspeitar de atividade suspeita, entre em contato conosco imediatamente.
            </Text>
          </Section>

          <Text style={footer}>
            💙 <strong>Cuidamos da sua segurança!</strong><br />
            <strong>Equipe Couples Financials</strong>
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

// Styles
const main = {
  backgroundColor: '#0a0a0a',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  maxWidth: '600px',
};

const header = {
  textAlign: 'center' as const,
  padding: '32px 0',
};

const logo = {
  margin: '0 auto 16px',
  borderRadius: '12px',
};

const h1 = {
  color: '#ffffff',
  fontSize: '32px',
  fontWeight: 'bold',
  textAlign: 'center' as const,
  margin: '16px 0 8px',
  background: 'linear-gradient(135deg, #ef4444, #f97316)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
};

const h2 = {
  color: '#ffffff',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '24px 0 16px',
};

const tagline = {
  color: '#94a3b8',
  fontSize: '16px',
  textAlign: 'center' as const,
  margin: '0 0 24px',
  fontWeight: '500',
};

const content = {
  backgroundColor: '#1a1a1a',
  borderRadius: '12px',
  padding: '32px',
  border: '1px solid #333333',
};

const greeting = {
  color: '#ffffff',
  fontSize: '18px',
  margin: '0 0 16px',
};

const paragraph = {
  color: '#e2e8f0',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '16px 0',
};

const alertBox = {
  backgroundColor: '#451a03',
  border: '1px solid #f97316',
  borderRadius: '8px',
  padding: '16px',
  margin: '24px 0',
};

const alertText = {
  color: '#fed7aa',
  fontSize: '15px',
  margin: '0',
  textAlign: 'center' as const,
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#ef4444',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '16px 32px',
  transition: 'all 0.2s ease',
};

const linkText = {
  color: '#f97316',
  fontSize: '14px',
  textDecoration: 'underline',
  wordBreak: 'break-all' as const,
  margin: '8px 0 16px',
};

const securityTips = {
  margin: '24px 0',
};

const tipItem = {
  color: '#cbd5e1',
  fontSize: '15px',
  margin: '8px 0',
  lineHeight: '20px',
};

const helpSection = {
  backgroundColor: '#1e1b4b',
  border: '1px solid #6366f1',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 0',
};

const helpText = {
  color: '#e0e7ff',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '8px 0',
};

const hr = {
  borderColor: '#333333',
  margin: '24px 0',
};

const footer = {
  color: '#94a3b8',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '16px 0',
  textAlign: 'center' as const,
};

export default PasswordResetPT;