// Centralized category translation utility
import { Language } from '@/contexts/LanguageContext';

interface CategoryTranslations {
  [key: string]: {
    pt: string;
    en: string;
    es: string;
  };
}

interface CategoryDescriptionTranslations {
  [key: string]: {
    pt: string;
    en: string;
    es: string;
  };
}

// Normalized category name mappings
const categoryTranslations: CategoryTranslations = {
  // Income categories
  'salario': { pt: 'Salário', en: 'Salary', es: 'Salario' },
  'salarios': { pt: 'Salários', en: 'Salaries', es: 'Salarios' },
  'freelance': { pt: 'Freelance', en: 'Freelance', es: 'Freelance' },
  'bonus': { pt: 'Bônus', en: 'Bonus', es: 'Bonificación' },
  'investimentos': { pt: 'Investimentos', en: 'Investments', es: 'Inversiones' },
  'investimento': { pt: 'Investimento', en: 'Investment', es: 'Inversión' },
  'vendas': { pt: 'Vendas', en: 'Sales', es: 'Ventas' },
  'aluguel_recebido': { pt: 'Aluguel Recebido', en: 'Rental Income', es: 'Ingresos por Alquiler' },
  'juros': { pt: 'Juros', en: 'Interest', es: 'Intereses' },
  'dividendos': { pt: 'Dividendos', en: 'Dividends', es: 'Dividendos' },
  'dividendo': { pt: 'Dividendo', en: 'Dividend', es: 'Dividendo' },
  'presente': { pt: 'Presente', en: 'Gift', es: 'Regalo' },
  'reembolso': { pt: 'Reembolso', en: 'Refund', es: 'Reembolso' },
  'outros_rendimentos': { pt: 'Outros Rendimentos', en: 'Other Income', es: 'Otros Ingresos' },
  'comissao': { pt: 'Comissão', en: 'Commission', es: 'Comisión' },
  'aposentadoria': { pt: 'Aposentadoria', en: 'Retirement', es: 'Jubilación' },
  'pensao': { pt: 'Pensão', en: 'Pension', es: 'Pensión' },
  'renda_extra': { pt: 'Renda Extra', en: 'Extra Income', es: 'Ingresos Extra' },
  'transferencia_entre_contas': { pt: 'Transferência entre Contas', en: 'Account Transfer', es: 'Transferencia entre Cuentas' },

  // Expense categories
  'alimentacao': { pt: 'Alimentação', en: 'Food', es: 'Alimentación' },
  'transporte': { pt: 'Transporte', en: 'Transportation', es: 'Transporte' },
  'moradia': { pt: 'Moradia', en: 'Housing', es: 'Vivienda' },
  'saude': { pt: 'Saúde', en: 'Health', es: 'Salud' },
  'educacao': { pt: 'Educação', en: 'Education', es: 'Educación' },
  'entretenimento': { pt: 'Entretenimento', en: 'Entertainment', es: 'Entretenimiento' },
  'compras': { pt: 'Compras', en: 'Shopping', es: 'Compras' },
  'servicos': { pt: 'Serviços', en: 'Services', es: 'Servicios' },
  'viagens': { pt: 'Viagens', en: 'Travel', es: 'Viajes' },
  'academia': { pt: 'Academia', en: 'Gym', es: 'Gimnasio' },
  'pets': { pt: 'Pets', en: 'Pets', es: 'Mascotas' },
  'casa_jardim': { pt: 'Casa e Jardim', en: 'Home & Garden', es: 'Casa y Jardín' },
  'combustivel': { pt: 'Combustível', en: 'Fuel', es: 'Combustible' },
  'estacionamento': { pt: 'Estacionamento', en: 'Parking', es: 'Estacionamiento' },
  'manutencao_veiculo': { pt: 'Manutenção de Veículo', en: 'Vehicle Maintenance', es: 'Mantenimiento de Vehículo' },
  'remedios': { pt: 'Remédios', en: 'Medication', es: 'Medicamentos' },
  'consultas_medicas': { pt: 'Consultas Médicas', en: 'Medical Appointments', es: 'Consultas Médicas' },
  'plano_saude': { pt: 'Plano de Saúde', en: 'Health Insurance', es: 'Seguro de Salud' },
  'cursos': { pt: 'Cursos', en: 'Courses', es: 'Cursos' },
  'livros_materiais': { pt: 'Livros e Materiais', en: 'Books & Materials', es: 'Libros y Materiales' },
  'cinema_teatro': { pt: 'Cinema e Teatro', en: 'Cinema & Theater', es: 'Cine y Teatro' },
  'jogos': { pt: 'Jogos', en: 'Games', es: 'Juegos' },
  'streaming': { pt: 'Streaming', en: 'Streaming', es: 'Streaming' },
  'roupas': { pt: 'Roupas', en: 'Clothing', es: 'Ropa' },
  'eletronicos': { pt: 'Eletrônicos', en: 'Electronics', es: 'Electrónicos' },
  'presentes': { pt: 'Presentes', en: 'Gifts', es: 'Regalos' },
  'limpeza': { pt: 'Limpeza', en: 'Cleaning', es: 'Limpieza' },
  'reparos': { pt: 'Reparos', en: 'Repairs', es: 'Reparaciones' },
  'seguro': { pt: 'Seguro', en: 'Insurance', es: 'Seguro' },
  'impostos': { pt: 'Impostos', en: 'Taxes', es: 'Impuestos' },
  'outros_gastos': { pt: 'Outros Gastos', en: 'Other Expenses', es: 'Otros Gastos' },
  
  // Additional categories that need translation
  'contas_basicas': { pt: 'Contas Básicas', en: 'Basic Bills', es: 'Cuentas Básicas' },
  'assinatura': { pt: 'Assinatura', en: 'Subscription', es: 'Suscripción' },
  'beleza': { pt: 'Beleza', en: 'Beauty', es: 'Belleza' },
  'doacao': { pt: 'Doação', en: 'Donation', es: 'Donación' },
  'farmacia': { pt: 'Farmácia', en: 'Pharmacy', es: 'Farmacia' },
  'pagamento_cartao_credito': { pt: 'Pagamento de Cartão de Crédito', en: 'Credit Card Payment', es: 'Pago de Tarjeta de Crédito' },
  'pagamento_de_cartao_de_credito': { pt: 'Pagamento de Cartão de Crédito', en: 'Credit Card Payment', es: 'Pago de Tarjeta de Crédito' },
  'restaurante': { pt: 'Restaurante', en: 'Restaurant', es: 'Restaurante' },
  'telefone': { pt: 'Telefone', en: 'Phone', es: 'Teléfono' },
  'supermercado': { pt: 'Supermercado', en: 'Supermarket', es: 'Supermercado' },
  'utilidades': { pt: 'Utilidades', en: 'Utilities', es: 'Servicios Públicos' },
  'vestuarios': { pt: 'Vestuários', en: 'Clothing', es: 'Ropa' },
  'vestuario': { pt: 'Vestuário', en: 'Clothing', es: 'Ropa' },
  'viagem': { pt: 'Viagem', en: 'Travel', es: 'Viaje' },
  'veiculos': { pt: 'Veículos', en: 'Vehicles', es: 'Vehículos' },
  'veiculos_financiamentos': { pt: 'Veículos & Financiamentos', en: 'Vehicles & Financing', es: 'Vehículos y Financiación' },
  'consorcio': { pt: 'Consórcio', en: 'Consortium', es: 'Consorcio' },
  
  // New categories often missing translations (avoiding duplicates)
  'lazer': { pt: 'Lazer', en: 'Leisure', es: 'Ocio' },
  'financas': { pt: 'Finanças', en: 'Finance', es: 'Finanzas' },
  'outros': { pt: 'Outros', en: 'Others', es: 'Otros' },
  
  // Specific missing category translations reported by user
  'saidas_gastos': { pt: 'Saídas (Gastos)', en: 'Expenses (Outgoing)', es: 'Gastos (Salidas)' },
  'saidas': { pt: 'Saídas', en: 'Expenses', es: 'Gastos' },
  'gastos': { pt: 'Gastos', en: 'Expenses', es: 'Gastos' },
  'compras_pessoais': { pt: 'Compras Pessoais', en: 'Personal Shopping', es: 'Compras Personales' },
  'doacoes_presentes': { pt: 'Doações & Presentes', en: 'Donations & Gifts', es: 'Donaciones y Regalos' },
  'doacoes_e_presentes': { pt: 'Doações & Presentes', en: 'Donations & Gifts', es: 'Donaciones y Regalos' },
  'familia_filhos': { pt: 'Família & Filhos', en: 'Family & Children', es: 'Familia e Hijos' },
  'familia_e_filhos': { pt: 'Família & Filhos', en: 'Family & Children', es: 'Familia e Hijos' },
  'lazer_entretenimento': { pt: 'Lazer & Entretenimento', en: 'Leisure & Entertainment', es: 'Ocio y Entretenimiento' },
  'lazer_e_entretenimento': { pt: 'Lazer & Entretenimento', en: 'Leisure & Entertainment', es: 'Ocio y Entretenimiento' },
  'trabalho_negocios': { pt: 'Trabalho & Negócios', en: 'Work & Business', es: 'Trabajo y Negocios' },
  'trabalho_e_negocios': { pt: 'Trabalho & Negócios', en: 'Work & Business', es: 'Trabajo y Negocios' },
  'entradas_receitas': { pt: 'Entradas (Receitas)', en: 'Income (Revenue)', es: 'Ingresos (Entradas)' },
  'entradas': { pt: 'Entradas', en: 'Income', es: 'Ingresos' },
  'receitas': { pt: 'Receitas', en: 'Revenue', es: 'Ingresos' },
  
  // Additional variations that might exist
  'compras_pessoal': { pt: 'Compras Pessoal', en: 'Personal Shopping', es: 'Compras Personales' },
  'familia': { pt: 'Família', en: 'Family', es: 'Familia' },
  'filhos': { pt: 'Filhos', en: 'Children', es: 'Hijos' },
  'trabalho': { pt: 'Trabalho', en: 'Work', es: 'Trabajo' },
  'negocios': { pt: 'Negócios', en: 'Business', es: 'Negocios' },
  
  // More variations based on actual database content
  'financas_servicos': { pt: 'Finanças & Serviços', en: 'Finance & Services', es: 'Finanzas y Servicios' },
  'financas_e_servicos': { pt: 'Finanças & Serviços', en: 'Finance & Services', es: 'Finanzas y Servicios' },
  'receitas_nao_programadas': { pt: 'Receitas não Programadas', en: 'Unscheduled Income', es: 'Ingresos No Programados' },
  
  // Missing translations reported by user
  'animais_de_estimacao': { pt: 'Animais de Estimação', en: 'Pets', es: 'Mascotas' },
  'beleza_cuidados_pessoais': { pt: 'Beleza & Cuidados Pessoais', en: 'Beauty & Personal Care', es: 'Belleza y Cuidado Personal' },
  'beleza_e_cuidados_pessoais': { pt: 'Beleza & Cuidados Pessoais', en: 'Beauty & Personal Care', es: 'Belleza y Cuidado Personal' },
  'reforma_construcao': { pt: 'Reforma & Construção', en: 'Renovation & Construction', es: 'Renovación y Construcción' },
  'reforma_e_construcao': { pt: 'Reforma & Construção', en: 'Renovation & Construction', es: 'Renovación y Construcción' },
  'tecnologia_assinaturas_digitais': { pt: 'Tecnologia & Assinaturas Digitais', en: 'Technology & Digital Subscriptions', es: 'Tecnología y Suscripciones Digitales' },
  'tecnologia_e_assinaturas_digitais': { pt: 'Tecnologia & Assinaturas Digitais', en: 'Technology & Digital Subscriptions', es: 'Tecnología y Suscripciones Digitales' },
  'receita_extraordinaria': { pt: 'Receita Extraordinária', en: 'Extraordinary Income', es: 'Ingresos Extraordinarios' },
  
  // Withdrawal/Cash categories
  'saque': { pt: 'Saque', en: 'Withdrawal', es: 'Retiro' },
  'withdrawal': { pt: 'Saque', en: 'Withdrawal', es: 'Retiro' },
  'retiro': { pt: 'Saque', en: 'Withdrawal', es: 'Retiro' }
};

// Category description translations
const categoryDescriptionTranslations: CategoryDescriptionTranslations = {
  'gastos_com_animais_de_estimacao': {
    pt: 'Gastos com animais de estimação',
    en: 'Pet expenses',
    es: 'Gastos con mascotas'
  },
  'gastos_com_beleza_e_cuidados_pessoais': {
    pt: 'Gastos com beleza e cuidados pessoais',
    en: 'Beauty and personal care expenses',
    es: 'Gastos en belleza y cuidado personal'
  },
  'gastos_com_reformas_e_construcao': {
    pt: 'Gastos com reformas e construção',
    en: 'Renovation and construction expenses',
    es: 'Gastos en reformas y construcción'
  },
  'gastos_com_tecnologia_e_servicos_digitais': {
    pt: 'Gastos com tecnologia e serviços digitais',
    en: 'Technology and digital services expenses',
    es: 'Gastos en tecnología y servicios digitales'
  },
  'despesas_com_viagens_e_turismo': {
    pt: 'Despesas com viagens e turismo',
    en: 'Travel and tourism expenses',
    es: 'Gastos de viajes y turismo'
  },
  'gastos_com_alimentacao_e_restaurantes': {
    pt: 'Gastos com alimentação e restaurantes',
    en: 'Food and restaurant expenses',
    es: 'Gastos en alimentación y restaurantes'
  },
  'gastos_com_transporte_e_combustivel': {
    pt: 'Gastos com transporte e combustível',
    en: 'Transportation and fuel expenses',
    es: 'Gastos en transporte y combustible'
  },
  'gastos_com_moradia_e_utilidades': {
    pt: 'Gastos com moradia e utilidades',
    en: 'Housing and utilities expenses',
    es: 'Gastos en vivienda y servicios públicos'
  },
  'gastos_com_saude_e_medicina': {
    pt: 'Gastos com saúde e medicina',
    en: 'Health and medical expenses',
    es: 'Gastos en salud y medicina'
  },
  'gastos_com_educacao_e_cursos': {
    pt: 'Gastos com educação e cursos',
    en: 'Education and course expenses',
    es: 'Gastos en educación y cursos'
  },
  'gastos_com_entretenimento_e_lazer': {
    pt: 'Gastos com entretenimento e lazer',
    en: 'Entertainment and leisure expenses',
    es: 'Gastos en entretenimiento y ocio'
  },
  'gastos_com_compras_e_vestuario': {
    pt: 'Gastos com compras e vestuário',
    en: 'Shopping and clothing expenses',
    es: 'Gastos en compras y ropa'
  },
  'gastos_com_servicos_e_taxas': {
    pt: 'Gastos com serviços e taxas',
    en: 'Services and fees expenses',
    es: 'Gastos en servicios y tarifas'
  },
  'rendimentos_do_trabalho': {
    pt: 'Rendimentos do trabalho',
    en: 'Employment income',
    es: 'Ingresos del trabajo'
  },
  'rendimentos_de_investimentos': {
    pt: 'Rendimentos de investimentos',
    en: 'Investment income',
    es: 'Ingresos de inversiones'
  },
  'rendimentos_extras_e_bonus': {
    pt: 'Rendimentos extras e bônus',
    en: 'Extra income and bonuses',
    es: 'Ingresos extra y bonificaciones'
  },
  'rendimentos_de_vendas': {
    pt: 'Rendimentos de vendas',
    en: 'Sales income',
    es: 'Ingresos de ventas'
  },
  'rendimentos_de_aluguel': {
    pt: 'Rendimentos de aluguel',
    en: 'Rental income',
    es: 'Ingresos por alquiler'
  },
  'outros_rendimentos': {
    pt: 'Outros rendimentos',
    en: 'Other income',
    es: 'Otros ingresos'
  }
};

// Function to normalize category names (same as used in CategoryManager)
const normalize = (str: string): string => {
  const normalized = str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
  
  // Debug logging to see normalization results
  console.log(`📝 Normalized "${str}" → "${normalized}"`);
  return normalized;
};

// Add debug logging to see what's being normalized
console.log('Categoria normalizada "Pagamento de Cartão de Crédito":', normalize('Pagamento de Cartão de Crédito'));

/**
 * Translates a category name to the specified language
 * @param categoryName - The original category name (usually in Portuguese)
 * @param language - Target language code
 * @returns Translated category name
 */
export const translateCategoryName = (categoryName: string, language: Language): string => {
  if (!categoryName) return '';
  
  // If already in target language, return as is
  if (language === 'pt') return categoryName;
  
  const normalizedName = normalize(categoryName);
  const translation = categoryTranslations[normalizedName];
  
  // Debug logging for missing translations
  if (!translation) {
    console.log(`🔍 Missing translation for: "${categoryName}" (normalized: "${normalizedName}") to ${language}`);
  }
  
  if (translation) {
    console.log(`✅ Found translation for "${categoryName}": ${translation[language]}`);
    return translation[language];
  }
  
  // If no translation found, return original name
  console.log(`❌ No translation found for "${categoryName}" (normalized: "${normalizedName}")`);
  return categoryName;
};

/**
 * Translates a category description to the specified language
 * @param description - The original category description (usually in Portuguese)
 * @param language - Target language code
 * @returns Translated category description
 */
export const translateCategoryDescription = (description: string, language: Language): string => {
  if (!description) return '';
  
  // If already in target language, return as is
  if (language === 'pt') return description;
  
  const normalizedDescription = normalize(description);
  const translation = categoryDescriptionTranslations[normalizedDescription];
  
  if (translation) {
    return translation[language];
  }
  
  // If no translation found, return original description
  return description;
};

export default translateCategoryName;