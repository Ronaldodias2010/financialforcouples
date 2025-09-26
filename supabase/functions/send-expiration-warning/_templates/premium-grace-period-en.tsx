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

interface PremiumGracePeriodProps {
  userName: string;
  expirationDate: string;
}

export const PremiumGracePeriodEN = ({
  userName,
  expirationDate,
}: PremiumGracePeriodProps) => (
  <Html>
    <Head />
    <Preview>Your premium access expired - Data safe for 90 days</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>🛡️ Grace Period - Your Data Is Safe</Heading>
        
        <Text style={text}>Hello {userName},</Text>
        
        <Text style={text}>
          Your premium access expired on {new Date(expirationDate).toLocaleDateString('en-US')}, but we have good news for you!
        </Text>

        <Section style={infoBox}>
          <Text style={infoTitle}>
            🛡️ <strong>Your data is completely safe!</strong>
          </Text>
          <Text style={infoText}>
            We will keep all your financial information, transaction history, and settings <strong>securely stored for 90 days</strong> from the expiration date.
          </Text>
        </Section>

        <Text style={text}>
          <strong>This means you have until {new Date(new Date(expirationDate).getTime() + 90 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US')} to renew</strong> and recover all your history without losing anything!
        </Text>

        <Section style={benefitsBox}>
          <Text style={benefitsTitle}>🎯 When you renew, you immediately recover:</Text>
          <ul style={benefitsList}>
            <li>All your financial history</li>
            <li>Personalized analysis and reports</li>
            <li>Couple settings</li>
            <li>Financial goals and objectives</li>
            <li>Custom categories</li>
            <li>All investment data</li>
          </ul>
        </Section>

        <Text style={text}>
          During this grace period, you can renew your premium access at any time and continue where you left off, as if nothing happened.
        </Text>

        <Section style={buttonContainer}>
          <Button style={button} href="https://app.example.com/subscription">
            💎 Recover Premium Access
          </Button>
        </Section>

        <Section style={urgentBox}>
          <Text style={urgentTitle}>⏰ <strong>Important:</strong></Text>
          <Text style={urgentText}>
            After 90 days (on {new Date(new Date(expirationDate).getTime() + 90 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US')}), your data will be permanently removed from our system for privacy and compliance reasons.
          </Text>
        </Section>

        <Text style={text}>
          <strong>Have questions or need help renewing?</strong> Our team is ready to assist you with the process. Contact us!
        </Text>

        <Text style={footerText}>
          We greatly value your trust in our system and hope to have you back soon!
        </Text>

        <Text style={signature}>
          With hope of reunion,<br />
          <strong>Couples Financials Team</strong>
        </Text>
      </Container>
    </Body>
  </Html>
);

export default PremiumGracePeriodEN;

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