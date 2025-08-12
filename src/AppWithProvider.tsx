import React from 'react';
import { LanguageProvider } from '@/contexts/LanguageContext';
import App from './App';

const AppWithProvider: React.FC = () => {
  return (
    <LanguageProvider>
      <App />
    </LanguageProvider>
  );
};

export default AppWithProvider;