import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CreditCard, Eye, EyeOff } from 'lucide-react';

export default function Auth() {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isResetMode, setIsResetMode] = useState(false);
  const [isTempLogin, setIsTempLogin] = useState(false);
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Verificar se já está logado
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        window.location.href = '/';
      }
    });
  }, []);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsLoading(true);
    try {
      // Se for login com senha provisória, usar a edge function
      if (isTempLogin) {
        const { data, error } = await supabase.functions.invoke('validate-temp-login', {
          body: {
            email,
            temp_password: password
          }
        });

        if (error) throw error;

        if (data.success) {
          toast({
            title: "Login realizado com sucesso!",
            description: "Conta vinculada com sucesso. Redirecionando...",
          });
          
          // Usar o session_url para fazer login
          if (data.session_url) {
            window.location.href = data.session_url;
          } else {
            window.location.href = '/';
          }
        }
      } else {
        // Login normal
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) throw error;
        
        if (data.user) {
          toast({
            title: "Login realizado com sucesso!",
            description: "Redirecionando para o dashboard...",
          });
          window.location.href = '/';
        }
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro no login",
        description: error.message || "Erro ao fazer login. Verifique suas credenciais.",
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
          redirectTo: `${window.location.origin}/`
        }
      });
      
      if (error) throw error;
      
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro no login com Google",
        description: error.message || "Erro ao fazer login com Google.",
      });
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsLoading(true);
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            display_name: displayName || email.split('@')[0]
          }
        }
      });
      
      if (error) throw error;
      
      if (data.user) {
        toast({
          title: "Conta criada com sucesso!",
          description: "Verifique seu email para confirmar a conta.",
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro no cadastro",
        description: error.message || "Erro ao criar conta.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth`,
      });
      
      if (error) throw error;
      
      toast({
        title: "Email enviado!",
        description: "Verifique seu email para redefinir a senha.",
      });
      setIsResetMode(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message || "Erro ao enviar email de recuperação.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-card/80 backdrop-blur-sm border-primary/20">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <img 
              src="/lovable-uploads/13ca0846-97a1-42b6-a0b8-232573bff76d.png" 
              alt="Financial App Logo" 
              className="h-28 w-28 object-contain"
            />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Financial App
            </CardTitle>
            <CardDescription className="text-muted-foreground mt-2">
              Gerencie suas finanças em casal
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Entrar</TabsTrigger>
              <TabsTrigger value="signup">Cadastrar</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin">
              {isResetMode ? (
                <form onSubmit={handlePasswordReset} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reset-email">Email</Label>
                    <Input
                      id="reset-email"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Enviar Email de Recuperação
                  </Button>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    className="w-full"
                    onClick={() => setIsResetMode(false)}
                  >
                    Voltar ao Login
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                 <div className="space-y-2">
                   <Label htmlFor="signin-password">
                     {isTempLogin ? "Senha Provisória" : "Senha"}
                   </Label>
                   <div className="relative">
                     <Input
                       id="signin-password"
                       type={showSignInPassword ? "text" : "password"}
                       placeholder={isTempLogin ? "Senha provisória do convite" : "••••••••"}
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
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="temp-login"
                    checked={isTempLogin}
                    onChange={(e) => setIsTempLogin(e.target.checked)}
                    className="w-4 h-4 text-primary bg-background border-gray-300 rounded focus:ring-primary focus:ring-2"
                  />
                  <Label 
                    htmlFor="temp-login" 
                    className="text-sm font-medium text-muted-foreground cursor-pointer"
                  >
                    Login com senha provisória (convite)
                  </Label>
                </div>
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading}
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Entrar
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
                  Continuar com Google
                </Button>
                <Button 
                  type="button" 
                  variant="ghost" 
                  className="w-full text-sm"
                  onClick={() => setIsResetMode(true)}
                >
                  Esqueci minha senha
                </Button>
              </form>
              )}
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Nome</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="Seu nome"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                 <div className="space-y-2">
                   <Label htmlFor="signup-password">Senha</Label>
                   <div className="relative">
                     <Input
                       id="signup-password"
                       type={showSignUpPassword ? "text" : "password"}
                       placeholder="••••••••"
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
                  Criar Conta
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
                  Continuar com Google
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}