/**
 * Centralized branding constants for Couples Financials
 * Version 13 - Unified logo standardization
 */

// Local logo paths (for React components - use as imports or direct paths)
export const LOGO_PRIMARY = "/lovable-uploads/couples-financials-logo-new.png";
export const LOGO_ICON_512 = "/icons/icon-512x512.png?v=13";
export const LOGO_ICON_192 = "/icons/icon-192x192.png?v=13";
export const LOGO_ICON_144 = "/icons/icon-144x144.png?v=13";

// External URL for emails (absolute URL required for email clients)
export const LOGO_EMAIL_URL = "https://couplesfinancials.com/lovable-uploads/couples-financials-logo-new.png";
export const LOGO_EMAIL_FALLBACK = "https://couplesfinancials.com/icons/icon-512x512.png?v=13";

// PWA Icons
export const PWA_ICONS = {
  favicon32: "/icons/favicon-32x32.png?v=13",
  favicon16: "/icons/favicon-16x16.png?v=13",
  icon48: "/icons/icon-48x48.png?v=13",
  icon96: "/icons/icon-96x96.png?v=13",
  icon144: "/icons/icon-144x144.png?v=13",
  icon192: "/icons/icon-192x192.png?v=13",
  icon256: "/icons/icon-256x256.png?v=13",
  icon384: "/icons/icon-384x384.png?v=13",
  icon512: "/icons/icon-512x512.png?v=13",
  maskable192: "/icons/maskable-icon-192x192.png?v=13",
  maskable512: "/icons/maskable-icon-512x512.png?v=13",
  appleTouchIcon: "/icons/apple-touch-icon.png?v=13",
  androidChrome192: "/icons/android-chrome-192x192.png?v=13",
  androidChrome512: "/icons/android-chrome-512x512.png?v=13",
  splash512: "/icons/splash-icon-512x512.png?v=13",
  notification128: "/icons/notification-icon-128x128.png?v=13",
} as const;

// Brand colors (HSL values matching index.css)
export const BRAND_COLORS = {
  primary: "162 48% 45%",
  primaryHover: "162 48% 40%",
  primaryGlow: "162 48% 55%",
  coral: "5 85% 60%",
  background: "222 47% 11%",
  foreground: "210 40% 98%",
} as const;

// Version for cache busting
export const BRANDING_VERSION = "13";
