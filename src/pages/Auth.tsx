import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CreditCard, Eye, EyeOff, Mail } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useLanguage } from '@/hooks/useLanguage';
import { PasswordValidation, PasswordMatchValidation, validatePassword } from '@/components/ui/PasswordValidation';
import { translateAuthError } from '@/utils/authErrors';
import { trackSignUp, trackLogin } from '@/utils/analytics';

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
  const { toast } = useToast();
  const { language, setLanguage, t } = useLanguage();

  useEffect(() => {
    // Verificar se já está logado
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        window.location.href = '/app';
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
        toast({
          title: t('auth.loginSuccessTitle'),
          description: t('auth.loginSuccessDesc'),
        });
        window.location.href = '/app';
      }
    } catch (error: any) {
      console.error('Login error:', error);
      const translatedError = translateAuthError(error.message || '', language);
      toast({
        variant: "destructive",
        title: t('auth.loginErrorTitle'),
        description: translatedError,
      });
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
          redirectTo: `${window.location.origin}/app`
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
      
      if (error) {
        console.error('❌ [AUTH] Signup error:', error);
        throw error;
      }

      console.log('✅ [AUTH] Signup successful, user data:', data?.user?.id);

      // Enviar email de confirmação usando nosso template personalizado
      if (data.user && !data.session) {
        console.log('📧 [AUTH] Invoking send-confirmation edge function...');
        try {
          await supabase.functions.invoke('send-confirmation', {
            body: {
              userEmail: email,
              language: language
            }
          });
          console.log('✅ [AUTH] Send-confirmation invoked successfully');
        } catch (emailError) {
          console.error('⚠️ [AUTH] Error invoking send-confirmation (non-critical):', emailError);
          // Não falhar o signup se o email falhar
        }
      }
      
      if (data.user) {
        trackSignUp('email');
        // Mostrar toast com duração estendida de 20 segundos
        toast({
          title: `✅ ${t('auth.signupSuccessTitle')}`,
          description: `📧 ${t('auth.signupSuccessDesc')}`,
          duration: 20000, // 20 segundos
        });
        
        // Limpar formulário
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setDisplayName('');
        setPhoneNumber('');
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
          <div className="flex justify-end">
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
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}