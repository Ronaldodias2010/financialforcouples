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
} from 'npm:@react-email/components@0.0.22'
import * as React from 'npm:react@18.3.1'

interface PremiumAccessGrantedEmailProps {
  user_email: string;
  start_date: string;
  end_date: string;
  login_url: string;
  days_duration: number;
}

export const PremiumAccessGrantedEmailEN = ({
  user_email,
  start_date,
  end_date,
  login_url,
  days_duration,
}: PremiumAccessGrantedEmailProps) => (
  <Html>
    <Head />
    <Preview>🎉 Premium Access Granted by Administration!</Preview>
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
          <Heading style={h2}>🎉 Premium Access Granted!</Heading>
          
          <Text style={text}>
            Congratulations! Our team has granted you free <strong>Premium</strong> access to Couples Financials.
          </Text>

          {/* Premium Badge */}
          <Section style={premiumBadge}>
            <Text style={premiumText}>✨ PREMIUM GRANTED ✨</Text>
          </Section>

          {/* Access Details */}
          <Section style={accessDetailsBox}>
            <Heading style={h3}>📅 Premium Access Details:</Heading>
            <Text style={detailText}>
              <strong>Email:</strong> {user_email}
            </Text>
            <Text style={detailText}>
              <strong>Duration:</strong> {days_duration} days
            </Text>
            <Text style={detailText}>
              <strong>Start:</strong> {new Date(start_date).toLocaleDateString('en-US')}
            </Text>
            <Text style={detailText}>
              <strong>End:</strong> {new Date(end_date).toLocaleDateString('en-US')}
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
            <Text style={featureText}>✅ Shared access with your partner</Text>
            <Text style={featureText}>✅ Smart notifications</Text>
          </Section>

          {/* Instructions */}
          <Section style={instructionsSection}>
            <Heading style={h3}>🔑 How to Access:</Heading>
            <Text style={instructionText}>
              1. Click the "Access Premium Now" button
            </Text>
            <Text style={instructionText}>
              2. Log in with your email and your normal password
            </Text>
            <Text style={instructionText}>
              3. All Premium features will be available
            </Text>
            <Text style={instructionText}>
              4. Explore all available Premium features
            </Text>
          </Section>

          <Hr style={divider} />

          <Text style={warningText}>
            <strong>⏰ Important:</strong> This Premium access expires on {new Date(end_date).toLocaleDateString('en-US')}. 
            After this date, your account will automatically return to the free plan.
          </Text>

          <Text style={gratitudeText}>
            Make the most of all Premium features and discover how Couples Financials 
            can revolutionize your relationship's financial management! 💚
          </Text>

          <Text style={supportText}>
            If you have questions or need help, our support team is available to assist you.
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

export default PremiumAccessGrantedEmailEN

// Styles following the Couples Financials color palette
const main = {
  backgroundColor: '#0f0f23', // --background
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
  padding: '20px 0',
}

const container = {
  backgroundColor: '#1a1a2e', // --card
  border: '1px solid #2a2a3e', // --card-border
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
  background: 'linear-gradient(135deg, #F59E0B, #F7B32B)', // --gradient-primary
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  fontSize: '32px',
  fontWeight: 'bold',
  margin: '0 0 8px 0',
  textAlign: 'center' as const,
}

const subtitle = {
  color: '#10B981', // --secondary
  fontSize: '16px',
  fontWeight: '500',
  margin: '0',
  textAlign: 'center' as const,
}

const contentSection = {
  padding: '0 20px',
}

const h2 = {
  color: '#F59E0B', // --primary
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0 0 16px 0',
  textAlign: 'center' as const,
}

const h3 = {
  color: '#F59E0B', // --primary
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '24px 0 12px 0',
}

const text = {
  color: '#FAFAFA', // --foreground
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
  background: 'linear-gradient(135deg, #F59E0B, #10B981)', // gold to green gradient
  color: '#0f0f23',
  fontSize: '20px',
  fontWeight: 'bold',
  padding: '12px 24px',
  borderRadius: '25px',
  display: 'inline-block',
  boxShadow: '0 10px 30px -10px rgba(245, 158, 11, 0.5)',
}

const accessDetailsBox = {
  backgroundColor: '#2a2a3e', // darker card
  border: '2px solid #10B981', // --secondary
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
  backgroundColor: '#F59E0B', // --primary
  color: '#0f0f23', // --primary-foreground
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
  background: 'linear-gradient(135deg, #F59E0B, #10B981)', // gold to green gradient
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
  backgroundColor: '#134e4a', // darker green
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
  color: '#F59E0B', // --primary
  fontSize: '14px',
  backgroundColor: '#2a2a3e',
  padding: '16px',
  borderRadius: '8px',
  margin: '24px 0',
}

const gratitudeText = {
  color: '#10B981', // --secondary
  fontSize: '16px',
  fontStyle: 'italic',
  textAlign: 'center' as const,
  margin: '24px 0',
  padding: '16px',
  backgroundColor: '#1f2937',
  borderRadius: '8px',
}

const supportText = {
  color: '#FAFAFA',
  fontSize: '14px',
  textAlign: 'center' as const,
  margin: '16px 0',
}

const footer = {
  textAlign: 'center' as const,
  marginTop: '32px',
  paddingTop: '24px',
  borderTop: '1px solid #2a2a3e',
}

const footerText = {
  color: '#9CA3AF', // muted
  fontSize: '14px',
  margin: '8px 0',
}

const footerSubtext = {
  color: '#10B981', // --secondary
  fontSize: '12px',
  margin: '4px 0',
  fontStyle: 'italic',
}