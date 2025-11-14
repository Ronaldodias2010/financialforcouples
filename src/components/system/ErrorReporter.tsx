import { useEffect } from 'react';

export const ErrorReporter = () => {
  useEffect(() => {
    // Check for previous errors on mount
    const checkPreviousErrors = () => {
      try {
        const lastError = localStorage.getItem('last_error');
        const lastGlobalError = localStorage.getItem('last_global_error');
        const lastRejection = localStorage.getItem('last_rejection_error');
        
        if (lastError) {
          console.warn('📋 [ErrorReporter] Previous error found:', JSON.parse(lastError));
        }
        if (lastGlobalError) {
          console.warn('📋 [ErrorReporter] Previous global error found:', JSON.parse(lastGlobalError));
        }
        if (lastRejection) {
          console.warn('📋 [ErrorReporter] Previous rejection found:', JSON.parse(lastRejection));
        }
      } catch (e) {
        console.error('[ErrorReporter] Failed to read error logs:', e);
      }
    };

    checkPreviousErrors();

    // Log app initialization
    console.log('🚀 [ErrorReporter] App initialized successfully', {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    });
  }, []);

  return null;
};
