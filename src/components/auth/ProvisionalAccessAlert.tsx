import React, { useState } from 'react';
import { AlertTriangle, Mail, Loader2, LogIn } from 'lucide-react';
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
    title: 'Não recebeu o e-mail de confirmação?',
    description: 'Verifique sua caixa de spam ou solicite acesso provisório.',
    resendButton: 'Reenviar e-mail',
    provisionalButton: 'Entrar com acesso provisório',
    sending: 'Enviando...',
  },
  en: {
    title: "Didn't receive the confirmation email?",
    description: 'Check your spam folder or request provisional access.',
    resendButton: 'Resend email',
    provisionalButton: 'Enter with provisional access',
    sending: 'Sending...',
  },
  es: {
    title: '¿No recibiste el correo de confirmación?',
    description: 'Revisa tu carpeta de spam o solicita acceso provisional.',
    resendButton: 'Reenviar correo',
    provisionalButton: 'Entrar con acceso provisional',
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
    <Alert className="bg-yellow-50 border-yellow-300 dark:bg-yellow-950/30 dark:border-yellow-800">
      <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
      <AlertTitle className="text-yellow-800 dark:text-yellow-200 font-semibold">
        {t.title}
      </AlertTitle>
      <AlertDescription className="mt-2">
        <p className="text-yellow-700 dark:text-yellow-300 mb-4">
          {t.description}
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={onResendEmail}
            disabled={isResending}
            className="flex-1 bg-white dark:bg-yellow-900/50"
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
          <Button
            variant="default"
            onClick={onProvisionalLogin}
            className="flex-1"
          >
            <LogIn className="h-4 w-4 mr-2" />
            {t.provisionalButton}
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
