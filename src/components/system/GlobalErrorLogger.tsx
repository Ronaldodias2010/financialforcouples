import { useEffect } from 'react';

export const GlobalErrorLogger = () => {
  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      console.error('[GlobalError] Uncaught error:', event.error || event.message, event);
      
      // Persist error for debugging
      try {
        const errorLog = {
          timestamp: new Date().toISOString(),
          type: 'uncaught_error',
          error: event.error?.toString(),
          message: event.message,
          stack: event.error?.stack,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          userAgent: navigator.userAgent,
        };
        localStorage.setItem('last_global_error', JSON.stringify(errorLog));
      } catch (e) {
        console.error('[GlobalError] Failed to log error:', e);
      }
    };
    
    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('[UnhandledRejection] Promise rejected:', event.reason);
      
      // Persist rejection for debugging
      try {
        const errorLog = {
          timestamp: new Date().toISOString(),
          type: 'unhandled_rejection',
          reason: event.reason?.toString(),
          message: event.reason?.message,
          stack: event.reason?.stack,
          userAgent: navigator.userAgent,
        };
        localStorage.setItem('last_rejection_error', JSON.stringify(errorLog));
      } catch (e) {
        console.error('[UnhandledRejection] Failed to log error:', e);
      }
    };

    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onUnhandledRejection);

    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onUnhandledRejection);
    };
  }, []);

  return null;
};
