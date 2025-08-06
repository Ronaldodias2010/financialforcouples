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

interface EmailConfirmationProps {
  userEmail: string;
  loginUrl: string;
}

export const EmailConfirmationEN = ({ userEmail, loginUrl }: EmailConfirmationProps) => {
  return React.createElement(
    Html,
    null,
    React.createElement(Head, null),
    React.createElement(Preview, null, "🎉 Confirm your email address - Couples Financials"),
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
          "Confirm your email address"
        ),
        React.createElement(
          Text,
          { style: text },
          `Hello ${userEmail}!`
        ),
        React.createElement(
          Text,
          { style: text },
          "Thank you for signing up for Couples Financials! To complete your registration and start using our platform, you need to confirm your email address."
        ),
        React.createElement(
          Button,
          { 
            href: loginUrl,
            style: button 
          },
          "Confirm Email"
        ),
        React.createElement(
          Text,
          { style: text },
          "Or copy and paste this link into your browser:"
        ),
        React.createElement(
          Text,
          { style: linkText },
          loginUrl
        ),
        React.createElement(Hr, { style: hr }),
        React.createElement(
          Text,
          { style: text },
          "After confirming your email, you'll have access to:"
        ),
        React.createElement(
          'ul',
          { style: list },
          React.createElement('li', { style: listItem }, "📊 Complete financial dashboard"),
          React.createElement('li', { style: listItem }, "💳 Card and account management"),
          React.createElement('li', { style: listItem }, "📈 Investment tracking"),
          React.createElement('li', { style: listItem }, "🎯 Financial goals"),
          React.createElement('li', { style: listItem }, "✈️ Miles system")
        ),
        React.createElement(Hr, { style: hr }),
        React.createElement(
          Text,
          { style: footer },
          "If you didn't create an account with Couples Financials, you can safely ignore this email."
        ),
        React.createElement(
          Text,
          { style: footer },
          "© 2024 Couples Financials. All rights reserved."
        )
      )
    )
  );
};

// Styles
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
  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
};

const header = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: '32px',
  gap: '16px',
};

const logo = {
  borderRadius: '8px',
};

const h1 = {
  color: '#e94560',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '0',
  textAlign: 'center' as const,
};

const h2 = {
  color: '#ffffff',
  fontSize: '24px',
  fontWeight: '600',
  margin: '32px 0 24px 0',
  textAlign: 'center' as const,
};

const text = {
  color: '#e2e8f0',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '16px 0',
};

const button = {
  backgroundColor: '#e94560',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '16px 32px',
  margin: '32px 0',
  transition: 'all 0.3s ease',
};

const linkText = {
  color: '#64b5f6',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '16px 0',
  wordBreak: 'break-all' as const,
};

const list = {
  color: '#e2e8f0',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '16px 0',
  paddingLeft: '20px',
};

const listItem = {
  margin: '8px 0',
};

const hr = {
  borderColor: '#334155',
  margin: '32px 0',
};

const footer = {
  color: '#94a3b8',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '16px 0',
  textAlign: 'center' as const,
};