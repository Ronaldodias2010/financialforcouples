import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Check, X, Users, TrendingUp, DollarSign, Code } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PartnershipApplication {
  id: string;
  name: string;
  email: string;
  phone?: string;
  audience_type: string;
  social_media?: string;
  payment_info?: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  approved_at?: string;
  referral_code_id?: string;
  referral_codes?: {
    code: string;
    reward_amount: number;
  };
}

interface Stats {
  totalApplications: number;
  pendingApplications: number;
  approvedPartners: number;
  totalRewardsPaid: number;
}

export const PartnershipApplicationsManager = () => {
  const [applications, setApplications] = useState<PartnershipApplication[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalApplications: 0,
    pendingApplications: 0,
    approvedPartners: 0,
    totalRewardsPaid: 0
  });
  const [loading, setLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch applications with referral code data
      const { data: applicationsData, error: appsError } = await supabase
        .from('partnership_applications')
        .select(`
          *,
          referral_codes (
            code,
            reward_amount
          )
        `)
        .order('created_at', { ascending: false });

      if (appsError) throw appsError;

      setApplications((applicationsData || []) as PartnershipApplication[]);

      // Calculate stats
      const totalApplications = applicationsData?.length || 0;
      const pendingApplications = applicationsData?.filter(app => app.status === 'pending').length || 0;
      const approvedPartners = applicationsData?.filter(app => app.status === 'approved').length || 0;

      // For demo purposes, setting totalRewardsPaid to 0
      // In real implementation, this would come from payment records
      setStats({
        totalApplications,
        pendingApplications,
        approvedPartners,
        totalRewardsPaid: 0
      });

    } catch (error) {
      console.error('Error fetching partnership data:', error);
      toast.error('Erro ao carregar dados de parcerias');
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (applicationId: string, approved: boolean) => {
    if (processingIds.has(applicationId)) return;

    setProcessingIds(prev => new Set(prev).add(applicationId));

    try {
      const application = applications.find(app => app.id === applicationId);
      if (!application) throw new Error('Aplicação não encontrada');

      if (approved) {
        // First, generate a unique referral code
        const { data: codeData, error: codeError } = await supabase
          .rpc('generate_referral_code');

        if (codeError) throw codeError;

        const newCode = codeData;

        // Update application status to approved and associate with new code
        const { error: updateError } = await supabase
          .from('partnership_applications')
          .update({
            status: 'approved',
            approved_at: new Date().toISOString(),
            approved_by_admin_id: (await supabase.auth.getUser()).data.user?.id
          })
          .eq('id', applicationId);

        if (updateError) throw updateError;

        // Create referral code for this partner
        const { error: codeInsertError } = await supabase
          .from('referral_codes')
          .insert({
            code: newCode,
            user_id: (await supabase.auth.getUser()).data.user?.id || '',
            max_uses: 100,
            reward_amount: 10.00,
            free_days_granted: 7,
            expiry_date: null,
            partner_email: application.email
          });

        if (codeInsertError) throw codeInsertError;

        // Send approval email with referral code
        const { error: emailError } = await supabase.functions.invoke('send-approval-email', {
          body: {
            applicationId,
            partnerName: application.name,
            partnerEmail: application.email,
            referralCode: newCode,
            rewardAmount: 10.00,
            rewardType: 'monetary',
            rewardCurrency: 'BRL'
          }
        });

        if (emailError) {
          console.error('Error sending approval email:', emailError);
          toast.error('Parceria aprovada mas erro ao enviar email. Verifique os logs.');
        } else {
          toast.success('Parceria aprovada e email enviado com sucesso!');
        }
      } else {
        // Reject application
        const { error: updateError } = await supabase
          .from('partnership_applications')
          .update({
            status: 'rejected',
            approved_by_admin_id: (await supabase.auth.getUser()).data.user?.id
          })
          .eq('id', applicationId);

        if (updateError) throw updateError;
        toast.success('Solicitação rejeitada');
      }

      await fetchData();
    } catch (error: any) {
      console.error('Error processing application:', error);
      toast.error(error.message || 'Erro ao processar solicitação');
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(applicationId);
        return newSet;
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pendente</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Aprovado</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Rejeitado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return <div className="p-6">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total de Solicitações</p>
                <p className="text-2xl font-bold">{stats.totalApplications}</p>
              </div>
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pendentes</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pendingApplications}</p>
              </div>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Parceiros Ativos</p>
                <p className="text-2xl font-bold text-green-600">{stats.approvedPartners}</p>
              </div>
              <Code className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Recompensas Pagas</p>
                <p className="text-2xl font-bold text-blue-600">R$ {stats.totalRewardsPaid.toFixed(2)}</p>
              </div>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Applications Table */}
      <Card>
        <CardHeader>
          <CardTitle>Solicitações de Parceria</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[15%]">Nome</TableHead>
                <TableHead className="w-[20%]">Email</TableHead>
                <TableHead className="w-[12%]">Audiência</TableHead>
                <TableHead className="w-[15%]">Redes Sociais</TableHead>
                <TableHead className="w-[15%]">Código Bancário</TableHead>
                <TableHead className="w-[10%]">Data</TableHead>
                <TableHead className="w-[8%]">Status</TableHead>
                <TableHead className="w-[5%]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applications.map((application) => (
                <TableRow key={application.id}>
                  <TableCell className="font-medium">{application.name}</TableCell>
                  <TableCell>{application.email}</TableCell>
                  <TableCell>{application.audience_type}</TableCell>
                  <TableCell className="max-w-xs">
                    <div 
                      className="truncate text-sm cursor-pointer hover:text-primary transition-colors"
                      title={application.social_media || 'Não informado'}
                    >
                      {application.social_media || 'Não informado'}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs">
                    {application.payment_info ? (
                      <div className="text-sm bg-blue-50 dark:bg-blue-950 p-2 rounded border max-w-48">
                        <div className="font-medium text-blue-700 dark:text-blue-300 text-xs mb-1">
                          Dados PIX/Bancários:
                        </div>
                        <div className="text-blue-600 dark:text-blue-400 text-xs whitespace-pre-wrap break-words">
                          {application.payment_info}
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">Não informado</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {format(new Date(application.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                  </TableCell>
                  <TableCell>{getStatusBadge(application.status)}</TableCell>
                  <TableCell>
                    {application.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-600 border-green-600 hover:bg-green-50"
                          onClick={() => handleApproval(application.id, true)}
                          disabled={processingIds.has(application.id)}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-600 hover:bg-red-50"
                          onClick={() => handleApproval(application.id, false)}
                          disabled={processingIds.has(application.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {applications.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma solicitação de parceria encontrada.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};