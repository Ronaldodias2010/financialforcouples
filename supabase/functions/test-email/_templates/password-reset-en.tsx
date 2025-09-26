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

export const PasswordResetEN = ({
  userEmail = 'user@example.com',
  resetUrl = 'https://app.example.com/reset-password'
}: PasswordResetProps) => (
  <Html>
    <Head />
    <Preview>🔐 Password Reset - Couples Financials</Preview>
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
          <Heading style={h1}>Password Reset 🔐</Heading>
          <Text style={tagline}>Financial Management for Couples</Text>
        </Section>

        <Hr style={hr} />

        <Section style={content}>
          <Text style={greeting}>
            Hello! 👋
          </Text>
          
          <Text style={paragraph}>
            We received a request to reset your password for your <strong>Couples Financials</strong> account.
          </Text>

          <Text style={paragraph}>
            Don't worry, this happens to all of us! 😅 Let's get this sorted out quickly!
          </Text>

          <Section style={alertBox}>
            <Text style={alertText}>
              🚨 <strong>Important:</strong> This link expires in 1 hour for security!
            </Text>
          </Section>

          <Section style={buttonContainer}>
            <Link href={resetUrl} style={button}>
              🔑 Reset My Password
            </Link>
          </Section>

          <Text style={paragraph}>
            Or copy and paste this link in your browser:
          </Text>
          <Text style={linkText}>{resetUrl}</Text>

          <Hr style={hr} />

          <Section style={securityTips}>
            <Heading style={h2}>Security Tips 🛡️</Heading>
            <Text style={tipItem}>🔐 Use a strong password with letters, numbers, and symbols</Text>
            <Text style={tipItem}>🔄 Don't reuse passwords from other accounts</Text>
            <Text style={tipItem}>📱 Consider using a password manager</Text>
            <Text style={tipItem}>🚫 Never share your credentials</Text>
          </Section>

          <Hr style={hr} />

          <Section style={helpSection}>
            <Text style={helpText}>
              🤔 <strong>Didn't request this change?</strong>
            </Text>
            <Text style={helpText}>
              If you didn't request a password reset, you can safely ignore this email. 
              Your account remains secure!
            </Text>
            <Text style={helpText}>
              But if you suspect suspicious activity, please contact us immediately.
            </Text>
          </Section>

          <Text style={footer}>
            💙 <strong>We care about your security!</strong><br />
            <strong>Couples Financials Team</strong>
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

export default PasswordResetEN;