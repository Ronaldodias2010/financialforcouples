import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

export default function SendConfirmationEmail() {
  const [email, setEmail] = useState('ronadias2010@gmail.com');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const sendConfirmationEmail = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-confirmation-manual', {
        body: { email }
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Email enviado com sucesso!",
        description: `Email de confirmação enviado para ${email}`,
      });
    } catch (error: any) {
      console.error('Erro ao enviar email:', error);
      toast({
        title: "Erro ao enviar email",
        description: error.message || "Ocorreu um erro inesperado",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Auto-enviar email para ronadias2010@gmail.com ao carregar a página
  React.useEffect(() => {
    if (email === 'ronadias2010@gmail.com') {
      sendConfirmationEmail();
    }
  }, []);

  return (
    <div className="container mx-auto p-6 max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>Enviar Email de Confirmação</CardTitle>
          <CardDescription>
            Envie um email de confirmação personalizado para o usuário
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="email">Email do destinatário</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Digite o email"
            />
          </div>
          <Button 
            onClick={sendConfirmationEmail}
            disabled={loading || !email}
            className="w-full"
          >
            {loading ? "Enviando..." : "Enviar Email de Confirmação"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}