import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Heading,
  Text,
  Button,
  Hr,
  Img,
} from 'https://esm.sh/@react-email/components@0.0.22';
import React from 'npm:react@18.3.1';

interface CodeUsageProps {
  partnerName: string;
  codeUsed: string;
  newUserEmail: string;
  rewardAmount: number;
  rewardCurrency?: string;
  transactionDate: string;
}

export const CodeUsageES = ({ 
  partnerName, 
  codeUsed, 
  newUserEmail, 
  rewardAmount, 
  rewardCurrency = 'USD',
  transactionDate 
}: CodeUsageProps) => {
  const formattedDate = new Date(transactionDate).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return React.createElement(
    Html,
    null,
    React.createElement(Head, null),
    React.createElement(Preview, null, `💰 ¡Tu código ${codeUsed} fue usado! Nueva comisión disponible`),
    React.createElement(
      Body,
      { style: main },
      React.createElement(
        Container,
        { style: container },
        React.createElement(
          'div',
          { style: header },
          React.createElement(Img, {
            src: "https://elxttabdtddlavhseipz.lovableproject.com/lovable-uploads/1f5e0469-b056-4cf9-9583-919702fa8736.png",
            width: "80",
            height: "80",
            alt: "Couples Financials",
            style: logo
          }),
          React.createElement(
            Heading,
            { style: h1 },
            "Couples Financials"
          )
        ),
        React.createElement(
          Heading,
          { style: h2 },
          `🎉 ¡Felicidades, ${partnerName}!`
        ),
        React.createElement(
          Text,
          { style: text },
          "¡Tu código de referencia fue usado!"
        ),
        React.createElement(
          'div',
          { style: commissionSection },
          React.createElement(
            Heading,
            { style: h3 },
            "💰 Nueva Comisión Registrada"
          ),
          React.createElement(
            'div',
            { style: commissionDetails },
            React.createElement(
              'div',
              { style: detailRow },
              React.createElement('span', { style: detailLabel }, "Código Usado:"),
              React.createElement('span', { style: detailValue }, codeUsed)
            ),
            React.createElement(
              'div',
              { style: detailRow },
              React.createElement('span', { style: detailLabel }, "Nuevo Usuario:"),
              React.createElement('span', { style: detailValue }, newUserEmail)
            ),
            React.createElement(
              'div',
              { style: detailRow },
              React.createElement('span', { style: detailLabel }, "Fecha de Registro:"),
              React.createElement('span', { style: detailValue }, formattedDate)
            ),
            React.createElement(
              'div',
              { style: detailRowFinal },
              React.createElement('span', { style: detailLabel }, "Comisión a Recibir:"),
              React.createElement('span', { style: detailValueFinal }, 
                `${rewardCurrency === 'USD' ? '$' : 'R$'} ${rewardAmount.toFixed(2).replace('.', ',')}`
              )
            )
          )
        ),
        React.createElement(
          'div',
          { style: paymentSection },
          React.createElement(
            Heading,
            { style: h3 },
            "📊 Cómo Funciona el Pago"
          ),
          React.createElement(
            'ul',
            { style: list },
            React.createElement('li', null, "Tu comisión se procesará 30 días después de la fecha de registro"),
            React.createElement('li', null, "Esto garantiza que el período de reembolso haya pasado"),
            React.createElement('li', null, "Recibirás un reporte mensual con todas tus comisiones"),
            React.createElement('li', null, "El pago se realizará vía PIX o transferencia bancaria")
          )
        ),
        React.createElement(
          'div',
          { style: encouragementSection },
          React.createElement(
            Heading,
            { style: h3 },
            "🚀 Sigue Compartiendo"
          ),
          React.createElement(
            Text,
            { style: encouragementText },
            `¡Cuantas más personas usen tu código ${codeUsed}, mayor será tu ingreso mensual!`
          ),
          React.createElement(
            Text,
            { style: encouragementText },
            "Recuerda a tu audiencia visitar couplesfinancials.com y usar tu código durante el registro."
          )
        ),
        React.createElement(Hr, { style: hr }),
        React.createElement(
          'div',
          { style: supportSection },
          React.createElement(
            Heading,
            { style: h4 },
            "📞 Preguntas o Soporte"
          ),
          React.createElement(
            Text,
            { style: supportText },
            "Contáctanos: contato@couplesfinancials.com",
            React.createElement('br', null),
            "¡Estamos aquí para apoyar tu éxito!"
          )
        ),
        React.createElement(
          Text,
          { style: footer },
          "¡Gracias por ser parte de la familia Couples Financials! 🚀"
        )
      )
    )
  );
};

const main = {
  backgroundColor: '#1a1a2e',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
  minHeight: '100vh',
  padding: '20px 0',
};

const container = { 
  backgroundColor: '#16213e', 
  margin: '0 auto', 
  padding: '40px 20px', 
  maxWidth: '600px', 
  borderRadius: '12px', 
  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)' 
};

const header = { 
  display: 'flex', 
  alignItems: 'center', 
  justifyContent: 'center', 
  marginBottom: '32px', 
  gap: '16px' 
};

const logo = { borderRadius: '8px' };

const h1 = { 
  color: '#e94560', 
  fontSize: '28px', 
  fontWeight: 'bold', 
  margin: '0', 
  textAlign: 'center' as const 
};

const h2 = { 
  color: '#ffffff', 
  fontSize: '24px', 
  fontWeight: '600', 
  margin: '32px 0 24px 0', 
  textAlign: 'center' as const 
};

const h3 = { 
  color: '#22c55e', 
  fontSize: '18px', 
  fontWeight: '600', 
  margin: '0 0 16px 0' 
};

const h4 = { 
  color: '#0369a1', 
  fontSize: '16px', 
  fontWeight: '600', 
  margin: '0 0 8px 0' 
};

const text = { 
  color: '#e2e8f0', 
  fontSize: '16px', 
  lineHeight: '24px', 
  margin: '16px 0' 
};

const commissionSection = { 
  backgroundColor: '#f0fdf4', 
  padding: '24px', 
  borderRadius: '8px', 
  marginBottom: '24px', 
  border: '1px solid #bbf7d0' 
};

const commissionDetails = { 
  backgroundColor: 'white', 
  padding: '20px', 
  borderRadius: '6px', 
  margin: '16px 0',
  display: 'grid',
  gap: '12px'
};

const detailRow = {
  display: 'flex',
  justifyContent: 'space-between',
  borderBottom: '1px solid #e5e7eb',
  paddingBottom: '8px'
};

const detailRowFinal = {
  display: 'flex',
  justifyContent: 'space-between',
  paddingTop: '8px'
};

const detailLabel = {
  color: '#6b7280',
  fontWeight: '500'
};

const detailValue = {
  color: '#374151',
  fontWeight: '500'
};

const detailValueFinal = {
  color: '#059669',
  fontWeight: 'bold',
  fontSize: '20px'
};

const paymentSection = { 
  backgroundColor: '#fffbeb', 
  padding: '24px', 
  borderRadius: '8px', 
  marginBottom: '24px', 
  border: '1px solid #fde68a' 
};

const encouragementSection = { 
  backgroundColor: '#f1f5f9', 
  padding: '24px', 
  borderRadius: '8px', 
  marginBottom: '24px' 
};

const encouragementText = {
  color: '#475569',
  margin: '0 0 12px 0'
};

const supportSection = { 
  backgroundColor: '#e0f2fe', 
  padding: '20px', 
  borderRadius: '8px', 
  borderLeft: '4px solid #0284c7' 
};

const list = { 
  color: '#92400e', 
  margin: '0', 
  paddingLeft: '20px' 
};

const supportText = { 
  margin: '0', 
  color: '#0369a1', 
  fontSize: '14px' 
};

const hr = { 
  borderColor: '#334155', 
  margin: '32px 0' 
};

const footer = { 
  color: '#94a3b8', 
  fontSize: '14px', 
  lineHeight: '20px', 
  margin: '32px 0 16px 0', 
  textAlign: 'center' as const 
};