import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = '2fa_verified_session';
const SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 1 day in milliseconds

interface SessionData {
  userId: string;
  verifiedAt: number;
}

export function use2FASession() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const setVerifiedSession = useCallback((userId: string) => {
    const sessionData: SessionData = {
      userId,
      verifiedAt: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionData));
  }, []);

  const isSessionValid = useCallback((userId: string): boolean => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return false;

      const sessionData: SessionData = JSON.parse(stored);
      
      // Check if session is for the same user
      if (sessionData.userId !== userId) return false;
      
      // Check if session is still valid (within 1 day)
      const elapsed = Date.now() - sessionData.verifiedAt;
      return elapsed < SESSION_DURATION_MS;
    } catch {
      return false;
    }
  }, []);

  const clearSession = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return {
    isLoaded,
    setVerifiedSession,
    isSessionValid,
    clearSession,
  };
}
