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
} from 'npm:@react-email/components@0.0.22';
import React from 'npm:react@18.3.1';

interface MagicLinkProps {
  userEmail: string;
  loginUrl: string;
}

export const MagicLinkES = ({ userEmail, loginUrl }: MagicLinkProps) => {
  return React.createElement(
    Html,
    null,
    React.createElement(Head, null),
    React.createElement(Preview, null, "✅ Email verificado — continuar al pago"),
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
            src: "https://elxttabdtddlavhseipz.lovableproject.com/lovable-uploads/couples-financials-logo-pwa.png",
            width: "60",
            height: "60",
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
          "¡Gracias! Tu email ha sido verificado"
        ),
        React.createElement(
          Text,
          { style: text },
          `Hola ${userEmail}, tu verificación se completó con éxito.`
        ),
        React.createElement(
          Text,
          { style: text },
          "Haz clic en el botón de abajo para continuar de forma segura al pago."
        ),
        React.createElement(
          Button,
          { href: loginUrl, style: button },
          "Ir al pago de forma segura"
        ),
        React.createElement(Hr, { style: hr }),
        React.createElement(
          Text,
          { style: footer },
          "Si no solicitaste este acceso, puedes ignorar este email."
        ),
        React.createElement(
          Text,
          { style: footer },
          "© 2024 Couples Financials. Todos los derechos reservados."
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
const container = { backgroundColor: '#16213e', margin: '0 auto', padding: '40px 20px', maxWidth: '600px', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)' };
const header = { display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '32px', gap: '16px' };
const logo = { borderRadius: '8px' };
const h1 = { color: '#e94560', fontSize: '28px', fontWeight: 'bold', margin: '0', textAlign: 'center' as const };
const h2 = { color: '#ffffff', fontSize: '24px', fontWeight: '600', margin: '32px 0 24px 0', textAlign: 'center' as const };
const text = { color: '#e2e8f0', fontSize: '16px', lineHeight: '24px', margin: '16px 0' };
const button = { backgroundColor: '#22c55e', borderRadius: '8px', color: '#ffffff', fontSize: '16px', fontWeight: '600', textDecoration: 'none', textAlign: 'center' as const, display: 'block', padding: '16px 32px', margin: '32px 0' };
const hr = { borderColor: '#334155', margin: '32px 0' };
const footer = { color: '#94a3b8', fontSize: '14px', lineHeight: '20px', margin: '16px 0', textAlign: 'center' as const };
