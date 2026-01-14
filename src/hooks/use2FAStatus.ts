import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = '2fa_enabled_flag';

/**
 * Hook to track if user has 2FA enabled.
 * This is used to hide the 2FA recommendation banner on the login page
 * once the user has enabled 2FA.
 */
export function use2FAStatus() {
  const [has2FAEnabled, setHas2FAEnabled] = useState<boolean | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    setHas2FAEnabled(stored === 'true');
    setIsLoaded(true);
  }, []);

  const markAs2FAEnabled = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setHas2FAEnabled(true);
  }, []);

  const markAs2FADisabled = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setHas2FAEnabled(false);
  }, []);

  return {
    has2FAEnabled: has2FAEnabled === true,
    isLoaded,
    markAs2FAEnabled,
    markAs2FADisabled,
  };
}
