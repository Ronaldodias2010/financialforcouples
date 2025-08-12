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
    
    // Dashboard
    'dashboard.title': 'Gestão Financeira para Casais',
    'dashboard.subtitle': 'Controle suas finanças de forma inteligente',
    'dashboard.balance': 'Saldo Total',
    'dashboard.income': 'Receitas',
    'dashboard.expenses': 'Despesas',
    'dashboard.addTransaction': 'Adicionar Transação',
    'dashboard.viewMode': 'Modo de Visualização',
    'dashboard.both': 'Ambos',
    'dashboard.user1': 'Usuário 1',
    'dashboard.user2': 'Usuário 2',
    'dashboard.sharedActiveBanner': 'Dashboard compartilhado ativo - mostrando dados de ambos os usuários',
    'dashboard.individualInviteBanner': 'Dashboard individual - convide seu parceiro(a) para compartilhar dados',
    
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.monthlyExpenses': 'Gastos Mensais',
    'nav.monthlyIncome': 'Receitas Mensais',
    'nav.categories': 'Categorias',
    'nav.recurring': 'Gastos Recorrentes',
    'nav.cards': 'Cartões',
    'nav.accounts': 'Contas',
    'nav.profile': 'Perfil',
    'nav.investments': 'Investimentos',
    'nav.mileage': 'Milhagem',
    'nav.back': 'Voltar',
    'nav.admin': 'Admin',
    'nav.subscription': 'Planos',
    'nav.testEmail': 'Teste Email',
    'nav.logout': 'Sair',
    
    // Cards
    'cards.title': 'Gerenciar Cartões',
    'cards.manage': 'Gerenciar Cartões',
    'cards.add': 'Adicionar Cartão',
    'cards.name': 'Nome do Cartão',
    'cards.type': 'Tipo do Cartão',
    'cards.credit': 'Crédito',
    'cards.debit': 'Débito',
    'cards.lastFourDigits': 'Últimos 4 Dígitos',
    'cards.creditLimit': 'Limite de Crédito',
    'cards.currentBalance': 'Saldo Atual',
    'cards.currency': 'Moeda',
    'cards.dueDate': 'Data de Vencimento',
    'cards.selectType': 'Selecione o tipo',
    'cards.selectDay': 'Selecione o dia',
    'cards.adding': 'Adicionando...',
    'cards.addCard': 'Adicionar Cartão',
    
    // Accounts
    'accounts.title': 'Gerenciar Contas',
    'accounts.manage': 'Gerenciar Contas',
    'accounts.add': 'Adicionar Conta',
    'accounts.name': 'Nome da Conta',
    'accounts.type': 'Tipo da Conta',
    'accounts.types.checking': 'Conta Corrente',
    'accounts.types.savings': 'Poupança',
    'accounts.types.investment': 'Investimento',
    'accounts.types.other': 'Outra',
    'accounts.models.personal': 'Pessoal',
    'accounts.models.business': 'Empresarial',
    'accounts.yourAccounts': 'Suas Contas',
    'accounts.noAccounts': 'Nenhuma conta cadastrada',
    'accounts.balance': 'Saldo',
    'accounts.bank': 'Banco',
    'accounts.selectType': 'Selecione o tipo',
    'accounts.adding': 'Adicionando...',
    'accounts.addAccount': 'Adicionar Conta',
    
    // Common
    'common.required': 'obrigatório',
    'common.cancel': 'Cancelar',
    'common.save': 'Salvar',
    'common.edit': 'Editar',
    'common.delete': 'Excluir',
    'common.loading': 'Carregando...',
    'common.search': 'Pesquisar',
    'common.filter': 'Filtrar',
    'common.all': 'Todos',
    'common.none': 'Nenhum',
    'common.select': 'Selecionar',
    'back': 'Voltar',
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
    
    // Dashboard
    'dashboard.title': 'Financial Management for Couples',
    'dashboard.subtitle': 'Control your finances intelligently',
    'dashboard.balance': 'Total Balance',
    'dashboard.income': 'Income',
    'dashboard.expenses': 'Expenses',
    'dashboard.addTransaction': 'Add Transaction',
    'dashboard.viewMode': 'View Mode',
    'dashboard.both': 'Both',
    'dashboard.user1': 'User 1',
    'dashboard.user2': 'User 2',
    'dashboard.sharedActiveBanner': 'Shared dashboard active - showing data from both users',
    'dashboard.individualInviteBanner': 'Individual dashboard - invite your partner to share data',
    
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.monthlyExpenses': 'Monthly Expenses',
    'nav.monthlyIncome': 'Monthly Income',
    'nav.categories': 'Categories',
    'nav.recurring': 'Recurring Expenses',
    'nav.cards': 'Cards',
    'nav.accounts': 'Accounts',
    'nav.profile': 'Profile',
    'nav.investments': 'Investments',
    'nav.mileage': 'Mileage',
    'nav.back': 'Back',
    'nav.admin': 'Admin',
    'nav.subscription': 'Plans',
    'nav.testEmail': 'Test Email',
    'nav.logout': 'Logout',
    
    // Cards
    'cards.title': 'Manage Cards',
    'cards.manage': 'Manage Cards',
    'cards.add': 'Add Card',
    'cards.name': 'Card Name',
    'cards.type': 'Card Type',
    'cards.credit': 'Credit',
    'cards.debit': 'Debit',
    'cards.lastFourDigits': 'Last 4 Digits',
    'cards.creditLimit': 'Credit Limit',
    'cards.currentBalance': 'Current Balance',
    'cards.currency': 'Currency',
    'cards.dueDate': 'Due Date',
    'cards.selectType': 'Select type',
    'cards.selectDay': 'Select day',
    'cards.adding': 'Adding...',
    'cards.addCard': 'Add Card',
    
    // Accounts
    'accounts.title': 'Manage Accounts',
    'accounts.manage': 'Manage Accounts',
    'accounts.add': 'Add Account',
    'accounts.name': 'Account Name',
    'accounts.type': 'Account Type',
    'accounts.types.checking': 'Checking Account',
    'accounts.types.savings': 'Savings',
    'accounts.types.investment': 'Investment',
    'accounts.types.other': 'Other',
    'accounts.models.personal': 'Personal',
    'accounts.models.business': 'Business',
    'accounts.yourAccounts': 'Your Accounts',
    'accounts.noAccounts': 'No accounts registered',
    'accounts.balance': 'Balance',
    'accounts.bank': 'Bank',
    'accounts.selectType': 'Select type',
    'accounts.adding': 'Adding...',
    'accounts.addAccount': 'Add Account',
    
    // Common
    'common.required': 'required',
    'common.cancel': 'Cancel',
    'common.save': 'Save',
    'common.edit': 'Edit',
    'common.delete': 'Delete',
    'common.loading': 'Loading...',
    'common.search': 'Search',
    'common.filter': 'Filter',
    'common.all': 'All',
    'common.none': 'None',
    'common.select': 'Select',
    'back': 'Back',
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
    
    // Dashboard
    'dashboard.title': 'Gestión Financiera para Parejas',
    'dashboard.subtitle': 'Controla tus finanzas de forma inteligente',
    'dashboard.balance': 'Saldo Total',
    'dashboard.income': 'Ingresos',
    'dashboard.expenses': 'Gastos',
    'dashboard.addTransaction': 'Agregar Transacción',
    'dashboard.viewMode': 'Modo de Vista',
    'dashboard.both': 'Ambos',
    'dashboard.user1': 'Usuario 1',
    'dashboard.user2': 'Usuario 2',
    'dashboard.sharedActiveBanner': 'Dashboard compartido activo - mostrando datos de ambos usuarios',
    'dashboard.individualInviteBanner': 'Dashboard individual - invita a tu pareja para compartir datos',
    
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.monthlyExpenses': 'Gastos Mensuales',
    'nav.monthlyIncome': 'Ingresos Mensuales',
    'nav.categories': 'Categorías',
    'nav.recurring': 'Gastos Recurrentes',
    'nav.cards': 'Tarjetas',
    'nav.accounts': 'Cuentas',
    'nav.profile': 'Perfil',
    'nav.investments': 'Inversiones',
    'nav.mileage': 'Millaje',
    'nav.back': 'Atrás',
    'nav.admin': 'Admin',
    'nav.subscription': 'Planes',
    'nav.testEmail': 'Prueba Email',
    'nav.logout': 'Cerrar sesión',
    
    // Cards
    'cards.title': 'Gestionar Tarjetas',
    'cards.manage': 'Gestionar Tarjetas',
    'cards.add': 'Agregar Tarjeta',
    'cards.name': 'Nombre de Tarjeta',
    'cards.type': 'Tipo de Tarjeta',
    'cards.credit': 'Crédito',
    'cards.debit': 'Débito',
    'cards.lastFourDigits': 'Últimos 4 Dígitos',
    'cards.creditLimit': 'Límite de Crédito',
    'cards.currentBalance': 'Saldo Actual',
    'cards.currency': 'Moneda',
    'cards.dueDate': 'Fecha de Vencimiento',
    'cards.selectType': 'Seleccionar tipo',
    'cards.selectDay': 'Seleccionar día',
    'cards.adding': 'Agregando...',
    'cards.addCard': 'Agregar Tarjeta',
    
    // Accounts
    'accounts.title': 'Gestionar Cuentas',
    'accounts.manage': 'Gestionar Cuentas',
    'accounts.add': 'Agregar Cuenta',
    'accounts.name': 'Nombre de Cuenta',
    'accounts.type': 'Tipo de Cuenta',
    'accounts.types.checking': 'Cuenta Corriente',
    'accounts.types.savings': 'Ahorros',
    'accounts.types.investment': 'Inversión',
    'accounts.types.other': 'Otra',
    'accounts.models.personal': 'Personal',
    'accounts.models.business': 'Empresarial',
    'accounts.yourAccounts': 'Tus Cuentas',
    'accounts.noAccounts': 'No hay cuentas registradas',
    'accounts.balance': 'Saldo',
    'accounts.bank': 'Banco',
    'accounts.selectType': 'Seleccionar tipo',
    'accounts.adding': 'Agregando...',
    'accounts.addAccount': 'Agregar Cuenta',
    
    // Common
    'common.required': 'requerido',
    'common.cancel': 'Cancelar',
    'common.save': 'Guardar',
    'common.edit': 'Editar',
    'common.delete': 'Eliminar',
    'common.loading': 'Cargando...',
    'common.search': 'Buscar',
    'common.filter': 'Filtrar',
    'common.all': 'Todos',
    'common.none': 'Ninguno',
    'common.select': 'Seleccionar',
    'back': 'Atrás',
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