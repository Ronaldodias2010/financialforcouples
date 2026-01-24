import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
} from 'https://esm.sh/@react-email/components@0.0.22';
import * as React from 'https://esm.sh/react@18.3.1';

interface ApprovalEmailProps {
  partnerName: string;
  referralCode: string;
  rewardAmount: number;
  rewardType: 'monetary' | 'other';
  rewardCurrency?: string;
  rewardDescription?: string;
}

export const ApprovalEmailPT = ({
  partnerName,
  referralCode,
  rewardAmount,
  rewardType = 'monetary',
  rewardCurrency = 'BRL',
  rewardDescription,
}: ApprovalEmailProps) => (
  <Html>
    <Head />
    <Preview>🎉 Sua solicitação de parceria foi aprovada!</Preview>
    <Body style={main}>
      <Container style={container}>
        <div style={header}>
          <img
            src="https://couplesfinancials.com/lovable-uploads/couples-financials-logo-new.png"
            width="48"
            height="48"
            alt="Couples Financials"
            style={logo}
          />
          <Heading style={h1}>Couples Financials</Heading>
        </div>
        
        <Heading style={h2}>Parabéns, {partnerName}!</Heading>
        <Text style={text}>Sua solicitação de parceria foi aprovada!</Text>
        
        <div style={codeSection}>
          <Heading style={h3}>Seu Código de Indicação</Heading>
          <div style={codeBox}>
            <Text style={code}>{referralCode}</Text>
          </div>
          <Text style={smallText}>
            Este é seu código exclusivo para compartilhar com sua audiência.
          </Text>
        </div>

        <div style={rewardSection}>
          <Heading style={h3}>
            {rewardType === 'monetary' ? '💰' : '🎁'} Como Funciona a Recompensa
          </Heading>
          <ul style={list}>
            <li>Para cada pessoa que se cadastrar usando seu código e efetuar o pagamento da ANUIDADE</li>
            <li>
              Você receberá: <strong>
                {rewardType === 'monetary' 
                  ? `${rewardCurrency === 'USD' ? '$' : 'R$'} ${rewardAmount.toFixed(2)}` 
                  : rewardDescription || `Recompensa: ${rewardAmount}`
                }
              </strong>
            </li>
            <li>
              {rewardType === 'monetary' 
                ? 'O pagamento será processado em até 30 dias após a confirmação do pagamento do usuário' 
                : 'A recompensa será processada conforme os termos acordados'
              }
            </li>
            <li>Você receberá um relatório mensal com seus {rewardType === 'monetary' ? 'ganhos' : 'resultados'}</li>
          </ul>
        </div>

        <div style={instructionsSection}>
          <Heading style={h3}>📝 Como Usar Seu Código</Heading>
          <ol style={list}>
            <li>Compartilhe seu código <strong>{referralCode}</strong> com sua audiência</li>
            <li>Oriente para acessarem: <strong>couplesfinancials.com</strong></li>
            <li>No cadastro, eles devem inserir seu código na seção "Código Promocional"</li>
            <li>Acompanhe seus resultados no painel que enviaremos mensalmente</li>
          </ol>
        </div>

        <div style={supportSection}>
          <Heading style={h4}>📞 Suporte e Dúvidas</Heading>
          <Text style={supportText}>
            Entre em contato conosco: <strong>contato@couplesfinancials.com</strong><br/>
            Estamos aqui para ajudar você a ter sucesso em nossa parceria!
          </Text>
        </div>

        <div style={footer}>
          <Text style={footerText}>
            Obrigado por fazer parte da família Couples Financials! 🚀
          </Text>
        </div>
      </Container>
    </Body>
  </Html>
);

export default ApprovalEmailPT;

// Styles
const main = {
  backgroundColor: '#ffffff',
  fontFamily: 'Arial, sans-serif',
};

const container = {
  maxWidth: '600px',
  margin: '0 auto',
  padding: '20px',
};

const header = {
  textAlign: 'center' as const,
  marginBottom: '32px',
};

const logo = {
  borderRadius: '8px',
};

const h1 = {
  color: '#059669',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '16px 0 0 0',
};

const h2 = {
  color: '#059669',
  fontSize: '20px',
  margin: '0 0 16px 0',
  textAlign: 'center' as const,
};

const h3 = {
  color: '#059669',
  fontSize: '18px',
  margin: '0 0 16px 0',
};

const h4 = {
  color: '#0369a1',
  fontSize: '16px',
  margin: '0 0 8px 0',
};

const text = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '16px 0',
  textAlign: 'center' as const,
};

const codeSection = {
  backgroundColor: '#f0fdf4',
  padding: '24px',
  borderRadius: '8px',
  margin: '24px 0',
  border: '1px solid #bbf7d0',
};

const codeBox = {
  backgroundColor: 'white',
  padding: '16px',
  borderRadius: '6px',
  textAlign: 'center' as const,
  margin: '16px 0',
};

const code = {
  fontSize: '24px',
  fontWeight: 'bold',
  color: '#059669',
  letterSpacing: '2px',
  margin: '0',
};

const rewardSection = {
  backgroundColor: '#fffbeb',
  padding: '24px',
  borderRadius: '8px',
  margin: '24px 0',
  border: '1px solid #fde68a',
};

const instructionsSection = {
  backgroundColor: '#f1f5f9',
  padding: '24px',
  borderRadius: '8px',
  margin: '24px 0',
};

const supportSection = {
  backgroundColor: '#e0f2fe',
  padding: '20px',
  borderRadius: '8px',
  borderLeft: '4px solid #0284c7',
  margin: '24px 0',
};

const list = {
  color: '#374151',
  margin: '0',
  paddingLeft: '20px',
};

const smallText = {
  margin: '16px 0 0 0',
  color: '#166534',
  fontSize: '14px',
};

const supportText = {
  margin: '0',
  color: '#0369a1',
  fontSize: '14px',
};

const footer = {
  textAlign: 'center' as const,
  marginTop: '32px',
  paddingTop: '24px',
  borderTop: '1px solid #e5e7eb',
};

const footerText = {
  color: '#6b7280',
  fontSize: '14px',
  margin: '0',
};