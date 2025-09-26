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

interface CouplesFinancialsEmailProps {
  name: string;
  inviter_name: string;
  email: string;
  temp_password: string;
  login_url: string;
}

export const CouplesFinancialsEmailEn = ({
  name,
  inviter_name,
  email,
  temp_password,
  login_url,
}: CouplesFinancialsEmailProps) => (
  <Html>
    <Head />
    <Preview>{inviter_name} invited you to Couples Financials</Preview>
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
              <Text style={subtitle}>Financial management for relationships</Text>
            </Column>
          </Row>
        </Section>

        {/* Main Content */}
        <Section style={contentSection}>
          <Heading style={h2}>You've been invited! 💚</Heading>

          <Text style={text}>
            Hello <strong>{name}</strong>,
          </Text>

          <Text style={text}>
            <strong>{inviter_name}</strong> invited you to use <strong>Couples Financials</strong>,
            a smart financial management platform for couples.
          </Text>

          {/* Credentials Box */}
          <Section style={credentialsBox}>
            <Heading style={h3}>🔑 Your access credentials:</Heading>
            <Text style={credentialText}>
              <strong>Email:</strong> {email}
            </Text>
            <Text style={credentialText}>
              <strong>Temporary Password:</strong>
              <span style={passwordCode}>{temp_password}</span>
            </Text>
          </Section>

          {/* CTA Button */}
          <Section style={buttonSection}>
            <Link href={login_url} style={button}>
              🚀 Access Couples Financials
            </Link>
          </Section>

          {/* Instructions */}
          <Section style={instructionsSection}>
            <Heading style={h3}>📋 Getting started:</Heading>
            <Text style={instructionText}>1. Click the button above to access the platform</Text>
            <Text style={instructionText}>2. Use your email and the temporary password to log in</Text>
            <Text style={instructionText}>3. After logging in, change your password in settings</Text>
            <Text style={instructionText}>4. Your financial data will be linked with {inviter_name}</Text>
          </Section>

          {/* Features */}
          <Section style={featuresSection}>
            <Heading style={h3}>💎 What you can do together:</Heading>
            <Text style={featureText}>✅ Manage shared transactions</Text>
            <Text style={featureText}>✅ Track spending by category</Text>
            <Text style={featureText}>✅ Control credit cards and bank accounts</Text>
            <Text style={featureText}>✅ View detailed financial reports</Text>
            <Text style={featureText}>✅ Set financial goals as a couple</Text>
          </Section>

          <Hr style={divider} />

          <Text style={warningText}>
            <strong>⚠️ Important:</strong> This temporary password expires in 7 days.
            If you didn't expect this invite, you can safely ignore this email.
          </Text>
        </Section>

        {/* Footer */}
        <Section style={footer}>
          <Text style={footerText}>
            Couples Financials - Smart financial management for relationships
          </Text>
          <Text style={footerSubtext}>
            Building a solid financial future, together 💚
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default CouplesFinancialsEmailEn

// Styles matching PT version
const main = {
  backgroundColor: '#0f0f23',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
  padding: '20px 0',
}

const container = {
  backgroundColor: '#1a1a2e',
  border: '1px solid #2a2a3e',
  borderRadius: '12px',
  margin: '0 auto',
  padding: '20px',
  width: '600px',
  maxWidth: '100%',
}

const header = {
  marginBottom: '32px',
  textAlign: 'center' as const,
}

const logo = {
  borderRadius: '12px',
  marginBottom: '16px',
}

const h1 = {
  background: 'linear-gradient(135deg, #F59E0B, #F7B32B)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  fontSize: '32px',
  fontWeight: 'bold',
  margin: '0 0 8px 0',
  textAlign: 'center' as const,
}

const subtitle = {
  color: '#10B981',
  fontSize: '16px',
  fontWeight: '500',
  margin: '0',
  textAlign: 'center' as const,
}

const contentSection = {
  padding: '0 20px',
}

const h2 = {
  color: '#F59E0B',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0 0 16px 0',
  textAlign: 'center' as const,
}

const h3 = {
  color: '#F59E0B',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '24px 0 12px 0',
}

const text = {
  color: '#FAFAFA',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '16px 0',
}

const credentialsBox = {
  backgroundColor: '#2a2a3e',
  border: '2px solid #F59E0B',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 0',
}

const credentialText = {
  color: '#FAFAFA',
  fontSize: '16px',
  margin: '8px 0',
}

const passwordCode = {
  backgroundColor: '#10B981',
  color: '#0f0f23',
  fontFamily: 'monospace',
  fontSize: '18px',
  fontWeight: 'bold',
  padding: '8px 12px',
  borderRadius: '6px',
  marginLeft: '8px',
}

const buttonSection = {
  textAlign: 'center' as const,
  margin: '32px 0',
}

const button = {
  backgroundColor: '#F59E0B',
  color: '#0f0f23',
  fontSize: '18px',
  fontWeight: 'bold',
  padding: '16px 32px',
  borderRadius: '8px',
  textDecoration: 'none',
  display: 'inline-block',
  boxShadow: '0 10px 30px -10px rgba(245, 158, 11, 0.3)',
}

const instructionsSection = {
  margin: '32px 0',
}

const instructionText = {
  color: '#FAFAFA',
  fontSize: '16px',
  margin: '8px 0',
  paddingLeft: '8px',
}

const featuresSection = {
  backgroundColor: '#134e4a',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 0',
}

const featureText = {
  color: '#FAFAFA',
  fontSize: '16px',
  margin: '8px 0',
}

const divider = {
  borderColor: '#2a2a3e',
  margin: '32px 0',
}

const warningText = {
  color: '#F59E0B',
  fontSize: '14px',
  backgroundColor: '#2a2a3e',
  padding: '16px',
  borderRadius: '8px',
  margin: '24px 0',
}

const footer = {
  textAlign: 'center' as const,
  marginTop: '32px',
  paddingTop: '24px',
  borderTop: '1px solid #2a2a3e',
}

const footerText = {
  color: '#9CA3AF',
  fontSize: '14px',
  margin: '8px 0',
}

const footerSubtext = {
  color: '#10B981',
  fontSize: '12px',
  margin: '4px 0',
  fontStyle: 'italic',
}
