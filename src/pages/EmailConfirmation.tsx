import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2, XCircle } from 'lucide-react';

export default function EmailConfirmation() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [countdown, setCountdown] = useState(5);
  const [shouldRedirect, setShouldRedirect] = useState(false);

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      try {
        // Get the current session to check if user was just confirmed
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session error:', error);
          setStatus('error');
          return;
        }

        if (session && session.user) {
          setStatus('success');
          setShouldRedirect(true);
        } else {
          setStatus('error');
        }
      } catch (error) {
        console.error('Confirmation error:', error);
        setStatus('error');
      }
    };

    handleEmailConfirmation();
  }, []);

  useEffect(() => {
    if (shouldRedirect && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (shouldRedirect && countdown === 0) {
      window.location.href = '/auth';
    }
  }, [shouldRedirect, countdown]);

  const handleManualRedirect = () => {
    window.location.href = '/auth';
  };

  const handleCloseTab = () => {
    window.close();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-card/80 backdrop-blur-sm border-primary/20">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            {status === 'loading' && (
              <Loader2 className="h-16 w-16 animate-spin text-primary" />
            )}
            {status === 'success' && (
              <CheckCircle className="h-16 w-16 text-green-500" />
            )}
            {status === 'error' && (
              <XCircle className="h-16 w-16 text-red-500" />
            )}
          </div>
          <div>
            <CardTitle className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              {status === 'loading' && 'Confirmando Email...'}
              {status === 'success' && 'Email Confirmado!'}
              {status === 'error' && 'Erro na Confirmação'}
            </CardTitle>
            <CardDescription className="text-muted-foreground mt-2">
              {status === 'loading' && 'Aguarde enquanto confirmamos seu email.'}
              {status === 'success' && `Redirecionando em ${countdown} segundos...`}
              {status === 'error' && 'Houve um erro ao confirmar seu email.'}
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {status === 'success' && (
            <>
              <div className="text-center text-sm text-muted-foreground">
                Sua conta foi confirmada com sucesso! Você será redirecionado para a página de login.
              </div>
              <div className="space-y-2">
                <Button 
                  onClick={handleManualRedirect}
                  className="w-full"
                >
                  Ir para Login Agora
                </Button>
                <Button 
                  onClick={handleCloseTab}
                  variant="outline"
                  className="w-full"
                >
                  Fechar esta Aba
                </Button>
              </div>
            </>
          )}
          
          {status === 'error' && (
            <>
              <div className="text-center text-sm text-muted-foreground">
                Confirmação realizada. Feche esta aba e retorne ao aplicativo para fazer login.
              </div>
              <div className="space-y-2">
                <Button 
                  onClick={handleManualRedirect}
                  className="w-full"
                >
                  Ir para Login
                </Button>
                <Button 
                  onClick={handleCloseTab}
                  variant="outline"
                  className="w-full"
                >
                  Fechar esta Aba
                </Button>
              </div>
            </>
          )}
          
          {status === 'loading' && (
            <div className="text-center text-sm text-muted-foreground">
              Por favor, aguarde...
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}