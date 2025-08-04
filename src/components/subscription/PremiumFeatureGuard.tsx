import { useState } from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import { UpgradeModal } from './UpgradeModal';

interface PremiumFeatureGuardProps {
  feature: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const PremiumFeatureGuard = ({ feature, children, fallback }: PremiumFeatureGuardProps) => {
  const { hasAccess } = useSubscription();
  const [showUpgrade, setShowUpgrade] = useState(false);

  if (hasAccess(feature)) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <>
      <div onClick={() => setShowUpgrade(true)} className="cursor-pointer opacity-60 hover:opacity-80 transition-opacity">
        {children}
      </div>
      <UpgradeModal 
        isOpen={showUpgrade} 
        onClose={() => setShowUpgrade(false)} 
        feature={feature}
      />
    </>
  );
};