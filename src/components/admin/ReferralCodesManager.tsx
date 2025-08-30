import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Plus, Copy, Eye, Edit, Trash2, Gift, Users, DollarSign } from 'lucide-react';
import { format } from 'date-fns';

interface ReferralCode {
  id: string;
  code: string;
  max_uses: number;
  current_uses: number;
  expiry_date: string | null;
  is_active: boolean;
  reward_amount: number;
  free_days_granted: number;
  created_at: string;
  user_id: string | null;
}

interface ReferralStats {
  totalCodes: number;
  activeCodes: number;
  totalReferrals: number;
  totalRewards: number;
}

export const ReferralCodesManager = () => {
  const [codes, setCodes] = useState<ReferralCode[]>([]);
  const [stats, setStats] = useState<ReferralStats>({ totalCodes: 0, activeCodes: 0, totalReferrals: 0, totalRewards: 0 });
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [formData, setFormData] = useState({
    maxUses: 10,
    rewardAmount: 10,
    freeDays: 7,
    expiryDate: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Buscar códigos de indicação
      const { data: codesData, error: codesError } = await supabase
        .from('referral_codes')
        .select('*')
        .order('created_at', { ascending: false });

      if (codesError) throw codesError;

      // Buscar estatísticas
      const { data: referralsData, error: referralsError } = await supabase
        .from('referrals')
        .select('*');

      const { data: rewardsData, error: rewardsError } = await supabase
        .from('referral_rewards')
        .select('amount');

      if (referralsError) throw referralsError;
      if (rewardsError) throw rewardsError;

      const totalRewards = rewardsData?.reduce((sum, reward) => sum + (reward.amount || 0), 0) || 0;

      setCodes(codesData || []);
      setStats({
        totalCodes: codesData?.length || 0,
        activeCodes: codesData?.filter(code => code.is_active).length || 0,
        totalReferrals: referralsData?.length || 0,
        totalRewards,
      });
    } catch (error) {
      console.error('Error fetching referral data:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar dados de indicações.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const generateNewCode = async () => {
    try {
      // Gerar código único
      const { data: codeData, error: codeError } = await supabase
        .rpc('generate_referral_code');

      if (codeError) throw codeError;

      const newCode = codeData;

      // Inserir novo código
      const { error: insertError } = await supabase
        .from('referral_codes')
        .insert({
          code: newCode,
          max_uses: formData.maxUses,
          reward_amount: formData.rewardAmount,
          free_days_granted: formData.freeDays,
          expiry_date: formData.expiryDate || null,
        });

      if (insertError) throw insertError;

      toast({
        title: 'Sucesso',
        description: `Código ${newCode} criado com sucesso!`,
      });

      setShowCreateDialog(false);
      setFormData({ maxUses: 10, rewardAmount: 10, freeDays: 7, expiryDate: '' });
      fetchData();
    } catch (error) {
      console.error('Error creating referral code:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao criar código de indicação.',
        variant: 'destructive',
      });
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: 'Copiado!',
      description: `Código ${code} copiado para a área de transferência.`,
    });
  };

  const toggleCodeStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('referral_codes')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: `Código ${!currentStatus ? 'ativado' : 'desativado'} com sucesso!`,
      });

      fetchData();
    } catch (error) {
      console.error('Error toggling code status:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao alterar status do código.',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return <div className="p-6">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Códigos</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCodes}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Códigos Ativos</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.activeCodes}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Indicações</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalReferrals}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total em Recompensas</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {stats.totalRewards.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Cabeçalho com ação */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Códigos de Indicação</h2>
          <p className="text-muted-foreground">Gerencie códigos de indicação e recompensas</p>
        </div>

        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Código
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Novo Código de Indicação</DialogTitle>
              <DialogDescription>
                Configure as configurações para o novo código de indicação.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="maxUses" className="text-right">
                  Máximo de Usos
                </Label>
                <Input
                  id="maxUses"
                  type="number"
                  value={formData.maxUses}
                  onChange={(e) => setFormData(prev => ({ ...prev, maxUses: parseInt(e.target.value) || 0 }))}
                  className="col-span-3"
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="rewardAmount" className="text-right">
                  Recompensa (R$)
                </Label>
                <Input
                  id="rewardAmount"
                  type="number"
                  step="0.01"
                  value={formData.rewardAmount}
                  onChange={(e) => setFormData(prev => ({ ...prev, rewardAmount: parseFloat(e.target.value) || 0 }))}
                  className="col-span-3"
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="freeDays" className="text-right">
                  Dias Gratuitos
                </Label>
                <Input
                  id="freeDays"
                  type="number"
                  value={formData.freeDays}
                  onChange={(e) => setFormData(prev => ({ ...prev, freeDays: parseInt(e.target.value) || 0 }))}
                  className="col-span-3"
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="expiryDate" className="text-right">
                  Data de Expiração
                </Label>
                <Input
                  id="expiryDate"
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, expiryDate: e.target.value }))}
                  className="col-span-3"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={generateNewCode}>
                Criar Código
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabela de códigos */}
      <Card>
        <CardHeader>
          <CardTitle>Códigos Criados</CardTitle>
          <CardDescription>Lista de todos os códigos de indicação criados</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Usos</TableHead>
                <TableHead>Recompensa</TableHead>
                <TableHead>Dias Gratuitos</TableHead>
                <TableHead>Expira em</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {codes.map((code) => (
                <TableRow key={code.id}>
                  <TableCell className="font-mono font-semibold">{code.code}</TableCell>
                  <TableCell>{code.current_uses} / {code.max_uses}</TableCell>
                  <TableCell>R$ {code.reward_amount.toFixed(2)}</TableCell>
                  <TableCell>{code.free_days_granted} dias</TableCell>
                  <TableCell>
                    {code.expiry_date ? format(new Date(code.expiry_date), 'dd/MM/yyyy') : 'Sem expiração'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={code.is_active ? 'default' : 'secondary'}>
                      {code.is_active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => copyCode(code.code)}>
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant={code.is_active ? 'secondary' : 'default'}
                        onClick={() => toggleCodeStatus(code.id, code.is_active)}
                      >
                        {code.is_active ? 'Desativar' : 'Ativar'}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};