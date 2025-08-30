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
  const [loading, setLoading] = useState(false);
  const [selectedPromoCode, setSelectedPromoCode] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showUsagesDialog, setShowUsagesDialog] = useState(false);
  
  const [formData, setFormData] = useState({
    code: '',
    owner_user_id: '',
    discount_type: 'fixed_price',
    discount_value: 179.80,
    stripe_price_id: 'price_1Ruie7FOhUY5r0H1qXXFouNn',
    max_uses: 100,
    valid_for_countries: ['BR'],
    expiry_date: ''
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
    if (!formData.code || !formData.owner_user_id) {
      toast({
        title: "Erro",
        description: "Código e ID do usuário são obrigatórios",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('promo_codes')
        .insert({
          ...formData,
          expiry_date: formData.expiry_date || null
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Código promocional criado com sucesso!",
      });

      setShowCreateDialog(false);
      setFormData({
        code: '',
        owner_user_id: '',
        discount_type: 'fixed_price',
        discount_value: 179.80,
        stripe_price_id: 'price_1Ruie7FOhUY5r0H1qXXFouNn',
        max_uses: 100,
        valid_for_countries: ['BR'],
        expiry_date: ''
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
  }, []);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Tag className="w-5 h-5" />
            Códigos Promocionais
          </CardTitle>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Criar Código
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
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
                  <Label htmlFor="owner_user_id">ID do Usuário Dono</Label>
                  <Input
                    id="owner_user_id"
                    value={formData.owner_user_id}
                    onChange={(e) => setFormData({ ...formData, owner_user_id: e.target.value })}
                    placeholder="UUID do usuário"
                  />
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
                <TableHead>Valor</TableHead>
                <TableHead>Usos</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {promoCodes.map((promo) => (
                <TableRow key={promo.id}>
                  <TableCell className="font-mono font-bold">{promo.code}</TableCell>
                  <TableCell>R$ {promo.discount_value.toFixed(2)}</TableCell>
                  <TableCell>
                    <span className="font-medium">{promo.current_uses}</span>
                    <span className="text-muted-foreground">/{promo.max_uses}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={promo.is_active ? "default" : "secondary"}>
                      {promo.is_active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(promo.created_at).toLocaleDateString('pt-BR')}</TableCell>
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