import { useState, useEffect } from 'react';

const STORAGE_KEY = '2fa_prompt_dismissed';

export function use2FAPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isDismissed, setIsDismissed] = useState<boolean | null>(null); // null = loading
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(STORAGE_KEY);
    setIsDismissed(dismissed === 'true');
    setIsLoaded(true);
  }, []);

  // Only show prompt if loaded AND not dismissed
  const shouldShowPrompt = isLoaded && isDismissed === false;

  const dismissPrompt = (dontAskAgain: boolean) => {
    setShowPrompt(false);
    if (dontAskAgain) {
      localStorage.setItem(STORAGE_KEY, 'true');
      setIsDismissed(true);
    }
  };

  const openPrompt = () => {
    if (isDismissed === false) {
      setShowPrompt(true);
    }
  };

  const resetPrompt = () => {
    localStorage.removeItem(STORAGE_KEY);
    setIsDismissed(false);
  };

  return {
    showPrompt,
    setShowPrompt,
    shouldShowPrompt,
    dismissPrompt,
    openPrompt,
    resetPrompt,
    isDismissed: isDismissed === true,
    isLoaded,
  };
}
