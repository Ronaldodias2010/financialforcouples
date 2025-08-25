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

export default function Auth() {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);
  const [isInviteAccess, setIsInviteAccess] = useState(false);
  
  const [defaultTab, setDefaultTab] = useState<'signin' | 'signup'>('signin');
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
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
        toast({
          title: t('auth.loginSuccessTitle'),
          description: t('auth.loginSuccessDesc'),
        });
        window.location.href = '/app';
      }
    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        variant: "destructive",
        title: t('auth.loginErrorTitle'),
        description: error.message || t('auth.loginErrorDesc'),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/app`
        }
      });
      
      if (error) throw error;
      
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t('auth.googleErrorTitle'),
        description: error.message || t('auth.loginErrorDesc'),
      });
      setIsLoading(false);
    }
  };

  const sendVerificationCode = async () => {
    if (!phoneNumber) {
      toast({
        variant: "destructive",
        title: t('auth.phoneRequired'),
        description: t('auth.phoneRequiredDesc'),
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.functions.invoke('send-phone-verification', {
        body: {
          phoneNumber: phoneNumber,
          language: language
        }
      });

      if (error) throw error;

      setIsCodeSent(true);
      toast({
        title: t('auth.codeSent'),
        description: t('auth.codeSentDesc'),
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t('auth.codeSendError'),
        description: error.message || t('auth.codeSendErrorDesc'),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !phoneNumber || !verificationCode) {
      toast({
        variant: "destructive",
        title: t('auth.fieldsRequired'),
        description: t('auth.fieldsRequiredDesc'),
      });
      return;
    }

    setIsLoading(true);
    try {
      // Verificar código SMS primeiro
      const { data: verificationData, error: verificationError } = await supabase.functions.invoke('verify-phone-code', {
        body: {
          phoneNumber: phoneNumber,
          code: verificationCode
        }
      });

      if (verificationError || !verificationData?.verified) {
        throw new Error(t('auth.invalidCode'));
      }

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
      
      if (error) throw error;

      // Enviar email de confirmação usando nosso template personalizado
      if (data.user && !data.session) {
        await supabase.functions.invoke('send-confirmation', {
          body: {
            userEmail: email,
            language: language
          }
        });
      }
      
      if (data.user) {
        // Mostrar toast com duração estendida de 20 segundos
        toast({
          title: `✅ ${t('auth.signupSuccessTitle')}`,
          description: `📧 ${t('auth.signupSuccessDesc')}`,
          duration: 20000, // 20 segundos
        });
        
        // Limpar formulário
        setEmail('');
        setPassword('');
        setDisplayName('');
        setPhoneNumber('');
        setVerificationCode('');
        setIsCodeSent(false);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t('auth.signupErrorTitle'),
        description: error.message || t('auth.signupErrorDesc'),
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
    <div className="min-h-screen bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-card/80 backdrop-blur-sm border-primary/20">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-end">
            <div className="inline-flex gap-2">
              <Button variant={language === 'pt' ? 'default' : 'outline'} size="sm" onClick={() => setLanguage('pt')}>PT</Button>
              <Button variant={language === 'en' ? 'default' : 'outline'} size="sm" onClick={() => setLanguage('en')}>EN</Button>
              <Button variant={language === 'es' ? 'default' : 'outline'} size="sm" onClick={() => setLanguage('es')}>ES</Button>
            </div>
          </div>
          <div className="flex justify-center">
            <img 
              src="/lovable-uploads/1f5e0469-b056-4cf9-9583-919702fa8736.png" 
              alt="Financial App Logo" 
              className="h-32 w-32 object-contain"
            />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              {t('auth.appName')}
            </CardTitle>
            <CardDescription className="text-muted-foreground mt-2">
              {t('auth.tagline')}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {isInviteAccess && (
            <Alert className="mb-4 border-primary/20 bg-primary/5">
              <Mail className="h-4 w-4" />
              <AlertDescription className="text-sm">
                {t('auth.inviteBanner')}
              </AlertDescription>
            </Alert>
          )}
          
          <Tabs defaultValue={defaultTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">{t('auth.signIn')}</TabsTrigger>
              <TabsTrigger value="signup" disabled={isInviteAccess}>
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
                  <div className="space-y-2">
                    <Input
                      id="signup-phone"
                      type="tel"
                      placeholder={t('auth.phonePlaceholder')}
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      {t('auth.phoneVerificationRequired')}
                    </p>
                    {!isCodeSent ? (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={sendVerificationCode}
                        disabled={isLoading || !phoneNumber}
                        className="w-full"
                      >
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {t('auth.sendCode')}
                      </Button>
                    ) : (
                      <div className="space-y-2">
                        <Label htmlFor="verification-code">{t('auth.verificationCode')} *</Label>
                        <Input
                          id="verification-code"
                          type="text"
                          placeholder={t('auth.verificationCodePlaceholder')}
                          value={verificationCode}
                          onChange={(e) => setVerificationCode(e.target.value)}
                          maxLength={6}
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => {
                            setIsCodeSent(false);
                            setVerificationCode('');
                          }}
                          className="text-sm w-full"
                        >
                          Enviar novo código
                        </Button>
                      </div>
                    )}
                  </div>
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
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading}
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