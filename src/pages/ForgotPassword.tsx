import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ForgotPassword() {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const { toast } = useToast();

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        variant: "destructive",
        title: "Email necessário",
        description: "Por favor, insira seu email para redefinir a senha.",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Enviar email com senha temporária usando nossa edge function
      const { error } = await supabase.functions.invoke('send-password-reset', {
        body: {
          userEmail: email,
          language: 'pt'
        }
      });

      if (error) throw error;

      setEmailSent(true);
      toast({
        title: "Senha temporária enviada!",
        description: "Verifique sua caixa de entrada para sua nova senha.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao enviar email",
        description: error.message || "Erro ao enviar email de redefinição.",
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
              Esqueci Minha Senha
            </CardTitle>
            <CardDescription className="text-muted-foreground mt-2">
              {emailSent 
                ? "Senha temporária enviada para seu email" 
                : "Digite seu email para receber uma senha temporária"
              }
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {emailSent ? (
            <div className="space-y-4 text-center">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-800">
                <p className="text-sm">
                  Enviamos uma <strong>senha temporária</strong> para <strong>{email}</strong>.
                </p>
                <p className="text-sm mt-2">
                  Use essa senha para fazer login. Depois, altere sua senha nas configurações do perfil.
                </p>
              </div>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setEmailSent(false)}
              >
                Enviar para outro email
              </Button>
              <Link to="/auth">
                <Button variant="ghost" className="w-full">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar ao Login
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handlePasswordReset} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enviar Instruções
              </Button>

              <Link to="/auth">
                <Button variant="ghost" className="w-full">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar ao Login
                </Button>
              </Link>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}