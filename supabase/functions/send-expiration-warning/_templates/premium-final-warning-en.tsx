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
} from 'https://esm.sh/@react-email/components@0.0.22';
import * as React from 'https://esm.sh/react@18.3.1';

interface PremiumFinalWarningProps {
  userName: string;
  expirationDate: string;
}

export const PremiumFinalWarningEN = ({
  userName,
  expirationDate,
}: PremiumFinalWarningProps) => (
  <Html>
    <Head />
    <Preview>⚠️ LAST CHANCE: Your premium access expires tomorrow!</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>🚨 FINAL WARNING - Premium Expires Tomorrow!</Heading>
        
        <Text style={text}>Hello {userName},</Text>
        
        <Text style={text}>
          This is your <strong>final notice</strong> before your premium access expires.
        </Text>

        <Section style={urgentBox}>
          <Text style={urgentText}>
            ⚠️ <strong>YOUR PREMIUM ACCESS EXPIRES TOMORROW!</strong>
          </Text>
          <Text style={urgentSubtext}>
            Expiration date: {new Date(expirationDate).toLocaleDateString('en-US')}
          </Text>
          <Text style={urgentSubtext}>
            ⏰ Less than 24 hours remaining
          </Text>
        </Section>

        <Text style={text}>
          <strong>Act now to avoid losing:</strong>
        </Text>

        <ul style={list}>
          <li><strong>Complete financial analysis</strong> of your family budget</li>
          <li><strong>Personalized reports</strong> for smart financial decisions</li>
          <li><strong>Real-time synchronization</strong> between you and your partner</li>
          <li><strong>Priority support</strong> when you need it most</li>
          <li><strong>Advanced planning tools</strong> for financial success</li>
        </ul>

        <Section style={actionBox}>
          <Text style={actionText}>
            💡 <strong>Don't wait any longer!</strong>
          </Text>
          <Text style={actionSubtext}>
            Renew now with just a few clicks and keep all your financial planning progress.
          </Text>
        </Section>

        <Section style={buttonContainer}>
          <Button style={button} href="https://app.example.com/subscription">
            🚀 RENEW NOW - LAST CHANCE
          </Button>
        </Section>

        <Section style={infoBox}>
          <Text style={infoText}>
            <strong>🛡️ Your data is safe!</strong><br />
            Even if you can't renew today, your data remains protected for <strong>90 days</strong> to facilitate renewal when possible.
          </Text>
        </Section>

        <Text style={footerText}>
          <strong>Need help?</strong> Our team is ready to assist you. Contact us immediately!
        </Text>

        <Text style={signature}>
          Urgently,<br />
          <strong>Couples Financials Team</strong>
        </Text>
      </Container>
    </Body>
  </Html>
);

export default PremiumFinalWarningEN;

const main = {
  backgroundColor: '#fef2f2',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  border: '2px solid #dc2626',
};

const h1 = {
  color: '#dc2626',
  fontSize: '26px',
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

const urgentBox = {
  backgroundColor: '#fee2e2',
  border: '3px solid #dc2626',
  borderRadius: '8px',
  margin: '24px 40px',
  padding: '24px',
  textAlign: 'center' as const,
};

const urgentText = {
  color: '#dc2626',
  fontSize: '20px',
  fontWeight: 'bold',
  margin: '0 0 12px 0',
};

const urgentSubtext = {
  color: '#dc2626',
  fontSize: '16px',
  fontWeight: '600',
  margin: '4px 0',
};

const list = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '16px 0',
  padding: '0 40px',
  paddingLeft: '60px',
};

const actionBox = {
  backgroundColor: '#f0f9ff',
  border: '2px solid #0ea5e9',
  borderRadius: '8px',
  margin: '24px 40px',
  padding: '20px',
  textAlign: 'center' as const,
};

const actionText = {
  color: '#0c4a6e',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0 0 8px 0',
};

const actionSubtext = {
  color: '#0c4a6e',
  fontSize: '14px',
  margin: '0',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#dc2626',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '18px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '16px 32px',
  border: 'none',
  boxShadow: '0 4px 8px rgba(220, 38, 38, 0.3)',
};

const infoBox = {
  backgroundColor: '#f0fdf4',
  border: '1px solid #16a34a',
  borderRadius: '8px',
  margin: '24px 40px',
  padding: '16px',
};

const infoText = {
  color: '#166534',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '0',
};

const footerText = {
  color: '#dc2626',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '32px 0 16px 0',
  padding: '0 40px',
  fontWeight: '600',
};

const signature = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '16px 0',
  padding: '0 40px',
  fontWeight: '600',
};