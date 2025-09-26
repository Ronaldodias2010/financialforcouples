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

interface PremiumWelcomeEmailProps {
  user_email: string;
  user_name?: string;
  subscription_end: string;
  login_url: string;
}

export const PremiumWelcomeEmailPT = ({
  user_email,
  user_name,
  subscription_end,
  login_url,
}: PremiumWelcomeEmailProps) => (
  <Html>
    <Head />
    <Preview>🎉 Bem-vindo ao Premium do Couples Financials!</Preview>
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
              <Text style={subtitle}>Gestão financeira para relacionamentos</Text>
            </Column>
          </Row>
        </Section>

        {/* Main Content */}
        <Section style={contentSection}>
          <Heading style={h2}>🎉 Bem-vindo ao Premium!</Heading>
          
          <Text style={text}>
            {user_name ? `Olá ${user_name}` : 'Olá'}! Parabéns por se tornar um usuário <strong>Premium</strong> do Couples Financials!
          </Text>

          {/* Premium Badge */}
          <Section style={premiumBadge}>
            <Text style={premiumText}>✨ PREMIUM ATIVO ✨</Text>
          </Section>

          {/* Access Details */}
          <Section style={accessDetailsBox}>
            <Heading style={h3}>📅 Sua assinatura Premium:</Heading>
            <Text style={detailText}>
              <strong>Email:</strong> {user_email}
            </Text>
            <Text style={detailText}>
              <strong>Válida até:</strong> {new Date(subscription_end).toLocaleDateString('pt-BR')}
            </Text>
          </Section>

          {/* CTA Button */}
          <Section style={buttonSection}>
            <Link
              href={login_url}
              style={premiumButton}
            >
              🚀 Acessar Minha Conta Premium
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
            <Text style={featureText}>✅ Acesso compartilhado com seu parceiro</Text>
            <Text style={featureText}>✅ Notificações inteligentes</Text>
            <Text style={featureText}>✅ Comparação de gastos mensais</Text>
          </Section>

          {/* Getting Started */}
          <Section style={instructionsSection}>
            <Heading style={h3}>🚀 Primeiros Passos:</Heading>
            <Text style={instructionText}>
              1. Acesse sua conta clicando no botão acima
            </Text>
            <Text style={instructionText}>
              2. Explore os novos recursos Premium na sua dashboard
            </Text>
            <Text style={instructionText}>
              3. Configure suas metas financeiras avançadas
            </Text>
            <Text style={instructionText}>
              4. Convide seu parceiro para compartilhar os benefícios
            </Text>
            <Text style={instructionText}>
              5. Configure notificações personalizadas
            </Text>
          </Section>

          <Hr style={divider} />

          <Text style={gratitudeText}>
            Obrigado por confiar no Couples Financials! Estamos aqui para ajudar você e seu parceiro 
            a construir um futuro financeiro sólido e próspero. 💚
          </Text>
          
          <Text style={supportText}>
            Precisa de ajuda? Nossa equipe de suporte prioritário está sempre pronta para atendê-lo!
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

export default PremiumWelcomeEmailPT

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
  color: '#F59E0B', // --primary
  fontSize: '14px',
  textAlign: 'center' as const,
  margin: '16px 0',
  fontWeight: '500',
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