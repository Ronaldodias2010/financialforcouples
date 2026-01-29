import React, { useState } from 'react';
import { CheckCircle, Mail, Loader2, LogIn } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/hooks/useLanguage';

interface ProvisionalAccessAlertProps {
  email: string;
  onResendEmail: () => Promise<boolean>;
  onProvisionalLogin: () => void;
  isResending: boolean;
}

const translations = {
  pt: {
    title: '✅ Conta criada com sucesso!',
    description: 'Sua conta está pronta. Clique abaixo para entrar na plataforma. Enviaremos um e-mail de verificação em breve.',
    resendButton: 'Reenviar e-mail',
    provisionalButton: 'Entrar na Plataforma',
    sending: 'Enviando...',
  },
  en: {
    title: '✅ Account created successfully!',
    description: 'Your account is ready. Click below to enter the platform. We will send a verification email shortly.',
    resendButton: 'Resend email',
    provisionalButton: 'Enter Platform',
    sending: 'Sending...',
  },
  es: {
    title: '✅ ¡Cuenta creada con éxito!',
    description: 'Tu cuenta está lista. Haz clic abajo para entrar a la plataforma. Te enviaremos un correo de verificación pronto.',
    resendButton: 'Reenviar correo',
    provisionalButton: 'Entrar a la Plataforma',
    sending: 'Enviando...',
  },
};

export function ProvisionalAccessAlert({ 
  email, 
  onResendEmail, 
  onProvisionalLogin,
  isResending 
}: ProvisionalAccessAlertProps) {
  const { language } = useLanguage();
  const t = translations[language] || translations.pt;

  return (
    <Alert className="bg-green-50 border-green-300 dark:bg-green-950/30 dark:border-green-800">
      <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
      <AlertTitle className="text-green-800 dark:text-green-200 font-semibold">
        {t.title}
      </AlertTitle>
      <AlertDescription className="mt-2">
        <p className="text-green-700 dark:text-green-300 mb-4">
          {t.description}
        </p>
        <div className="flex flex-col gap-2">
          <Button
            variant="default"
            onClick={onProvisionalLogin}
            size="lg"
            className="w-full bg-green-600 hover:bg-green-700"
          >
            <LogIn className="h-4 w-4 mr-2" />
            {t.provisionalButton}
          </Button>
          <Button
            variant="ghost"
            onClick={onResendEmail}
            disabled={isResending}
            size="sm"
            className="w-full text-green-700 hover:text-green-800"
          >
            {isResending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t.sending}
              </>
            ) : (
              <>
                <Mail className="h-4 w-4 mr-2" />
                {t.resendButton}
              </>
            )}
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
