/**
 * Utility functions for handling monetary values with precision
 */

/**
 * Converts a string or number to a precise monetary value
 * Avoids floating point precision issues by working with integers
 */
export const parseMonetaryValue = (value: string | number): number => {
  if (typeof value === 'string') {
    // Remove any non-numeric characters except decimal point
    const cleanValue = value.replace(/[^\d.,]/g, '').replace(',', '.');
    return parseFloat(cleanValue) || 0;
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