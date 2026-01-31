import { useState, useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Fingerprint, Smartphone, Info, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/hooks/useLanguage';
import { useWebAuthn } from '@/hooks/useWebAuthn';

const translations = {
  pt: {
    title: 'Login por Biometria Disponível',
    description: 'Após fazer login com sua senha, você poderá ativar o login por digital ou Face ID para acessar mais rápido.',
    howItWorks: 'Como funciona:',
    step1: 'Faça login com email e senha',
    step2: 'Aceite a ativação da biometria',
    step3: 'Próximos acessos serão com digital/Face ID',
    dismiss: 'Entendi',
  },
  en: {
    title: 'Biometric Login Available',
    description: 'After logging in with your password, you can enable fingerprint or Face ID login for faster access.',
    howItWorks: 'How it works:',
    step1: 'Log in with email and password',
    step2: 'Accept biometric activation',
    step3: 'Future logins will use fingerprint/Face ID',
    dismiss: 'Got it',
  },
  es: {
    title: 'Inicio de Sesión Biométrico Disponible',
    description: 'Después de iniciar sesión con tu contraseña, podrás activar el inicio de sesión con huella digital o Face ID para un acceso más rápido.',
    howItWorks: 'Cómo funciona:',
    step1: 'Inicia sesión con email y contraseña',
    step2: 'Acepta la activación biométrica',
    step3: 'Los próximos accesos serán con huella/Face ID',
    dismiss: 'Entendido',
  },
};

interface PWABiometricGuideProps {
  userEmail?: string;
}

export function PWABiometricGuide({ userEmail }: PWABiometricGuideProps) {
  const { language } = useLanguage();
  const { isSupported, hasCredentials, checkHasCredentials } = useWebAuthn();
  const [isDismissed, setIsDismissed] = useState(false);
  const [isPWA, setIsPWA] = useState(false);
  const [alreadyHasBiometrics, setAlreadyHasBiometrics] = useState(false);

  const t = translations[language as keyof typeof translations] || translations.pt;

  useEffect(() => {
    // Check if running as PWA
    const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches;
    const isInWebAppMode = (window.navigator as any).standalone === true;
    const isFromHomeScreen = document.referrer.includes('android-app://');
    setIsPWA(isInStandaloneMode || isInWebAppMode || isFromHomeScreen);
  }, []);

  useEffect(() => {
    // Check if user already has biometrics registered
    const checkBiometrics = async () => {
      if (userEmail && isSupported) {
        const hasBio = await checkHasCredentials(userEmail);
        setAlreadyHasBiometrics(hasBio);
      }
    };
    checkBiometrics();
  }, [userEmail, isSupported, checkHasCredentials]);

  // Check if dismissed in localStorage
  useEffect(() => {
    const dismissed = localStorage.getItem('pwa-biometric-guide-dismissed');
    if (dismissed) {
      setIsDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('pwa-biometric-guide-dismissed', 'true');
  };

  // Don't show if:
  // - Not a PWA
  // - Biometrics not supported
  // - User already has biometrics set up
  // - User dismissed the guide
  if (!isPWA || !isSupported || alreadyHasBiometrics || isDismissed) {
    return null;
  }

  return (
    <Alert className="mb-4 border-primary/30 bg-gradient-to-r from-primary/10 to-secondary/10 relative">
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-2 right-2 h-6 w-6 p-0 hover:bg-background/50"
        onClick={handleDismiss}
      >
        <X className="h-4 w-4" />
      </Button>
      
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
            <Fingerprint className="h-5 w-5 text-primary" />
          </div>
        </div>
        
        <div className="flex-1 pr-6">
          <AlertTitle className="text-sm font-semibold mb-1 flex items-center gap-2">
            <Smartphone className="h-4 w-4" />
            {t.title}
          </AlertTitle>
          <AlertDescription className="text-xs text-muted-foreground">
            {t.description}
          </AlertDescription>
          
          <div className="mt-3 space-y-1.5">
            <p className="text-xs font-medium text-foreground">{t.howItWorks}</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">1</span>
              {t.step1}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">2</span>
              {t.step2}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-secondary/20 flex items-center justify-center text-[10px] font-bold text-secondary">3</span>
              {t.step3}
            </div>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            className="mt-3 h-7 text-xs"
            onClick={handleDismiss}
          >
            {t.dismiss}
          </Button>
        </div>
      </div>
    </Alert>
  );
}
