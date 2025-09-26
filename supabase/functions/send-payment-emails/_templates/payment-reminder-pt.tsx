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

interface PaymentReminderPTProps {
  userName: string;
  customerPortalUrl: string;
  daysRemaining: number;
}

export const PaymentReminderPT = ({ userName, customerPortalUrl, daysRemaining }: PaymentReminderPTProps) => (
  <Html>
    <Head />
    <Preview>{daysRemaining === 3 ? 'Sua assinatura premium renova em 3 dias' : 'Sua assinatura premium renova amanhã'}</Preview>
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
        
        <Heading style={h1}>⏰ Lembrete de Renovação</Heading>
        
        <Text style={text}>Olá, {userName}!</Text>
        
        <Text style={text}>
          Sua assinatura premium do Couples Financials será renovada em{' '}
          <strong>{daysRemaining === 3 ? '3 dias' : 'amanhã'}</strong>.
        </Text>

        <Section style={infoBox}>
          <Text style={infoText}>
            ✅ Tudo está em ordem! Sua cobrança será processada automaticamente.
          </Text>
        </Section>

        <Text style={text}>
          <strong>Continue aproveitando seus benefícios premium:</strong>
        </Text>
        
        <Text style={benefitsList}>
          🎤 <strong>Entrada por voz:</strong> Adicione transações falando<br />
          🤖 <strong>IA Financeira:</strong> Consultoria personalizada<br />
          📊 <strong>Análises Avançadas:</strong> Relatórios detalhados<br />
          🏆 <strong>Metas de Milhas:</strong> Maximize seus pontos<br />
          💰 <strong>Metas de Investimento:</strong> Alcance seus objetivos<br />
          🚀 <strong>Suporte Prioritário:</strong> Atendimento exclusivo
        </Text>

        <Section style={buttonContainer}>
          <Button style={button} href={customerPortalUrl}>
            Gerenciar Assinatura
          </Button>
        </Section>

        <Hr style={hr} />

        <Text style={text}>
          Precisa de alguma coisa? Certifique-se de que seus dados de pagamento estão atualizados para evitar qualquer interrupção no seu acesso premium.
        </Text>

        <Text style={footer}>
          Alguma dúvida? Entre em contato conosco em{' '}
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

const infoBox = {
  backgroundColor: '#10B981',
  borderRadius: '8px',
  padding: '16px',
  margin: '24px 0',
};

const infoText = {
  color: '#000000',
  fontSize: '16px',
  fontWeight: '500',
  margin: '0',
  textAlign: 'center' as const,
};

const benefitsList = {
  color: '#d1d5db',
  fontSize: '15px',
  lineHeight: '28px',
  margin: '20px 0',
  paddingLeft: '8px',
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
  maxWidth: '200px',
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

export default PaymentReminderPT;