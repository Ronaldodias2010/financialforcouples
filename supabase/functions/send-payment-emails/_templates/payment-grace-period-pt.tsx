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
} from 'npm:@react-email/components@0.0.22';
import * as React from 'npm:react@18.3.1';

interface PaymentGracePeriodPTProps {
  userName: string;
  customerPortalUrl: string;
}

export const PaymentGracePeriodPT = ({ userName, customerPortalUrl }: PaymentGracePeriodPTProps) => (
  <Html>
    <Head />
    <Preview>Período de graça de 24h - Seus dados estão seguros</Preview>
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
        
        <Heading style={h1}>⚠️ Período de Graça Ativado</Heading>
        
        <Text style={text}>Olá, {userName}!</Text>
        
        <Text style={text}>
          Seu acesso premium foi temporariamente suspenso devido à falha no pagamento, mas temos uma boa notícia:
        </Text>

        <Section style={safetyBox}>
          <Text style={safetyText}>
            🛡️ <strong>Seus dados estão 100% seguros!</strong><br />
            Mantemos todas as suas informações financeiras protegidas por 90 dias.
          </Text>
        </Section>

        <Text style={text}>
          <strong>O que acontece agora?</strong>
        </Text>
        
        <Text style={timelineText}>
          ⏰ <strong>Próximas 24 horas:</strong> Tempo para resolver o pagamento<br />
          🔒 <strong>Após 24h:</strong> Acesso alterado para plano Essential<br />
          🛡️ <strong>Próximos 90 dias:</strong> Seus dados permanecem seguros<br />
          ✅ <strong>Pagamento resolvido:</strong> Acesso premium restaurado imediatamente
        </Text>

        <Section style={buttonContainer}>
          <Button style={button} href={customerPortalUrl}>
            Resolver Pagamento Agora
          </Button>
        </Section>

        <Text style={text}>
          <strong>O que você ainda pode fazer no plano Essential:</strong>
        </Text>
        
        <Text style={essentialList}>
          ✅ Adicionar transações manualmente<br />
          ✅ Visualizar relatórios básicos<br />
          ✅ Gerenciar categorias<br />
          ✅ Acessar seus dados históricos
        </Text>

        <Hr style={hr} />

        <Section style={urgencyBox}>
          <Text style={urgencyText}>
            🚨 <strong>Ação recomendada:</strong><br />
            Resolva o pagamento nas próximas 24h para manter todos os seus benefícios premium ativos.
          </Text>
        </Section>

        <Text style={footer}>
          Precisa de ajuda? Nossa equipe está aqui para você em{' '}
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

export default PaymentGracePeriodPT;