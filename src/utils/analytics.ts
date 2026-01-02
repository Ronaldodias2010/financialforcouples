/**
 * GTM Analytics Utility
 * Provides functions to push events to Google Tag Manager dataLayer
 */

// Main event tracking function
export const trackEvent = (eventName: string, params?: Record<string, unknown>) => {
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push({
      event: eventName,
      ...params
    });
    console.log(`[GTM] Event tracked: ${eventName}`, params);
  }
};

// CTA Click events
export const trackCtaClick = (ctaName: string, location: string) => {
  trackEvent('cta_click', {
    cta_name: ctaName,
    cta_location: location
  });
};

// Sign up event
export const trackSignUp = (method: 'email' | 'google') => {
  trackEvent('sign_up', {
    method
  });
};

// Login event
export const trackLogin = (method: 'email' | 'google') => {
  trackEvent('login', {
    method
  });
};

// Begin checkout event
export const trackBeginCheckout = (value: number, currency: string, plan: string) => {
  trackEvent('begin_checkout', {
    value,
    currency,
    plan
  });
};

// Purchase/Conversion event (most important for Google Ads)
export const trackPurchase = (transactionId: string, value: number, currency: string) => {
  trackEvent('purchase', {
    transaction_id: transactionId,
    value,
    currency
  });
};
