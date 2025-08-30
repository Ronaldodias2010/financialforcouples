import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export const TestPartnerEmails = () => {
  const [loading, setLoading] = useState(false);

  const testApprovalEmail = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-approval-email', {
        body: {
          applicationId: 'test-id',
          partnerName: 'Ronaldo Dias',
          partnerEmail: 'ronadias2010@gmail.com',
          referralCode: 'TESTCODE2024',
          rewardAmount: 10.00,
          rewardType: 'monetary',
          rewardCurrency: 'BRL'
        }
      });

      if (error) {
        console.error('Erro:', error);
        toast.error('Erro ao enviar email de aprovação');
      } else {
        console.log('Sucesso:', data);
        toast.success('Email de aprovação enviado para ronadias2010@gmail.com');
      }
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao enviar email');
    } finally {
      setLoading(false);
    }
  };

  const testUsageNotification = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('notify-code-usage', {
        body: {
          codeUsed: 'TESTCODE2024',
          partnerEmail: 'ronadias2010@gmail.com',
          partnerName: 'Ronaldo Dias',
          newUserEmail: 'usuario.teste@gmail.com',
          rewardAmount: 10.00,
          rewardCurrency: 'BRL',
          transactionDate: new Date().toISOString()
        }
      });

      if (error) {
        console.error('Erro:', error);
        toast.error('Erro ao enviar notificação de uso');
      } else {
        console.log('Sucesso:', data);
        toast.success('Notificação de uso do código enviada para ronadias2010@gmail.com');
      }
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao enviar notificação');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Teste de Emails para Parceiros</CardTitle>
            <CardDescription>
              Teste dos emails que são enviados automaticamente para parceiros
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-semibold">Email de Aprovação</h3>
              <p className="text-sm text-muted-foreground">
                Enviado quando um parceiro é aprovado, com código de referência e instruções de ganhos.
              </p>
              <Button 
                onClick={testApprovalEmail} 
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Enviando...' : 'Testar Email de Aprovação'}
              </Button>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold">Notificação de Uso do Código</h3>
              <p className="text-sm text-muted-foreground">
                Enviado toda vez que o código do parceiro é usado por um novo usuário.
              </p>
              <Button 
                onClick={testUsageNotification} 
                disabled={loading}
                variant="outline"
                className="w-full"
              >
                {loading ? 'Enviando...' : 'Testar Notificação de Uso'}
              </Button>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg mt-6">
              <h4 className="font-semibold text-blue-900 mb-2">📧 Email de Teste</h4>
              <p className="text-blue-800 text-sm">
                Os emails serão enviados para: <strong>ronadias2010@gmail.com</strong>
              </p>
              <p className="text-blue-700 text-xs mt-2">
                Verifique a caixa de entrada e spam. Os emails incluem todas as informações sobre ganhos e instruções para uso do código.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};