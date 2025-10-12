import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

export type Language = 'pt' | 'en' | 'es';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  tFor: (lang: Language, key: string) => string;
  inBrazil: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Basic translations - keep only essential ones
const translations: Record<Language, Record<string, string>> = {
  pt: {
    'hero.title': 'Couples Financials',
    'hero.subtitle': 'Controle suas finanças de forma inteligente',
    'header.login': 'Entrar',
    'dashboard.title': 'Dashboard',
    'dashboard.balance': 'Saldo',
    'dashboard.income': 'Receitas',
    'dashboard.expenses': 'Despesas',
  },
  en: {
    'hero.title': 'Couples Financials',
    'hero.subtitle': 'Control your finances intelligently',
    'header.login': 'Login',
    'dashboard.title': 'Dashboard',
    'dashboard.balance': 'Balance',
    'dashboard.income': 'Income',
    'dashboard.expenses': 'Expenses',
  },
  es: {
    'hero.title': 'Couples Financials',
    'hero.subtitle': 'Controla tus finanzas de forma inteligente',
    'header.login': 'Entrar',
    'dashboard.title': 'Dashboard',
    'dashboard.balance': 'Saldo',
    'dashboard.income': 'Ingresos',
    'dashboard.expenses': 'Gastos',
  }
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>('pt');
  const [inBrazil, setInBrazil] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('language');
    if (stored && ['pt', 'en', 'es'].includes(stored)) {
      setLanguage(stored as Language);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const t = (key: string): string => {
    return translations[language]?.[key] || key;
  };

  const tFor = (lang: Language, key: string): string => {
    return translations[lang]?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, tFor, inBrazil }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};
