export interface TaxHelpSection {
  tooltipKey: string;
  examples: string[];
  whereToFindKey: string;
  whatCountsKeys: string[];
  whatDoesNotKeys: string[];
  tipKey?: string;
}

export const TAX_HELP_CONTENT: Record<string, TaxHelpSection> = {
  identification: {
    tooltipKey: 'tax.help.identification.tooltip',
    examples: ['CPF', 'Nome completo', 'Data de nascimento', 'Endereço'],
    whereToFindKey: 'tax.help.identification.whereToFind',
    whatCountsKeys: [
      'tax.help.identification.whatCounts.1',
      'tax.help.identification.whatCounts.2',
    ],
    whatDoesNotKeys: [
      'tax.help.identification.whatDoesNot.1',
    ],
  },
  taxableIncome: {
    tooltipKey: 'tax.help.taxableIncome.tooltip',
    examples: ['Salário CLT', 'Pró-labore', 'Freelance', 'Aluguel recebido', '13º salário'],
    whereToFindKey: 'tax.help.taxableIncome.whereToFind',
    whatCountsKeys: [
      'tax.help.taxableIncome.whatCounts.1',
      'tax.help.taxableIncome.whatCounts.2',
      'tax.help.taxableIncome.whatCounts.3',
      'tax.help.taxableIncome.whatCounts.4',
    ],
    whatDoesNotKeys: [
      'tax.help.taxableIncome.whatDoesNot.1',
      'tax.help.taxableIncome.whatDoesNot.2',
      'tax.help.taxableIncome.whatDoesNot.3',
    ],
    tipKey: 'tax.help.taxableIncome.tip',
  },
  exemptIncome: {
    tooltipKey: 'tax.help.exemptIncome.tooltip',
    examples: ['Dividendos', 'Poupança', 'LCI/LCA', 'FGTS', 'Lucro de vendas até R$ 20.000'],
    whereToFindKey: 'tax.help.exemptIncome.whereToFind',
    whatCountsKeys: [
      'tax.help.exemptIncome.whatCounts.1',
      'tax.help.exemptIncome.whatCounts.2',
      'tax.help.exemptIncome.whatCounts.3',
    ],
    whatDoesNotKeys: [
      'tax.help.exemptIncome.whatDoesNot.1',
      'tax.help.exemptIncome.whatDoesNot.2',
    ],
  },
  deductions: {
    tooltipKey: 'tax.help.deductions.tooltip',
    examples: ['Consultas médicas', 'Plano de saúde', 'Escola dos filhos', 'Previdência privada'],
    whereToFindKey: 'tax.help.deductions.whereToFind',
    whatCountsKeys: [
      'tax.help.deductions.whatCounts.1',
      'tax.help.deductions.whatCounts.2',
      'tax.help.deductions.whatCounts.3',
    ],
    whatDoesNotKeys: [
      'tax.help.deductions.whatDoesNot.1',
      'tax.help.deductions.whatDoesNot.2',
      'tax.help.deductions.whatDoesNot.3',
    ],
    tipKey: 'tax.help.deductions.tip',
  },
  assets: {
    tooltipKey: 'tax.help.assets.tooltip',
    examples: ['Imóveis', 'Veículos', 'Investimentos', 'Saldos bancários > R$ 140'],
    whereToFindKey: 'tax.help.assets.whereToFind',
    whatCountsKeys: [
      'tax.help.assets.whatCounts.1',
      'tax.help.assets.whatCounts.2',
      'tax.help.assets.whatCounts.3',
    ],
    whatDoesNotKeys: [
      'tax.help.assets.whatDoesNot.1',
      'tax.help.assets.whatDoesNot.2',
    ],
    tipKey: 'tax.help.assets.tip',
  },
};

export const DEDUCTION_LIMITS_2025 = {
  education: {
    limit: 3561.50,
    perPerson: true,
    labelKey: 'tax.limits.education',
  },
  dependents: {
    limit: 2275.08,
    perPerson: true,
    labelKey: 'tax.limits.dependents',
  },
  health: {
    limit: null, // No limit
    perPerson: false,
    labelKey: 'tax.limits.health',
  },
  privatePension: {
    limit: null, // 12% of taxable income
    percentOfIncome: 12,
    labelKey: 'tax.limits.privatePension',
  },
  simplified: {
    limit: 16754.34,
    percentage: 20,
    labelKey: 'tax.limits.simplified',
  },
};
