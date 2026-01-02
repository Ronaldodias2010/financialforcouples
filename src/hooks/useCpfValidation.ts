import { useState, useCallback } from 'react';

export interface CpfValidationResult {
  isValid: boolean;
  errorMessage: string | null;
  formattedCpf: string;
}

// Validate CPF checksum digits
function validateCpfDigits(cpf: string): boolean {
  // Remove non-digits
  const cleanCpf = cpf.replace(/\D/g, '');
  
  if (cleanCpf.length !== 11) return false;
  
  // Check for known invalid patterns (all same digits)
  if (/^(\d)\1{10}$/.test(cleanCpf)) return false;
  
  // Calculate first check digit
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCpf.charAt(i)) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCpf.charAt(9))) return false;
  
  // Calculate second check digit
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCpf.charAt(i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCpf.charAt(10))) return false;
  
  return true;
}

// Format CPF as XXX.XXX.XXX-XX
export function formatCpf(value: string): string {
  const cleanValue = value.replace(/\D/g, '').slice(0, 11);
  
  if (cleanValue.length <= 3) {
    return cleanValue;
  } else if (cleanValue.length <= 6) {
    return `${cleanValue.slice(0, 3)}.${cleanValue.slice(3)}`;
  } else if (cleanValue.length <= 9) {
    return `${cleanValue.slice(0, 3)}.${cleanValue.slice(3, 6)}.${cleanValue.slice(6)}`;
  } else {
    return `${cleanValue.slice(0, 3)}.${cleanValue.slice(3, 6)}.${cleanValue.slice(6, 9)}-${cleanValue.slice(9)}`;
  }
}

// Unformat CPF (remove dots and dash)
export function unformatCpf(cpf: string): string {
  return cpf.replace(/\D/g, '');
}

export function useCpfValidation() {
  const [validationResult, setValidationResult] = useState<CpfValidationResult>({
    isValid: true,
    errorMessage: null,
    formattedCpf: ''
  });

  const validateCpf = useCallback((cpf: string): CpfValidationResult => {
    const cleanCpf = cpf.replace(/\D/g, '');
    const formatted = formatCpf(cpf);
    
    // Empty is valid (optional field)
    if (cleanCpf.length === 0) {
      const result = { isValid: true, errorMessage: null, formattedCpf: '' };
      setValidationResult(result);
      return result;
    }
    
    // Incomplete CPF
    if (cleanCpf.length < 11) {
      const result = { 
        isValid: false, 
        errorMessage: 'CPF incompleto', 
        formattedCpf: formatted 
      };
      setValidationResult(result);
      return result;
    }
    
    // Invalid checksum
    if (!validateCpfDigits(cleanCpf)) {
      const result = { 
        isValid: false, 
        errorMessage: 'CPF inválido', 
        formattedCpf: formatted 
      };
      setValidationResult(result);
      return result;
    }
    
    // Valid CPF
    const result = { isValid: true, errorMessage: null, formattedCpf: formatted };
    setValidationResult(result);
    return result;
  }, []);

  const handleCpfChange = useCallback((value: string): string => {
    const formatted = formatCpf(value);
    validateCpf(formatted);
    return formatted;
  }, [validateCpf]);

  return {
    validationResult,
    validateCpf,
    handleCpfChange,
    formatCpf,
    unformatCpf
  };
}
