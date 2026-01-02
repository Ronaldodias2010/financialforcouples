import { useMemo } from 'react';
import { TaxReportSummary, DeductibleExpense } from './useIncomeTaxReport';

// Tabela IRPF 2025 (ano-calendário 2024)
const IRPF_2025_TABLE = [
  { min: 0, max: 2259.20, rate: 0, deduction: 0 },
  { min: 2259.21, max: 2826.65, rate: 0.075, deduction: 169.44 },
  { min: 2826.66, max: 3751.05, rate: 0.15, deduction: 381.44 },
  { min: 3751.06, max: 4664.68, rate: 0.225, deduction: 662.77 },
  { min: 4664.69, max: Infinity, rate: 0.275, deduction: 896.00 },
];

// Constantes IRPF 2025
const SIMPLIFIED_DISCOUNT_RATE = 0.20;
const SIMPLIFIED_DISCOUNT_LIMIT = 16754.34;
const DEPENDENT_DEDUCTION_MONTHLY = 189.59;
const DEPENDENT_DEDUCTION_ANNUAL = 2275.08;

export interface TaxCalculationInput {
  totalTaxableIncome: number;
  totalExemptIncome: number;
  totalDeductions: number;
  dependentsCount: number;
  inssContribution: number;
  alimonyPaid: number;
}

export interface TaxBracketResult {
  bracket: number;
  rate: number;
  taxBase: number;
  taxDue: number;
  effectiveRate: number;
}

export interface DeclarationTypeResult {
  type: 'simplified' | 'complete';
  discount: number;
  deductionsTotal: number;
  taxBase: number;
  monthlyTaxBase: number;
  taxDue: number;
  effectiveRate: number;
  bracket: TaxBracketResult;
}

export interface TaxCalculationResult {
  // Entradas
  input: TaxCalculationInput;
  
  // Cálculo Simplificado
  simplified: DeclarationTypeResult;
  
  // Cálculo Completo
  complete: DeclarationTypeResult;
  
  // Resultado
  recommended: 'simplified' | 'complete';
  estimatedTax: number;
  estimatedRefund: number;
  savings: number;
  
  // Comparação
  previousYear?: {
    taxDue: number;
    difference: number;
    percentChange: number;
  };
  
  // Metadata
  taxYear: number;
  tableVersion: string;
}

/**
 * Calcula o imposto devido com base na tabela progressiva
 */
function calculateTaxFromTable(monthlyTaxBase: number): TaxBracketResult {
  for (let i = IRPF_2025_TABLE.length - 1; i >= 0; i--) {
    const bracket = IRPF_2025_TABLE[i];
    if (monthlyTaxBase >= bracket.min) {
      const taxDue = Math.max(0, (monthlyTaxBase * bracket.rate) - bracket.deduction);
      const annualTax = taxDue * 12;
      const annualBase = monthlyTaxBase * 12;
      
      return {
        bracket: i + 1,
        rate: bracket.rate,
        taxBase: annualBase,
        taxDue: annualTax,
        effectiveRate: annualBase > 0 ? (annualTax / annualBase) * 100 : 0,
      };
    }
  }
  
  return {
    bracket: 1,
    rate: 0,
    taxBase: monthlyTaxBase * 12,
    taxDue: 0,
    effectiveRate: 0,
  };
}

/**
 * Calcula declaração simplificada (20% de desconto, máximo R$ 16.754,34)
 */
function calculateSimplified(totalTaxableIncome: number): DeclarationTypeResult {
  const discount = Math.min(
    totalTaxableIncome * SIMPLIFIED_DISCOUNT_RATE,
    SIMPLIFIED_DISCOUNT_LIMIT
  );
  
  const taxBase = Math.max(0, totalTaxableIncome - discount);
  const monthlyTaxBase = taxBase / 12;
  const bracket = calculateTaxFromTable(monthlyTaxBase);
  
  return {
    type: 'simplified',
    discount,
    deductionsTotal: discount,
    taxBase,
    monthlyTaxBase,
    taxDue: bracket.taxDue,
    effectiveRate: bracket.effectiveRate,
    bracket,
  };
}

/**
 * Calcula declaração completa (deduções reais)
 */
function calculateComplete(
  totalTaxableIncome: number,
  totalDeductions: number,
  dependentsCount: number,
  inssContribution: number,
  alimonyPaid: number
): DeclarationTypeResult {
  const dependentDeduction = dependentsCount * DEPENDENT_DEDUCTION_ANNUAL;
  const totalLegalDeductions = totalDeductions + dependentDeduction + inssContribution + alimonyPaid;
  
  const taxBase = Math.max(0, totalTaxableIncome - totalLegalDeductions);
  const monthlyTaxBase = taxBase / 12;
  const bracket = calculateTaxFromTable(monthlyTaxBase);
  
  return {
    type: 'complete',
    discount: 0,
    deductionsTotal: totalLegalDeductions,
    taxBase,
    monthlyTaxBase,
    taxDue: bracket.taxDue,
    effectiveRate: bracket.effectiveRate,
    bracket,
  };
}

interface UseTaxCalculationProps {
  summary: TaxReportSummary;
  deductibleExpenses: DeductibleExpense[];
  dependentsCount?: number;
  inssContribution?: number;
  alimonyPaid?: number;
  taxYear: number;
}

export function useTaxCalculation({
  summary,
  deductibleExpenses,
  dependentsCount = 0,
  inssContribution = 0,
  alimonyPaid = 0,
  taxYear,
}: UseTaxCalculationProps): TaxCalculationResult {
  return useMemo(() => {
    const input: TaxCalculationInput = {
      totalTaxableIncome: summary.taxableIncome,
      totalExemptIncome: summary.exemptIncome,
      totalDeductions: summary.deductibleExpenses,
      dependentsCount,
      inssContribution,
      alimonyPaid,
    };
    
    // Calcular ambos os modelos
    const simplified = calculateSimplified(summary.taxableIncome);
    const complete = calculateComplete(
      summary.taxableIncome,
      summary.deductibleExpenses,
      dependentsCount,
      inssContribution,
      alimonyPaid
    );
    
    // Determinar qual é mais vantajosa
    const recommended = simplified.taxDue <= complete.taxDue ? 'simplified' : 'complete';
    const bestOption = recommended === 'simplified' ? simplified : complete;
    const savings = Math.abs(simplified.taxDue - complete.taxDue);
    
    // Calcular estimativa final
    // Assumindo que não há IR retido na fonte por enquanto
    const estimatedTax = bestOption.taxDue;
    const estimatedRefund = 0; // Seria: irRetidoNaFonte - estimatedTax se positivo
    
    return {
      input,
      simplified,
      complete,
      recommended,
      estimatedTax,
      estimatedRefund,
      savings,
      taxYear,
      tableVersion: 'IRPF 2025 (AC 2024)',
    };
  }, [summary, dependentsCount, inssContribution, alimonyPaid, taxYear]);
}

/**
 * Formata o valor para exibição em BRL
 */
export function formatTaxCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

/**
 * Retorna a descrição da faixa de imposto
 */
export function getTaxBracketDescription(bracket: number): string {
  const descriptions: Record<number, string> = {
    1: 'Isento',
    2: '7,5%',
    3: '15%',
    4: '22,5%',
    5: '27,5%',
  };
  return descriptions[bracket] || 'N/A';
}
