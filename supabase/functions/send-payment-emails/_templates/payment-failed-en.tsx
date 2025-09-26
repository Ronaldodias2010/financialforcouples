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

interface PaymentFailedENProps {
  userName: string;
  customerPortalUrl: string;
}

export const PaymentFailedEN = ({ userName, customerPortalUrl }: PaymentFailedENProps) => (
  <Html>
    <Head />
    <Preview>Payment failed - Update your payment method</Preview>
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
        
        <Heading style={h1}>🚨 Payment Failed</Heading>
        
        <Text style={text}>Hi, {userName}!</Text>
        
        <Text style={text}>
          We tried to process your premium subscription payment, but unfortunately we couldn't complete the transaction.
        </Text>

        <Section style={warningBox}>
          <Text style={warningText}>
            ⚠️ <strong>Action required:</strong> To keep your premium access, you need to update your payment method within the next 24 hours.
          </Text>
        </Section>

        <Text style={text}>
          <strong>What happened?</strong><br />
          This could have occurred for several reasons:
        </Text>
        
        <Text style={bulletList}>
          • Expired credit card<br />
          • Outdated billing information<br />
          • Insufficient limit<br />
          • Temporary bank issue
        </Text>

        <Section style={buttonContainer}>
          <Button style={button} href={customerPortalUrl}>
            Update Payment Method
          </Button>
        </Section>

        <Text style={text}>
          <strong>Your premium benefits:</strong>
        </Text>
        
        <Text style={benefitsList}>
          ✅ Voice Input<br />
          ✅ AI Financial Planning<br />
          ✅ Advanced Analytics<br />
          ✅ Priority Support<br />
          ✅ Miles & Investment Goals
        </Text>

        <Hr style={hr} />

        <Text style={smallText}>
          You have <strong>24 hours</strong> to update your payment method. After this period, your access will be changed to the Essential plan, but your data will remain safe for 90 days.
        </Text>

        <Text style={footer}>
          Need help? Contact us at{' '}
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

const warningBox = {
  backgroundColor: '#F59E0B',
  borderRadius: '8px',
  padding: '16px',
  margin: '24px 0',
};

const warningText = {
  color: '#000000',
  fontSize: '16px',
  fontWeight: '500',
  margin: '0',
  textAlign: 'center' as const,
};

const bulletList = {
  color: '#d1d5db',
  fontSize: '14px',
  lineHeight: '24px',
  margin: '16px 0',
  paddingLeft: '20px',
};

const benefitsList = {
  color: '#10B981',
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
  maxWidth: '280px',
};

const hr = {
  borderColor: '#374151',
  margin: '32px 0',
};

const link = {
  color: '#F59E0B',
  textDecoration: 'underline',
};

const smallText = {
  color: '#d1d5db',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '16px 0',
  textAlign: 'center' as const,
};

const footer = {
  color: '#9CA3AF',
  fontSize: '12px',
  lineHeight: '22px',
  marginTop: '32px',
  textAlign: 'center' as const,
};

export default PaymentFailedEN;