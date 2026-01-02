import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { TwoFactorVerification } from '@/components/auth/TwoFactorVerification';
import { TwoFactorWizard } from '@/components/auth/TwoFactorWizard';
import { TwoFactorOptOut } from '@/components/auth/TwoFactorOptOut';
import { TwoFactorSetup } from '@/components/auth/TwoFactorSetup';
import { TwoFactorMethod } from '@/hooks/use2FA';
import { use2FAPrompt } from '@/hooks/use2FAPrompt';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/useLanguage';

export default function AuthCallback() {
  const [show2FA, setShow2FA] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [showOptOut, setShowOptOut] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [twoFactorMethod, setTwoFactorMethod] = useState<TwoFactorMethod>('none');
  const [selectedMethod, setSelectedMethod] = useState<TwoFactorMethod>('totp');
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { t } = useLanguage();
  const { shouldShowPrompt, dismissPrompt } = use2FAPrompt();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error || !session) {
          console.error('Auth callback error:', error);
          window.location.href = '/auth';
          return;
        }

        // Verificar se usuário tem 2FA habilitado
        try {
          const { data: tfaResponse } = await supabase.functions.invoke('check-2fa-status', {
            body: { userId: session.user.id }
          });

          if (tfaResponse?.is_enabled && tfaResponse?.method && tfaResponse.method !== 'none') {
            // Enviar código se for SMS ou Email
            if (tfaResponse.method === 'sms' || tfaResponse.method === 'email') {
              await supabase.functions.invoke('send-2fa-email', {
                body: { userId: session.user.id, method: tfaResponse.method }
              });
            }
            
            setTwoFactorMethod(tfaResponse.method as TwoFactorMethod);
            setShow2FA(true);
            setIsLoading(false);
            return;
          }

          // Usuário não tem 2FA - mostrar wizard se não foi dispensado
          if (shouldShowPrompt) {
            setShowWizard(true);
            setIsLoading(false);
            return;
          }
        } catch (tfaError) {
          console.log('2FA check skipped:', tfaError);
        }

        // Sem 2FA e wizard dispensado, redirecionar para app
        window.location.href = '/app';
      } catch (err) {
        console.error('Callback error:', err);
        window.location.href = '/auth';
      }
    };

    handleCallback();
  }, [shouldShowPrompt]);

  const handle2FAVerified = () => {
    toast({
      title: t('auth.loginSuccessTitle'),
      description: t('auth.loginSuccessDesc'),
    });
    window.location.href = '/app';
  };

  const handle2FACancel = async () => {
    await supabase.auth.signOut();
    window.location.href = '/auth';
  };

  const handleSelectMethod = (method: TwoFactorMethod) => {
    setSelectedMethod(method);
    setShowWizard(false);
    setShowSetup(true);
  };

  const handleSkipWizard = () => {
    setShowWizard(false);
    setShowOptOut(true);
  };

  const handleOptOutConfirm = (dontAskAgain: boolean) => {
    dismissPrompt(dontAskAgain);
    setShowOptOut(false);
    window.location.href = '/app';
  };

  const handleOptOutGoBack = () => {
    setShowOptOut(false);
    setShowWizard(true);
  };

  const handleSetupComplete = () => {
    setShowSetup(false);
    toast({
      title: t('2fa.enabled.title'),
      description: t('2fa.enabled.description'),
    });
    window.location.href = '/app';
  };

  if (isLoading && !show2FA && !showWizard) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="mt-4 text-muted-foreground">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <TwoFactorVerification
        open={show2FA}
        onOpenChange={setShow2FA}
        method={twoFactorMethod}
        onVerified={handle2FAVerified}
        onCancel={handle2FACancel}
      />

      <TwoFactorWizard
        open={showWizard}
        onOpenChange={setShowWizard}
        onSelectMethod={handleSelectMethod}
        onSkip={handleSkipWizard}
      />

      <TwoFactorOptOut
        open={showOptOut}
        onOpenChange={setShowOptOut}
        onConfirm={handleOptOutConfirm}
        onGoBack={handleOptOutGoBack}
      />

      <TwoFactorSetup
        open={showSetup}
        onOpenChange={setShowSetup}
        method={selectedMethod}
        onComplete={handleSetupComplete}
      />
    </div>
  );
}
