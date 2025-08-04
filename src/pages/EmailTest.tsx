import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Mail, Send, Loader2 } from 'lucide-react';

export default function EmailTest() {
  const [email, setEmail] = useState('ronadias2010@gmail.com');
  const [template, setTemplate] = useState('invite');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const sendTestEmail = async () => {
    if (!email) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Por favor, insira um email válido.",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('test-email', {
        body: {
          email,
          template
        }
      });

      if (error) throw error;

      toast({
        title: "Email enviado com sucesso! ✅",
        description: `Template "${template === 'premium' ? 'Premium' : 'Convite'}" enviado para ${email}`,
      });

    } catch (error: any) {
      console.error('Erro ao enviar email:', error);
      toast({
        variant: "destructive",
        title: "Erro ao enviar email",
        description: error.message || "Não foi possível enviar o email de teste.",
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
            <div className="p-3 rounded-full bg-primary/20">
              <Mail className="h-8 w-8 text-primary" />
            </div>
          </div>
          <div>
            <CardTitle className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Teste de Email
            </CardTitle>
            <CardDescription className="text-muted-foreground mt-2">
              Envie emails de teste com os novos templates
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email de destino</Label>
            <Input
              id="email"
              type="email"
              placeholder="teste@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="template">Template do email</Label>
            <Select value={template} onValueChange={setTemplate}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o template" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="invite">🤝 Email de Convite</SelectItem>
                <SelectItem value="premium">⭐ Email de Acesso Premium</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            <Button 
              onClick={sendTestEmail} 
              className="w-full" 
              disabled={isLoading}
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Enviar Email de Teste
                </>
              )}
            </Button>

            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Teste do sistema de emails com React Email
              </p>
            </div>
          </div>

          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-semibold text-sm mb-2">Templates disponíveis:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>📧 <strong>Convite:</strong> Email para convidar usuários</li>
              <li>⭐ <strong>Premium:</strong> Email de concessão de acesso premium</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}