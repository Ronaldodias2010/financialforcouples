import React from 'react';
import { GlobalErrorBoundary } from './GlobalErrorBoundary';

export const SafeTooltipProvider = ({ children }: { children: React.ReactNode }) => {
  // Temporarily render children without TooltipProvider to avoid hook crash
  return (
    <GlobalErrorBoundary>
      {children}
    </GlobalErrorBoundary>
  );
};
