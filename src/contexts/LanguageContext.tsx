import React, { createContext, useContext, useState, ReactNode } from 'react';

export type Language = 'pt' | 'en' | 'es';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
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
    
    // App Demo Section
    'demo.title': 'Veja como é fácil usar',
    'demo.subtitle': 'Interface simples e intuitiva para controle financeiro completo',
    'demo.balance.title': 'Saldo total',
    'demo.balance.description': 'Visualize todo seu patrimônio em tempo real',
    'demo.transactions.title': 'Receitas e despesas',
    'demo.transactions.description': 'Controle detalhado de todas suas transações',
    'demo.analysis.title': 'Análise por usuário',
    'demo.analysis.description': 'Relatórios individuais e conjunto para casais',
    'demo.add.title': 'Adição de transações simples',
    'demo.add.description': 'Registre gastos rapidamente com poucos cliques',
    
    // Pricing Section
    'pricing.title': 'Escolha o plano',
    'pricing.title.highlight': 'ideal para você',
    'pricing.subtitle': 'Comece gratuitamente e evolua conforme suas necessidades',
    'pricing.free.name': 'Gratuito',
    'pricing.free.price': 'R$ 0,00',
    'pricing.free.period': 'para sempre',
    'pricing.free.description': 'Perfeito para começar',
    'pricing.free.feature1': 'Gestão básica de finanças',
    'pricing.free.feature2': 'Controle em múltiplas moedas',
    'pricing.free.feature3': 'Análise financeira conjunta ou separada',
    'pricing.free.feature4': 'Multi linguas',
    'pricing.free.feature5': 'Controle de investimentos',
    'pricing.free.feature6': 'Simulador de rentabilidade',
    'pricing.free.feature7': 'Segurança básica',
    'pricing.free.button': 'Começar Grátis',
    'pricing.premium.name': 'Premium com IA',
    'pricing.premium.price': 'R$ 19,90',
    'pricing.premium.period': '/mês',
    'pricing.premium.description': 'Para quem quer mais inteligência',
    'pricing.premium.feature1': 'Tudo do plano gratuito',
    'pricing.premium.feature2': 'Input por voz via WhatsApp',
    'pricing.premium.feature3': 'Controle de milhas com IA',
    'pricing.premium.feature4': 'Planejamento inteligente com IA',
    'pricing.premium.feature5': 'Sugestões de investimento',
    'pricing.premium.feature6': 'Metas financeiras personalizadas',
    'pricing.premium.feature7': 'Análises avançadas',
    'pricing.premium.feature8': 'Suporte prioritário',
    'pricing.premium.button': 'Assinar Premium',
    'pricing.popular': 'Mais Popular',
    'pricing.note': '🔒 Pagamento seguro • ❌ Sem compromisso • 📱 Cancele quando quiser',
    
    // WhatsApp Section
    'whatsapp.title': 'Fale com seu assistente financeiro',
    'whatsapp.subtitle': 'Registre seus gastos usando apenas a voz pelo WhatsApp',
    'whatsapp.feature1': 'Comando por voz intuitivo',
    'whatsapp.feature2': 'Reconhecimento automático de valores',
    'whatsapp.feature3': 'Categorização inteligente',
    'whatsapp.cta': 'Comece agora pelo WhatsApp',
    
    // Final CTA Section
    'finalcta.title': 'Pronto para transformar sua vida financeira?',
    'finalcta.subtitle': 'Baixe o Couples Financials e comece a planejar seu futuro hoje mesmo.',
    'finalcta.free': 'Download Gratuito',
    'finalcta.premium': 'Assinar versão com IA',
    
    // Footer
    'footer.description': 'Controle suas finanças de forma inteligente com o Couples Financials.',
    'footer.product': 'Produto',
    'footer.features': 'Recursos',
    'footer.pricing': 'Preços',
    'footer.download': 'Download',
    'footer.support': 'Suporte',
    'footer.help': 'Ajuda',
    'footer.contact': 'Contato',
    'footer.faq': 'FAQ',
    'footer.legal': 'Legal',
    'footer.privacy': 'Privacidade',
    'footer.terms': 'Termos',
    'footer.rights': '2024 Couples Financials. Todos os direitos reservados.',
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
    
    // App Demo Section
    'demo.title': 'See how easy it is to use',
    'demo.subtitle': 'Simple and intuitive interface for complete financial control',
    'demo.balance.title': 'Total balance',
    'demo.balance.description': 'View all your assets in real time',
    'demo.transactions.title': 'Income and expenses',
    'demo.transactions.description': 'Detailed control of all your transactions',
    'demo.analysis.title': 'User analysis',
    'demo.analysis.description': 'Individual and joint reports for couples',
    'demo.add.title': 'Simple transaction addition',
    'demo.add.description': 'Record expenses quickly with just a few clicks',
    
    // Pricing Section
    'pricing.title': 'Choose the',
    'pricing.title.highlight': 'perfect plan for you',
    'pricing.subtitle': 'Start for free and evolve according to your needs',
    'pricing.free.name': 'Free',
    'pricing.free.price': '$0.00',
    'pricing.free.period': 'forever',
    'pricing.free.description': 'Perfect to get started',
    'pricing.free.feature1': 'Basic financial management',
    'pricing.free.feature2': 'Multi-currency control',
    'pricing.free.feature3': 'Joint or separate financial analysis',
    'pricing.free.feature4': 'Multi languages',
    'pricing.free.feature5': 'Investment control',
    'pricing.free.feature6': 'Profitability simulator',
    'pricing.free.feature7': 'Basic security',
    'pricing.free.button': 'Start Free',
    'pricing.premium.name': 'Premium with AI',
    'pricing.premium.price': '$19.90',
    'pricing.premium.period': '/month',
    'pricing.premium.description': 'For those who want more intelligence',
    'pricing.premium.feature1': 'Everything from free plan',
    'pricing.premium.feature2': 'Voice input via WhatsApp',
    'pricing.premium.feature3': 'AI Miles control',
    'pricing.premium.feature4': 'AI intelligent planning',
    'pricing.premium.feature5': 'Investment suggestions',
    'pricing.premium.feature6': 'Personalized financial goals',
    'pricing.premium.feature7': 'Advanced analytics',
    'pricing.premium.feature8': 'Priority support',
    'pricing.premium.button': 'Subscribe Premium',
    'pricing.popular': 'Most Popular',
    'pricing.note': '🔒 Secure payment • ❌ No commitment • 📱 Cancel anytime',
    
    // WhatsApp Section
    'whatsapp.title': 'Talk to your financial assistant',
    'whatsapp.subtitle': 'Record your expenses using only voice through WhatsApp',
    'whatsapp.feature1': 'Intuitive voice commands',
    'whatsapp.feature2': 'Automatic value recognition',
    'whatsapp.feature3': 'Smart categorization',
    'whatsapp.cta': 'Start now on WhatsApp',
    
    // Final CTA Section
    'finalcta.title': 'Ready to transform your financial life?',
    'finalcta.subtitle': 'Download Couples Financials and start planning your future today.',
    'finalcta.free': 'Free Download',
    'finalcta.premium': 'Subscribe to AI version',
    
    // Footer
    'footer.description': 'Control your finances intelligently with Couples Financials.',
    'footer.product': 'Product',
    'footer.features': 'Features',
    'footer.pricing': 'Pricing',
    'footer.download': 'Download',
    'footer.support': 'Support',
    'footer.help': 'Help',
    'footer.contact': 'Contact',
    'footer.faq': 'FAQ',
    'footer.legal': 'Legal',
    'footer.privacy': 'Privacy',
    'footer.terms': 'Terms',
    'footer.rights': '2024 Couples Financials. All rights reserved.',
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
    
    // App Demo Section
    'demo.title': 'Ve qué fácil es de usar',
    'demo.subtitle': 'Interfaz simple e intuitiva para control financiero completo',
    'demo.balance.title': 'Saldo total',
    'demo.balance.description': 'Visualiza todo tu patrimonio en tiempo real',
    'demo.transactions.title': 'Ingresos y gastos',
    'demo.transactions.description': 'Control detallado de todas tus transacciones',
    'demo.analysis.title': 'Análisis por usuario',
    'demo.analysis.description': 'Informes individuales y conjuntos para parejas',
    'demo.add.title': 'Adición simple de transacciones',
    'demo.add.description': 'Registra gastos rápidamente con pocos clics',
    
    // Pricing Section
    'pricing.title': 'Elige el plan',
    'pricing.title.highlight': 'ideal para ti',
    'pricing.subtitle': 'Comienza gratis y evoluciona según tus necesidades',
    'pricing.free.name': 'Gratuito',
    'pricing.free.price': '$0.00',
    'pricing.free.period': 'para siempre',
    'pricing.free.description': 'Perfecto para comenzar',
    'pricing.free.feature1': 'Gestión básica de finanzas',
    'pricing.free.feature2': 'Control en múltiples monedas',
    'pricing.free.feature3': 'Análisis financiero conjunto o separado',
    'pricing.free.feature4': 'Múltiples idiomas',
    'pricing.free.feature5': 'Control de inversiones',
    'pricing.free.feature6': 'Simulador de rentabilidad',
    'pricing.free.feature7': 'Seguridad básica',
    'pricing.free.button': 'Comenzar Gratis',
    'pricing.premium.name': 'Premium con IA',
    'pricing.premium.price': '$19.90',
    'pricing.premium.period': '/mes',
    'pricing.premium.description': 'Para quienes quieren más inteligencia',
    'pricing.premium.feature1': 'Todo del plan gratuito',
    'pricing.premium.feature2': 'Entrada por voz vía WhatsApp',
    'pricing.premium.feature3': 'Control de millas con IA',
    'pricing.premium.feature4': 'Planificación inteligente con IA',
    'pricing.premium.feature5': 'Sugerencias de inversión',
    'pricing.premium.feature6': 'Metas financieras personalizadas',
    'pricing.premium.feature7': 'Análisis avanzados',
    'pricing.premium.feature8': 'Soporte prioritario',
    'pricing.premium.button': 'Suscribir Premium',
    'pricing.popular': 'Más Popular',
    'pricing.note': '🔒 Pago seguro • ❌ Sin compromiso • 📱 Cancela cuando quieras',
    
    // WhatsApp Section
    'whatsapp.title': 'Habla con tu asistente financiero',
    'whatsapp.subtitle': 'Registra tus gastos usando solo la voz por WhatsApp',
    'whatsapp.feature1': 'Comandos de voz intuitivos',
    'whatsapp.feature2': 'Reconocimiento automático de valores',
    'whatsapp.feature3': 'Categorización inteligente',
    'whatsapp.cta': 'Comienza ahora por WhatsApp',
    
    // Final CTA Section
    'finalcta.title': '¿Listo para transformar tu vida financiera?',
    'finalcta.subtitle': 'Descarga Couples Financials y comienza a planificar tu futuro hoy.',
    'finalcta.free': 'Descarga Gratuita',
    'finalcta.premium': 'Suscribir versión con IA',
    
    // Footer
    'footer.description': 'Controla tus finanzas de forma inteligente con Couples Financials.',
    'footer.product': 'Producto',
    'footer.features': 'Características',
    'footer.pricing': 'Precios',
    'footer.download': 'Descargar',
    'footer.support': 'Soporte',
    'footer.help': 'Ayuda',
    'footer.contact': 'Contacto',
    'footer.faq': 'FAQ',
    'footer.legal': 'Legal',
    'footer.privacy': 'Privacidad',
    'footer.terms': 'Términos',
    'footer.rights': '2024 Couples Financials. Todos los derechos reservados.',
  },
};

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguage] = useState<Language>('pt');

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
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