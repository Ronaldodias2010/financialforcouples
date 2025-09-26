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

interface ApprovalEmailProps {
  partnerName: string;
  referralCode: string;
  rewardAmount: number;
  rewardType: 'monetary' | 'other';
  rewardCurrency?: string;
  rewardDescription?: string;
}

export const ApprovalEmailES = ({ 
  partnerName, 
  referralCode, 
  rewardAmount, 
  rewardType = 'monetary',
  rewardCurrency = 'USD',
  rewardDescription 
}: ApprovalEmailProps) => {
  return React.createElement(
    Html,
    null,
    React.createElement(Head, null),
    React.createElement(Preview, null, "🎉 ¡Tu solicitud de partnership ha sido aprobada!"),
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
          `¡Felicidades, ${partnerName}!`
        ),
        React.createElement(
          Text,
          { style: text },
          "¡Tu solicitud de partnership ha sido aprobada!"
        ),
        React.createElement(
          'div',
          { style: codeSection },
          React.createElement(
            Heading,
            { style: h3 },
            "Tu Código de Referencia"
          ),
          React.createElement(
            'div',
            { style: codeContainer },
            React.createElement(
              'span',
              { style: codeText },
              referralCode
            )
          ),
          React.createElement(
            Text,
            { style: codeDescription },
            "Este es tu código exclusivo para compartir con tu audiencia."
          )
        ),
        React.createElement(
          'div',
          { style: rewardSection },
          React.createElement(
            Heading,
            { style: h3 },
            `${rewardType === 'monetary' ? '💰' : '🎁'} Cómo Funcionan las Recompensas`
          ),
          React.createElement(
            'ul',
            { style: list },
            React.createElement('li', null, "Por cada persona que se registre usando tu código y realice el pago de la ANUALIDAD"),
            React.createElement('li', null, `Recibirás: ${
              rewardType === 'monetary' 
                ? `${rewardCurrency === 'USD' ? '$' : 'R$'} ${rewardAmount.toFixed(2)}` 
                : rewardDescription || `Recompensa: ${rewardAmount}`
            }`),
            React.createElement('li', null, rewardType === 'monetary' ? 'El pago se procesará después de la confirmación del pago del usuario' : 'La recompensa se procesará según los términos acordados'),
            React.createElement('li', null, `Recibirás un reporte mensual con tus ${rewardType === 'monetary' ? 'ganancias' : 'resultados'}`)
          )
        ),
        React.createElement(
          'div',
          { style: instructionsSection },
          React.createElement(
            Heading,
            { style: h3 },
            "📝 Cómo Usar Tu Código"
          ),
          React.createElement(
            'ol',
            { style: list },
            React.createElement('li', null, `Comparte tu código ${referralCode} con tu audiencia`),
            React.createElement('li', null, "Dirigelos a: couplesfinancials.com"),
            React.createElement('li', null, "Durante el registro, deben ingresar tu código en la sección 'Código Promocional'"),
            React.createElement('li', null, "Sigue tus resultados en el panel mensual que te enviaremos")
          )
        ),
        React.createElement(Hr, { style: hr }),
        React.createElement(
          'div',
          { style: supportSection },
          React.createElement(
            Heading,
            { style: h4 },
            "📞 Soporte y Preguntas"
          ),
          React.createElement(
            Text,
            { style: supportText },
            "Contáctanos: contato@couplesfinancials.com",
            React.createElement('br', null),
            "¡Estamos aquí para ayudarte a tener éxito en nuestra asociación!"
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

const codeSection = { 
  backgroundColor: '#f0fdf4', 
  padding: '24px', 
  borderRadius: '8px', 
  marginBottom: '24px', 
  border: '1px solid #bbf7d0' 
};

const codeContainer = { 
  backgroundColor: 'white', 
  padding: '16px', 
  borderRadius: '6px', 
  textAlign: 'center' as const, 
  margin: '16px 0' 
};

const codeText = { 
  fontSize: '24px', 
  fontWeight: 'bold', 
  color: '#059669', 
  letterSpacing: '2px' 
};

const codeDescription = { 
  margin: '16px 0 0 0', 
  color: '#166534', 
  fontSize: '14px' 
};

const rewardSection = { 
  backgroundColor: '#fffbeb', 
  padding: '24px', 
  borderRadius: '8px', 
  marginBottom: '24px', 
  border: '1px solid #fde68a' 
};

const instructionsSection = { 
  backgroundColor: '#f1f5f9', 
  padding: '24px', 
  borderRadius: '8px', 
  marginBottom: '24px' 
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