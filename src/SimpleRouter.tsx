import React from 'react';
import { LanguageProvider } from '@/contexts/LanguageContext';
import TempApp from './TempApp';
import TempAuth from './TempAuth';

const SimpleRouter: React.FC = () => {
  const currentPath = window.location.pathname;
  
  return (
    <LanguageProvider>
      {currentPath === '/auth' ? <TempAuth /> : <TempApp />}
    </LanguageProvider>
  );
};

export default SimpleRouter;