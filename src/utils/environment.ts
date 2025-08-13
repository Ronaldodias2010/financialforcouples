/**
 * Environment detection and configuration for multi-region deployment
 */

export interface Environment {
  name: string;
  isProduction: boolean;
  isDevelopment: boolean;
  isStaging: boolean;
  apiUrl: string;
  supabaseUrl: string;
  region: string;
  features: {
    analytics: boolean;
    debugging: boolean;
    performanceMonitoring: boolean;
    errorReporting: boolean;
  };
}

class EnvironmentManager {
  private static instance: EnvironmentManager;
  private currentEnv: Environment;

  static getInstance(): EnvironmentManager {
    if (!EnvironmentManager.instance) {
      EnvironmentManager.instance = new EnvironmentManager();
    }
    return EnvironmentManager.instance;
  }

  constructor() {
    this.currentEnv = this.detectEnvironment();
  }

  private detectEnvironment(): Environment {
    const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
    const isLovable = hostname.includes('lovable.dev') || hostname.includes('lovable.app');
    const isStaging = hostname.includes('staging') || hostname.includes('dev');
    const isProduction = !isLocalhost && !isLovable && !isStaging;

    // Detect region based on hostname or user location
    const region = this.detectRegion(hostname);

    return {
      name: isProduction ? 'production' : isStaging ? 'staging' : 'development',
      isProduction,
      isDevelopment: isLocalhost || isLovable,
      isStaging,
      apiUrl: this.getApiUrl(hostname),
      supabaseUrl: 'https://elxttabdtddlavhseipz.supabase.co',
      region,
      features: {
        analytics: isProduction,
        debugging: !isProduction,
        performanceMonitoring: true,
        errorReporting: isProduction,
      },
    };
  }

  private detectRegion(hostname: string): string {
    // Default regions for global deployment
    if (hostname.includes('.br') || hostname.includes('brazil')) return 'br';
    if (hostname.includes('.eu') || hostname.includes('europe')) return 'eu';
    if (hostname.includes('.asia') || hostname.includes('asia')) return 'asia';
    
    // Try to detect from user's timezone
    if (typeof window !== 'undefined') {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (timezone.includes('America/Sao_Paulo') || timezone.includes('America/Recife')) return 'br';
      if (timezone.includes('Europe/')) return 'eu';
      if (timezone.includes('Asia/')) return 'asia';
    }

    return 'us'; // Default to US
  }

  private getApiUrl(hostname: string): string {
    if (hostname === 'localhost' || hostname.includes('lovable')) {
      return '';
    }
    
    // Production API URLs based on region
    const region = this.detectRegion(hostname);
    switch (region) {
      case 'br':
        return 'https://api-br.couplesfinancials.com';
      case 'eu':
        return 'https://api-eu.couplesfinancials.com';
      case 'asia':
        return 'https://api-asia.couplesfinancials.com';
      default:
        return 'https://api.couplesfinancials.com';
    }
  }

  getEnvironment(): Environment {
    return this.currentEnv;
  }

  isFeatureEnabled(feature: keyof Environment['features']): boolean {
    return this.currentEnv.features[feature];
  }

  getRegionConfig() {
    const region = this.currentEnv.region;
    
    return {
      currency: this.getRegionCurrency(region),
      locale: this.getRegionLocale(region),
      dateFormat: this.getRegionDateFormat(region),
      numberFormat: this.getRegionNumberFormat(region),
    };
  }

  private getRegionCurrency(region: string): string {
    switch (region) {
      case 'br': return 'BRL';
      case 'eu': return 'EUR';
      case 'asia': return 'USD'; // Default for Asia
      default: return 'USD';
    }
  }

  private getRegionLocale(region: string): string {
    switch (region) {
      case 'br': return 'pt-BR';
      case 'eu': return 'en-GB';
      case 'asia': return 'en-US';
      default: return 'en-US';
    }
  }

  private getRegionDateFormat(region: string): string {
    switch (region) {
      case 'br': return 'dd/MM/yyyy';
      case 'eu': return 'dd/MM/yyyy';
      case 'asia': return 'MM/dd/yyyy';
      default: return 'MM/dd/yyyy';
    }
  }

  private getRegionNumberFormat(region: string): Intl.NumberFormatOptions {
    switch (region) {
      case 'br':
        return {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        };
      case 'eu':
        return {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        };
      default:
        return {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        };
    }
  }
}

// Global instance
export const environmentManager = EnvironmentManager.getInstance();

// Utility functions
export const getEnvironment = () => environmentManager.getEnvironment();
export const isFeatureEnabled = (feature: keyof Environment['features']) => 
  environmentManager.isFeatureEnabled(feature);
export const getRegionConfig = () => environmentManager.getRegionConfig();

// Environment constants
export const ENV = getEnvironment();
export const IS_PRODUCTION = ENV.isProduction;
export const IS_DEVELOPMENT = ENV.isDevelopment;
export const IS_STAGING = ENV.isStaging;
export const REGION = ENV.region;