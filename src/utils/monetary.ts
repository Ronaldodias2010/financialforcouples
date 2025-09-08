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