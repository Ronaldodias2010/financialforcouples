import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';

export default function ChangePassword() {
  const [isLoading, setIsLoading] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { toast } = useToast();

  // Validação de senha em tempo real
  const validatePassword = (password: string) => {
    const hasMinLength = password.length >= 6;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    
    return {
      hasMinLength,
      hasUppercase,
      hasLowercase,
      hasNumber,
      isValid: hasMinLength && hasUppercase && hasLowercase && hasNumber
    };
  };

  const passwordValidation = validatePassword(newPassword);
  const passwordsMatch = newPassword && confirmPassword && newPassword === confirmPassword;

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!passwordValidation.isValid) {
      toast({
        variant: "destructive",
        title: "Senha inválida",
        description: "A senha deve atender todos os critérios de segurança.",
      });
      return;
    }

    if (!passwordsMatch) {
      toast({
        variant: "destructive",
        title: "Senhas não coincidem",
        description: "As senhas digitadas devem ser iguais.",
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
        title: "Senha alterada com sucesso!",
        description: "Faça login novamente com sua nova senha.",
      });

      // Aguardar um pouco para mostrar a mensagem
      setTimeout(() => {
        window.location.href = '/auth';
      }, 2000);

    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao alterar senha",
        description: error.message || "Erro ao alterar a senha.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const ValidationItem = ({ isValid, text }: { isValid: boolean; text: string }) => (
    <div className="flex items-center space-x-2">
      {isValid ? (
        <CheckCircle className="h-4 w-4 text-green-500" />
      ) : (
        <XCircle className="h-4 w-4 text-red-500" />
      )}
      <span className={`text-sm ${isValid ? 'text-green-500' : 'text-red-500'}`}>
        {text}
      </span>
    </div>
  );

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
              Alteração de Senha Obrigatória
            </CardTitle>
            <CardDescription className="text-muted-foreground mt-2">
              Por segurança, você deve criar uma nova senha
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">Nova Senha</Label>
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
              <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
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

            {/* Critérios de validação da senha */}
            {newPassword && (
              <div className="bg-muted p-3 rounded-md space-y-2">
                <p className="text-sm font-medium">Critérios de segurança:</p>
                <ValidationItem 
                  isValid={passwordValidation.hasMinLength} 
                  text="Mínimo 6 caracteres" 
                />
                <ValidationItem 
                  isValid={passwordValidation.hasUppercase} 
                  text="Pelo menos 1 letra maiúscula" 
                />
                <ValidationItem 
                  isValid={passwordValidation.hasLowercase} 
                  text="Pelo menos 1 letra minúscula" 
                />
                <ValidationItem 
                  isValid={passwordValidation.hasNumber} 
                  text="Pelo menos 1 número" 
                />
              </div>
            )}

            {/* Validação de confirmação de senha */}
            {confirmPassword && (
              <div className="flex items-center space-x-2">
                {passwordsMatch ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
                <span className={`text-sm ${passwordsMatch ? 'text-green-500' : 'text-red-500'}`}>
                  {passwordsMatch ? 'Senhas coincidem' : 'Senhas não coincidem'}
                </span>
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading || !passwordValidation.isValid || !passwordsMatch}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Alterar Senha
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}