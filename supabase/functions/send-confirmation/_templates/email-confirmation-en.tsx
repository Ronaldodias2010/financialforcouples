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
} from 'https://esm.sh/@react-email/components@0.0.22';
import * as React from 'https://esm.sh/react@18.3.1';

interface EmailConfirmationProps {
  userEmail: string;
  loginUrl: string;
}

export const EmailConfirmationEN = ({
  userEmail,
  loginUrl,
}: EmailConfirmationProps) => (
  <Html>
    <Head />
    <Preview>🎉 Welcome to Couples Financials! Account confirmed successfully</Preview>
    <Body style={main}>
      <Container style={container}>
        {/* Header with Logo */}
        <Section style={header}>
          <Row>
            <Column align="center">
              <Img
                src="https://elxttabdtddlavhseipz.lovableproject.com/lovable-uploads/1f5e0469-b056-4cf9-9583-919702fa8736.png"
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
          <Heading style={h2}>🎉 Welcome!</Heading>
          <Text style={paragraph}>
            Hello! Your account has been successfully confirmed. You can now enjoy all the features of Couples Financials.
          </Text>
          
          <Text style={paragraph}>
            <strong>Your account:</strong> {userEmail}
          </Text>

          <Section style={buttonContainer}>
            <Link href={loginUrl} style={button}>
              Access Platform
            </Link>
          </Section>

          <Hr style={hr} />

          <Text style={subheading}>✨ What you can do now:</Text>
          <ul style={list}>
            <li style={listItem}>🏦 Manage bank accounts</li>
            <li style={listItem}>💳 Control credit cards</li>
            <li style={listItem}>📊 Track transactions</li>
            <li style={listItem}>🎯 Set financial goals</li>
            <li style={listItem}>📈 View detailed reports</li>
            <li style={listItem}>👥 Manage couple finances</li>
          </ul>
        </Section>

        {/* Footer */}
        <Section style={footer}>
          <Text style={footerText}>
            If you didn't create this account, you can safely ignore this email.
          </Text>
          <Text style={footerText}>
            © 2024 Couples Financials. All rights reserved.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

// Styles (same as PT version)
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
  backgroundColor: '#6366f1',
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

export default EmailConfirmationEN;