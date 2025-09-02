import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Send } from 'lucide-react';

export default function EmailSender() {
  const [email, setEmail] = useState('');
  const [template, setTemplate] = useState<'invite' | 'premium' | 'confirmation' | 'password-reset' | 'expiration-warning' | 'final-warning' | 'grace-period' | 'premium-welcome' | 'premium-access-granted'>('invite');
  const [language, setLanguage] = useState<'pt' | 'en' | 'es'>('pt');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const sendTestEmail = async () => {
    if (!email) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Por favor, insira um email válido.',
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.functions.invoke('test-email', {
        body: { email, template, language },
      });

      if (error) throw error;

      toast({
        title: 'Email enviado com sucesso! ✅',
        description: `Template "${template}" enviado para ${email} (${language.toUpperCase()})`,
      });
    } catch (error: any) {
      console.error('Erro ao enviar email:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao enviar email',
        description: error.message || 'Não foi possível enviar o email de teste.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
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
        <Select value={template} onValueChange={(v: any) => setTemplate(v)}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione o template" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="invite">🤝 Convite</SelectItem>
            <SelectItem value="premium">⭐ Acesso Premium</SelectItem>
            <SelectItem value="confirmation">🎉 Confirmação de Conta</SelectItem>
            <SelectItem value="password-reset">🔐 Redefinir Senha</SelectItem>
            <SelectItem value="expiration-warning">⏰ Aviso de Vencimento Premium</SelectItem>
            <SelectItem value="final-warning">🚨 Aviso Final Premium</SelectItem>
            <SelectItem value="grace-period">🛡️ Período de Graça Premium</SelectItem>
            <SelectItem value="premium-welcome">🎊 Boas-vindas Premium (Assinatura)</SelectItem>
            <SelectItem value="premium-access-granted">🎁 Acesso Premium Concedido (Admin)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="language">Idioma / Language</Label>
        <Select value={language} onValueChange={(v: any) => setLanguage(v)}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione o idioma" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pt">🇧🇷 Português</SelectItem>
            <SelectItem value="en">🇺🇸 English</SelectItem>
            <SelectItem value="es">🇪🇸 Español</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button onClick={sendTestEmail} className="w-full" disabled={isLoading}>
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

      <div className="text-sm text-muted-foreground">
        Templates: Convite, Premium, Confirmação, Reset de Senha, Avisos de Vencimento, Boas-vindas Premium, Acesso Premium Concedido (PT/EN/ES)
      </div>
    </div>
  );
}
