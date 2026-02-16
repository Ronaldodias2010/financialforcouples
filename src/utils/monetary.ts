/**
 * Utility functions for handling monetary values with precision
 */

/**
 * Converts a string or number to a precise monetary value
 * Avoids floating point precision issues by working with integers
 */
export const parseMonetaryValue = (value: string | number): number => {
  if (typeof value === 'string') {
    let str = value.trim();
    // Remove currency symbols and spaces
    str = str.replace(/[¤$\u20AC£¥R\s]/g, '');
    // Remove any remaining non-numeric chars except . and ,
    str = str.replace(/[^\d.,-]/g, '');
    
    if (!str) return 0;

    const lastComma = str.lastIndexOf(',');
    const lastDot = str.lastIndexOf('.');

    // Auto-detect: if comma appears after dot, comma is decimal (Brazilian: 1.234,56)
    // If dot appears after comma, dot is decimal (US: 1,234.56)
    // If only comma exists, treat as decimal separator
    // If only dot exists, treat as decimal separator
    if (lastComma > lastDot) {
      // Brazilian format: dots are thousands, comma is decimal
      str = str.replace(/\./g, '');
      str = str.replace(',', '.');
    } else if (lastDot > lastComma) {
      // US format: commas are thousands, dot is decimal
      str = str.replace(/,/g, '');
    } else if (lastComma !== -1 && lastDot === -1) {
      // Only comma: treat as decimal (e.g. "21,78")
      str = str.replace(',', '.');
    }
    // If only dot or no separator, parseFloat handles it

    return parseFloat(str) || 0;
  }
  return value || 0;
};

/**
 * Rounds a monetary value to 2 decimal places without precision loss
 */
export const roundMonetaryValue = (value: number): number => {
  return Math.round((value + Number.EPSILON) * 100) / 100;
};

/**
 * Formats a monetary value ensuring consistent precision
 */
export const formatMonetaryValue = (value: number): number => {
  return roundMonetaryValue(parseMonetaryValue(value));
};

/**
 * Adds two monetary values with precision
 * Works with cents (integers) to avoid floating point errors
 */
export const addMonetaryValues = (a: number, b: number): number => {
  const aCents = Math.round(a * 100);
  const bCents = Math.round(b * 100);
  return (aCents + bCents) / 100;
};

/**
 * Subtracts two monetary values with precision
 */
export const subtractMonetaryValues = (a: number, b: number): number => {
  const aCents = Math.round(a * 100);
  const bCents = Math.round(b * 100);
  return (aCents - bCents) / 100;
};

/**
 * Multiplies a monetary value by a multiplier with precision
 */
export const multiplyMonetaryValue = (value: number, multiplier: number): number => {
  const valueCents = Math.round(value * 100);
  const result = Math.round(valueCents * multiplier);
  return result / 100;
};

/**
 * Divides a monetary value by a divisor with precision
 */
export const divideMonetaryValue = (value: number, divisor: number): number => {
  if (divisor === 0) return 0;
  const valueCents = Math.round(value * 100);
  const result = Math.round(valueCents / divisor);
  return result / 100;
};

/**
 * Sums an array of monetary values with precision
 * Avoids accumulation of floating point errors
 */
export const sumMonetaryArray = (values: number[]): number => {
  const totalCents = values.reduce((sum, value) => {
    return sum + Math.round(value * 100);
  }, 0);
  return totalCents / 100;
};