import { useState, useEffect } from 'react';

const STORAGE_KEY = '2fa_prompt_dismissed';

export function use2FAPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(STORAGE_KEY);
    setIsDismissed(dismissed === 'true');
  }, []);

  const shouldShowPrompt = !isDismissed;

  const dismissPrompt = (dontAskAgain: boolean) => {
    setShowPrompt(false);
    if (dontAskAgain) {
      localStorage.setItem(STORAGE_KEY, 'true');
      setIsDismissed(true);
    }
  };

  const openPrompt = () => {
    if (!isDismissed) {
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
    isDismissed,
  };
}
