import React, { createContext, useContext, useState, useCallback } from 'react';

export type Language = 'en' | 'pt' | 'es';

interface LanguageContextProps {
  language: Language;
  t: (key: string, params?: Record<string, string | number>) => string;
  setLanguage: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextProps>({
  language: 'pt',
  t: (key: string) => key,
  setLanguage: () => {},
});

const translations = {
  pt: {
    common: {
      confirm: 'Confirmar',
      cancel: 'Cancelar',
    },
    login: {
      title: 'Bem-vindo de volta!',
      subtitle: 'Entre com sua conta Lov para continuar',
      email: 'Email',
      password: 'Senha',
      forgotPassword: 'Esqueceu sua senha?',
      createAccount: 'Criar conta',
    },
    aiRecommendations: {
      title: 'Recomendações da IA',
      subtitle: 'Obtenha insights inteligentes sobre suas finanças e extraia relatórios personalizados',
      analysisPanel: 'Período de Análise',
      from: 'De:',
      to: 'Até:',
      selectDate: 'Selecionar data',
      cashflow: 'Fluxo de Caixa',
      cashflowDesc: 'Acompanhe a movimentação do seu dinheiro.',
      expensesConsolidated: 'Despesas Consolidadas',
      expensesDesc: 'Veja para onde está indo o seu dinheiro.',
      incomeConsolidated: 'Receitas Consolidadas',
      incomeDesc: 'Acompanhe de onde vem o seu dinheiro.',
      taxReport: 'Relatório de Impostos',
      taxDesc: 'Tenha seus impostos em dia.',
      export: 'Exportar Dados',
      aiConsultant: 'Consultor de IA',
      askAnything: 'Pergunte qualquer coisa sobre suas finanças...',
      exampleQuestion: 'Ex: "Quais foram meus gastos com alimentação no último mês?"',
      typePlaceholder: 'Digite sua pergunta...',
      educationalContent: 'Conteúdo Educacional',
      planning: 'Planejamento Financeiro',
      planningDesc: 'Aprenda a planejar suas finanças de forma eficaz.',
      investments: 'Investimentos Inteligentes',
      investmentsDesc: 'Descubra como investir seu dinheiro de forma inteligente.',
      emergency: 'Fundo de Emergência',
      emergencyDesc: 'Saiba como criar e manter um fundo de emergência.',
      analysis: 'Análise Financeira',
      analysisDesc: 'Aprenda a analisar suas finanças para tomar decisões melhores.',
    },
  },
  en: {
    common: {
      confirm: 'Confirm',
      cancel: 'Cancel',
    },
    login: {
      title: 'Welcome back!',
      subtitle: 'Sign in to your Lov account to continue',
      email: 'Email',
      password: 'Password',
      forgotPassword: 'Forgot your password?',
      createAccount: 'Create account',
    },
     aiRecommendations: {
      title: 'AI Recommendations',
      subtitle: 'Get smart insights into your finances and extract custom reports',
      analysisPanel: 'Analysis Period',
      from: 'From:',
      to: 'To:',
      selectDate: 'Select date',
      cashflow: 'Cashflow',
      cashflowDesc: 'Track the movement of your money.',
      expensesConsolidated: 'Consolidated Expenses',
      expensesDesc: 'See where your money is going.',
      incomeConsolidated: 'Consolidated Income',
      incomeDesc: 'Track where your money comes from.',
      taxReport: 'Tax Report',
      taxDesc: 'Keep your taxes up to date.',
      export: 'Export Data',
      aiConsultant: 'AI Consultant',
      askAnything: 'Ask anything about your finances...',
      exampleQuestion: 'Ex: "What were my food expenses last month?"',
      typePlaceholder: 'Type your question...',
      educationalContent: 'Educational Content',
      planning: 'Financial Planning',
      planningDesc: 'Learn how to plan your finances effectively.',
      investments: 'Smart Investments',
      investmentsDesc: 'Discover how to invest your money wisely.',
      emergency: 'Emergency Fund',
      emergencyDesc: 'Learn how to create and maintain an emergency fund.',
      analysis: 'Financial Analysis',
      analysisDesc: 'Learn how to analyze your finances to make better decisions.',
    },
  },
  es: {
    common: {
      confirm: 'Confirmar',
      cancel: 'Cancelar',
    },
    login: {
      title: '¡Bienvenido de nuevo!',
      subtitle: 'Inicia sesión en tu cuenta Lov para continuar',
      email: 'Correo electrónico',
      password: 'Contraseña',
      forgotPassword: '¿Olvidaste tu contraseña?',
      createAccount: 'Crear cuenta',
    },
    aiRecommendations: {
      title: 'Recomendaciones de la IA',
      subtitle: 'Obtenga información inteligente sobre sus finanzas y extraiga informes personalizados',
      analysisPanel: 'Periodo de Análisis',
      from: 'De:',
      to: 'Hasta:',
      selectDate: 'Seleccionar fecha',
      cashflow: 'Flujo de Caja',
      cashflowDesc: 'Realice un seguimiento del movimiento de su dinero.',
      expensesConsolidated: 'Gastos Consolidados',
      expensesDesc: 'Vea a dónde va su dinero.',
      incomeConsolidated: 'Ingresos Consolidados',
      incomeDesc: 'Realice un seguimiento de dónde proviene su dinero.',
      taxReport: 'Informe de Impuestos',
      taxDesc: 'Mantenga sus impuestos al día.',
      export: 'Exportar Datos',
      aiConsultant: 'Consultor de IA',
      askAnything: 'Pregunte cualquier cosa sobre sus finanzas...',
      exampleQuestion: 'Ej: "¿Cuáles fueron mis gastos de comida el mes pasado?"',
      typePlaceholder: 'Escribe tu pregunta...',
      educationalContent: 'Contenido Educativo',
      planning: 'Planificación Financiera',
      planningDesc: 'Aprenda a planificar sus finanzas de manera efectiva.',
      investments: 'Inversiones Inteligentes',
      investmentsDesc: 'Descubra cómo invertir su dinero de manera inteligente.',
      emergency: 'Fondo de Emergencia',
      emergencyDesc: 'Aprenda a crear y mantener un fondo de emergencia.',
      analysis: 'Análisis Financiero',
      analysisDesc: 'Aprenda a analizar sus finanzas para tomar mejores decisiones.',
    },
  },
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('pt');

  const t = useCallback((key: string, params?: Record<string, string | number>): string => {
    const keys = key.split('.');
    let value: any = translations[language];
  
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return key;
      }
    }
  
    if (typeof value === 'string') {
      if (params) {
        Object.entries(params).forEach(([paramKey, paramValue]) => {
          const placeholder = `{{${paramKey}}}`;
          value = value.replace(new RegExp(placeholder, 'g'), String(paramValue));
        });
      }
      return value;
    }
  
    return key;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, t, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
