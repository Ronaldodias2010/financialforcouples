import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CreditCard, Eye, EyeOff, Mail, Shield, ArrowLeft, Fingerprint } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useLanguage } from '@/hooks/useLanguage';
import { PasswordValidation, PasswordMatchValidation, validatePassword } from '@/components/ui/PasswordValidation';
import { translateAuthError } from '@/utils/authErrors';
import { trackSignUp, trackLogin } from '@/utils/analytics';
import { TwoFactorVerification } from '@/components/auth/TwoFactorVerification';
import { TwoFactorMethod } from '@/hooks/use2FA';
import { use2FAStatus } from '@/hooks/use2FAStatus';
import { ProvisionalAccessAlert } from '@/components/auth/ProvisionalAccessAlert';
import { BiometricActivationModal } from '@/components/auth/BiometricActivationModal';
import { BiometricLoginButton } from '@/components/auth/BiometricLoginButton';
import { useWebAuthn } from '@/hooks/useWebAuthn';

export default function Auth() {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isResetMode, setIsResetMode] = useState(false);
  const [isInviteAccess, setIsInviteAccess] = useState(false);
  
  const [defaultTab, setDefaultTab] = useState<'signin' | 'signup'>('signin');
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [show2FAVerification, setShow2FAVerification] = useState(false);
  const [twoFactorMethod, setTwoFactorMethod] = useState<TwoFactorMethod>('none');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [smsError, setSmsError] = useState(false);
  const [smsErrorMessage, setSmsErrorMessage] = useState<string | null>(null);
  
  // Provisional login state
  const [showProvisionalAlert, setShowProvisionalAlert] = useState(false);
  const [pendingSignupEmail, setPendingSignupEmail] = useState<string | null>(null);
  
  // Biometric state
  const [showBiometricModal, setShowBiometricModal] = useState(false);
  const [pendingBiometricActivation, setPendingBiometricActivation] = useState(false);
  const { isSupported: isBiometricSupported, hasCredentials: hasBiometricCredentials, checkHasCredentials } = useWebAuthn();
  const [isResendingEmail, setIsResendingEmail] = useState(false);
  const provisionalTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  const { toast } = useToast();
  const { language, setLanguage, t } = useLanguage();
  const { has2FAEnabled, isLoaded: is2FAStatusLoaded } = use2FAStatus();
  const navigate = useNavigate();

  // Force light mode for auth page (even if user preference is dark)
  useLayoutEffect(() => {
    const root = document.documentElement;
    root.dataset.forceTheme = 'light';
    root.classList.remove('dark');
    root.classList.add('light');
    window.dispatchEvent(new Event('app:force-theme-change'));

    return () => {
      delete root.dataset.forceTheme;
      window.dispatchEvent(new Event('app:force-theme-change'));
    };
  }, []);

  // Listen for auth state changes (captures OAuth completion)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        // Redirect to callback to show 2FA wizard
        window.location.href = '/auth/callback';
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    // Verificar se já está logado
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        // Redirect to callback to check 2FA status
        window.location.href = '/auth/callback';
      }
    });

    // Verificar se é acesso via convite através de parâmetros da URL
    const urlParams = new URLSearchParams(window.location.search);
    const inviteEmail = urlParams.get('email');
    const fromInvite = urlParams.get('invite') === 'true';
    const tabParam = urlParams.get('tab');

    // Definir aba padrão com base no parâmetro de URL, evitando signup quando for convite
    if (tabParam === 'signup' && !fromInvite) {
      setDefaultTab('signup');
    } else {
      setDefaultTab('signin');
    }
    
    if (fromInvite && inviteEmail) {
      setIsInviteAccess(true);
      setEmail(inviteEmail);
    }
  }, []);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsLoading(true);
    try {
      // Primeiro verificar se é um convite com senha temporária
      if (isInviteAccess) { // Usar edge function apenas quando vem de um link de convite
        // É um login com senha temporária - usar edge function
        const { data, error } = await supabase.functions.invoke('validate-temp-login', {
          body: {
            email,
            temp_password: password
          }
        });

        if (error) {
          console.error('Error in validate-temp-login:', error);
          // Se falhou na edge function, tentar login normal como fallback
          // Isso pode acontecer se o usuário já trocou a senha
        } else if (data?.success && data?.access_token) {
          toast({
            title: t('auth.loginSuccessTitle'),
            description: t('auth.loginSuccessDesc'),
          });
          
          // Configurar a sessão automaticamente
          const { error: setSessionError } = await supabase.auth.setSession({
            access_token: data.access_token,
            refresh_token: data.refresh_token
          });
          
          if (setSessionError) {
            console.error('Error setting session:', setSessionError);
            throw new Error('Erro ao configurar sessão');
          }
          
          // Redirecionar para mudança de senha obrigatória
          window.location.href = '/change-password';
          return;
        }
      }
      
      // Limpeza robusta de sessão antes de tentar novo login
      try {
        const { cleanupAuthState } = await import('@/utils/authCleanup');
        cleanupAuthState();
        try { await supabase.auth.signOut({ scope: 'global' }); } catch {}
      } catch {}
      
      // Se chegou aqui, fazer login normal com email/senha
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      if (data.user) {
        trackLogin('email');
        setCurrentUserId(data.user.id);
        setCurrentUserEmail(data.user.email || email);
        
        // Verificar se usuário tem 2FA habilitado
        try {
          const { data: tfaResponse } = await supabase.functions.invoke('check-2fa-status', {
            body: { userId: data.user.id }
          });

          if (tfaResponse?.is_enabled && tfaResponse?.method && tfaResponse.method !== 'none') {
            // Reset SMS error state
            setSmsError(false);
            setSmsErrorMessage(null);
            
            // Enviar código no canal correto
            if (tfaResponse.method === 'sms') {
              const phone = tfaResponse.phone_number;
              if (phone) {
                const { data: smsResponse, error: smsNetworkError } = await supabase.functions.invoke('send-phone-verification', {
                  body: { phoneNumber: phone, language, userId: data.user.id }
                });
                
                // Check if SMS failed
                if (smsNetworkError || smsResponse?.error) {
                  console.warn('[Auth] SMS failed:', smsNetworkError || smsResponse);
                  setSmsError(true);
                  setSmsErrorMessage(smsResponse?.error_code || smsResponse?.error_message || 'SMS_FAILED');
                }
              }
            } else if (tfaResponse.method === 'email') {
              await supabase.functions.invoke('send-2fa-email', {
                body: { userId: data.user.id, email: data.user.email ?? email, language }
              });
            }
            
            setTwoFactorMethod(tfaResponse.method as TwoFactorMethod);
            setShow2FAVerification(true);
            setIsLoading(false);
            return; // Não redirecionar ainda
          }
        } catch (tfaError) {
          console.log('2FA check skipped:', tfaError);
        }
        
        // Check if we should offer biometric activation
        if (isBiometricSupported) {
          const hasBio = await checkHasCredentials(email);
          if (!hasBio) {
            // User doesn't have biometrics set up - offer to enable
            setPendingBiometricActivation(true);
            setShowBiometricModal(true);
            return; // Don't redirect yet, let user decide
          }
        }
          
        toast({
          title: t('auth.loginSuccessTitle'),
          description: t('auth.loginSuccessDesc'),
        });
        window.location.href = '/app';
      }
    } catch (error: any) {
      console.error('Login error:', error);
      const errorMsg = error.message?.toLowerCase() || '';
      const errorCode = error.code || '';
      
      // Verificar se é erro de email não confirmado ou credenciais inválidas
      if (errorMsg.includes('email not confirmed') || errorMsg.includes('invalid login credentials') || errorCode === 'invalid_credentials') {
        const errorTitle = language === 'en' 
          ? 'Login Error' 
          : language === 'es' 
          ? 'Error de inicio de sesión' 
          : 'Erro no login';
        
        const errorDesc = language === 'en'
          ? 'Invalid credentials or email not confirmed. Check your inbox for the confirmation link, or try registering again if you haven\'t received the email.'
          : language === 'es'
          ? 'Credenciales inválidas o email no confirmado. Revisa tu bandeja de entrada para el enlace de confirmación, o intenta registrarte de nuevo si no recibiste el email.'
          : 'Credenciais inválidas ou e-mail não confirmado. Verifique sua caixa de entrada para o link de confirmação, ou tente se cadastrar novamente se não recebeu o e-mail.';
        
        toast({
          variant: "destructive",
          title: errorTitle,
          description: errorDesc,
        });
      } else {
        const translatedError = translateAuthError(error.message || '', language);
        toast({
          variant: "destructive",
          title: t('auth.loginErrorTitle'),
          description: translatedError,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      trackSignUp('google'); // Track before redirect
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });
      
      if (error) throw error;
      
    } catch (error: any) {
      const translatedError = translateAuthError(error.message || '', language);
      toast({
        variant: "destructive",
        title: t('auth.googleErrorTitle'),
        description: translatedError,
      });
      setIsLoading(false);
    }
  };

  const handle2FAVerified = () => {
    toast({
      title: t('auth.loginSuccessTitle'),
      description: t('auth.loginSuccessDesc'),
    });
    window.location.href = '/app';
  };

  const handle2FACancel = async () => {
    await supabase.auth.signOut();
    setShow2FAVerification(false);
    setTwoFactorMethod('none');
    setSmsError(false);
    setSmsErrorMessage(null);
  };

  const handleRetrySMS = async () => {
    if (!currentUserId) return;
    
    setSmsError(false);
    setSmsErrorMessage(null);
    
    try {
      const { data: tfaResponse } = await supabase.functions.invoke('check-2fa-status', {
        body: { userId: currentUserId }
      });
      
      if (tfaResponse?.phone_number) {
        const { data: smsResponse, error: smsError } = await supabase.functions.invoke('send-phone-verification', {
          body: { 
            phoneNumber: tfaResponse.phone_number, 
            language,
            userId: currentUserId
          }
        });
        
        if (smsError || smsResponse?.error) {
          setSmsError(true);
          setSmsErrorMessage(smsResponse?.error_code || smsResponse?.error_message || 'SMS_FAILED');
          toast({
            variant: 'destructive',
            title: language === 'en' ? 'SMS Error' : language === 'es' ? 'Error de SMS' : 'Erro de SMS',
            description: language === 'en' 
              ? 'Could not send SMS. Try email as backup.'
              : language === 'es'
              ? 'No se pudo enviar el SMS. Intente correo como respaldo.'
              : 'Não foi possível enviar o SMS. Tente email como backup.',
          });
        } else {
          toast({
            title: language === 'en' ? 'SMS Sent' : language === 'es' ? 'SMS Enviado' : 'SMS Enviado',
            description: language === 'en' 
              ? 'A new verification code has been sent.'
              : language === 'es'
              ? 'Se ha enviado un nuevo código de verificación.'
              : 'Um novo código de verificação foi enviado.',
          });
        }
      }
    } catch (error) {
      console.error('Retry SMS failed:', error);
      setSmsError(true);
      setSmsErrorMessage('EXCEPTION');
    }
  };


  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !confirmPassword || !phoneNumber) {
      toast({
        variant: "destructive",
        title: t('auth.fieldsRequired'),
        description: t('auth.fieldsRequiredDesc'),
      });
      return;
    }

    console.log('🔐 [AUTH] Starting signup process for:', email);

    // Validar senha antes de submeter
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      console.log('❌ [AUTH] Password validation failed');
      toast({
        variant: "destructive",
        title: t('password.error.weakTitle'),
        description: t('password.error.invalid'),
      });
      return;
    }

    // Validar se as senhas coincidem
    if (password !== confirmPassword) {
      console.log('❌ [AUTH] Passwords do not match');
      toast({
        variant: "destructive",
        title: t('password.error.mismatchTitle'),
        description: t('password.error.mismatch'),
      });
      return;
    }

    setIsLoading(true);
    try {
      console.log('📧 [AUTH] Calling Supabase signUp...');
      const redirectUrl = `${window.location.origin}/email-confirmation`;
      
      // Limpar sessão anterior
      try {
        const { cleanupAuthState } = await import('@/utils/authCleanup');
        cleanupAuthState();
        try { await supabase.auth.signOut({ scope: 'global' }); } catch {}
      } catch {}
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            display_name: displayName || email.split('@')[0],
            phone_number: phoneNumber
          }
        }
      });
      
      const errorMsg = error?.message?.toLowerCase() || '';
      const isWebhookTimeout = errorMsg.includes('hook') && (errorMsg.includes('timeout') || errorMsg.includes('maximum time'));
      
      if (error && !isWebhookTimeout) {
        console.error('❌ [AUTH] Signup error:', error);
        throw error;
      }

      // Conta criada com sucesso! Agora vamos fazer login automático
      console.log('✅ [AUTH] Signup completed, attempting immediate login...');
      
      // Enviar email de confirmação em background (não bloqueia)
      const userEmail = data?.user?.email || email;
      if (userEmail) {
        console.log('📧 [AUTH] Sending confirmation email in background...');
        supabase.functions.invoke('send-confirmation', {
          body: {
            userEmail: userEmail,
            language: language
          }
        }).catch((emailError) => {
          console.warn('⚠️ [AUTH] Background email send failed (non-critical):', emailError);
        });
      }
      
      trackSignUp('email');
      
      // Tentar fazer login imediato com as credenciais recém-criadas
      console.log('🔑 [AUTH] Attempting immediate login...');
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (loginError) {
        // Se falhou o login (ex: email não confirmado no Supabase), ainda permitimos acesso provisório
        console.log('⚠️ [AUTH] Immediate login failed:', loginError.message);
        
        // Verificar se o erro é de email não confirmado
        if (loginError.message?.toLowerCase().includes('email not confirmed')) {
          // Mostrar mensagem de sucesso e oferecer acesso provisório
          const successTitle = language === 'en' 
            ? '✅ Account Created!' 
            : language === 'es' 
            ? '✅ ¡Cuenta Creada!' 
            : '✅ Conta Criada!';
          
          const successDesc = language === 'en'
            ? 'Your account was created. Click below to enter the platform. We will send a verification email.'
            : language === 'es'
            ? 'Tu cuenta fue creada. Haz clic abajo para entrar a la plataforma. Te enviaremos un correo de verificación.'
            : 'Sua conta foi criada. Clique abaixo para entrar na plataforma. Enviaremos um e-mail de verificação.';
          
          toast({
            title: successTitle,
            description: successDesc,
            duration: 10000,
          });
          
          // Mostrar o alerta de acesso provisório imediatamente
          setPendingSignupEmail(email);
          setShowProvisionalAlert(true);
          
          // Limpar formulário (exceto email e password para o login provisório)
          setDisplayName('');
          setPhoneNumber('');
          setConfirmPassword('');
        } else {
          throw loginError;
        }
      } else if (loginData.user) {
        // Login imediato bem-sucedido!
        console.log('✅ [AUTH] Immediate login successful!');
        trackLogin('email');
        
        // Mostrar mensagem de boas-vindas
        const welcomeTitle = language === 'en' 
          ? '🎉 Welcome!' 
          : language === 'es' 
          ? '🎉 ¡Bienvenido!' 
          : '🎉 Bem-vindo!';
        
        const welcomeDesc = language === 'en'
          ? 'Your account is ready. We will send a verification email shortly.'
          : language === 'es'
          ? 'Tu cuenta está lista. Te enviaremos un correo de verificación en breve.'
          : 'Sua conta está pronta. Enviaremos um e-mail de verificação em breve.';
        
        toast({
          title: welcomeTitle,
          description: welcomeDesc,
          duration: 5000,
        });
        
        // Redirecionar para o app imediatamente
        window.location.href = '/app';
        return;
      }
    } catch (error: any) {
      const translatedError = translateAuthError(error.message || '', language);
      toast({
        variant: "destructive",
        title: t('auth.signupErrorTitle'),
        description: translatedError,
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handler for resending confirmation email
  const handleResendConfirmationEmail = async (): Promise<boolean> => {
    const emailToResend = pendingSignupEmail || email;
    if (!emailToResend) return false;
    
    setIsResendingEmail(true);
    try {
      const { error } = await supabase.functions.invoke('send-confirmation', {
        body: { email: emailToResend }
      });
      
      if (error) {
        console.error('[Auth] Error resending confirmation:', error);
        toast({
          variant: 'destructive',
          title: language === 'en' ? 'Error' : language === 'es' ? 'Error' : 'Erro',
          description: language === 'en' 
            ? 'Could not resend email. Please try again.' 
            : language === 'es'
            ? 'No se pudo reenviar el correo. Intente nuevamente.'
            : 'Não foi possível reenviar o e-mail. Tente novamente.',
        });
        return false;
      }
      
      toast({
        title: language === 'en' ? 'Email sent!' : language === 'es' ? '¡Correo enviado!' : 'E-mail enviado!',
        description: language === 'en' 
          ? 'Check your inbox and spam folder.' 
          : language === 'es'
          ? 'Revisa tu bandeja de entrada y spam.'
          : 'Verifique sua caixa de entrada e spam.',
      });
      return true;
    } catch (err) {
      console.error('[Auth] Exception resending email:', err);
      return false;
    } finally {
      setIsResendingEmail(false);
    }
  };
  
  // Handler for provisional login - allows entry without email confirmation
  const handleProvisionalLogin = async () => {
    const emailToLogin = pendingSignupEmail || email;
    if (!emailToLogin || !password) {
      toast({
        variant: 'destructive',
        title: language === 'en' ? 'Missing credentials' : language === 'es' ? 'Credenciales faltantes' : 'Credenciais faltando',
        description: language === 'en' 
          ? 'Please enter your password to continue.' 
          : language === 'es'
          ? 'Por favor ingrese su contraseña para continuar.'
          : 'Por favor, insira sua senha para continuar.',
      });
      return;
    }
    
    setIsLoading(true);
    try {
      // Limpar estado de autenticação
      try {
        const { cleanupAuthState } = await import('@/utils/authCleanup');
        cleanupAuthState();
        try { await supabase.auth.signOut({ scope: 'global' }); } catch {}
      } catch {}
      
      console.log('[Auth] Attempting provisional login for:', emailToLogin);
      
      // Usar edge function para login provisório
      const { data, error } = await supabase.functions.invoke('provisional-login', {
        body: { email: emailToLogin, password }
      });
      
      if (error || !data?.success) {
        console.error('[Auth] Provisional login failed:', error || data?.error);
        toast({
          variant: 'destructive',
          title: language === 'en' ? 'Login failed' : language === 'es' ? 'Error de inicio de sesión' : 'Falha no login',
          description: language === 'en' 
            ? 'Could not log in. Please check your credentials.' 
            : language === 'es'
            ? 'No se pudo iniciar sesión. Verifica tus credenciales.'
            : 'Não foi possível fazer login. Verifique suas credenciais.',
        });
        return;
      }
      
      // Configurar a sessão com os tokens retornados
      if (data.access_token && data.refresh_token) {
        const { error: setSessionError } = await supabase.auth.setSession({
          access_token: data.access_token,
          refresh_token: data.refresh_token
        });
        
        if (setSessionError) {
          console.error('[Auth] Error setting session:', setSessionError);
          throw setSessionError;
        }
      }
      
      // Login bem-sucedido
      trackLogin('email');
      
      const welcomeTitle = data.provisional
        ? (language === 'en' ? '🎉 Welcome!' : language === 'es' ? '🎉 ¡Bienvenido!' : '🎉 Bem-vindo!')
        : (language === 'en' ? 'Logged in!' : language === 'es' ? '¡Sesión iniciada!' : 'Login realizado!');
      
      const welcomeDesc = data.provisional
        ? (language === 'en' 
            ? 'You have provisional access. Please verify your email for full access.' 
            : language === 'es'
            ? 'Tienes acceso provisional. Verifica tu correo para acceso completo.'
            : 'Você tem acesso provisório. Verifique seu e-mail para acesso completo.')
        : (language === 'en' 
            ? 'Welcome to the platform.' 
            : language === 'es'
            ? 'Bienvenido a la plataforma.'
            : 'Bem-vindo à plataforma.');
      
      toast({
        title: welcomeTitle,
        description: welcomeDesc,
      });
      
      // Clear timer and state
      if (provisionalTimerRef.current) {
        clearTimeout(provisionalTimerRef.current);
      }
      setShowProvisionalAlert(false);
      setPendingSignupEmail(null);
      
      window.location.href = '/app';
    } catch (error: any) {
      console.error('[Auth] Provisional login error:', error);
      const translatedError = translateAuthError(error.message || '', language);
      toast({
        variant: 'destructive',
        title: language === 'en' ? 'Login error' : language === 'es' ? 'Error de inicio de sesión' : 'Erro no login',
        description: translatedError,
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (provisionalTimerRef.current) {
        clearTimeout(provisionalTimerRef.current);
      }
    };
  }, []);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({
        variant: "destructive",
        title: t('auth.emailRequiredTitle'),
        description: t('auth.emailRequiredDesc'),
      });
      return;
    }

    setIsLoading(true);
    try {
      // Enviar email de redefinição usando nossa edge function
      const { error } = await supabase.functions.invoke('send-password-reset', {
        body: {
          userEmail: email,
          resetUrl: `${window.location.origin}/reset-password`,
          language: language
        }
      });

      if (error) throw error;

      toast({
        title: t('auth.resetEmailTitle'),
        description: t('auth.resetEmailDesc'),
      });
      setIsResetMode(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t('auth.resetEmailErrorTitle'),
        description: error.message || t('auth.resetEmailErrorDesc'),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <Card className="w-full max-w-md mx-auto bg-card/80 backdrop-blur-sm border-primary/20">
        <CardHeader className="text-center space-y-4 px-4 sm:px-6 pt-4 sm:pt-6">
          <div className="flex justify-between items-center">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/')}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              {language === 'en' ? 'Back' : language === 'es' ? 'Volver' : 'Voltar'}
            </Button>
            <div className="inline-flex gap-1 sm:gap-2">
              <Button variant={language === 'pt' ? 'default' : 'outline'} size="sm" onClick={() => setLanguage('pt')} className="text-xs sm:text-sm px-2 sm:px-3">PT</Button>
              <Button variant={language === 'en' ? 'default' : 'outline'} size="sm" onClick={() => setLanguage('en')} className="text-xs sm:text-sm px-2 sm:px-3">EN</Button>
              <Button variant={language === 'es' ? 'default' : 'outline'} size="sm" onClick={() => setLanguage('es')} className="text-xs sm:text-sm px-2 sm:px-3">ES</Button>
            </div>
          </div>
          <div className="flex justify-center">
            <img 
              src="/lovable-uploads/1f5e0469-b056-4cf9-9583-919702fa8736.png" 
              alt="Financial App Logo" 
              className="h-24 w-24 sm:h-32 sm:w-32 object-contain"
            />
          </div>
          <div>
            <CardTitle className="text-xl sm:text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              {t('auth.appName')}
            </CardTitle>
            <CardDescription className="text-muted-foreground mt-2 text-sm sm:text-base">
              {t('auth.tagline')}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
          {isInviteAccess && (
            <Alert className="mb-4 border-primary/20 bg-primary/5">
              <Mail className="h-4 w-4" />
              <AlertDescription className="text-sm">
                {t('auth.inviteBanner')}
              </AlertDescription>
            </Alert>
          )}
          
          <Tabs defaultValue={defaultTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-9 sm:h-10">
              <TabsTrigger value="signin" className="text-sm sm:text-base">{t('auth.signIn')}</TabsTrigger>
              <TabsTrigger value="signup" disabled={isInviteAccess} className="text-sm sm:text-base">
                {t('auth.signUp')}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin">
              {isResetMode ? (
                <form onSubmit={handlePasswordReset} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reset-email">{t('auth.email')}</Label>
                    <Input
                      id="reset-email"
                      type="email"
                      placeholder={t('auth.emailPlaceholder')}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t('auth.resetEmailSend')}
                  </Button>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    className="w-full"
                    onClick={() => setIsResetMode(false)}
                  >
                    {t('auth.backToLogin')}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleSignIn} className="space-y-4">
                   {/* Biometric Login Button - shown first if email has biometrics */}
                   {email && isBiometricSupported && (
                     <BiometricLoginButton
                       email={email}
                       onSuccess={() => {
                         toast({
                           title: t('auth.loginSuccessTitle'),
                           description: t('auth.loginSuccessDesc'),
                         });
                         window.location.href = '/app';
                       }}
                       onFallbackToPassword={() => {}}
                     />
                   )}
                   
                   <div className="space-y-2">
                     <Label htmlFor="signin-email">{t('auth.email')}</Label>
                     <Input
                       id="signin-email"
                       type="email"
                       placeholder={t('auth.emailPlaceholder')}
                       value={email}
                       onChange={(e) => setEmail(e.target.value)}
                       required
                       disabled={isInviteAccess}
                     />
                   </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">
                      {isInviteAccess ? t('auth.tempPassword') : t('auth.password')}
                    </Label>
                    <div className="relative">
                       <Input
                         id="signin-password"
                         type={showSignInPassword ? "text" : "password"}
                         placeholder={isInviteAccess ? t('auth.tempPasswordPlaceholder') : "••••••••"}
                         value={password}
                         onChange={(e) => setPassword(e.target.value)}
                         required
                         className="pr-10"
                       />
                     <button
                       type="button"
                       className="absolute inset-y-0 right-0 pr-3 flex items-center"
                       onClick={() => setShowSignInPassword(!showSignInPassword)}
                     >
                       {showSignInPassword ? (
                         <EyeOff className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                       ) : (
                         <Eye className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                       )}
                     </button>
                   </div>
                 </div>
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading}
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t('auth.signIn')}
                </Button>
                {/* 2FA Recommendation Alert - only show if user hasn't enabled 2FA before */}
                {is2FAStatusLoaded && !has2FAEnabled && (
                  <Alert className="border-blue-500/20 bg-blue-500/5">
                    <Shield className="h-4 w-4 text-blue-500" />
                    <AlertDescription className="text-sm text-blue-600 dark:text-blue-400">
                      {t('auth.2faRecommendation')}
                    </AlertDescription>
                  </Alert>
                )}
                
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-colors"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  {t('auth.continueWithGoogle')}
                </Button>
                <Button 
                  type="button" 
                  variant="ghost" 
                  className="w-full text-sm"
                  onClick={() => setIsResetMode(true)}
                >
                  {t('auth.forgotPassword')}
                </Button>
              </form>
              )}
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">{t('auth.name')}</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder={t('auth.yourName')}
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">{t('auth.email')}</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder={t('auth.emailPlaceholder')}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                 <div className="space-y-2">
                   <Label htmlFor="signup-phone">{t('auth.phone')} *</Label>
                   <Input
                     id="signup-phone"
                     type="tel"
                     placeholder={t('auth.phonePlaceholder')}
                     value={phoneNumber}
                     onChange={(e) => setPhoneNumber(e.target.value)}
                     required
                   />
                   <p className="text-xs text-muted-foreground">
                     {language === 'pt' ? 'Campo obrigatório para contato' : 'Required field for contact'}
                   </p>
                 </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">{t('auth.password')}</Label>
                  <div className="relative">
                    <Input
                      id="signup-password"
                      type={showSignUpPassword ? "text" : "password"}
                      placeholder={"••••••••"}
                       value={password}
                       onChange={(e) => setPassword(e.target.value)}
                       required
                       className="pr-10"
                     />
                     <button
                       type="button"
                       className="absolute inset-y-0 right-0 pr-3 flex items-center"
                       onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                     >
                       {showSignUpPassword ? (
                         <EyeOff className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                       ) : (
                         <Eye className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                       )}
                     </button>
                   </div>
                 </div>
                   <div className="space-y-2">
                     <Label htmlFor="confirm-password">{t('auth.confirmPassword')}</Label>
                     <div className="relative">
                       <Input
                         id="confirm-password"
                         type={showConfirmPassword ? "text" : "password"}
                         placeholder={"••••••••"}
                         value={confirmPassword}
                         onChange={(e) => setConfirmPassword(e.target.value)}
                         required
                         className="pr-10"
                       />
                       <button
                         type="button"
                         className="absolute inset-y-0 right-0 pr-3 flex items-center"
                         onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                       >
                         {showConfirmPassword ? (
                           <EyeOff className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                         ) : (
                           <Eye className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                         )}
                       </button>
                     </div>
                   </div>
                  
                  {/* Validação visual da senha em tempo real */}
                  <PasswordValidation password={password} />
                  
                  {/* Validação de correspondência das senhas */}
                  {confirmPassword && (
                    <PasswordMatchValidation passwordsMatch={password === confirmPassword} />
                  )}
                
                 <Button
                   type="submit" 
                   className="w-full" 
                   disabled={isLoading || !validatePassword(password).isValid || password !== confirmPassword}
                 >
                   {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                   {t('auth.createAccount')}
                 </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-colors"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  {t('auth.continueWithGoogle')}
                </Button>
                
                {/* Provisional Access Alert - appears after 30 seconds */}
                {showProvisionalAlert && pendingSignupEmail && (
                  <div className="mt-4">
                    <ProvisionalAccessAlert
                      email={pendingSignupEmail}
                      onResendEmail={handleResendConfirmationEmail}
                      onProvisionalLogin={handleProvisionalLogin}
                      isResending={isResendingEmail}
                    />
                  </div>
                )}
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      <TwoFactorVerification
        open={show2FAVerification}
        onOpenChange={setShow2FAVerification}
        method={twoFactorMethod}
        onVerified={handle2FAVerified}
        onCancel={handle2FACancel}
        smsError={smsError}
        smsErrorMessage={smsErrorMessage}
        onRetrySMS={handleRetrySMS}
        userId={currentUserId || undefined}
        userEmail={currentUserEmail || undefined}
      />
      
      {/* Biometric Activation Modal - shown after successful login */}
      <BiometricActivationModal
        open={showBiometricModal}
        onClose={() => {
          setShowBiometricModal(false);
          setPendingBiometricActivation(false);
          // Redirect to app even if user declined
          toast({
            title: t('auth.loginSuccessTitle'),
            description: t('auth.loginSuccessDesc'),
          });
          window.location.href = '/app';
        }}
        onSuccess={() => {
          setShowBiometricModal(false);
          setPendingBiometricActivation(false);
          toast({
            title: t('auth.loginSuccessTitle'),
            description: t('auth.loginSuccessDesc'),
          });
          window.location.href = '/app';
        }}
      />
    </div>
  );
}