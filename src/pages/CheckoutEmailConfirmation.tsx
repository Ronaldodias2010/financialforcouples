import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, Loader2, CheckCircle, Clock, RefreshCw } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/components/ui/use-toast";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const CheckoutEmailConfirmation = () => {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [isChecking, setIsChecking] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [isEmailConfirmed, setIsEmailConfirmed] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const pollIntervalRef = useRef<number | null>(null);
  
  const sessionToken = searchParams.get('token');
  useEffect(() => {
    // Tentar obter email do usuário
    const urlParams = new URLSearchParams(window.location.search);
    const emailParam = urlParams.get('email');
    if (emailParam) {
      setUserEmail(emailParam);
    }

    // Verificar se o usuário já confirmou o email
    const checkEmailConfirmation = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email_confirmed_at) {
          setIsEmailConfirmed(true);
          // Se email confirmado e tem token de sessão, completar checkout
          if (sessionToken) {
            await completeCheckoutFlow();
          }
        }
      } catch (error) {
        console.error('Error checking email confirmation:', error);
      }
    };

    // Verificar imediatamente
    checkEmailConfirmation();

    // Configurar listener para mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Handle multiple possible events after confirmation
        if (event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'TOKEN_REFRESHED') {
          try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user?.email_confirmed_at) {
              setIsEmailConfirmed(true);
              if (sessionToken) {
                setTimeout(() => {
                  completeCheckoutFlow();
                }, 800);
              }
            }
          } catch (e) {
            console.error('Auth state check failed:', e);
          }
        }
      }
    );
    return () => subscription.unsubscribe();
  }, [sessionToken]);

  // Poll for confirmation in case it happened in another tab/origin
  useEffect(() => {
    if (isEmailConfirmed) return;

    let attempts = 0;
    const maxAttempts = 20; // ~60s at 3s interval
    pollIntervalRef.current = window.setInterval(async () => {
      attempts += 1;
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email_confirmed_at) {
          setIsEmailConfirmed(true);
          if (sessionToken) {
            completeCheckoutFlow();
          }
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
        }
      } catch (e) {
        console.log('Polling email confirmation failed:', e);
      } finally {
        if (attempts >= maxAttempts && pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
      }
    }, 3000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [isEmailConfirmed, sessionToken]);

  const completeCheckoutFlow = async () => {
    if (!sessionToken || isProcessingPayment) return;
    
    setIsProcessingPayment(true);
    
    try {
      toast({
        title: t('directCheckout.processingPayment'),
        description: t('directCheckout.redirectingToPayment'),
      });

      // Chamar edge function para completar checkout
      const { data: checkoutData, error: checkoutError } = await supabase.functions.invoke(
        'complete-checkout',
        {
          body: { sessionToken }
        }
      );

      if (checkoutError) throw checkoutError;

      if (checkoutData?.url) {
        // Redirecionar para o Stripe Checkout na mesma janela
        window.location.href = checkoutData.url;
      } else {
        throw new Error('URL de pagamento não recebida');
      }
    } catch (error) {
      console.error('Error completing checkout:', error);
      toast({
        title: t('directCheckout.error'),
        description: t('directCheckout.paymentError'),
        variant: "destructive",
      });
      setIsProcessingPayment(false);
    }
  };

  const checkEmailStatus = async () => {
    setIsChecking(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();

      // If we already have confirmation in session, proceed
      const currentUserConfirmed = !!session?.user?.email_confirmed_at;

      if (!currentUserConfirmed && session) {
        // Try to refresh tokens to get latest user metadata
        try { await supabase.auth.refreshSession(); } catch {}
      }

      // Fetch fresh user from server
      const { data: { user } } = await supabase.auth.getUser();

      if (user?.email_confirmed_at) {
        setIsEmailConfirmed(true);
        if (sessionToken) {
          await completeCheckoutFlow();
        }
        toast({
          title: t('emailConfirmation.emailConfirmed'),
          description: t('emailConfirmation.accountReady'),
          variant: "default",
        });
      } else {
        toast({
          title: t('emailConfirmation.notYetConfirmed'),
          description: t('emailConfirmation.pleaseCheck'),
          variant: "default",
        });
      }
    } catch (error) {
      console.error('Error checking email status:', error);
      toast({
        title: t('directCheckout.error'),
        description: t('directCheckout.checkEmailError'),
        variant: "destructive",
      });
    } finally {
      setIsChecking(false);
    }
  };

  const resendEmail = async () => {
    setIsChecking(true);
    try {
      // Primeiro tentar via função manual do Supabase
      try {
        const { data, error: manualError } = await supabase.functions.invoke(
          'send-confirmation-manual',
          {
            body: {
              userEmail: userEmail,
              language: language
            }
          }
        );
        
        if (manualError) {
          console.log('Manual send failed, trying auth.resend:', manualError);
          throw manualError;
        }
        
        console.log('Manual confirmation email sent:', data);
        
        toast({
          title: t('emailConfirmation.emailResent'),
          description: t('emailConfirmation.checkInbox'),
        });
        return;
        
      } catch (manualErr) {
        console.log('Fallback to auth.resend due to:', manualErr);
      }
      
      // Fallback para método padrão do Supabase
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: userEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/checkout-email-confirmation${sessionToken ? `?token=${sessionToken}` : ''}`
        }
      });
      
      if (error) throw error;
      
      toast({
        title: t('emailConfirmation.emailResent'),
        description: t('emailConfirmation.checkInbox'),
      });
    } catch (error) {
      console.error('Error resending email:', error);
      toast({
        title: t('directCheckout.error'),
        description: t('emailConfirmation.resendError'),
        variant: "destructive",
      });
    } finally {
      setIsChecking(false);
    }
  };

  if (isProcessingPayment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-muted/40 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
            </div>
            <CardTitle className="text-xl text-foreground">
              {t('directCheckout.processingPayment')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              {t('directCheckout.redirectingToStripe')}
            </p>
            <div className="text-sm text-muted-foreground">
              {t('directCheckout.pleaseWait')}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-muted/40 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        
        {/* Header with logo */}
        <div className="text-center">
          <img
            src="/lovable-uploads/2f7e7907-5cf5-4262-adbd-04f4dbd3151b.png"
            alt="Couples Financials"
            className="w-16 h-16 mx-auto mb-4"
          />
          <h1 className="text-xl font-bold text-foreground">Couples Financials</h1>
        </div>

        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                isEmailConfirmed ? 'bg-green-100' : 'bg-primary/10'
              }`}>
                {isEmailConfirmed ? (
                  <CheckCircle className="w-8 h-8 text-green-600" />
                ) : (
                  <Mail className="w-8 h-8 text-primary" />
                )}
              </div>
            </div>
            <CardTitle className="text-xl text-foreground">
              {isEmailConfirmed 
                ? t('emailConfirmation.confirmed')
                : t('emailConfirmation.title')
              }
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEmailConfirmed ? (
              <div className="text-center">
                <div className="text-green-600 font-medium mb-2">
                  ✅ {t('emailConfirmation.emailConfirmed')}
                </div>
                <p className="text-muted-foreground text-sm mb-4">
                  {sessionToken 
                    ? t('emailConfirmation.redirectingToPayment')
                    : t('emailConfirmation.accountReady')
                  }
                </p>
                {sessionToken && (
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    {t('emailConfirmation.preparingPayment')}
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className="text-center">
                  <p className="text-muted-foreground mb-4">
                    {t('emailConfirmation.checkEmail')}
                  </p>
                  {userEmail && (
                    <p className="text-sm text-primary font-medium mb-4">
                      📧 {userEmail}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mb-6">
                    {t('emailConfirmation.afterConfirming')}
                  </p>
                </div>

                <div className="space-y-3">
                  <Button 
                    onClick={checkEmailStatus}
                    className="w-full"
                    disabled={isChecking}
                  >
                    {isChecking && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {t('emailConfirmation.checkStatus')}
                  </Button>
                  
                  <Button 
                    variant="outline"
                    onClick={resendEmail}
                    className="w-full"
                    disabled={isChecking || !userEmail}
                  >
                    {isChecking ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4 mr-2" />
                    )}
                    {t('emailConfirmation.resendEmail')}
                  </Button>
                </div>

                <div className="text-xs text-muted-foreground text-center pt-4 border-t">
                  {t('emailConfirmation.troubleshooting')}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Close page instruction */}
        <div className="text-center text-xs text-muted-foreground">
          {t('emailConfirmation.closeThisPage')}
        </div>
      </div>
    </div>
  );
};

export default CheckoutEmailConfirmation;