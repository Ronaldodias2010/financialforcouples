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

interface PremiumAccessEmailProps {
  user_email: string;
  start_date: string;
  end_date: string;
  temp_password: string;
  login_url: string;
  days_duration: number;
}

export const PremiumAccessEmailEn = ({
  user_email,
  start_date,
  end_date,
  temp_password,
  login_url,
  days_duration,
}: PremiumAccessEmailProps) => (
  <Html>
    <Head />
    <Preview>🎉 Premium Access Granted on Couples Financials!</Preview>
    <Body style={main}>
      <Container style={container}>
        {/* Header with Logo */}
        <Section style={header}>
          <Row>
            <Column align="center">
              <Img
                src="https://utfs.io/f/0b2d12de-d9b0-4c44-89f4-e14b3e9b9275-1p.png"
                width="120"
                height="120"
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
          <Heading style={h2}>🎉 Premium Access Granted!</Heading>
          
          <Text style={text}>
            Congratulations! You have received free <strong>Premium</strong> access to Couples Financials.
          </Text>

          {/* Premium Badge */}
          <Section style={premiumBadge}>
            <Text style={premiumText}>✨ PREMIUM ACTIVE ✨</Text>
          </Section>

          {/* Access Details */}
          <Section style={accessDetailsBox}>
            <Heading style={h3}>📅 Your Premium access details:</Heading>
            <Text style={detailText}>
              <strong>Duration:</strong> {days_duration} days
            </Text>
            <Text style={detailText}>
              <strong>Start:</strong> {start_date}
            </Text>
            <Text style={detailText}>
              <strong>End:</strong> {end_date}
            </Text>
            <Text style={detailText}>
              <strong>Email:</strong> {user_email}
            </Text>
            <Text style={detailText}>
              <strong>Temporary Password:</strong> 
              <span style={passwordCode}>{temp_password}</span>
            </Text>
          </Section>

          {/* CTA Button */}
          <Section style={buttonSection}>
            <Link
              href={login_url}
              style={premiumButton}
            >
              🚀 Access Premium Now
            </Link>
          </Section>

          {/* Premium Features */}
          <Section style={featuresSection}>
            <Heading style={h3}>💎 Premium Features Unlocked:</Heading>
            <Text style={featureText}>✅ Advanced reports and detailed analytics</Text>
            <Text style={featureText}>✅ Unlimited data export</Text>
            <Text style={featureText}>✅ Unlimited custom categories</Text>
            <Text style={featureText}>✅ Advanced financial goals</Text>
            <Text style={featureText}>✅ Trend analysis and projections</Text>
            <Text style={featureText}>✅ Automatic cloud backup</Text>
            <Text style={featureText}>✅ Priority support</Text>
          </Section>

          {/* Instructions */}
          <Section style={instructionsSection}>
            <Heading style={h3}>🔑 How to access:</Heading>
            <Text style={instructionText}>
              1. Click the "Access Premium Now" button
            </Text>
            <Text style={instructionText}>
              2. Sign in with your email and temporary password
            </Text>
            <Text style={instructionText}>
              3. All Premium features will be available
            </Text>
            <Text style={instructionText}>
              4. Change your password in settings if needed
            </Text>
          </Section>

          <Hr style={divider} />

          <Text style={warningText}>
            <strong>⏰ Important:</strong> This Premium access expires on {end_date}. 
            After this date, your account will automatically return to the free plan.
          </Text>

          <Text style={gratitudeText}>
            Make the most of all Premium features and discover how Couples Financials 
            can revolutionize your relationship's financial management! 💚
          </Text>
        </Section>

        {/* Footer */}
        <Section style={footer}>
          <Text style={footerText}>
            Couples Financials - Intelligent financial management for relationships
          </Text>
          <Text style={footerSubtext}>
            Building a solid financial future, together 💚
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

// Styles following the Couples Financials color palette
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
  textAlign: 'center' as const,
}

const premiumBadge = {
  textAlign: 'center' as const,
  margin: '24px 0',
}

const premiumText = {
  background: 'linear-gradient(135deg, #F59E0B, #10B981)',
  color: '#0f0f23',
  fontSize: '20px',
  fontWeight: 'bold',
  padding: '12px 24px',
  borderRadius: '25px',
  display: 'inline-block',
  boxShadow: '0 10px 30px -10px rgba(245, 158, 11, 0.5)',
}

const accessDetailsBox = {
  backgroundColor: '#2a2a3e',
  border: '2px solid #10B981',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 0',
}

const detailText = {
  color: '#FAFAFA',
  fontSize: '16px',
  margin: '8px 0',
}

const passwordCode = {
  backgroundColor: '#F59E0B',
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

const premiumButton = {
  background: 'linear-gradient(135deg, #F59E0B, #10B981)',
  color: '#0f0f23',
  fontSize: '18px',
  fontWeight: 'bold',
  padding: '16px 32px',
  borderRadius: '8px',
  textDecoration: 'none',
  display: 'inline-block',
  boxShadow: '0 10px 30px -10px rgba(245, 158, 11, 0.5)',
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

const gratitudeText = {
  color: '#10B981',
  fontSize: '16px',
  fontStyle: 'italic',
  textAlign: 'center' as const,
  margin: '24px 0',
  padding: '16px',
  backgroundColor: '#1f2937',
  borderRadius: '8px',
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