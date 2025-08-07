import React from 'react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { GlobalErrorBoundary } from './GlobalErrorBoundary';

export const SafeTooltipProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <GlobalErrorBoundary>
      <TooltipProvider>
        {children}
      </TooltipProvider>
    </GlobalErrorBoundary>
  );
};
