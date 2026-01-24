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

export const PasswordResetEN = ({
  userEmail,
  resetUrl,
}: PasswordResetProps) => (
  <Html>
    <Head />
    <Preview>🔐 Reset your Couples Financials password</Preview>
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
          <Heading style={h2}>🔐 Password Reset</Heading>
          <Text style={paragraph}>
            Hello! We received a request to reset the password for your Couples Financials account.
          </Text>
          
          <Text style={paragraph}>
            <strong>Requesting account:</strong> {userEmail}
          </Text>

          <Section style={buttonContainer}>
            <Link href={resetUrl} style={button}>
              Reset Password
            </Link>
          </Section>

          <Hr style={hr} />

          <Text style={subheading}>🔒 Security Tips:</Text>
          <ul style={list}>
            <li style={listItem}>This link expires in 24 hours</li>
            <li style={listItem}>Use a strong and unique password</li>
            <li style={listItem}>Don't share your new password</li>
            <li style={listItem}>Consider using a password manager</li>
          </ul>

          <Hr style={hr} />

          <Text style={alertText}>
            <strong>⚠️ Didn't request this change?</strong><br />
            If you didn't request a password reset, you can safely ignore this email. 
            Your password will not be changed. For additional security, contact us if 
            you continue receiving these emails.
          </Text>
        </Section>

        {/* Footer */}
        <Section style={footer}>
          <Text style={footerText}>
            This email was sent automatically. Do not reply to this email.
          </Text>
          <Text style={footerText}>
            © 2024 Couples Financials. All rights reserved.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

// Styles (same as PT version with different colors for reset button)
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

export default PasswordResetEN;