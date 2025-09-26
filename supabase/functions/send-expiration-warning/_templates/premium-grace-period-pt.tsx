import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
  Section,
  Button,
} from 'https://esm.sh/@react-email/components@0.0.22';
import * as React from 'https://esm.sh/react@18.3.1';

interface PremiumGracePeriodProps {
  userName: string;
  expirationDate: string;
}

export const PremiumGracePeriodPT = ({
  userName,
  expirationDate,
}: PremiumGracePeriodProps) => (
  <Html>
    <Head />
    <Preview>Seu acesso premium expirou - Dados seguros por 90 dias</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>🛡️ Período de Graça - Seus Dados Estão Seguros</Heading>
        
        <Text style={text}>Olá {userName},</Text>
        
        <Text style={text}>
          Seu acesso premium expirou em {new Date(expirationDate).toLocaleDateString('pt-BR')}, mas temos uma boa notícia para você!
        </Text>

        <Section style={infoBox}>
          <Text style={infoTitle}>
            🛡️ <strong>Seus dados estão completamente seguros!</strong>
          </Text>
          <Text style={infoText}>
            Manteremos todas as suas informações financeiras, histórico de transações e configurações <strong>armazenadas com segurança por 90 dias</strong> a partir da data de expiração.
          </Text>
        </Section>

        <Text style={text}>
          <strong>Isso significa que você tem até {new Date(new Date(expirationDate).getTime() + 90 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR')} para renovar</strong> e recuperar todo seu histórico sem perder nada!
        </Text>

        <Section style={benefitsBox}>
          <Text style={benefitsTitle}>🎯 Ao renovar, você recupera imediatamente:</Text>
          <ul style={benefitsList}>
            <li>Todo seu histórico financeiro</li>
            <li>Análises e relatórios personalizados</li>
            <li>Configurações do casal</li>
            <li>Metas e objetivos financeiros</li>
            <li>Categorias personalizadas</li>
            <li>Todos os dados de investimentos</li>
          </ul>
        </Section>

        <Text style={text}>
          Durante este período de graça, você pode renovar seu acesso premium a qualquer momento e continuar de onde parou, como se nada tivesse acontecido.
        </Text>

        <Section style={buttonContainer}>
          <Button style={button} href="https://app.example.com/subscription">
            💎 Recuperar Acesso Premium
          </Button>
        </Section>

        <Section style={urgentBox}>
          <Text style={urgentTitle}>⏰ <strong>Importante:</strong></Text>
          <Text style={urgentText}>
            Após 90 dias (em {new Date(new Date(expirationDate).getTime() + 90 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR')}), seus dados serão removidos permanentemente do nosso sistema por questões de privacidade e conformidade.
          </Text>
        </Section>

        <Text style={text}>
          <strong>Tem dúvidas ou precisa de ajuda para renovar?</strong> Nossa equipe está pronta para auxiliar você no processo. Entre em contato conosco!
        </Text>

        <Text style={footerText}>
          Valorizamos muito sua confiança em nosso sistema e esperamos tê-lo de volta em breve!
        </Text>

        <Text style={signature}>
          Com esperança de reencontro,<br />
          <strong>Equipe Couples Financials</strong>
        </Text>
      </Container>
    </Body>
  </Html>
);

export default PremiumGracePeriodPT;

const main = {
  backgroundColor: '#f0f9ff',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  border: '2px solid #0ea5e9',
};

const h1 = {
  color: '#0ea5e9',
  fontSize: '24px',
  fontWeight: 'bold',
  textAlign: 'center' as const,
  margin: '30px 0',
};

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '16px 0',
  padding: '0 40px',
};

const infoBox = {
  backgroundColor: '#f0fdf4',
  border: '2px solid #16a34a',
  borderRadius: '8px',
  margin: '24px 40px',
  padding: '20px',
};

const infoTitle = {
  color: '#166534',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0 0 12px 0',
  textAlign: 'center' as const,
};

const infoText = {
  color: '#166534',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0',
  textAlign: 'center' as const,
};

const benefitsBox = {
  backgroundColor: '#fefce8',
  border: '2px solid #eab308',
  borderRadius: '8px',
  margin: '24px 40px',
  padding: '20px',
};

const benefitsTitle = {
  color: '#a16207',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '0 0 12px 0',
};

const benefitsList = {
  color: '#a16207',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '0',
  paddingLeft: '20px',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#0ea5e9',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 28px',
  border: 'none',
  boxShadow: '0 4px 8px rgba(14, 165, 233, 0.3)',
};

const urgentBox = {
  backgroundColor: '#fef3c7',
  border: '2px solid #f59e0b',
  borderRadius: '8px',
  margin: '24px 40px',
  padding: '16px',
};

const urgentTitle = {
  color: '#92400e',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '0 0 8px 0',
};

const urgentText = {
  color: '#92400e',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '0',
};

const footerText = {
  color: '#0ea5e9',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '32px 0 16px 0',
  padding: '0 40px',
  fontWeight: '600',
  textAlign: 'center' as const,
};

const signature = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '16px 0',
  padding: '0 40px',
  textAlign: 'center' as const,
};