import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Fingerprint, Loader2, AlertCircle } from 'lucide-react';
import { useWebAuthn } from '@/hooks/useWebAuthn';
import { useLanguage } from '@/hooks/useLanguage';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface BiometricLoginButtonProps {
  email: string;
  onSuccess?: () => void;
  onFallbackToPassword?: () => void;
  className?: string;
}

const translations = {
  pt: {
    loginWithBiometrics: 'Entrar com biometria',
    useFingerprint: 'Use a digital ou Face ID do seu celular para acessar sua conta.',
    authenticating: 'Autenticando...',
    orUsePassword: 'Ou entre com email e senha',
    errorTitle: 'Não foi possível autenticar',
    errorMessage: 'Não foi possível autenticar com biometria. Por favor, entre usando seu email e senha.',
    notSupported: 'Seu dispositivo não suporta login por biometria. Continue usando email e senha.',
    noBiometrics: 'Você ainda não ativou a biometria. Entre com email e senha.',
    successMessage: 'Autenticação bem-sucedida!',
  },
  en: {
    loginWithBiometrics: 'Sign in with biometrics',
    useFingerprint: 'Use your fingerprint or Face ID to access your account.',
    authenticating: 'Authenticating...',
    orUsePassword: 'Or sign in with email and password',
    errorTitle: 'Authentication failed',
    errorMessage: 'Could not authenticate with biometrics. Please sign in with your email and password.',
    notSupported: 'Your device does not support biometric login. Continue using email and password.',
    noBiometrics: 'You haven\'t enabled biometrics yet. Sign in with email and password.',
    successMessage: 'Authentication successful!',
  },
  es: {
    loginWithBiometrics: 'Iniciar sesión con biometría',
    useFingerprint: 'Usa tu huella digital o Face ID para acceder a tu cuenta.',
    authenticating: 'Autenticando...',
    orUsePassword: 'O inicia sesión con email y contraseña',
    errorTitle: 'Error de autenticación',
    errorMessage: 'No se pudo autenticar con biometría. Por favor, inicia sesión con tu email y contraseña.',
    notSupported: 'Tu dispositivo no soporta inicio de sesión biométrico. Continúa usando email y contraseña.',
    noBiometrics: 'Aún no has activado la biometría. Inicia sesión con email y contraseña.',
    successMessage: '¡Autenticación exitosa!',
  },
};

export function BiometricLoginButton({
  email,
  onSuccess,
  onFallbackToPassword,
  className,
}: BiometricLoginButtonProps) {
  const { isSupported, isLoading, error, authenticate, checkHasCredentials, clearError } = useWebAuthn();
  const { language } = useLanguage();
  const { toast } = useToast();
  const [hasCredentials, setHasCredentials] = useState<boolean | null>(null);
  const [showError, setShowError] = useState(false);
  const [isMobileOrPWA, setIsMobileOrPWA] = useState(false);

  const t = translations[language as keyof typeof translations] || translations.pt;

  // Only show biometric login on mobile devices or PWA
  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isIOSStandalone = (window.navigator as any).standalone === true;
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const isMobileUA = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    setIsMobileOrPWA(isStandalone || isIOSStandalone || (isTouchDevice && isMobileUA));
  }, []);

  // Check if user has biometric credentials when email changes
  useEffect(() => {
    if (email && isSupported) {
      checkHasCredentials(email).then(setHasCredentials);
    } else {
      setHasCredentials(null);
    }
  }, [email, isSupported, checkHasCredentials]);

  const handleBiometricLogin = async () => {
    if (!email) return;

    clearError();
    setShowError(false);

    const result = await authenticate(email);

    if (result.success && result.actionLink) {
      toast({
        title: '✅',
        description: t.successMessage,
      });

      // Use the magic link to sign in
      // Extract token from action link and verify
      try {
        const url = new URL(result.actionLink);
        const token = url.searchParams.get('token');
        const type = url.searchParams.get('type') || 'magiclink';
        
        if (token) {
          const { error: verifyError } = await supabase.auth.verifyOtp({
            token_hash: token,
            type: type as any,
          });

          if (verifyError) {
            console.error('[BiometricLogin] OTP verification error:', verifyError);
            // Try redirecting to the action link directly
            window.location.href = result.actionLink;
            return;
          }
        }
        
        onSuccess?.();
      } catch (err) {
        console.error('[BiometricLogin] Error processing auth:', err);
        // Fallback: redirect to action link
        if (result.actionLink) {
          window.location.href = result.actionLink;
        }
      }
    } else {
      setShowError(true);
    }
  };

  // Don't show on desktop web - only mobile/PWA
  if (!isMobileOrPWA) {
    return null;
  }

  // Don't show if not supported
  if (!isSupported) {
    return null;
  }

  // If no email yet or checking credentials
  if (!email || hasCredentials === null) {
    return null;
  }

  // No credentials registered
  if (hasCredentials === false) {
    return null; // Don't show button if user hasn't registered biometrics
  }

  return (
    <div className={className}>
      {showError && error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{t.errorMessage}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-3">
        <Button
          type="button"
          onClick={handleBiometricLogin}
          disabled={isLoading}
          className="w-full"
          size="lg"
          variant="default"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              {t.authenticating}
            </>
          ) : (
            <>
              <Fingerprint className="mr-2 h-5 w-5" />
              {t.loginWithBiometrics}
            </>
          )}
        </Button>

        <p className="text-center text-sm text-muted-foreground">{t.useFingerprint}</p>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              {t.orUsePassword}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
