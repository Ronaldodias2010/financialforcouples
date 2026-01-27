import { useState, useEffect } from 'react';
import { Shield, ShieldCheck, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useLanguage } from '@/hooks/useLanguage';
import { use2FA, TwoFactorMethod } from '@/hooks/use2FA';
import { use2FAStatus } from '@/hooks/use2FAStatus';
import { TwoFactorWizard } from './TwoFactorWizard';
import { TwoFactorSetup } from './TwoFactorSetup';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface TwoFactorToggleProps {
  variant?: 'button' | 'badge' | 'compact';
  showLabel?: boolean;
}

export function TwoFactorToggle({ variant = 'button', showLabel = true }: TwoFactorToggleProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { isEnabled, isLoading, method, disable2FA, fetchSettings } = use2FA();
  const { markAs2FAEnabled, markAs2FADisabled } = use2FAStatus();
  
  const [showWizard, setShowWizard] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<TwoFactorMethod>('totp');
  const [isDisabling, setIsDisabling] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSelectMethod = (m: TwoFactorMethod) => {
    setSelectedMethod(m);
    setShowWizard(false);
    setShowSetup(true);
  };

  const handleSetupComplete = () => {
    markAs2FAEnabled();
    setShowSetup(false);
    toast({
      title: t('2fa.enabled.title'),
      description: t('2fa.enabled.description'),
    });
    fetchSettings();
  };

  const handleDisable = async () => {
    setIsDisabling(true);
    try {
      const success = await disable2FA();
      if (success) {
        markAs2FADisabled();
        toast({
          title: t('2fa.disabled.title'),
          description: t('2fa.disabled.description'),
        });
      } else {
        toast({
          variant: 'destructive',
          title: t('2fa.error.title'),
          description: t('2fa.error.disableFailed'),
        });
      }
    } finally {
      setIsDisabling(false);
    }
  };

  const handleToggle = () => {
    if (isEnabled) {
      handleDisable();
    } else {
      setShowWizard(true);
    }
  };

  const handleOpenSettings = () => {
    navigate('/security-settings');
  };

  if (isLoading) {
    return (
      <Button variant="outline" size="sm" disabled>
        <Loader2 className="h-4 w-4 animate-spin" />
      </Button>
    );
  }

  const getMethodLabel = (m: TwoFactorMethod) => {
    switch (m) {
      case 'totp': return t('2fa.method.totp');
      case 'sms': return t('2fa.method.sms');
      case 'email': return t('2fa.method.email');
      default: return '';
    }
  };

  if (variant === 'badge') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge 
              variant={isEnabled ? 'default' : 'secondary'} 
              className={`cursor-pointer ${isEnabled ? 'bg-green-500/10 text-green-600 border-green-500/30 hover:bg-green-500/20' : 'hover:bg-muted'}`}
              onClick={handleOpenSettings}
            >
              {isEnabled ? (
                <ShieldCheck className="h-3 w-3 mr-1" />
              ) : (
                <Shield className="h-3 w-3 mr-1" />
              )}
              2FA
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            {isEnabled 
              ? `${t('2fa.toggle.enabled')} (${getMethodLabel(method)})` 
              : t('2fa.toggle.disabled')
            }
          </TooltipContent>
        </Tooltip>

        <TwoFactorWizard
          open={showWizard}
          onOpenChange={setShowWizard}
          onSelectMethod={handleSelectMethod}
          onSkip={() => setShowWizard(false)}
        />

        <TwoFactorSetup
          open={showSetup}
          onOpenChange={setShowSetup}
          method={selectedMethod}
          onComplete={handleSetupComplete}
        />
      </TooltipProvider>
    );
  }

  if (variant === 'compact') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={isEnabled ? 'outline' : 'default'}
              size="sm"
              onClick={handleToggle}
              disabled={isDisabling}
              className={isEnabled ? 'border-green-500/50 text-green-600 hover:bg-green-500/10' : ''}
            >
              {isDisabling ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isEnabled ? (
                <ShieldCheck className="h-4 w-4" />
              ) : (
                <Shield className="h-4 w-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {isEnabled 
              ? `${t('2fa.toggle.clickToDisable')} (${getMethodLabel(method)})` 
              : t('2fa.toggle.clickToEnable')
            }
          </TooltipContent>
        </Tooltip>

        <TwoFactorWizard
          open={showWizard}
          onOpenChange={setShowWizard}
          onSelectMethod={handleSelectMethod}
          onSkip={() => setShowWizard(false)}
        />

        <TwoFactorSetup
          open={showSetup}
          onOpenChange={setShowSetup}
          method={selectedMethod}
          onComplete={handleSetupComplete}
        />
      </TooltipProvider>
    );
  }

  // Default button variant
  return (
    <>
      <Button
        variant={isEnabled ? 'outline' : 'default'}
        size="sm"
        onClick={handleToggle}
        disabled={isDisabling}
        className={isEnabled ? 'border-green-500/50 text-green-600 hover:bg-green-500/10' : ''}
      >
        {isDisabling ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : isEnabled ? (
          <ShieldCheck className="h-4 w-4 mr-2" />
        ) : (
          <Shield className="h-4 w-4 mr-2" />
        )}
        {showLabel && (
          isEnabled 
            ? t('2fa.toggle.enabled') 
            : t('2fa.toggle.enable')
        )}
      </Button>

      <TwoFactorWizard
        open={showWizard}
        onOpenChange={setShowWizard}
        onSelectMethod={handleSelectMethod}
        onSkip={() => setShowWizard(false)}
      />

      <TwoFactorSetup
        open={showSetup}
        onOpenChange={setShowSetup}
        method={selectedMethod}
        onComplete={handleSetupComplete}
      />
    </>
  );
}
