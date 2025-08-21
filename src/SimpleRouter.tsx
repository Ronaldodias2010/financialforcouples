import React from 'react';
import { LanguageProvider } from '@/contexts/LanguageContext';
import TempApp from './TempApp';
import TempAuth from './TempAuth';
import CheckoutEmailConfirmation from './pages/CheckoutEmailConfirmation';

const SimpleRouter: React.FC = () => {
  const currentPath = window.location.pathname;
  
  return (
    <LanguageProvider>
      {currentPath === '/auth' ? <TempAuth /> : 
       currentPath === '/checkout-email-confirmation' ? <CheckoutEmailConfirmation /> :
       <TempApp />}
    </LanguageProvider>
  );
};

export default SimpleRouter;