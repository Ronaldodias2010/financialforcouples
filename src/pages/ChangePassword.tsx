import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { PasswordValidation, PasswordMatchValidation, validatePassword } from '@/components/ui/PasswordValidation';
import { translateAuthError } from '@/utils/authErrors';

export default function ChangePassword() {
  const [isLoading, setIsLoading] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { toast } = useToast();
  const { t, language } = useLanguage();

  const passwordValidation = validatePassword(newPassword);
  const passwordsMatch = newPassword && confirmPassword && newPassword === confirmPassword;

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!passwordValidation.isValid) {
      toast({
        variant: "destructive",
        title: t('password.error.weakTitle'),
        description: t('password.error.invalid'),
      });
      return;
    }

    if (!passwordsMatch) {
      toast({
        variant: "destructive",
        title: t('password.error.weakTitle'),
        description: t('password.error.noMatch'),
      });
      return;
    }

    setIsLoading(true);
    try {
      // Atualizar a senha do usuário e remover a flag de alteração obrigatória
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
        data: {
          requires_password_change: false
        }
      });

      if (updateError) throw updateError;

      // Aguardar para garantir que a senha foi atualizada
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Fazer logout global para limpar sessões anteriores
      await supabase.auth.signOut({ scope: 'global' });

      toast({
        title: t('auth.changeSuccessTitle'),
        description: t('auth.changeSuccessDesc'),
      });

      // Aguardar um pouco para mostrar a mensagem
      setTimeout(() => {
        window.location.href = '/auth';
      }, 2000);

    } catch (error: any) {
      const translatedError = translateAuthError(error.message || '', language);
      toast({
        variant: "destructive",
        title: t('auth.changeErrorTitle'),
        description: translatedError,
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
              src="/lovable-uploads/1f5e0469-b056-4cf9-9583-919702fa8736.png" 
              alt="Financial App Logo" 
              className="h-32 w-32 object-contain"
            />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              {t('auth.changePasswordTitle')}
            </CardTitle>
            <CardDescription className="text-muted-foreground mt-2">
              {t('auth.changePasswordDesc')}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">{t('auth.newPassword')}</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showNewPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? (
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
                  placeholder="••••••••"
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

            {/* Validação da senha */}
            <PasswordValidation password={newPassword} />

            {/* Validação de confirmação de senha */}
            {confirmPassword && (
              <PasswordMatchValidation passwordsMatch={passwordsMatch} />
            )}

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading || !passwordValidation.isValid || !passwordsMatch}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('auth.changePassword')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}