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

const translations = {
  pt: {
    // Hero Section
    'hero.badge': 'Lançamento',
    'hero.title': 'Couples Financials',
    'hero.subtitle': 'Controle suas finanças de forma inteligente',
    'hero.description': 'Idealizado para casais, mas recomendamos para todos. Planeje, economize e invista com ajuda da IA.',
    'hero.cta.free': 'Baixe Gratuitamente',
    'hero.cta.premium': 'Experimente a versão com IA por R$ 19,90',
    
    // Header
    'header.login': 'Entrar',
    'header.comingSoon': 'Funcionalidade em breve.',
    
    // Benefits Section
    'benefits.title': 'Por que escolher o',
    'benefits.subtitle': 'Recursos inovadores para controle financeiro completo',
    'benefits.shared.title': 'Gestão financeira compartilhada ou individual',
    'benefits.shared.description': 'Controle suas finanças sozinho ou compartilhe com seu parceiro',
    'benefits.multicurrency.title': 'Controle em múltiplas moedas',
    'benefits.multicurrency.description': 'Gerencie gastos em diferentes moedas com conversão automática',
    'benefits.ai.title': 'Planejamento inteligente com IA',
    'benefits.ai.description': 'Saiba quanto poupar e onde investir com recomendações personalizadas',
    'benefits.miles.title': 'Ferramenta de milhas inteligente',
    'benefits.miles.description': 'Veja promoções e use suas milhas com inteligência',
    'benefits.voice.title': 'Input por voz via WhatsApp',
    'benefits.voice.description': 'Fale com o robô e registre seus gastos sem digitar',
    'benefits.security.title': 'Segurança e privacidade garantidas',
    'benefits.security.description': 'Seus dados financeiros protegidos com criptografia avançada',
    
    // Dashboard básico
    'dashboard.title': 'Gestão Financeira para Casais',
    'dashboard.subtitle': 'Controle suas finanças de forma inteligente',
    
    // Navigation básico
    'nav.dashboard': 'Dashboard',
    'nav.back': 'Voltar',
    'nav.logout': 'Sair',
  },
  
  en: {
    // Hero Section
    'hero.badge': 'Launch',
    'hero.title': 'Couples Financials',
    'hero.subtitle': 'Control your finances intelligently',
    'hero.description': 'Designed for couples, but we recommend it for everyone. Plan, save and invest with AI help.',
    'hero.cta.free': 'Download for Free',
    'hero.cta.premium': 'Try AI version for $19.90',
    
    // Header
    'header.login': 'Sign in',
    'header.comingSoon': 'Feature coming soon.',
    
    // Benefits Section
    'benefits.title': 'Why choose',
    'benefits.subtitle': 'Innovative features for complete financial control',
    'benefits.shared.title': 'Shared or individual financial management',
    'benefits.shared.description': 'Control your finances alone or share with your partner',
    'benefits.multicurrency.title': 'Multi-currency control',
    'benefits.multicurrency.description': 'Manage expenses in different currencies with automatic conversion',
    'benefits.ai.title': 'AI intelligent planning',
    'benefits.ai.description': 'Know how much to save and where to invest with personalized recommendations',
    'benefits.miles.title': 'Smart miles tool',
    'benefits.miles.description': 'See promotions and use your miles intelligently',
    'benefits.voice.title': 'Voice input via WhatsApp',
    'benefits.voice.description': 'Talk to the bot and record your expenses without typing',
    'benefits.security.title': 'Security and privacy guaranteed',
    'benefits.security.description': 'Your financial data protected with advanced encryption',
    
    // Dashboard básico
    'dashboard.title': 'Financial Management for Couples',
    'dashboard.subtitle': 'Control your finances intelligently',
    
    // Navigation básico
    'nav.dashboard': 'Dashboard',
    'nav.back': 'Back',
    'nav.logout': 'Logout',
  },
  
  es: {
    // Hero Section
    'hero.badge': 'Lanzamiento',
    'hero.title': 'Couples Financials',
    'hero.subtitle': 'Controla tus finanzas de forma inteligente',
    'hero.description': 'Diseñado para parejas, pero lo recomendamos para todos. Planifica, ahorra e invierte con ayuda de IA.',
    'hero.cta.free': 'Descargar Gratis',
    'hero.cta.premium': 'Prueba la versión con IA por $19.90',
    
    // Header
    'header.login': 'Iniciar sesión',
    'header.comingSoon': 'Funcionalidad próximamente.',
    
    // Benefits Section
    'benefits.title': 'Por qué elegir',
    'benefits.subtitle': 'Características innovadoras para control financiero completo',
    'benefits.shared.title': 'Gestión financiera compartida o individual',
    'benefits.shared.description': 'Controla tus finanzas solo o comparte con tu pareja',
    'benefits.multicurrency.title': 'Control en múltiples monedas',
    'benefits.multicurrency.description': 'Gestiona gastos en diferentes monedas con conversión automática',
    'benefits.ai.title': 'Planificación inteligente con IA',
    'benefits.ai.description': 'Sabe cuánto ahorrar y dónde invertir con recomendaciones personalizadas',
    'benefits.miles.title': 'Herramienta de millas inteligente',
    'benefits.miles.description': 'Ve promociones y usa tus millas con inteligencia',
    'benefits.voice.title': 'Entrada por voz vía WhatsApp',
    'benefits.voice.description': 'Habla con el bot y registra tus gastos sin escribir',
    'benefits.security.title': 'Seguridad y privacidad garantizadas',
    'benefits.security.description': 'Tus datos financieros protegidos con encriptación avanzada',
    
    // Dashboard básico
    'dashboard.title': 'Gestión Financiera para Parejas',
    'dashboard.subtitle': 'Controla tus finanzas de forma inteligente',
    
    // Navigation básico
    'nav.dashboard': 'Dashboard',
    'nav.back': 'Atrás',
    'nav.logout': 'Cerrar sesión',
  },
};

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [languageState, setLanguageState] = useState<Language>('pt');
  const [inBrazil, setInBrazil] = useState<boolean>(true);
  const [userPreferred, setUserPreferred] = useState<boolean>(false);

  // Persisted setter that marks user preference
  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    setUserPreferred(true);
    try {
      localStorage.setItem('language', lang);
    } catch {}
  };

  // Initialize language and detect location
  useEffect(() => {
    try {
      const stored = localStorage.getItem('language') as Language | null;
      if (stored) {
        setLanguageState(stored);
        setUserPreferred(true);
      } else {
        const nav = navigator.language || (Array.isArray(navigator.languages) ? navigator.languages[0] : 'en');
        const defaultLang: Language = nav?.startsWith('pt') ? 'pt' : nav?.startsWith('es') ? 'es' : 'en';
        setLanguageState(defaultLang);
      }
    } catch {}

    // Geo-IP detection (fallback to timezone heuristics)
    fetch('https://ipapi.co/json/')
      .then((res) => (res.ok ? res.json() : Promise.reject('geo fetch failed')))
      .then((data) => {
        const isBR = data?.country_code === 'BR';
        setInBrazil(!!isBR);
        if (!isBR && !userPreferred) {
          setLanguageState('en');
        }
      })
      .catch(() => {
        try {
          const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
          const isBR = tz.includes('Sao_Paulo') || tz.includes('America/Sao_Paulo') || tz.includes('America/Fortaleza') || tz.includes('America/Recife') || tz.includes('America/Manaus');
          setInBrazil(isBR);
        } catch {
          setInBrazil(true);
        }
      });
  }, []);

  const t = (key: string): string => {
    return translations[languageState]?.[key] || key;
  };

  const tFor = (lang: Language, key: string): string => {
    return translations[lang]?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language: languageState, setLanguage, t, tFor, inBrazil }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}