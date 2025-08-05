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
} from 'npm:@react-email/components@0.0.22';
import * as React from 'npm:react@18.3.1';

interface EmailConfirmationProps {
  userEmail: string;
  loginUrl: string;
}

export const EmailConfirmationEN = ({
  userEmail = 'user@example.com',
  loginUrl = 'https://app.example.com/auth'
}: EmailConfirmationProps) => (
  <Html>
    <Head />
    <Preview>🎉 Welcome to Couples Financials! Your account has been successfully confirmed</Preview>
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
          <Heading style={h1}>Account Confirmed! 🎉</Heading>
          <Text style={tagline}>Financial Management for Couples</Text>
        </Section>

        <Hr style={hr} />

        <Section style={content}>
          <Text style={greeting}>
            Hello! 👋
          </Text>
          
          <Text style={paragraph}>
            <strong>Congratulations!</strong> Your account has been successfully confirmed! 🚀
          </Text>

          <Text style={paragraph}>
            We're so excited to have you with us at <strong>Couples Financials</strong>! 💕 
            Now you can start transforming your relationship's financial management in a fun and efficient way.
          </Text>

          <Section style={buttonContainer}>
            <Link href={loginUrl} style={button}>
              🔓 Login Now
            </Link>
          </Section>

          <Text style={paragraph}>
            Or copy and paste this link in your browser:
          </Text>
          <Text style={linkText}>{loginUrl}</Text>

          <Hr style={hr} />

          <Section style={features}>
            <Heading style={h2}>What you can do now: ✨</Heading>
            <Text style={featureItem}>💰 Track expenses and income together</Text>
            <Text style={featureItem}>💳 Manage cards and accounts</Text>
            <Text style={featureItem}>📊 View financial reports</Text>
            <Text style={featureItem}>🎯 Set and track goals</Text>
            <Text style={featureItem}>✈️ Miles and rewards system</Text>
          </Section>

          <Hr style={hr} />

          <Text style={footer}>
            🤝 <strong>Tip:</strong> Invite your partner to manage finances together!
          </Text>

          <Text style={footer}>
            With love,<br />
            <strong>Couples Financials Team</strong> 💙
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
  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
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

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#6366f1',
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
  color: '#8b5cf6',
  fontSize: '14px',
  textDecoration: 'underline',
  wordBreak: 'break-all' as const,
  margin: '8px 0 16px',
};

const features = {
  margin: '24px 0',
};

const featureItem = {
  color: '#cbd5e1',
  fontSize: '15px',
  margin: '8px 0',
  lineHeight: '20px',
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
};

export default EmailConfirmationEN;