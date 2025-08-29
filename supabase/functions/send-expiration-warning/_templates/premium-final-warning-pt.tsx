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
} from 'npm:@react-email/components@0.0.22';
import * as React from 'npm:react@18.3.1';

interface PremiumFinalWarningProps {
  userName: string;
  expirationDate: string;
}

export const PremiumFinalWarningPT = ({
  userName,
  expirationDate,
}: PremiumFinalWarningProps) => (
  <Html>
    <Head />
    <Preview>⚠️ ÚLTIMA CHANCE: Seu acesso premium expira amanhã!</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>🚨 AVISO FINAL - Premium Expira Amanhã!</Heading>
        
        <Text style={text}>Olá {userName},</Text>
        
        <Text style={text}>
          Este é seu <strong>último aviso</strong> antes da expiração do seu acesso premium.
        </Text>

        <Section style={urgentBox}>
          <Text style={urgentText}>
            ⚠️ <strong>SEU ACESSO PREMIUM EXPIRA AMANHÃ!</strong>
          </Text>
          <Text style={urgentSubtext}>
            Data de vencimento: {new Date(expirationDate).toLocaleDateString('pt-BR')}
          </Text>
          <Text style={urgentSubtext}>
            ⏰ Restam menos de 24 horas
          </Text>
        </Section>

        <Text style={text}>
          <strong>Aja agora para não perder:</strong>
        </Text>

        <ul style={list}>
          <li><strong>Análises financeiras completas</strong> do seu orçamento familiar</li>
          <li><strong>Relatórios personalizados</strong> para decisões financeiras inteligentes</li>
          <li><strong>Sincronização em tempo real</strong> entre você e seu parceiro(a)</li>
          <li><strong>Suporte prioritário</strong> quando você mais precisa</li>
          <li><strong>Ferramentas avançadas</strong> de planejamento financeiro</li>
        </ul>

        <Section style={actionBox}>
          <Text style={actionText}>
            💡 <strong>Não deixe para depois!</strong>
          </Text>
          <Text style={actionSubtext}>
            Renove agora em poucos cliques e mantenha todo o progresso do seu planejamento financeiro.
          </Text>
        </Section>

        <Section style={buttonContainer}>
          <Button style={button} href="https://app.example.com/subscription">
            🚀 RENOVAR AGORA - ÚLTIMA CHANCE
          </Button>
        </Section>

        <Section style={infoBox}>
          <Text style={infoText}>
            <strong>🛡️ Seus dados estão seguros!</strong><br />
            Mesmo se não conseguir renovar hoje, seus dados ficam protegidos por <strong>90 dias</strong> para facilitar a renovação quando possível.
          </Text>
        </Section>

        <Text style={footerText}>
          <strong>Precisa de ajuda?</strong> Nossa equipe está pronta para auxiliar você. Entre em contato conosco imediatamente!
        </Text>

        <Text style={signature}>
          Com urgência,<br />
          <strong>Equipe Couples Financials</strong>
        </Text>
      </Container>
    </Body>
  </Html>
);

export default PremiumFinalWarningPT;

const main = {
  backgroundColor: '#fef2f2',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  border: '2px solid #dc2626',
};

const h1 = {
  color: '#dc2626',
  fontSize: '26px',
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

const urgentBox = {
  backgroundColor: '#fee2e2',
  border: '3px solid #dc2626',
  borderRadius: '8px',
  margin: '24px 40px',
  padding: '24px',
  textAlign: 'center' as const,
};

const urgentText = {
  color: '#dc2626',
  fontSize: '20px',
  fontWeight: 'bold',
  margin: '0 0 12px 0',
};

const urgentSubtext = {
  color: '#dc2626',
  fontSize: '16px',
  fontWeight: '600',
  margin: '4px 0',
};

const list = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '16px 0',
  padding: '0 40px',
  paddingLeft: '60px',
};

const actionBox = {
  backgroundColor: '#f0f9ff',
  border: '2px solid #0ea5e9',
  borderRadius: '8px',
  margin: '24px 40px',
  padding: '20px',
  textAlign: 'center' as const,
};

const actionText = {
  color: '#0c4a6e',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0 0 8px 0',
};

const actionSubtext = {
  color: '#0c4a6e',
  fontSize: '14px',
  margin: '0',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#dc2626',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '18px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '16px 32px',
  border: 'none',
  boxShadow: '0 4px 8px rgba(220, 38, 38, 0.3)',
};

const infoBox = {
  backgroundColor: '#f0fdf4',
  border: '1px solid #16a34a',
  borderRadius: '8px',
  margin: '24px 40px',
  padding: '16px',
};

const infoText = {
  color: '#166534',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '0',
};

const footerText = {
  color: '#dc2626',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '32px 0 16px 0',
  padding: '0 40px',
  fontWeight: '600',
};

const signature = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '16px 0',
  padding: '0 40px',
  fontWeight: '600',
};