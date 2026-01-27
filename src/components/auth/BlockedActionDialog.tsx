import React, { useState } from 'react';
import { AlertTriangle, Mail, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useEmailVerification } from '@/hooks/useEmailVerification';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/useLanguage';

interface BlockedActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actionType: 'change_email' | 'change_password' | 'withdrawal' | 'delete_account';
}

const translations = {
  pt: {
    title: 'Ação bloqueada',
    description: 'Para realizar esta ação, você precisa confirmar seu e-mail primeiro.',
    actionLabels: {
      change_email: 'alterar seu e-mail',
      change_password: 'alterar sua senha',
      withdrawal: 'realizar saques ou transferências',
      delete_account: 'excluir sua conta',
    },
    resendButton: 'Reenviar e-mail de confirmação',
    cancelButton: 'Cancelar',
    sending: 'Enviando...',
    successTitle: 'E-mail enviado!',
    successMessage: 'Verifique sua caixa de entrada e spam.',
    errorTitle: 'Erro ao enviar',
    errorMessage: 'Não foi possível enviar o e-mail. Tente novamente.',
  },
  en: {
    title: 'Action blocked',
    description: 'To perform this action, you need to confirm your email first.',
    actionLabels: {
      change_email: 'change your email',
      change_password: 'change your password',
      withdrawal: 'make withdrawals or transfers',
      delete_account: 'delete your account',
    },
    resendButton: 'Resend confirmation email',
    cancelButton: 'Cancel',
    sending: 'Sending...',
    successTitle: 'Email sent!',
    successMessage: 'Check your inbox and spam folder.',
    errorTitle: 'Failed to send',
    errorMessage: 'Could not send the email. Please try again.',
  },
  es: {
    title: 'Acción bloqueada',
    description: 'Para realizar esta acción, necesitas confirmar tu correo electrónico primero.',
    actionLabels: {
      change_email: 'cambiar tu correo electrónico',
      change_password: 'cambiar tu contraseña',
      withdrawal: 'realizar retiros o transferencias',
      delete_account: 'eliminar tu cuenta',
    },
    resendButton: 'Reenviar correo de confirmación',
    cancelButton: 'Cancelar',
    sending: 'Enviando...',
    successTitle: '¡Correo enviado!',
    successMessage: 'Revisa tu bandeja de entrada y spam.',
    errorTitle: 'Error al enviar',
    errorMessage: 'No se pudo enviar el correo. Intenta de nuevo.',
  },
};

export function BlockedActionDialog({ open, onOpenChange, actionType }: BlockedActionDialogProps) {
  const { resendConfirmationEmail } = useEmailVerification();
  const [sending, setSending] = useState(false);
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

    if (success) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            {t.title}
          </DialogTitle>
          <DialogDescription className="pt-2">
            {t.description}
            <br />
            <span className="text-foreground font-medium mt-2 block">
              Para {t.actionLabels[actionType]}, confirme seu e-mail.
            </span>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {t.cancelButton}
          </Button>
          <Button
            onClick={handleResend}
            disabled={sending}
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
