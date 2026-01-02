import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { TwoFactorVerification } from '@/components/auth/TwoFactorVerification';
import { TwoFactorMethod } from '@/hooks/use2FA';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/useLanguage';

export default function AuthCallback() {
  const [show2FA, setShow2FA] = useState(false);
  const [twoFactorMethod, setTwoFactorMethod] = useState<TwoFactorMethod>('none');
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { t } = useLanguage();

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
        } catch (tfaError) {
          console.log('2FA check skipped:', tfaError);
        }

        // Sem 2FA, redirecionar para app
        window.location.href = '/app';
      } catch (err) {
        console.error('Callback error:', err);
        window.location.href = '/auth';
      }
    };

    handleCallback();
  }, []);

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

  if (isLoading && !show2FA) {
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
    </div>
  );
}
