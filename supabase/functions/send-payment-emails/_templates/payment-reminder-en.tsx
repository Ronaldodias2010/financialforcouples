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

interface PaymentReminderENProps {
  userName: string;
  customerPortalUrl: string;
  daysRemaining: number;
}

export const PaymentReminderEN = ({ userName, customerPortalUrl, daysRemaining }: PaymentReminderENProps) => (
  <Html>
    <Head />
    <Preview>{daysRemaining === 3 ? 'Your premium subscription renews in 3 days' : 'Your premium subscription renews tomorrow'}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoContainer}>
          <Img
            src="https://couplesfinancials.com/lovable-uploads/couples-financials-logo-new.png"
            width="120"
            height="40"
            alt="Couples Financials"
            style={logo}
          />
        </Section>
        
        <Heading style={h1}>⏰ Renewal Reminder</Heading>
        
        <Text style={text}>Hi, {userName}!</Text>
        
        <Text style={text}>
          Your Couples Financials premium subscription will renew in{' '}
          <strong>{daysRemaining === 3 ? '3 days' : 'tomorrow'}</strong>.
        </Text>

        <Section style={infoBox}>
          <Text style={infoText}>
            ✅ Everything is in order! Your billing will be processed automatically.
          </Text>
        </Section>

        <Text style={text}>
          <strong>Continue enjoying your premium benefits:</strong>
        </Text>
        
        <Text style={benefitsList}>
          🎤 <strong>Voice Input:</strong> Add transactions by speaking<br />
          🤖 <strong>AI Financial:</strong> Personalized consulting<br />
          📊 <strong>Advanced Analytics:</strong> Detailed reports<br />
          🏆 <strong>Miles Goals:</strong> Maximize your points<br />
          💰 <strong>Investment Goals:</strong> Achieve your objectives<br />
          🚀 <strong>Priority Support:</strong> Exclusive assistance
        </Text>

        <Section style={buttonContainer}>
          <Button style={button} href={customerPortalUrl}>
            Manage Subscription
          </Button>
        </Section>

        <Hr style={hr} />

        <Text style={text}>
          Need anything? Make sure your payment information is up to date to avoid any interruption to your premium access.
        </Text>

        <Text style={footer}>
          Any questions? Contact us at{' '}
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

const infoBox = {
  backgroundColor: '#10B981',
  borderRadius: '8px',
  padding: '16px',
  margin: '24px 0',
};

const infoText = {
  color: '#000000',
  fontSize: '16px',
  fontWeight: '500',
  margin: '0',
  textAlign: 'center' as const,
};

const benefitsList = {
  color: '#d1d5db',
  fontSize: '15px',
  lineHeight: '28px',
  margin: '20px 0',
  paddingLeft: '8px',
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
  maxWidth: '200px',
};

const hr = {
  borderColor: '#374151',
  margin: '32px 0',
};

const link = {
  color: '#F59E0B',
  textDecoration: 'underline',
};

const footer = {
  color: '#9CA3AF',
  fontSize: '12px',
  lineHeight: '22px',
  marginTop: '32px',
  textAlign: 'center' as const,
};

export default PaymentReminderEN;