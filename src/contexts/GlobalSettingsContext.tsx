import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useGeolocation, GeolocationData } from '@/hooks/useGeolocation';
import { useCurrencyConverter, CurrencyCode } from '@/hooks/useCurrencyConverter';

export type Language = 'pt' | 'en' | 'es';

interface GlobalSettingsContextType {
  // Location data
  location: GeolocationData;
  loading: boolean;
  isInternational: boolean;
  
  // Language & Currency
  language: Language;
  currency: CurrencyCode;
  setLanguage: (lang: Language) => void;
  setCurrency: (curr: CurrencyCode) => void;
  
  // Currency conversion
  convertPrice: (amount: number, fromCurrency?: CurrencyCode) => number;
  formatPrice: (amount: number, targetCurrency?: CurrencyCode) => string;
  
  // Utilities
  forceLocationUpdate: (newLocation: Partial<GeolocationData>) => void;
  refreshLocation: () => void;
  
  // Translation function
  t: (key: string) => string;
}

const GlobalSettingsContext = createContext<GlobalSettingsContextType | undefined>(undefined);

const translations = {
  pt: {
    'pricing.premium.price': 'R$ 19,90',
    'pricing.free.price': 'R$ 0,00',
    'hero.cta.premium': 'Experimente a versão com IA por R$ 19,90',
    'whatsapp.step1.example': '\\"Gastei R$ 45 no almoço hoje\\"',
    'benefits.title': 'Benefícios',
    'benefits.item1': 'Economize tempo e dinheiro',
    'benefits.item2': 'Organize suas finanças',
    'benefits.item3': 'Tome decisões mais inteligentes',
    'appdemo.title': 'Demonstração do Aplicativo',
    'appdemo.description': 'Veja como o aplicativo funciona na prática',
    'pricing.title': 'Preços',
    'pricing.free.title': 'Grátis',
    'pricing.free.description': 'Para quem está começando',
    'pricing.premium.title': 'Premium',
    'pricing.premium.description': 'Para quem quer tudo',
    'testimonials.title': 'Depoimentos',
    'testimonials.item1': 'O melhor aplicativo para finanças pessoais que já usei!',
    'testimonials.item2': 'Com o aplicativo, consegui economizar muito dinheiro.',
    'testimonials.item3': 'Recomendo o aplicativo para todos!',
    'whatsapp.title': 'Comece a usar agora!',
    'whatsapp.step1': 'Envie uma mensagem para o nosso WhatsApp',
    'whatsapp.step2': 'O nosso robô irá te ajudar a controlar seus gastos',
    'whatsapp.step3': 'Tenha uma vida financeira mais organizada',
    'finalcta.title': 'Experimente agora!',
    'finalcta.description': 'Comece a usar o aplicativo agora mesmo e veja como é fácil controlar suas finanças.',
    'faq.title': 'Perguntas Frequentes',
    'faq.item1.question': 'Como funciona o aplicativo?',
    'faq.item1.answer': 'O aplicativo funciona através de mensagens no WhatsApp. Você envia uma mensagem com o valor gasto e o aplicativo registra o gasto.',
    'faq.item2.question': 'O aplicativo é seguro?',
    'faq.item2.answer': 'Sim, o aplicativo é seguro. Todas as suas informações são criptografadas e armazenadas em servidores seguros.',
    'faq.item3.question': 'Quanto custa o aplicativo?',
    'faq.item3.answer': 'O aplicativo possui uma versão gratuita e uma versão premium. A versão gratuita possui algumas limitações, enquanto a versão premium possui todos os recursos liberados.',
    'footer.copyright': '© 2023 Todos os direitos reservados.',
  },
  en: {
    'pricing.premium.price': '$9.90',
    'pricing.free.price': '$0.00', 
    'hero.cta.premium': 'Try AI version for $9.90',
    'whatsapp.step1.example': '\\"I spent $9 on lunch today\\"',
    'benefits.title': 'Benefits',
    'benefits.item1': 'Save time and money',
    'benefits.item2': 'Organize your finances',
    'benefits.item3': 'Make smarter decisions',
    'appdemo.title': 'App Demo',
    'appdemo.description': 'See how the app works in practice',
    'pricing.title': 'Pricing',
    'pricing.free.title': 'Free',
    'pricing.free.description': 'For those who are starting',
    'pricing.premium.title': 'Premium',
    'pricing.premium.description': 'For those who want everything',
    'testimonials.title': 'Testimonials',
    'testimonials.item1': 'The best app for personal finances I have ever used!',
    'testimonials.item2': 'With the app, I was able to save a lot of money.',
    'testimonials.item3': 'I recommend the app to everyone!',
    'whatsapp.title': 'Start using now!',
    'whatsapp.step1': 'Send a message to our WhatsApp',
    'whatsapp.step2': 'Our robot will help you control your expenses',
    'whatsapp.step3': 'Have a more organized financial life',
    'finalcta.title': 'Try it now!',
    'finalcta.description': 'Start using the app right now and see how easy it is to control your finances.',
    'faq.title': 'Frequently Asked Questions',
    'faq.item1.question': 'How does the app work?',
    'faq.item1.answer': 'The app works through messages on WhatsApp. You send a message with the amount spent and the app records the expense.',
    'faq.item2.question': 'Is the app safe?',
    'faq.item2.answer': 'Yes, the app is safe. All your information is encrypted and stored on secure servers.',
    'faq.item3.question': 'How much does the app cost?',
    'faq.item3.answer': 'The app has a free version and a premium version. The free version has some limitations, while the premium version has all the features released.',
    'footer.copyright': '© 2023 All rights reserved.',
  },
  es: {
    'pricing.premium.price': '$9.90',
    'pricing.free.price': '$0.00',
    'hero.cta.premium': 'Prueba la versión con IA por $9.90',
    'whatsapp.step1.example': '\\"Gasté $9 en el almuerzo hoy\\"',
    'benefits.title': 'Beneficios',
    'benefits.item1': 'Ahorra tiempo y dinero',
    'benefits.item2': 'Organiza tus finanzas',
    'benefits.item3': 'Toma decisiones más inteligentes',
    'appdemo.title': 'Demo de la App',
    'appdemo.description': 'Mira cómo funciona la app en la práctica',
    'pricing.title': 'Precios',
    'pricing.free.title': 'Gratis',
    'pricing.free.description': 'Para aquellos que están empezando',
    'pricing.premium.title': 'Premium',
    'pricing.premium.description': 'Para aquellos que lo quieren todo',
    'testimonials.title': 'Testimonios',
    'testimonials.item1': '¡La mejor app para finanzas personales que he usado!',
    'testimonials.item2': 'Con la app, pude ahorrar mucho dinero.',
    'testimonials.item3': '¡Recomiendo la app a todos!',
    'whatsapp.title': '¡Empieza a usar ahora!',
    'whatsapp.step1': 'Envía un mensaje a nuestro WhatsApp',
    'whatsapp.step2': 'Nuestro robot te ayudará a controlar tus gastos',
    'whatsapp.step3': 'Ten una vida financiera más organizada',
    'finalcta.title': '¡Pruébalo ahora!',
    'finalcta.description': 'Empieza a usar la app ahora mismo y mira lo fácil que es controlar tus finanzas.',
    'faq.title': 'Preguntas Frecuentes',
    'faq.item1.question': '¿Cómo funciona la app?',
    'faq.item1.answer': 'La app funciona a través de mensajes en WhatsApp. Envías un mensaje con la cantidad gastada y la app registra el gasto.',
    'faq.item2.question': '¿Es segura la app?',
    'faq.item2.answer': 'Sí, la app es segura. Toda tu información está encriptada y almacenada en servidores seguros.',
    'faq.item3.question': '¿Cuánto cuesta la app?',
    'faq.item3.answer': 'La app tiene una versión gratuita y una versión premium. La versión gratuita tiene algunas limitaciones, mientras que la versión premium tiene todas las funciones liberadas.',
    'footer.copyright': '© 2023 Todos los derechos reservados.',
  }
};

export function GlobalSettingsProvider({ children }: { children: ReactNode }) {
  const { location, loading, detectLocation, forceUpdate, isInternational } = useGeolocation();
  const { convertCurrency, formatCurrency, CURRENCY_INFO } = useCurrencyConverter();
  
  const [language, setLanguageState] = useState<Language>('pt');
  const [currency, setCurrencyState] = useState<CurrencyCode>('BRL');

  // Update language and currency based on location
  useEffect(() => {
    if (!loading && location) {
      console.log('🌍 Updating settings based on location:', location);
      
      // Set language based on location
      if (location.language && ['pt', 'en', 'es'].includes(location.language)) {
        setLanguageState(location.language as Language);
      }
      
      // Set currency based on location
      if (location.currency && ['BRL', 'USD', 'EUR'].includes(location.currency)) {
        setCurrencyState(location.currency as CurrencyCode);
      }
    }
  }, [location, loading]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('userLanguage', lang);
    console.log('🗣️ Language changed to:', lang);
  };

  const setCurrency = (curr: CurrencyCode) => {
    setCurrencyState(curr);
    localStorage.setItem('userCurrency', curr);
    console.log('💰 Currency changed to:', curr);
  };

  const convertPrice = (amount: number, fromCurrency: CurrencyCode = 'BRL'): number => {
    return convertCurrency(amount, fromCurrency, currency);
  };

  const formatPrice = (amount: number, targetCurrency?: CurrencyCode): string => {
    const targetCurr = targetCurrency || currency;
    return formatCurrency(amount, targetCurr);
  };

  const t = (key: string): string => {
    const langTranslations = translations[language] || translations.pt;
    return langTranslations[key] || key;
  };

  const forceLocationUpdate = (newLocation: Partial<GeolocationData>) => {
    forceUpdate(newLocation);
    
    // Update language and currency if provided
    if (newLocation.language && ['pt', 'en', 'es'].includes(newLocation.language)) {
      setLanguage(newLocation.language as Language);
    }
    if (newLocation.currency && ['BRL', 'USD', 'EUR'].includes(newLocation.currency)) {
      setCurrency(newLocation.currency as CurrencyCode);
    }
  };

  const value = {
    location,
    loading,
    isInternational,
    language,
    currency,
    setLanguage,
    setCurrency,
    convertPrice,
    formatPrice,
    forceLocationUpdate,
    refreshLocation: detectLocation,
    t
  };

  return (
    <GlobalSettingsContext.Provider value={value}>
      {children}
    </GlobalSettingsContext.Provider>
  );
}

export function useGlobalSettings() {
  const context = useContext(GlobalSettingsContext);
  if (context === undefined) {
    throw new Error('useGlobalSettings must be used within a GlobalSettingsProvider');
  }
  return context;
}
