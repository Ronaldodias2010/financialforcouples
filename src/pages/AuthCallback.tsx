import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { TwoFactorVerification } from '@/components/auth/TwoFactorVerification';
import { TwoFactorWizard } from '@/components/auth/TwoFactorWizard';
import { TwoFactorOptOut } from '@/components/auth/TwoFactorOptOut';
import { TwoFactorSetup } from '@/components/auth/TwoFactorSetup';
import { TwoFactorMethod } from '@/hooks/use2FA';
import { use2FAPrompt } from '@/hooks/use2FAPrompt';
import { use2FASession } from '@/hooks/use2FASession';
import { use2FAStatus } from '@/hooks/use2FAStatus';
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
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [smsBlocked, setSmsBlocked] = useState(false);
  const { toast } = useToast();
  const { t, language } = useLanguage();
  const { shouldShowPrompt, dismissPrompt, isLoaded } = use2FAPrompt();
  const { isSessionValid, setVerifiedSession, isLoaded: isSessionLoaded } = use2FASession();
  const { markAs2FAEnabled } = use2FAStatus();

  useEffect(() => {
    // Wait for localStorage to be loaded before making decisions
    if (!isLoaded || !isSessionLoaded) return;

    const handleCallback = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error || !session) {
          console.error('Auth callback error:', error);
          window.location.href = '/auth';
          return;
        }

        setCurrentUserId(session.user.id);
        console.log('AuthCallback: Session found, checking 2FA status...');

        // Verificar se usuário tem 2FA habilitado
        try {
          const { data: tfaResponse } = await supabase.functions.invoke('check-2fa-status', {
            body: { userId: session.user.id }
          });

          console.log('AuthCallback: 2FA status response:', tfaResponse);

          if (tfaResponse?.is_enabled && tfaResponse?.method && tfaResponse.method !== 'none') {
            // Check if user has a valid 2FA session (verified within 1 day)
            if (isSessionValid(session.user.id)) {
              console.log('AuthCallback: Valid 2FA session found, skipping verification');
              window.location.href = '/app';
              return;
            }

            // Enviar código se for SMS ou Email
            let actualMethod: TwoFactorMethod = tfaResponse.method as TwoFactorMethod;
            
            if (tfaResponse.method === 'sms') {
              // Para SMS, tentar enviar e fazer fallback para email se falhar
              const phoneNumber = tfaResponse.phone_number;
              let smsFailed = false;
              
              if (phoneNumber) {
                try {
                  const { data: smsResponse, error: smsError } = await supabase.functions.invoke('send-phone-verification', {
                    body: { phoneNumber, language }
                  });
                  
                  // Check if there was ANY error with SMS
                  if (smsError || smsResponse?.error) {
                    console.warn('SMS failed, will fallback to email:', smsError || smsResponse?.error);
                    smsFailed = true;
                  }
                } catch (smsException) {
                  console.warn('SMS exception, will fallback to email:', smsException);
                  smsFailed = true;
                }
              } else {
                // No phone number configured, fallback to email
                console.warn('No phone number configured, will fallback to email');
                smsFailed = true;
              }
              
              // If SMS failed for any reason, automatically fallback to email
              if (smsFailed) {
                setSmsBlocked(true);
                try {
                  const { error: emailError } = await supabase.functions.invoke('send-2fa-email', {
                    body: { userId: session.user.id, email: session.user.email, language }
                  });
                  
                  if (!emailError) {
                    toast({
                      title: language === 'en' ? 'Verification via Email' : language === 'es' ? 'Verificación por Email' : 'Verificação via Email',
                      description: language === 'en' 
                        ? 'SMS was unavailable. A verification code was sent to your email.'
                        : language === 'es'
                        ? 'SMS no disponible. Se envió un código de verificación a su correo.'
                        : 'SMS indisponível. Um código de verificação foi enviado para seu e-mail.',
                    });
                    actualMethod = 'email';
                  } else {
                    // Both SMS and email failed
                    toast({
                      variant: 'destructive',
                      title: language === 'en' ? 'Verification Error' : language === 'es' ? 'Error de Verificación' : 'Erro de Verificação',
                      description: language === 'en' 
                        ? 'Could not send verification code. Please try again later.'
                        : language === 'es'
                        ? 'No se pudo enviar el código. Por favor intente más tarde.'
                        : 'Não foi possível enviar o código. Por favor tente novamente mais tarde.',
                    });
                    // Still show the dialog with email method as last resort
                    actualMethod = 'email';
                  }
                } catch (emailException) {
                  console.error('Email fallback also failed:', emailException);
                  toast({
                    variant: 'destructive',
                    title: language === 'en' ? 'Verification Error' : language === 'es' ? 'Error de Verificación' : 'Erro de Verificação',
                    description: language === 'en' 
                      ? 'Could not send verification code. Please try again later.'
                      : language === 'es'
                      ? 'No se pudo enviar el código. Por favor intente más tarde.'
                      : 'Não foi possível enviar o código. Por favor tente novamente mais tarde.',
                  });
                  actualMethod = 'email';
                }
              }
            } else if (tfaResponse.method === 'email') {
              try {
                await supabase.functions.invoke('send-2fa-email', {
                  body: { userId: session.user.id, email: session.user.email, language }
                });
              } catch (emailError) {
                console.error('Email 2FA send failed:', emailError);
                toast({
                  variant: 'destructive',
                  title: language === 'en' ? 'Email Error' : language === 'es' ? 'Error de Email' : 'Erro de Email',
                  description: language === 'en' 
                    ? 'Could not send verification email. Please try again.'
                    : language === 'es'
                    ? 'No se pudo enviar el correo de verificación. Por favor intente de nuevo.'
                    : 'Não foi possível enviar o e-mail de verificação. Por favor tente novamente.',
                });
              }
            }
            
            setTwoFactorMethod(actualMethod);
            setShow2FA(true);
            setIsLoading(false);
            return;
          }

          // Usuário não tem 2FA - mostrar wizard se não foi dispensado
          console.log('AuthCallback: shouldShowPrompt =', shouldShowPrompt);
          if (shouldShowPrompt) {
            setShowWizard(true);
            setIsLoading(false);
            return;
          }
        } catch (tfaError) {
          console.log('2FA check skipped:', tfaError);
          // Se falhou a verificação, ainda mostrar wizard se não foi dispensado
          if (shouldShowPrompt) {
            setShowWizard(true);
            setIsLoading(false);
            return;
          }
        }

        // Sem 2FA e wizard dispensado, redirecionar para app
        window.location.href = '/app';
      } catch (err) {
        console.error('Callback error:', err);
        window.location.href = '/auth';
      }
    };

    handleCallback();
  }, [shouldShowPrompt, isLoaded, isSessionLoaded, isSessionValid]);

  const handle2FAVerified = () => {
    // Save session so user doesn't need to verify again for 1 day
    if (currentUserId) {
      setVerifiedSession(currentUserId);
    }
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
    // Mark user as having 2FA enabled (to hide recommendation on login page)
    markAs2FAEnabled();
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
