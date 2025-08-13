/**
 * Enhanced internationalization utilities for global scale
 */

import { format, parseISO, isValid } from 'date-fns';
import { enUS, ptBR, es } from 'date-fns/locale';

export type SupportedLocale = 'en-US' | 'pt-BR' | 'es-ES';
export type CurrencyCode = 'USD' | 'BRL' | 'EUR' | 'GBP' | 'JPY' | 'CAD' | 'AUD' | 'MXN' | 'ARS' | 'CLP' | 'COP' | 'PEN';

// Locale detection and management
export class LocaleManager {
  private static instance: LocaleManager;
  private currentLocale: SupportedLocale = 'en-US';

  static getInstance(): LocaleManager {
    if (!LocaleManager.instance) {
      LocaleManager.instance = new LocaleManager();
    }
    return LocaleManager.instance;
  }

  constructor() {
    this.detectLocale();
  }

  private detectLocale(): void {
    // Try to detect from URL, localStorage, navigator, etc.
    const stored = localStorage.getItem('preferred-locale') as SupportedLocale;
    if (stored && this.isValidLocale(stored)) {
      this.currentLocale = stored;
      return;
    }

    // Detect from browser
    const browserLang = navigator.language;
    if (browserLang.startsWith('pt')) {
      this.currentLocale = 'pt-BR';
    } else if (browserLang.startsWith('es')) {
      this.currentLocale = 'es-ES';
    } else {
      this.currentLocale = 'en-US';
    }

    // Save detected locale
    localStorage.setItem('preferred-locale', this.currentLocale);
  }

  private isValidLocale(locale: string): locale is SupportedLocale {
    return ['en-US', 'pt-BR', 'es-ES'].includes(locale);
  }

  getLocale(): SupportedLocale {
    return this.currentLocale;
  }

  setLocale(locale: SupportedLocale): void {
    this.currentLocale = locale;
    localStorage.setItem('preferred-locale', locale);
    
    // Update document language
    document.documentElement.lang = locale.split('-')[0];
  }

  getDateFnsLocale() {
    switch (this.currentLocale) {
      case 'pt-BR':
        return ptBR;
      case 'es-ES':
        return es;
      default:
        return enUS;
    }
  }
}

// Currency formatting with RTL support
export class CurrencyFormatter {
  private static formatters = new Map<string, Intl.NumberFormat>();

  static getFormatter(locale: SupportedLocale, currency: CurrencyCode): Intl.NumberFormat {
    const key = `${locale}-${currency}`;
    
    if (!this.formatters.has(key)) {
      try {
        const formatter = new Intl.NumberFormat(locale, {
          style: 'currency',
          currency,
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
        this.formatters.set(key, formatter);
      } catch (error) {
        // Fallback to USD if currency not supported
        const formatter = new Intl.NumberFormat(locale, {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
        this.formatters.set(key, formatter);
      }
    }

    return this.formatters.get(key)!;
  }

  static format(amount: number, currency: CurrencyCode, locale?: SupportedLocale): string {
    const currentLocale = locale || LocaleManager.getInstance().getLocale();
    const formatter = this.getFormatter(currentLocale, currency);
    return formatter.format(amount);
  }

  static formatCompact(amount: number, currency: CurrencyCode, locale?: SupportedLocale): string {
    const currentLocale = locale || LocaleManager.getInstance().getLocale();
    
    try {
      const formatter = new Intl.NumberFormat(currentLocale, {
        style: 'currency',
        currency,
        notation: 'compact',
        compactDisplay: 'short',
      });
      return formatter.format(amount);
    } catch (error) {
      // Fallback to regular formatting
      return this.format(amount, currency, locale);
    }
  }
}

// Date formatting with locale support
export class DateFormatter {
  static format(date: Date | string, formatString: string, locale?: SupportedLocale): string {
    const currentLocale = locale || LocaleManager.getInstance().getLocale();
    const localeManager = LocaleManager.getInstance();
    
    let dateObj: Date;
    if (typeof date === 'string') {
      dateObj = parseISO(date);
      if (!isValid(dateObj)) {
        dateObj = new Date(date);
      }
    } else {
      dateObj = date;
    }

    if (!isValid(dateObj)) {
      return 'Invalid Date';
    }

    try {
      return format(dateObj, formatString, { locale: localeManager.getDateFnsLocale() });
    } catch (error) {
      // Fallback to basic formatting
      return dateObj.toLocaleDateString(currentLocale);
    }
  }

  static formatRelative(date: Date | string, locale?: SupportedLocale): string {
    const currentLocale = locale || LocaleManager.getInstance().getLocale();
    
    let dateObj: Date;
    if (typeof date === 'string') {
      dateObj = parseISO(date);
    } else {
      dateObj = date;
    }

    if (!isValid(dateObj)) {
      return 'Invalid Date';
    }

    try {
      const rtf = new Intl.RelativeTimeFormat(currentLocale, { 
        numeric: 'auto',
        style: 'long'
      });

      const now = new Date();
      const diffInMilliseconds = dateObj.getTime() - now.getTime();
      const diffInDays = Math.floor(diffInMilliseconds / (1000 * 60 * 60 * 24));

      if (Math.abs(diffInDays) < 1) {
        const diffInHours = Math.floor(diffInMilliseconds / (1000 * 60 * 60));
        if (Math.abs(diffInHours) < 1) {
          const diffInMinutes = Math.floor(diffInMilliseconds / (1000 * 60));
          return rtf.format(diffInMinutes, 'minute');
        }
        return rtf.format(diffInHours, 'hour');
      }

      if (Math.abs(diffInDays) < 7) {
        return rtf.format(diffInDays, 'day');
      }

      if (Math.abs(diffInDays) < 30) {
        const diffInWeeks = Math.floor(diffInDays / 7);
        return rtf.format(diffInWeeks, 'week');
      }

      const diffInMonths = Math.floor(diffInDays / 30);
      return rtf.format(diffInMonths, 'month');
    } catch (error) {
      return dateObj.toLocaleDateString(currentLocale);
    }
  }
}

// Number formatting for different locales
export class NumberFormatter {
  static format(number: number, locale?: SupportedLocale, options?: Intl.NumberFormatOptions): string {
    const currentLocale = locale || LocaleManager.getInstance().getLocale();
    
    try {
      const formatter = new Intl.NumberFormat(currentLocale, options);
      return formatter.format(number);
    } catch (error) {
      return number.toString();
    }
  }

  static formatPercentage(number: number, locale?: SupportedLocale): string {
    return this.format(number, locale, {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 2,
    });
  }

  static formatDecimal(number: number, locale?: SupportedLocale): string {
    return this.format(number, locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
}

// Text direction and RTL support
export class TextDirectionManager {
  private static rtlLanguages = ['ar', 'he', 'fa', 'ur'];

  static isRTL(locale: string): boolean {
    const language = locale.split('-')[0];
    return this.rtlLanguages.includes(language);
  }

  static getDirection(locale?: SupportedLocale): 'ltr' | 'rtl' {
    const currentLocale = locale || LocaleManager.getInstance().getLocale();
    return this.isRTL(currentLocale) ? 'rtl' : 'ltr';
  }

  static applyDirection(locale?: SupportedLocale): void {
    const direction = this.getDirection(locale);
    document.documentElement.dir = direction;
    document.documentElement.setAttribute('data-direction', direction);
  }
}

// Timezone handling
export class TimezoneManager {
  static getUserTimezone(): string {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  }

  static convertToUserTimezone(date: Date | string): Date {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Date(dateObj.toLocaleString('en-US', { timeZone: this.getUserTimezone() }));
  }

  static formatInTimezone(date: Date | string, timezone: string, locale?: SupportedLocale): string {
    const currentLocale = locale || LocaleManager.getInstance().getLocale();
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    try {
      return dateObj.toLocaleString(currentLocale, { timeZone: timezone });
    } catch (error) {
      return dateObj.toLocaleString(currentLocale);
    }
  }
}

// Export singleton instance
export const localeManager = LocaleManager.getInstance();

// Utility functions
export const formatCurrency = CurrencyFormatter.format;
export const formatCurrencyCompact = CurrencyFormatter.formatCompact;
export const formatDate = DateFormatter.format;
export const formatRelativeDate = DateFormatter.formatRelative;
export const formatNumber = NumberFormatter.format;
export const formatPercentage = NumberFormatter.formatPercentage;
export const formatDecimal = NumberFormatter.formatDecimal;

// Initialize on import
if (typeof window !== 'undefined') {
  TextDirectionManager.applyDirection();
}