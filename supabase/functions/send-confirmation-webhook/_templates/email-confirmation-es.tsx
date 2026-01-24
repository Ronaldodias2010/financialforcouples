import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
  Button,
  Hr,
  Img,
} from 'https://esm.sh/@react-email/components@0.0.22'
import * as React from 'https://esm.sh/react@18.3.1'

interface EmailConfirmationProps {
  userEmail: string
  loginUrl: string
}

export const EmailConfirmationES = ({
  userEmail,
  loginUrl,
}: EmailConfirmationProps) => (
  <Html>
    <Head />
    <Preview>Confirma tu dirección de email para activar tu cuenta de Couples Financials</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img
          src="https://couplesfinancials.com/lovable-uploads/couples-financials-logo-new.png"
          width="250"
          height="80"
          alt="Couples Financials"
          style={logo}
        />
        
        <Heading style={h1}>Confirma tu dirección de email</Heading>
        
        <Text style={text}>
          ¡Hola <strong>{userEmail}</strong>! Gracias por registrarte en <strong>Couples Financials</strong>. 
          Para activar tu cuenta, confirma tu dirección de email.
        </Text>
        
        <Button style={button} href={loginUrl}>
          Confirmar Email
        </Button>
        
        <Text style={text}>
          O copia y pega este enlace en tu navegador:
        </Text>
        
        <Text style={{ ...text, wordBreak: 'break-all' as const, fontSize: '14px' }}>
          {loginUrl}
        </Text>
        
        <Hr style={hr} />
        
        <Text style={subtitle}>Después de confirmar tu email, podrás:</Text>
        
        <ul style={list}>
          <li style={listItem}>Gestionar tus cuentas bancarias</li>
          <li style={listItem}>Controlar gastos con tarjetas</li>
          <li style={listItem}>Ver reportes detallados</li>
          <li style={listItem}>Definir metas financieras</li>
          <li style={listItem}>Seguir millas y puntos</li>
          <li style={listItem}>Invitar a tu pareja</li>
        </ul>
        
        <Hr style={hr} />
        
        <Text style={footer}>
          Si no creaste esta cuenta, puedes ignorar este email con seguridad.
        </Text>
        
        <Text style={footer}>
          <strong>Couples Financials</strong> - Gestión financiera inteligente para parejas
        </Text>
      </Container>
    </Body>
  </Html>
)

export default EmailConfirmationES

const main = {
  backgroundColor: '#ffffff',
}

const container = {
  paddingLeft: '12px',
  paddingRight: '12px',
  margin: '0 auto',
}

const logo = {
  margin: '0 auto',
  marginBottom: '32px',
}

const h1 = {
  color: '#333',
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0',
  textAlign: 'center' as const,
}

const text = {
  color: '#333',
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
  fontSize: '16px',
  lineHeight: '24px',
  margin: '16px 0',
  padding: '0 40px',
}

const button = {
  backgroundColor: '#007ee6',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '12px 20px',
  margin: '32px auto',
  maxWidth: '200px',
}

const hr = {
  borderColor: '#e6ebf1',
  margin: '32px 40px',
}

const subtitle = {
  color: '#333',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '32px 0 16px',
  padding: '0 40px',
}

const list = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '24px',
  padding: '0 40px',
  margin: '0',
}

const listItem = {
  margin: '8px 0',
}

const footer = {
  color: '#8898aa',
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
  fontSize: '14px',
  lineHeight: '20px',
  margin: '16px 0',
  padding: '0 40px',
  textAlign: 'center' as const,
}