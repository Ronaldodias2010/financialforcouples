import { useState, useEffect } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Tag, Eye, Users } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';

interface PromoCode {
  id: string;
  code: string;
  owner_user_id: string;
  discount_type: string;
  discount_value: number;
  stripe_price_id?: string;
  max_uses: number;
  current_uses: number;
  is_active: boolean;
  valid_for_countries: string[];
  expiry_date?: string;
  created_at: string;
  partner_email?: string;
  reward_type?: string;
  reward_currency?: string;
  reward_description?: string;
}

interface ApprovedPartner {
  id: string;
  name: string;
  email: string;
  audience_type: string;
  approved_at: string;
}

interface PromoCodeUsage {
  id: string;
  email: string;
  amount_paid: number;
  currency: string;
  applied_at: string;
  status: string;
}

export const PromoCodesManager = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [usages, setUsages] = useState<PromoCodeUsage[]>([]);
  const [approvedPartners, setApprovedPartners] = useState<ApprovedPartner[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPromoCode, setSelectedPromoCode] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showUsagesDialog, setShowUsagesDialog] = useState(false);
  
  const [formData, setFormData] = useState({
    code: '',
    partner_email: '',
    discount_type: 'fixed_price',
    discount_value: 179.80,
    stripe_price_id: 'price_1Ruie7FOhUY5r0H1qXXFouNn',
    max_uses: 100,
    valid_for_countries: ['BR'],
    expiry_date: '',
    reward_type: 'monetary' as 'monetary' | 'other',
    reward_currency: 'BRL',
    reward_description: ''
  });

  const fetchPromoCodes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('promo_codes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPromoCodes(data || []);
    } catch (error) {
      console.error('Error fetching promo codes:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar códigos promocionais",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchApprovedPartners = async () => {
    console.log('🔍 Fetching approved partners...');
    try {
      const { data, error } = await supabase
        .from('partnership_applications')
        .select('id, name, email, audience_type, approved_at')
        .eq('status', 'approved')
        .order('approved_at', { ascending: false });

      console.log('📊 Approved partners query result:', { data, error });
      
      if (error) throw error;
      setApprovedPartners(data || []);
      console.log('✅ Approved partners set:', data);
    } catch (error) {
      console.error('❌ Error fetching approved partners:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar parceiros aprovados",
        variant: "destructive",
      });
    }
  };

  const fetchUsages = async (promoCodeId: string) => {
    try {
      const { data, error } = await supabase
        .from('promo_code_usage')
        .select('*')
        .eq('promo_code_id', promoCodeId)
        .order('applied_at', { ascending: false });

      if (error) throw error;
      setUsages(data || []);
    } catch (error) {
      console.error('Error fetching usages:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar usos do código",
        variant: "destructive",
      });
    }
  };

  const generateCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, code: result });
  };

  const handleCreatePromoCode = async () => {
    if (!formData.code || !formData.partner_email) {
      toast({
        title: "Erro",
        description: "Código e parceiro são obrigatórios",
        variant: "destructive",
      });
      return;
    }

    if (formData.reward_type === 'monetary' && (!formData.discount_value || !formData.reward_currency)) {
      toast({
        title: "Erro",
        description: "Para recompensa monetária, valor e moeda são obrigatórios",
        variant: "destructive",
      });
      return;
    }

    if (formData.reward_type === 'other' && !formData.reward_description) {
      toast({
        title: "Erro",
        description: "Para outros tipos de recompensa, a descrição é obrigatória",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Create promo code with partner email and reward info
      const { error: createError } = await supabase
        .from('promo_codes')
        .insert({
          code: formData.code,
          owner_user_id: formData.partner_email, // Using email as identifier
          discount_type: formData.discount_type,
          discount_value: formData.discount_value,
          stripe_price_id: formData.stripe_price_id,
          max_uses: formData.max_uses,
          valid_for_countries: formData.valid_for_countries,
          expiry_date: formData.expiry_date || null,
          partner_email: formData.partner_email,
          reward_type: formData.reward_type,
          reward_currency: formData.reward_type === 'monetary' ? formData.reward_currency : null,
          reward_description: formData.reward_type === 'other' ? formData.reward_description : null,
          reward_amount: formData.reward_type === 'monetary' ? formData.discount_value : 0
        });

      if (createError) throw createError;

      // Send email to partner with code and reward details
      const partner = approvedPartners.find(p => p.email === formData.partner_email);
      const { error: emailError } = await supabase.functions.invoke('send-approval-email', {
        body: {
          partnerName: partner?.name || 'Parceiro',
          partnerEmail: formData.partner_email,
          referralCode: formData.code,
          rewardType: formData.reward_type,
          rewardAmount: formData.reward_type === 'monetary' ? formData.discount_value : 0,
          rewardCurrency: formData.reward_type === 'monetary' ? formData.reward_currency : undefined,
          rewardDescription: formData.reward_type === 'other' ? formData.reward_description : undefined
        }
      });

      if (emailError) {
        console.error('Email error:', emailError);
        toast({
          title: "Sucesso",
          description: "Código criado, mas houve erro no envio do email",
        });
      } else {
        toast({
          title: "Sucesso",
          description: "Código promocional criado e email enviado com sucesso!",
        });
      }

      setShowCreateDialog(false);
      setFormData({
        code: '',
        partner_email: '',
        discount_type: 'fixed_price',
        discount_value: 179.80,
        stripe_price_id: 'price_1Ruie7FOhUY5r0H1qXXFouNn',
        max_uses: 100,
        valid_for_countries: ['BR'],
        expiry_date: '',
        reward_type: 'monetary',
        reward_currency: 'BRL',
        reward_description: ''
      });
      
      fetchPromoCodes();
    } catch (error) {
      console.error('Error creating promo code:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar código promocional",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const togglePromoCodeStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('promo_codes')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `Código ${!currentStatus ? 'ativado' : 'desativado'} com sucesso!`,
      });

      fetchPromoCodes();
    } catch (error) {
      console.error('Error updating promo code:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar código promocional",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchPromoCodes();
    fetchApprovedPartners();
  }, []);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Tag className="w-5 h-5" />
            Códigos Promocionais
          </CardTitle>
          <Dialog open={showCreateDialog} onOpenChange={(open) => {
            setShowCreateDialog(open);
            if (open) {
              fetchApprovedPartners(); // Refresh partners when opening dialog
            }
          }}>
            <DialogTrigger asChild>
              <Button onClick={() => fetchApprovedPartners()}>
                <Plus className="w-4 h-4 mr-2" />
                Criar Código
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Criar Código Promocional</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Label htmlFor="code">Código</Label>
                    <Input
                      id="code"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      placeholder="Ex: DESCONTO179"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button type="button" variant="outline" onClick={generateCode}>
                      Gerar
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="partner_email">Parceiro</Label>
                  <Select value={formData.partner_email} onValueChange={(value) => setFormData({ ...formData, partner_email: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um parceiro aprovado" />
                    </SelectTrigger>
                    <SelectContent>
                      {approvedPartners.length === 0 ? (
                        <div className="p-2 text-sm text-muted-foreground">
                          Nenhum parceiro aprovado encontrado
                        </div>
                      ) : (
                        approvedPartners.map((partner) => (
                          <SelectItem key={partner.id} value={partner.email}>
                            {partner.name} - {partner.email}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {approvedPartners.length === 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Aprove parceiros na aba "Solicitações de Parceria" primeiro
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="discount_value">Valor (R$)</Label>
                  <Input
                    id="discount_value"
                    type="number"
                    step="0.01"
                    value={formData.discount_value}
                    onChange={(e) => setFormData({ ...formData, discount_value: parseFloat(e.target.value) })}
                  />
                </div>

                <div>
                  <Label htmlFor="max_uses">Máximo de Usos</Label>
                  <Input
                    id="max_uses"
                    type="number"
                    value={formData.max_uses}
                    onChange={(e) => setFormData({ ...formData, max_uses: parseInt(e.target.value) })}
                  />
                </div>

                <div>
                  <Label htmlFor="expiry_date">Data de Expiração (Opcional)</Label>
                  <Input
                    id="expiry_date"
                    type="date"
                    value={formData.expiry_date}
                    onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                  />
                </div>

                {/* Reward Configuration */}
                <div className="border-t pt-4">
                  <Label className="text-base font-semibold">Configuração de Recompensa</Label>
                  
                  <div className="mt-3">
                    <Label htmlFor="reward_type">Tipo de Recompensa</Label>
                    <Select value={formData.reward_type} onValueChange={(value: 'monetary' | 'other') => setFormData({ ...formData, reward_type: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monetary">Monetária</SelectItem>
                        <SelectItem value="other">Outro Tipo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.reward_type === 'monetary' && (
                    <div className="mt-3 space-y-3">
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <Label htmlFor="reward_amount">Valor da Recompensa</Label>
                          <Input
                            id="reward_amount"
                            type="number"
                            step="0.01"
                            value={formData.discount_value}
                            onChange={(e) => setFormData({ ...formData, discount_value: parseFloat(e.target.value) })}
                            placeholder="Ex: 2.00"
                          />
                        </div>
                        <div className="w-24">
                          <Label htmlFor="reward_currency">Moeda</Label>
                          <Select value={formData.reward_currency} onValueChange={(value) => setFormData({ ...formData, reward_currency: value })}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="BRL">BRL</SelectItem>
                              <SelectItem value="USD">USD</SelectItem>
                              <SelectItem value="EUR">EUR</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  )}

                  {formData.reward_type === 'other' && (
                    <div className="mt-3">
                      <Label htmlFor="reward_description">Descrição da Recompensa</Label>
                      <Textarea
                        id="reward_description"
                        value={formData.reward_description}
                        onChange={(e) => setFormData({ ...formData, reward_description: e.target.value })}
                        placeholder="Ex: Acesso premium por 30 dias"
                        rows={3}
                      />
                    </div>
                  )}
                </div>

                <Button onClick={handleCreatePromoCode} disabled={loading} className="w-full">
                  {loading ? 'Criando...' : 'Criar Código'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Parceiro</TableHead>
                <TableHead>Recompensa</TableHead>
                <TableHead>Usos</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {promoCodes.map((promo) => (
                <TableRow key={promo.id}>
                  <TableCell className="font-mono font-bold">{promo.code}</TableCell>
                  <TableCell>
                    {promo.partner_email ? (
                      <div className="text-sm">
                        <div className="font-medium">{promo.partner_email}</div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {promo.reward_type === 'monetary' ? (
                      <div className="text-sm">
                        <span className="font-medium">{promo.reward_currency} {promo.discount_value?.toFixed(2)}</span>
                        <div className="text-muted-foreground">por uso</div>
                      </div>
                    ) : (
                      <div className="text-sm">
                        <div className="font-medium">Outro tipo</div>
                        <div className="text-muted-foreground text-xs">{promo.reward_description}</div>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">{promo.current_uses}</span>
                    <span className="text-muted-foreground">/{promo.max_uses}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={promo.is_active ? "default" : "secondary"}>
                      {promo.is_active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedPromoCode(promo.id);
                          fetchUsages(promo.id);
                          setShowUsagesDialog(true);
                        }}
                      >
                        <Users className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant={promo.is_active ? "outline" : "default"}
                        onClick={() => togglePromoCodeStatus(promo.id, promo.is_active)}
                      >
                        {promo.is_active ? 'Desativar' : 'Ativar'}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Usage Details Dialog */}
        <Dialog open={showUsagesDialog} onOpenChange={setShowUsagesDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Usos do Código Promocional</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {usages.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Valor Pago</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usages.map((usage) => (
                      <TableRow key={usage.id}>
                        <TableCell>{usage.email}</TableCell>
                        <TableCell>{usage.currency} {usage.amount_paid?.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge variant={usage.status === 'completed' ? "default" : "secondary"}>
                            {usage.status === 'completed' ? 'Completo' : 'Pendente'}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(usage.applied_at).toLocaleDateString('pt-BR')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum uso registrado para este código.
                </p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};