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

export const PremiumAccessEmail = ({
  user_email,
  start_date,
  end_date,
  temp_password,
  login_url,
  days_duration,
}: PremiumAccessEmailProps) => (
  <Html>
    <Head />
    <Preview>🎉 Acesso Premium Concedido no Couples Financials!</Preview>
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
          <Heading style={h2}>🎉 Acesso Premium Concedido!</Heading>
          
          <Text style={text}>
            Parabéns! Você recebeu acesso <strong>Premium</strong> gratuito ao Couples Financials.
          </Text>

          {/* Premium Badge */}
          <Section style={premiumBadge}>
            <Text style={premiumText}>✨ PREMIUM ATIVO ✨</Text>
          </Section>

          {/* Access Details */}
          <Section style={accessDetailsBox}>
            <Heading style={h3}>📅 Detalhes do seu acesso Premium:</Heading>
            <Text style={detailText}>
              <strong>Período:</strong> {days_duration} dias
            </Text>
            <Text style={detailText}>
              <strong>Início:</strong> {start_date}
            </Text>
            <Text style={detailText}>
              <strong>Término:</strong> {end_date}
            </Text>
            <Text style={detailText}>
              <strong>Email:</strong> {user_email}
            </Text>
            <Text style={detailText}>
              <strong>Senha Temporária:</strong> 
              <span style={passwordCode}>{temp_password}</span>
            </Text>
          </Section>

          {/* CTA Button */}
          <Section style={buttonSection}>
            <Link
              href={login_url}
              style={premiumButton}
            >
              🚀 Acessar Premium Agora
            </Link>
          </Section>

          {/* Premium Features */}
          <Section style={featuresSection}>
            <Heading style={h3}>💎 Recursos Premium Liberados:</Heading>
            <Text style={featureText}>✅ Relatórios avançados e análises detalhadas</Text>
            <Text style={featureText}>✅ Exportação ilimitada de dados</Text>
            <Text style={featureText}>✅ Categorias personalizadas sem limites</Text>
            <Text style={featureText}>✅ Metas financeiras avançadas</Text>
            <Text style={featureText}>✅ Análise de tendências e projeções</Text>
            <Text style={featureText}>✅ Backup automático na nuvem</Text>
            <Text style={featureText}>✅ Suporte prioritário</Text>
          </Section>

          {/* Instructions */}
          <Section style={instructionsSection}>
            <Heading style={h3}>🔑 Como acessar:</Heading>
            <Text style={instructionText}>
              1. Clique no botão "Acessar Premium Agora"
            </Text>
            <Text style={instructionText}>
              2. Faça login com seu email e a senha temporária
            </Text>
            <Text style={instructionText}>
              3. Todas as funcionalidades Premium estarão disponíveis
            </Text>
            <Text style={instructionText}>
              4. Altere sua senha nas configurações se necessário
            </Text>
          </Section>

          <Hr style={divider} />

          <Text style={warningText}>
            <strong>⏰ Importante:</strong> Este acesso Premium expira em {end_date}. 
            Após esta data, sua conta retornará automaticamente ao plano gratuito.
          </Text>

          <Text style={gratitudeText}>
            Aproveite ao máximo todos os recursos Premium e descubra como o Couples Financials 
            pode revolucionar a gestão financeira do seu relacionamento! 💚
          </Text>
        </Section>

        {/* Footer */}
        <Section style={footer}>
          <Text style={footerText}>
            Couples Financials - Gestão financeira inteligente para relacionamentos
          </Text>
          <Text style={footerSubtext}>
            Construindo um futuro financeiro sólido, juntos 💚
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