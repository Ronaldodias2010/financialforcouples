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

export const PremiumExpirationWarningEN = ({
  userName,
  expirationDate,
  daysRemaining,
}: PremiumExpirationWarningProps) => (
  <Html>
    <Head />
    <Preview>Your premium access expires in {String(daysRemaining)} day(s)</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>⏰ Premium Expiration Notice</Heading>
        
        <Text style={text}>Hello {userName},</Text>
        
        <Text style={text}>
          We hope you've been enjoying all the premium features of our couples financial management system!
        </Text>

        <Section style={warningBox}>
          <Text style={warningText}>
            🚨 <strong>Your premium access expires in {daysRemaining} day(s)</strong>
          </Text>
          <Text style={warningSubtext}>
            Expiration date: {new Date(expirationDate).toLocaleDateString('en-US')}
          </Text>
        </Section>

        <Text style={text}>
          To continue enjoying all premium features, including:
        </Text>

        <ul style={list}>
          <li>Advanced financial analytics</li>
          <li>Detailed reports</li>
          <li>Couple synchronization</li>
          <li>Priority support</li>
        </ul>

        <Text style={text}>
          <strong>Please make your payment before expiration</strong> to keep your access active.
        </Text>

        <Section style={buttonContainer}>
          <Button style={button} href="https://app.example.com/subscription">
            💳 Renew Premium Now
          </Button>
        </Section>

        <Section style={infoBox}>
          <Text style={infoText}>
            <strong>💡 Don't worry!</strong><br />
            If you can't renew immediately, your data remains safe and stored for <strong>90 days</strong> after expiration, making it easy to renew when possible.
          </Text>
        </Section>

        <Text style={footerText}>
          If you have any questions or need assistance, please don't hesitate to contact us.
        </Text>

        <Text style={signature}>
          Best regards,<br />
          <strong>Couples Financials Team</strong>
        </Text>
      </Container>
    </Body>
  </Html>
);

export default PremiumExpirationWarningEN;

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