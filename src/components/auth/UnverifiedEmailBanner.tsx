import React, { useState } from 'react';
import { AlertTriangle, Mail, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEmailVerification } from '@/hooks/useEmailVerification';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/useLanguage';

const translations = {
  pt: {
    title: 'Sua conta ainda não foi confirmada.',
    subtitle: 'Confirme seu e-mail para garantir acesso total.',
    resendButton: 'Reenviar e-mail de confirmação',
    sending: 'Enviando...',
    successTitle: 'E-mail enviado!',
    successMessage: 'Verifique sua caixa de entrada e spam.',
    errorTitle: 'Erro ao enviar',
    errorMessage: 'Não foi possível enviar o e-mail. Tente novamente.',
    dismiss: 'Fechar',
  },
  en: {
    title: 'Your account has not been confirmed yet.',
    subtitle: 'Confirm your email to ensure full access.',
    resendButton: 'Resend confirmation email',
    sending: 'Sending...',
    successTitle: 'Email sent!',
    successMessage: 'Check your inbox and spam folder.',
    errorTitle: 'Failed to send',
    errorMessage: 'Could not send the email. Please try again.',
    dismiss: 'Close',
  },
  es: {
    title: 'Tu cuenta aún no ha sido confirmada.',
    subtitle: 'Confirma tu correo electrónico para garantizar acceso completo.',
    resendButton: 'Reenviar correo de confirmación',
    sending: 'Enviando...',
    successTitle: '¡Correo enviado!',
    successMessage: 'Revisa tu bandeja de entrada y spam.',
    errorTitle: 'Error al enviar',
    errorMessage: 'No se pudo enviar el correo. Intenta de nuevo.',
    dismiss: 'Cerrar',
  },
};

export function UnverifiedEmailBanner() {
  const { emailVerified, loading, resendConfirmationEmail } = useEmailVerification();
  const [sending, setSending] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const { toast } = useToast();
  const { language } = useLanguage();
  
  const t = translations[language] || translations.pt;

  const handleResend = async () => {
    setSending(true);
    const success = await resendConfirmationEmail();
    setSending(false);

    toast({
      title: success ? t.successTitle : t.errorTitle,
      description: success ? t.successMessage : t.errorMessage,
      variant: success ? 'default' : 'destructive',
    });
  };

  // Don't show if loading, verified, or dismissed
  if (loading || emailVerified || dismissed) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-500/95 text-yellow-950 py-3 px-4 shadow-lg">
      <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 flex-shrink-0" />
          <div className="text-sm">
            <span className="font-semibold">{t.title}</span>
            <span className="hidden sm:inline ml-1">{t.subtitle}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleResend}
            disabled={sending}
            className="bg-white/90 text-yellow-950 border-yellow-600 hover:bg-white"
          >
            {sending ? (
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
            variant="ghost"
            size="icon"
            onClick={() => setDismissed(true)}
            className="h-8 w-8 text-yellow-950 hover:bg-yellow-600/30"
            aria-label={t.dismiss}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
