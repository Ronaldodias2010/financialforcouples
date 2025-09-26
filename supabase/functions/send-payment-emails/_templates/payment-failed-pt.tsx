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

interface PaymentFailedPTProps {
  userName: string;
  customerPortalUrl: string;
}

export const PaymentFailedPT = ({ userName, customerPortalUrl }: PaymentFailedPTProps) => (
  <Html>
    <Head />
    <Preview>Falha no pagamento - Atualize seu método de pagamento</Preview>
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
        
        <Heading style={h1}>🚨 Falha no Pagamento</Heading>
        
        <Text style={text}>Olá, {userName}!</Text>
        
        <Text style={text}>
          Tentamos processar o pagamento da sua assinatura premium, mas infelizmente não foi possível completar a transação.
        </Text>

        <Section style={warningBox}>
          <Text style={warningText}>
            ⚠️ <strong>Ação necessária:</strong> Para manter seu acesso aos recursos premium, você precisa atualizar seu método de pagamento nas próximas 24 horas.
          </Text>
        </Section>

        <Text style={text}>
          <strong>O que aconteceu?</strong><br />
          Isso pode ter ocorrido por diversos motivos:
        </Text>
        
        <Text style={bulletList}>
          • Cartão de crédito expirado<br />
          • Dados de cobrança desatualizados<br />
          • Limite insuficiente<br />
          • Problema temporário com o banco
        </Text>

        <Section style={buttonContainer}>
          <Button style={button} href={customerPortalUrl}>
            Atualizar Método de Pagamento
          </Button>
        </Section>

        <Text style={text}>
          <strong>Seus benefícios premium:</strong>
        </Text>
        
        <Text style={benefitsList}>
          ✅ Entrada por voz<br />
          ✅ IA para Planejamento Financeiro<br />
          ✅ Análises Avançadas<br />
          ✅ Suporte Prioritário<br />
          ✅ Metas de Milhas e Investimentos
        </Text>

        <Hr style={hr} />

        <Text style={smallText}>
          Você tem <strong>24 horas</strong> para atualizar seu método de pagamento. Após esse período, seu acesso será alterado para o plano Essential, mas seus dados permanecerão seguros por 90 dias.
        </Text>

        <Text style={footer}>
          Precisa de ajuda? Entre em contato conosco em{' '}
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

export default PaymentFailedPT;