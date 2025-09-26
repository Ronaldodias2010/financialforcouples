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

interface PaymentGracePeriodENProps {
  userName: string;
  customerPortalUrl: string;
}

export const PaymentGracePeriodEN = ({ userName, customerPortalUrl }: PaymentGracePeriodENProps) => (
  <Html>
    <Head />
    <Preview>24-hour grace period - Your data is safe</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoContainer}>
          <Img
            src="https://app.couplesfinancials.com/lovable-uploads/1f5e0469-b056-4cf9-9583-919702fa8736.png"
            width="120"
            height="40"
            alt="Couples Financials"
            style={logo}
          />
        </Section>
        
        <Heading style={h1}>⚠️ Grace Period Activated</Heading>
        
        <Text style={text}>Hi, {userName}!</Text>
        
        <Text style={text}>
          Your premium access has been temporarily suspended due to payment failure, but we have good news:
        </Text>

        <Section style={safetyBox}>
          <Text style={safetyText}>
            🛡️ <strong>Your data is 100% safe!</strong><br />
            We keep all your financial information protected for 90 days.
          </Text>
        </Section>

        <Text style={text}>
          <strong>What happens now?</strong>
        </Text>
        
        <Text style={timelineText}>
          ⏰ <strong>Next 24 hours:</strong> Time to resolve payment<br />
          🔒 <strong>After 24h:</strong> Access changed to Essential plan<br />
          🛡️ <strong>Next 90 days:</strong> Your data remains safe<br />
          ✅ <strong>Payment resolved:</strong> Premium access restored immediately
        </Text>

        <Section style={buttonContainer}>
          <Button style={button} href={customerPortalUrl}>
            Resolve Payment Now
          </Button>
        </Section>

        <Text style={text}>
          <strong>What you can still do on Essential plan:</strong>
        </Text>
        
        <Text style={essentialList}>
          ✅ Add transactions manually<br />
          ✅ View basic reports<br />
          ✅ Manage categories<br />
          ✅ Access your historical data
        </Text>

        <Hr style={hr} />

        <Section style={urgencyBox}>
          <Text style={urgencyText}>
            🚨 <strong>Recommended action:</strong><br />
            Resolve payment within the next 24h to keep all your premium benefits active.
          </Text>
        </Section>

        <Text style={footer}>
          Need help? Our team is here for you at{' '}
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

const safetyBox = {
  backgroundColor: '#10B981',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 0',
  textAlign: 'center' as const,
};

const safetyText = {
  color: '#000000',
  fontSize: '16px',
  fontWeight: '500',
  margin: '0',
};

const timelineText = {
  color: '#d1d5db',
  fontSize: '15px',
  lineHeight: '28px',
  margin: '20px 0',
  paddingLeft: '8px',
};

const essentialList = {
  color: '#d1d5db',
  fontSize: '15px',
  lineHeight: '24px',
  margin: '16px 0',
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
  maxWidth: '250px',
};

const urgencyBox = {
  backgroundColor: '#F59E0B',
  borderRadius: '8px',
  padding: '16px',
  margin: '24px 0',
  textAlign: 'center' as const,
};

const urgencyText = {
  color: '#000000',
  fontSize: '15px',
  fontWeight: '500',
  margin: '0',
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

export default PaymentGracePeriodEN;