import { useMemo } from 'react';
import { TaxReportSummary, DeductibleExpense, TaxableIncome, TaxAsset } from '@/hooks/useIncomeTaxReport';

export type ValidationLevel = 'info' | 'warning' | 'blocking';

export interface TaxValidation {
  id: string;
  rule: string;
  level: ValidationLevel;
  messageKey: string;
  section: string;
  passed: boolean;
  details?: string;
  actionKey?: string;
}

interface UseTaxValidationParams {
  summary: TaxReportSummary;
  taxableIncomes: TaxableIncome[];
  deductibleExpenses: DeductibleExpense[];
  taxAssets: TaxAsset[];
  previousYearSummary?: TaxReportSummary | null;
}

export function useTaxValidation({
  summary,
  taxableIncomes,
  deductibleExpenses,
  taxAssets,
  previousYearSummary,
}: UseTaxValidationParams) {
  const validations = useMemo((): TaxValidation[] => {
    const results: TaxValidation[] = [];

    // 1. Assets vs Income validation
    if (summary.totalAssets > 0 && summary.taxableIncome > 0) {
      const assetsToIncomeRatio = summary.totalAssets / summary.taxableIncome;
      if (assetsToIncomeRatio > 5) {
        results.push({
          id: 'assets_vs_income',
          rule: 'assets_vs_income',
          level: 'warning',
          messageKey: 'tax.validation.assetsVsIncome',
          section: 'assets',
          passed: false,
          details: `Patrimônio de ${formatCurrency(summary.totalAssets)} é ${assetsToIncomeRatio.toFixed(1)}x maior que a renda anual`,
        });
      }
    }

    // 2. Zero income with expenses
    if (summary.taxableIncome === 0 && summary.deductibleExpenses > 10000) {
      results.push({
        id: 'zero_income_expenses',
        rule: 'zero_income_expenses',
        level: 'warning',
        messageKey: 'tax.validation.zeroIncomeExpenses',
        section: 'taxableIncome',
        passed: false,
        details: `Despesas de ${formatCurrency(summary.deductibleExpenses)} sem rendimentos declarados`,
      });
    }

    // 3. Medical expenses above average (15% of income)
    const medicalExpenses = deductibleExpenses
      .filter(e => e.category.toLowerCase().includes('saúde') || e.category.toLowerCase().includes('health'))
      .reduce((sum, e) => sum + e.totalSpent, 0);
    
    if (summary.taxableIncome > 0 && medicalExpenses > summary.taxableIncome * 0.15) {
      const percentage = ((medicalExpenses / summary.taxableIncome) * 100).toFixed(1);
      results.push({
        id: 'medical_above_avg',
        rule: 'medical_above_avg',
        level: 'info',
        messageKey: 'tax.validation.medicalAboveAvg',
        section: 'deductions',
        passed: true,
        details: `Gastos médicos representam ${percentage}% da renda (acima da média de 15%)`,
      });
    }

    // 4. Missing documents on deductibles
    const missingDocs = deductibleExpenses.filter(e => e.status === 'missing_docs');
    if (missingDocs.length > 0) {
      results.push({
        id: 'missing_docs',
        rule: 'missing_docs',
        level: 'warning',
        messageKey: 'tax.validation.missingDocs',
        section: 'deductions',
        passed: false,
        details: `${missingDocs.length} despesa(s) dedutível(eis) sem comprovante`,
        actionKey: 'tax.validation.attachDocs',
      });
    }

    // 5. Deductions exceeding limits
    const exceedsLimit = deductibleExpenses.filter(e => e.status === 'exceeds_limit');
    if (exceedsLimit.length > 0) {
      results.push({
        id: 'exceeds_limit',
        rule: 'exceeds_limit',
        level: 'info',
        messageKey: 'tax.validation.exceedsLimit',
        section: 'deductions',
        passed: true,
        details: `${exceedsLimit.length} categoria(s) excedem o limite legal de dedução`,
      });
    }

    // 6. Income pattern deviation (compared to previous year)
    if (previousYearSummary && previousYearSummary.taxableIncome > 0) {
      const incomeChange = ((summary.taxableIncome - previousYearSummary.taxableIncome) / previousYearSummary.taxableIncome) * 100;
      if (Math.abs(incomeChange) > 30) {
        const direction = incomeChange > 0 ? 'aumento' : 'queda';
        results.push({
          id: 'income_pattern',
          rule: 'income_pattern',
          level: 'info',
          messageKey: 'tax.validation.incomePattern',
          section: 'taxableIncome',
          passed: true,
          details: `${direction} de ${Math.abs(incomeChange).toFixed(0)}% em relação ao ano anterior`,
        });
      }
    }

    // 7. No taxable income declared
    if (taxableIncomes.length === 0) {
      results.push({
        id: 'no_taxable_income',
        rule: 'no_taxable_income',
        level: 'warning',
        messageKey: 'tax.validation.noTaxableIncome',
        section: 'taxableIncome',
        passed: false,
        actionKey: 'tax.validation.addIncome',
      });
    }

    // 8. High value transactions without source
    const highValueUnidentified = taxableIncomes.filter(i => i.amount > 50000 && i.category === 'Outros');
    if (highValueUnidentified.length > 0) {
      const total = highValueUnidentified.reduce((sum, i) => sum + i.amount, 0);
      results.push({
        id: 'high_income_unclassified',
        rule: 'high_income_unclassified',
        level: 'blocking',
        messageKey: 'tax.validation.highIncomeUnclassified',
        section: 'taxableIncome',
        passed: false,
        details: `${formatCurrency(total)} em rendimentos sem classificação adequada`,
        actionKey: 'tax.validation.classifyIncome',
      });
    }

    // 9. Assets declared correctly
    if (taxAssets.length > 0) {
      const assetsWithIssues = taxAssets.filter(a => a.currentValue === 0 && a.previousValue === 0);
      if (assetsWithIssues.length > 0) {
        results.push({
          id: 'assets_zero_value',
          rule: 'assets_zero_value',
          level: 'warning',
          messageKey: 'tax.validation.assetsZeroValue',
          section: 'assets',
          passed: false,
          details: `${assetsWithIssues.length} bem(ns) com valores zerados`,
        });
      }
    }

    return results;
  }, [summary, taxableIncomes, deductibleExpenses, taxAssets, previousYearSummary]);

  const blockingValidations = validations.filter(v => v.level === 'blocking' && !v.passed);
  const warningValidations = validations.filter(v => v.level === 'warning' && !v.passed);
  const infoValidations = validations.filter(v => v.level === 'info');
  
  const hasBlockingIssues = blockingValidations.length > 0;
  const hasWarnings = warningValidations.length > 0;

  return {
    validations,
    blockingValidations,
    warningValidations,
    infoValidations,
    hasBlockingIssues,
    hasWarnings,
    totalIssues: blockingValidations.length + warningValidations.length,
  };
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}
