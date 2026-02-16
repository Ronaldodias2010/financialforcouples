/**
 * Loan amortization calculation utilities
 * Supports Price (fixed installments) and SAC (decreasing installments) systems
 */

export interface LoanInstallment {
  installment_number: number;
  due_date: string; // YYYY-MM-DD
  principal_part: number;
  interest_part: number;
  total_value: number;
  remaining_balance_after: number;
}

export interface LoanCalculationResult {
  installments: LoanInstallment[];
  total_interest: number;
  total_payable: number;
  installment_value: number; // First installment for SAC, fixed for Price
}

/**
 * Calculate Price (French) amortization schedule
 * Fixed monthly installments
 */
function calculatePrice(
  principal: number,
  monthlyRate: number,
  totalInstallments: number,
  firstDate: Date
): LoanCalculationResult {
  const installments: LoanInstallment[] = [];
  
  // PMT formula: P * [r(1+r)^n] / [(1+r)^n - 1]
  let pmt: number;
  if (monthlyRate === 0) {
    pmt = principal / totalInstallments;
  } else {
    const factor = Math.pow(1 + monthlyRate, totalInstallments);
    pmt = principal * (monthlyRate * factor) / (factor - 1);
  }
  
  pmt = Math.round(pmt * 100) / 100;
  
  let remainingBalance = principal;
  let totalInterest = 0;
  
  for (let i = 1; i <= totalInstallments; i++) {
    const interestPart = Math.round(remainingBalance * monthlyRate * 100) / 100;
    let principalPart = Math.round((pmt - interestPart) * 100) / 100;
    
    // Last installment adjustment
    if (i === totalInstallments) {
      principalPart = Math.round(remainingBalance * 100) / 100;
      const adjustedTotal = principalPart + interestPart;
      remainingBalance = 0;
      
      const dueDate = new Date(firstDate);
      dueDate.setMonth(dueDate.getMonth() + (i - 1));
      
      installments.push({
        installment_number: i,
        due_date: formatDate(dueDate),
        principal_part: principalPart,
        interest_part: interestPart,
        total_value: Math.round(adjustedTotal * 100) / 100,
        remaining_balance_after: 0,
      });
      totalInterest += interestPart;
      break;
    }
    
    remainingBalance = Math.round((remainingBalance - principalPart) * 100) / 100;
    totalInterest += interestPart;
    
    const dueDate = new Date(firstDate);
    dueDate.setMonth(dueDate.getMonth() + (i - 1));
    
    installments.push({
      installment_number: i,
      due_date: formatDate(dueDate),
      principal_part: principalPart,
      interest_part: interestPart,
      total_value: pmt,
      remaining_balance_after: remainingBalance,
    });
  }
  
  totalInterest = Math.round(totalInterest * 100) / 100;
  
  return {
    installments,
    total_interest: totalInterest,
    total_payable: Math.round((principal + totalInterest) * 100) / 100,
    installment_value: pmt,
  };
}

/**
 * Calculate SAC amortization schedule
 * Fixed principal, decreasing installments
 */
function calculateSAC(
  principal: number,
  monthlyRate: number,
  totalInstallments: number,
  firstDate: Date
): LoanCalculationResult {
  const installments: LoanInstallment[] = [];
  const fixedPrincipal = Math.round((principal / totalInstallments) * 100) / 100;
  
  let remainingBalance = principal;
  let totalInterest = 0;
  
  for (let i = 1; i <= totalInstallments; i++) {
    const interestPart = Math.round(remainingBalance * monthlyRate * 100) / 100;
    let principalPart = fixedPrincipal;
    
    // Last installment adjustment
    if (i === totalInstallments) {
      principalPart = Math.round(remainingBalance * 100) / 100;
    }
    
    const totalValue = Math.round((principalPart + interestPart) * 100) / 100;
    remainingBalance = Math.round((remainingBalance - principalPart) * 100) / 100;
    if (remainingBalance < 0) remainingBalance = 0;
    
    totalInterest += interestPart;
    
    const dueDate = new Date(firstDate);
    dueDate.setMonth(dueDate.getMonth() + (i - 1));
    
    installments.push({
      installment_number: i,
      due_date: formatDate(dueDate),
      principal_part: principalPart,
      interest_part: interestPart,
      total_value: totalValue,
      remaining_balance_after: remainingBalance,
    });
  }
  
  totalInterest = Math.round(totalInterest * 100) / 100;
  
  return {
    installments,
    total_interest: totalInterest,
    total_payable: Math.round((principal + totalInterest) * 100) / 100,
    installment_value: installments[0]?.total_value || 0,
  };
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Main calculation function
 * @param principal - Loan amount
 * @param annualRate - Annual interest rate in percentage (e.g., 12 = 12%)
 * @param totalInstallments - Number of installments
 * @param firstInstallmentDate - Date of first installment
 * @param amortizationType - 'price' or 'sac'
 */
export function calculateLoanSchedule(
  principal: number,
  annualRate: number,
  totalInstallments: number,
  firstInstallmentDate: Date,
  amortizationType: 'price' | 'sac'
): LoanCalculationResult {
  const monthlyRate = annualRate / 100 / 12;
  
  if (amortizationType === 'sac') {
    return calculateSAC(principal, monthlyRate, totalInstallments, firstInstallmentDate);
  }
  return calculatePrice(principal, monthlyRate, totalInstallments, firstInstallmentDate);
}
