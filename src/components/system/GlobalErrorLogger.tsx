import { useEffect } from 'react';

export const GlobalErrorLogger = () => {
  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      console.error('[GlobalError] Uncaught error:', event.error || event.message, event);
    };
    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('[UnhandledRejection] Promise rejected:', event.reason);
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
