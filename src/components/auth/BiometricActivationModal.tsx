import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Fingerprint, ShieldCheck, X, Loader2, CheckCircle } from 'lucide-react';
import { useWebAuthn } from '@/hooks/useWebAuthn';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/useLanguage';

interface BiometricActivationModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const translations = {
  pt: {
    title: 'Ative o login por biometria',
    description: 'Use sua digital ou Face ID para entrar mais rápido e com mais segurança neste dispositivo.',
    activateNow: 'Ativar agora',
    notNow: 'Agora não',
    activating: 'Ativando...',
    successTitle: 'Biometria ativada!',
    successMessage: 'Na próxima vez, você poderá entrar usando sua digital ou Face ID.',
    errorTitle: 'Erro ao ativar',
    securityNote: 'Sua biometria nunca sai do seu dispositivo. Usamos padrões de segurança WebAuthn.',
  },
  en: {
    title: 'Enable biometric login',
    description: 'Use your fingerprint or Face ID to sign in faster and more securely on this device.',
    activateNow: 'Enable now',
    notNow: 'Not now',
    activating: 'Enabling...',
    successTitle: 'Biometrics enabled!',
    successMessage: 'Next time, you can sign in using your fingerprint or Face ID.',
    errorTitle: 'Activation error',
    securityNote: 'Your biometrics never leave your device. We use WebAuthn security standards.',
  },
  es: {
    title: 'Activa el inicio de sesión biométrico',
    description: 'Usa tu huella digital o Face ID para iniciar sesión más rápido y seguro en este dispositivo.',
    activateNow: 'Activar ahora',
    notNow: 'Ahora no',
    activating: 'Activando...',
    successTitle: '¡Biometría activada!',
    successMessage: 'La próxima vez, podrás iniciar sesión usando tu huella digital o Face ID.',
    errorTitle: 'Error al activar',
    securityNote: 'Tu biometría nunca sale de tu dispositivo. Usamos estándares de seguridad WebAuthn.',
  },
};

export function BiometricActivationModal({
  open,
  onClose,
  onSuccess,
}: BiometricActivationModalProps) {
  const { registerCredential, isLoading, error } = useWebAuthn();
  const { toast } = useToast();
  const { language } = useLanguage();
  const [isSuccess, setIsSuccess] = useState(false);

  const t = translations[language as keyof typeof translations] || translations.pt;

  const handleActivate = async () => {
    const success = await registerCredential('Meu dispositivo');

    if (success) {
      setIsSuccess(true);
      toast({
        title: t.successTitle,
        description: t.successMessage,
      });
      setTimeout(() => {
        onSuccess?.();
        onClose();
        setIsSuccess(false);
      }, 2000);
    } else if (error) {
      toast({
        variant: 'destructive',
        title: t.errorTitle,
        description: error,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            {isSuccess ? (
              <CheckCircle className="h-8 w-8 text-green-500" />
            ) : (
              <Fingerprint className="h-8 w-8 text-primary" />
            )}
          </div>
          <DialogTitle className="text-center text-xl">
            {isSuccess ? t.successTitle : t.title}
          </DialogTitle>
          <DialogDescription className="text-center">
            {isSuccess ? t.successMessage : t.description}
          </DialogDescription>
        </DialogHeader>

        {!isSuccess && (
          <>
            <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
              <ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
              <span>{t.securityNote}</span>
            </div>

            <div className="flex flex-col gap-2 mt-4">
              <Button
                onClick={handleActivate}
                disabled={isLoading}
                className="w-full"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t.activating}
                  </>
                ) : (
                  <>
                    <Fingerprint className="mr-2 h-4 w-4" />
                    {t.activateNow}
                  </>
                )}
              </Button>
              <Button
                variant="ghost"
                onClick={onClose}
                disabled={isLoading}
                className="w-full"
              >
                {t.notNow}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
