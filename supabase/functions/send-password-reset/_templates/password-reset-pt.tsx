import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
  Img,
  Hr,
  Section,
  Row,
  Column,
} from 'https://esm.sh/@react-email/components@0.0.22'
import * as React from 'https://esm.sh/react@18.3.1'

interface PasswordResetProps {
  userEmail: string;
  resetUrl: string;
}

export const PasswordResetPT = ({
  userEmail,
  resetUrl,
}: PasswordResetProps) => (
  <Html>
    <Head />
    <Preview>🔐 Redefinir sua senha do Couples Financials</Preview>
    <Body style={main}>
      <Container style={container}>
        {/* Header with Logo */}
        <Section style={header}>
          <Row>
            <Column align="center">
              <Img
                src="https://couplesfinancials.com/lovable-uploads/couples-financials-logo-new.png"
                width="140"
                height="140"
                alt="Couples Financials Logo"
                style={logo}
              />
            </Column>
          </Row>
          <Row>
            <Column align="center">
              <Heading style={h1}>Couples Financials</Heading>
            </Column>
          </Row>
        </Section>

        {/* Main Content */}
        <Section style={content}>
          <Heading style={h2}>🔐 Redefinir Senha</Heading>
          <Text style={paragraph}>
            Olá! Recebemos uma solicitação para redefinir a senha da sua conta do Couples Financials.
          </Text>
          
          <Text style={paragraph}>
            <strong>Conta solicitante:</strong> {userEmail}
          </Text>

          <Section style={buttonContainer}>
            <Link href={resetUrl} style={button}>
              Redefinir Senha
            </Link>
          </Section>

          <Hr style={hr} />

          <Text style={subheading}>🔒 Dicas de Segurança:</Text>
          <ul style={list}>
            <li style={listItem}>Este link expira em 24 horas</li>
            <li style={listItem}>Use uma senha forte e única</li>
            <li style={listItem}>Não compartilhe sua nova senha</li>
            <li style={listItem}>Consider usar um gerenciador de senhas</li>
          </ul>

          <Hr style={hr} />

          <Text style={alertText}>
            <strong>⚠️ Não solicitou esta alteração?</strong><br />
            Se você não solicitou a redefinição de senha, pode ignorar este email com segurança. 
            Sua senha não será alterada. Para maior segurança, entre em contato conosco se 
            continuar recebendo estes emails.
          </Text>
        </Section>

        {/* Footer */}
        <Section style={footer}>
          <Text style={footerText}>
            Este email foi enviado automaticamente. Não responda a este email.
          </Text>
          <Text style={footerText}>
            © 2024 Couples Financials. Todos os direitos reservados.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

// Styles
const main = {
  backgroundColor: '#1a1a1a',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
  backgroundColor: '#1a1a1a',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
}

const header = {
  padding: '32px 0',
}

const logo = {
  borderRadius: '16px',
}

const h1 = {
  color: '#ffffff',
  fontSize: '28px',
  fontWeight: '700',
  margin: '16px 0 0 0',
  textAlign: 'center' as const,
}

const h2 = {
  color: '#ffffff',
  fontSize: '24px',
  fontWeight: '600',
  margin: '32px 0 16px 0',
  textAlign: 'center' as const,
}

const content = {
  backgroundColor: '#262626',
  border: '1px solid #404040',
  borderRadius: '12px',
  padding: '32px',
  margin: '16px 0',
}

const paragraph = {
  color: '#e5e5e5',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '16px 0',
}

const subheading = {
  color: '#ffffff',
  fontSize: '18px',
  fontWeight: '600',
  margin: '24px 0 16px 0',
}

const list = {
  color: '#e5e5e5',
  fontSize: '16px',
  lineHeight: '1.6',
  paddingLeft: '20px',
}

const listItem = {
  margin: '8px 0',
}

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
}

const button = {
  backgroundColor: '#dc2626',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 32px',
  border: 'none',
  cursor: 'pointer',
}

const hr = {
  borderColor: '#404040',
  margin: '32px 0',
}

const alertText = {
  backgroundColor: '#422006',
  border: '1px solid #d97706',
  borderRadius: '8px',
  color: '#fbbf24',
  fontSize: '14px',
  lineHeight: '1.5',
  padding: '16px',
  margin: '16px 0',
}

const footer = {
  padding: '32px 0 0 0',
  textAlign: 'center' as const,
}

const footerText = {
  color: '#a3a3a3',
  fontSize: '14px',
  lineHeight: '1.5',
  margin: '8px 0',
}

export default PasswordResetPT;