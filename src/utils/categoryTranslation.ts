// Centralized category translation utility
import { Language } from '@/contexts/LanguageContext';

interface CategoryTranslations {
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
  
  // Missing categories that need translation
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
  'consorcio': { pt: 'Consórcio', en: 'Consortium', es: 'Consorcio' }
};

// Function to normalize category names (same as used in CategoryManager)
const normalize = (str: string): string => {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
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
  
  if (translation) {
    return translation[language];
  }
  
  // If no translation found, return original name
  return categoryName;
};

export default translateCategoryName;