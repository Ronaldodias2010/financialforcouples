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
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [smsError, setSmsError] = useState(false);
  const [smsErrorMessage, setSmsErrorMessage] = useState<string | null>(null);
  const { toast } = useToast();
  const { t, language } = useLanguage();
  const { shouldShowPrompt, dismissPrompt, isLoaded } = use2FAPrompt();
  const { isSessionValid, setVerifiedSession, isLoaded: isSessionLoaded } = use2FASession();
  const { markAs2FAEnabled } = use2FAStatus();

  const handleRetrySMS = async () => {
    if (!currentUserId) return;
    
    setSmsError(false);
    setSmsErrorMessage(null);
    
    try {
      const { data: tfaResponse } = await supabase.functions.invoke('check-2fa-status', {
        body: { userId: currentUserId }
      });
      
      if (tfaResponse?.phone_number) {
        const { data: smsResponse, error: smsError } = await supabase.functions.invoke('send-phone-verification', {
          body: { 
            phoneNumber: tfaResponse.phone_number, 
            language,
            userId: currentUserId
          }
        });
        
        if (smsError || smsResponse?.error) {
          setSmsError(true);
          setSmsErrorMessage(smsResponse?.error_message || 'SMS sending failed');
          toast({
            variant: 'destructive',
            title: language === 'en' ? 'SMS Error' : language === 'es' ? 'Error de SMS' : 'Erro de SMS',
            description: language === 'en' 
              ? 'Could not send SMS. Please try again or change your verification method in settings.'
              : language === 'es'
              ? 'No se pudo enviar el SMS. Intente de nuevo o cambie su método de verificación en configuración.'
              : 'Não foi possível enviar o SMS. Tente novamente ou altere seu método de verificação nas configurações.',
          });
        } else {
          toast({
            title: language === 'en' ? 'SMS Sent' : language === 'es' ? 'SMS Enviado' : 'SMS Enviado',
            description: language === 'en' 
              ? 'A new verification code has been sent.'
              : language === 'es'
              ? 'Se ha enviado un nuevo código de verificación.'
              : 'Um novo código de verificação foi enviado.',
          });
        }
      }
    } catch (error) {
      console.error('Retry SMS failed:', error);
      setSmsError(true);
      setSmsErrorMessage('Exception during SMS retry');
    }
  };

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
        setCurrentUserEmail(session.user.email || null);
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
            // IMPORTANT: Always respect user's method preference - no automatic fallback
            const userMethod: TwoFactorMethod = tfaResponse.method as TwoFactorMethod;
            
            if (userMethod === 'sms') {
              // Para SMS, tentar enviar - se falhar, mostrar erro mas NÃO fazer fallback automático
              const phoneNumber = tfaResponse.phone_number;
              
              if (phoneNumber) {
                try {
                  const { data: smsResponse, error: smsNetworkError } = await supabase.functions.invoke('send-phone-verification', {
                    body: { 
                      phoneNumber, 
                      language,
                      userId: session.user.id
                    }
                  });
                  
                  // Check if there was an error with SMS
                  if (smsNetworkError || smsResponse?.error) {
                    console.warn('[2FA] SMS failed - error logged. User preference NOT changed.');
                    console.warn('[2FA] Error details:', smsNetworkError || smsResponse);
                    
                    // Set error state so UI can show retry option
                    setSmsError(true);
                    setSmsErrorMessage(smsResponse?.error_message || 'SMS sending failed');
                    
                    // Show toast informing user about the error
                    toast({
                      variant: 'destructive',
                      title: language === 'en' ? 'SMS Error' : language === 'es' ? 'Error de SMS' : 'Erro de SMS',
                      description: language === 'en' 
                        ? 'Could not send SMS verification. You can retry or use a backup code.'
                        : language === 'es'
                        ? 'No se pudo enviar la verificación por SMS. Puede reintentar o usar un código de respaldo.'
                        : 'Não foi possível enviar a verificação por SMS. Você pode tentar novamente ou usar um código de backup.',
                    });
                    
                    // IMPORTANT: Keep method as SMS - do NOT change to email
                    // User can use backup codes or retry
                  } else {
                    console.log('[2FA] SMS sent successfully');
                  }
                } catch (smsException) {
                  console.error('[2FA] SMS exception - error logged. User preference NOT changed:', smsException);
                  setSmsError(true);
                  setSmsErrorMessage('Exception during SMS sending');
                  
                  toast({
                    variant: 'destructive',
                    title: language === 'en' ? 'SMS Error' : language === 'es' ? 'Error de SMS' : 'Erro de SMS',
                    description: language === 'en' 
                      ? 'Could not send SMS verification. You can retry or use a backup code.'
                      : language === 'es'
                      ? 'No se pudo enviar la verificación por SMS. Puede reintentar o usar un código de respaldo.'
                      : 'Não foi possível enviar a verificação por SMS. Você pode tentar novamente ou usar um código de backup.',
                  });
                }
              } else {
                // No phone number configured
                console.warn('[2FA] No phone number configured for SMS method');
                setSmsError(true);
                setSmsErrorMessage('No phone number configured');
                
                toast({
                  variant: 'destructive',
                  title: language === 'en' ? 'Configuration Error' : language === 'es' ? 'Error de Configuración' : 'Erro de Configuração',
                  description: language === 'en' 
                    ? 'No phone number configured for SMS. Please use a backup code or update your settings.'
                    : language === 'es'
                    ? 'No hay número de teléfono configurado para SMS. Use un código de respaldo o actualice su configuración.'
                    : 'Nenhum número de telefone configurado para SMS. Use um código de backup ou atualize suas configurações.',
                });
              }
              
              // ALWAYS keep the method as SMS - respect user preference
              setTwoFactorMethod('sms');
              
            } else if (userMethod === 'email') {
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
              setTwoFactorMethod('email');
            } else {
              setTwoFactorMethod(userMethod);
            }
            
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
        smsError={smsError}
        smsErrorMessage={smsErrorMessage}
        onRetrySMS={handleRetrySMS}
        userId={currentUserId || undefined}
        userEmail={currentUserEmail || undefined}
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
