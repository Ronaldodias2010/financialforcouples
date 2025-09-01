import { format } from "date-fns";
import { ptBR, enUS, es } from "date-fns/locale";

/**
 * Parses a date string (YYYY-MM-DD) as a local date instead of UTC
 * This prevents the common timezone shift issue where dates appear one day earlier
 */
export const parseLocalDate = (dateString: string): Date => {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
};

/**
 * Formats a date string as a local date with the given format and locale
 */
export const formatLocalDate = (
  dateString: string, 
  formatStr: string = "dd/MM/yyyy",
  language: 'pt' | 'en' | 'es' = 'pt'
): string => {
  const locale = getLocaleForLanguage(language);
  const date = parseLocalDate(dateString);
  return format(date, formatStr, { locale });
};

/**
 * Gets the appropriate date-fns locale for the given language
 */
export const getLocaleForLanguage = (language: 'pt' | 'en' | 'es') => {
  switch (language) {
    case 'en': return enUS;
    case 'es': return es;
    default: return ptBR;
  }
};

/**
 * Creates a date string in YYYY-MM-DD format for today in local timezone
 * Use this instead of new Date().toISOString().split('T')[0] to avoid timezone issues
 */
export const getTodayLocalDateString = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Gets the start and end dates for a given month (YYYY-MM format)
 * Returns proper date range to avoid invalid dates like 2025-02-31
 */
export const getMonthDateRange = (monthStr: string): { startDate: string; endDate: string } => {
  const [year, month] = monthStr.split('-').map(Number);
  
  // Create start date (first day of month)
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  
  // Create end date (last day of month) 
  const lastDay = new Date(year, month, 0).getDate(); // month is 0-indexed here, so this gets last day of the month
  const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  
  return { startDate, endDate };
};