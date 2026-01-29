import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2, XCircle } from 'lucide-react';

export default function EmailConfirmation() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [countdown, setCountdown] = useState(5);
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      try {
        console.log('EmailConfirmation: Starting confirmation process...');
        console.log('Current URL:', window.location.href);
        console.log('Hash:', window.location.hash);
        
        // Check if there's a hash fragment with tokens (from Supabase redirect)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const type = hashParams.get('type');
        const errorCode = hashParams.get('error_code');
        const errorDescription = hashParams.get('error_description');
        
        console.log('Hash params - type:', type, 'has access_token:', !!accessToken, 'error_code:', errorCode);
        
        // Check for errors in the URL
        if (errorCode || errorDescription) {
          console.error('Error in URL:', errorCode, errorDescription);
          setErrorMessage(errorDescription || 'Erro na confirmação');
          setStatus('error');
          return;
        }

        // If we have tokens from the hash, set the session
        if (accessToken && refreshToken) {
          console.log('Found tokens in URL hash, setting session...');
          
          const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (sessionError) {
            console.error('Error setting session:', sessionError);
            setErrorMessage(sessionError.message);
            setStatus('error');
            return;
          }

          if (sessionData.session) {
            console.log('Session set successfully, user:', sessionData.session.user.email);
            console.log('Email confirmed at:', sessionData.session.user.email_confirmed_at);
            
            // Mark email as verified in profiles table
            try {
              await supabase.rpc('verify_user_email', { 
                p_user_id: sessionData.session.user.id 
              });
              console.log('Profile email_verified flag updated');
            } catch (verifyError) {
              console.error('Error updating email_verified flag:', verifyError);
              // Continue anyway - the session is valid
            }
            
            setStatus('success');
            setShouldRedirect(true);
            
            // Clean up the URL hash
            window.history.replaceState(null, '', window.location.pathname + window.location.search);
            return;
          }
        }

        // Check for existing session
        console.log('Checking for existing session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session error:', error);
          setErrorMessage(error.message);
          setStatus('error');
          return;
        }

        if (session && session.user) {
          console.log('Found existing session for:', session.user.email);
          console.log('Email confirmed at:', session.user.email_confirmed_at);
          
          if (session.user.email_confirmed_at) {
            // Mark email as verified in profiles table
            try {
              await supabase.rpc('verify_user_email', { 
                p_user_id: session.user.id 
              });
              console.log('Profile email_verified flag updated');
            } catch (verifyError) {
              console.error('Error updating email_verified flag:', verifyError);
              // Continue anyway - the session is valid
            }
            
            setStatus('success');
            setShouldRedirect(true);
          } else {
            // User has session but email not confirmed yet
            console.log('Session exists but email not confirmed');
            setErrorMessage('Email ainda não foi confirmado. Por favor, verifique seu email.');
            setStatus('error');
          }
        } else {
          // No session and no tokens - likely direct navigation or expired link
          console.log('No session found and no tokens in URL');
          setErrorMessage('Link de confirmação inválido ou expirado. Por favor, solicite um novo email de confirmação.');
          setStatus('error');
        }
      } catch (error: any) {
        console.error('Confirmation error:', error);
        setErrorMessage(error.message || 'Erro desconhecido');
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
      // Redirect to app since user is now verified
      window.location.href = '/app';
    }
  }, [shouldRedirect, countdown]);

  const handleManualRedirect = () => {
    // Redirect to app since user is verified
    window.location.href = '/app';
  };

  const handleCloseTab = () => {
    window.close();
  };

  // Get language from URL params
  const lang = searchParams.get('lang') || 'pt';
  
  const texts = {
    pt: {
      loading: 'Confirmando Email...',
      success: 'Email Confirmado!',
      error: 'Erro na Confirmação',
      loadingDesc: 'Aguarde enquanto confirmamos seu email.',
      successDesc: `Redirecionando em ${countdown} segundos...`,
      errorDesc: errorMessage || 'Houve um erro ao confirmar seu email.',
      successMessage: 'Sua conta foi confirmada com sucesso! Você será redirecionado para o aplicativo.',
      errorMessage: 'Erro na confirmação. Retorne ao aplicativo e tente reenviar o email de confirmação.',
      goToApp: 'Ir para o App',
      goToAppNow: 'Entrar no App Agora',
      closeTab: 'Fechar esta Aba',
      wait: 'Por favor, aguarde...'
    },
    en: {
      loading: 'Confirming Email...',
      success: 'Email Confirmed!',
      error: 'Confirmation Error',
      loadingDesc: 'Please wait while we confirm your email.',
      successDesc: `Redirecting in ${countdown} seconds...`,
      errorDesc: errorMessage || 'There was an error confirming your email.',
      successMessage: 'Your account has been confirmed successfully! You will be redirected to the app.',
      errorMessage: 'Confirmation error. Return to the app and try resending the confirmation email.',
      goToApp: 'Go to App',
      goToAppNow: 'Enter App Now',
      closeTab: 'Close this Tab',
      wait: 'Please wait...'
    },
    es: {
      loading: 'Confirmando Email...',
      success: '¡Email Confirmado!',
      error: 'Error en la Confirmación',
      loadingDesc: 'Espere mientras confirmamos su email.',
      successDesc: `Redirigiendo en ${countdown} segundos...`,
      errorDesc: errorMessage || 'Hubo un error al confirmar su email.',
      successMessage: '¡Su cuenta ha sido confirmada con éxito! Será redirigido a la aplicación.',
      errorMessage: 'Error en la confirmación. Vuelva a la aplicación e intente reenviar el email.',
      goToApp: 'Ir al App',
      goToAppNow: 'Entrar al App Ahora',
      closeTab: 'Cerrar esta Pestaña',
      wait: 'Por favor espere...'
    }
  };

  const t = texts[lang as keyof typeof texts] || texts.pt;

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
              {status === 'loading' && t.loading}
              {status === 'success' && t.success}
              {status === 'error' && t.error}
            </CardTitle>
            <CardDescription className="text-muted-foreground mt-2">
              {status === 'loading' && t.loadingDesc}
              {status === 'success' && t.successDesc}
              {status === 'error' && t.errorDesc}
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {status === 'success' && (
            <>
              <div className="text-center text-sm text-muted-foreground">
                {t.successMessage}
              </div>
              <div className="space-y-2">
                <Button 
                  onClick={handleManualRedirect}
                  className="w-full"
                >
                  {t.goToAppNow}
                </Button>
                <Button 
                  onClick={handleCloseTab}
                  variant="outline"
                  className="w-full"
                >
                  {t.closeTab}
                </Button>
              </div>
            </>
          )}
          
          {status === 'error' && (
            <>
              <div className="text-center text-sm text-muted-foreground">
                {t.errorMessage}
              </div>
              <div className="space-y-2">
                <Button 
                  onClick={handleManualRedirect}
                  className="w-full"
                >
                  {t.goToApp}
                </Button>
                <Button 
                  onClick={handleCloseTab}
                  variant="outline"
                  className="w-full"
                >
                  {t.closeTab}
                </Button>
              </div>
            </>
          )}
          
          {status === 'loading' && (
            <div className="text-center text-sm text-muted-foreground">
              {t.wait}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
