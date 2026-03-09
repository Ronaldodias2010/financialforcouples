import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Edit, Zap, CreditCard, FileText, Banknote, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/useLanguage';
import { usePartnerNames } from '@/hooks/usePartnerNames';

interface AutomaticDebit {
  id: string;
  name: string;
  debit_type: string;
  card_id: string | null;
  category_id: string | null;
  account_id: string;
  debit_day: number;
  fixed_amount: number | null;
  description: string | null;
  owner_user: string | null;
  is_active: boolean;
  last_processed_date: string | null;
}

interface AutomaticDebitsTabProps {
  viewMode: 'both' | 'user1' | 'user2';
}

export const AutomaticDebitsTab: React.FC<AutomaticDebitsTabProps> = ({ viewMode }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const { names: partnerNames } = usePartnerNames();
  const [coupleData, setCoupleData] = useState<any>(null);

  useEffect(() => {
    const fetchCouple = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('user_couples')
        .select('user1_id, user2_id')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .eq('status', 'active')
        .maybeSingle();
      setCoupleData(data);
    };
    fetchCouple();
  }, [user]);

  const [debits, setDebits] = useState<AutomaticDebit[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [cards, setCards] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDebit, setEditingDebit] = useState<AutomaticDebit | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [debitType, setDebitType] = useState('variable_bill');
  const [cardId, setCardId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [accountId, setAccountId] = useState('');
  const [debitDay, setDebitDay] = useState('1');
  const [fixedAmount, setFixedAmount] = useState('');
  const [description, setDescription] = useState('');
  const [ownerUser, setOwnerUser] = useState('');
  const [isActive, setIsActive] = useState(true);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);

    const userIds = coupleData
      ? [coupleData.user1_id, coupleData.user2_id]
      : [user.id];

    const [debitsRes, accountsRes, cardsRes, categoriesRes] = await Promise.all([
      supabase.from('automatic_debits').select('*').in('user_id', userIds).order('debit_day'),
      supabase.from('accounts').select('id, name, balance, owner_user').in('user_id', userIds).eq('is_active', true).is('deleted_at', null),
      supabase.from('cards').select('id, name, current_balance, card_type, owner_user, user_id').in('user_id', userIds).is('deleted_at', null),
      supabase.from('categories').select('id, name').in('user_id', userIds).is('deleted_at', null),
    ]);

    setDebits((debitsRes.data as AutomaticDebit[]) || []);
    setAccounts(accountsRes.data || []);
    setCards(cardsRes.data || []);
    setCategories(categoriesRes.data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [user, coupleData]);

  const resetForm = () => {
    setName('');
    setDebitType('variable_bill');
    setCardId('');
    setCategoryId('');
    setAccountId('');
    setDebitDay('1');
    setFixedAmount('');
    setDescription('');
    setOwnerUser('');
    setIsActive(true);
    setEditingDebit(null);
  };

  const handleEdit = (debit: AutomaticDebit) => {
    setEditingDebit(debit);
    setName(debit.name);
    setDebitType(debit.debit_type);
    setCardId(debit.card_id || '');
    setCategoryId(debit.category_id || '');
    setAccountId(debit.account_id);
    setDebitDay(debit.debit_day.toString());
    setFixedAmount(debit.fixed_amount ? debit.fixed_amount.toString() : '');
    setDescription(debit.description || '');
    setOwnerUser(debit.owner_user || '');
    setIsActive(debit.is_active);
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !accountId) return;

    const payload = {
      user_id: user.id,
      name,
      debit_type: debitType,
      card_id: debitType === 'credit_card' && cardId ? cardId : null,
      category_id: categoryId || null,
      account_id: accountId,
      debit_day: parseInt(debitDay),
      fixed_amount: fixedAmount ? parseFloat(fixedAmount) : null,
      description: description || null,
      owner_user: ownerUser || null,
      is_active: isActive,
    };

    let error;
    if (editingDebit) {
      const { error: e } = await supabase.from('automatic_debits').update(payload).eq('id', editingDebit.id);
      error = e;
    } else {
      const { error: e } = await supabase.from('automatic_debits').insert(payload);
      error = e;
    }

    if (error) {
      toast({ title: t('common.error'), description: error.message, variant: 'destructive' });
      return;
    }

    toast({ title: editingDebit ? t('autoDebit.updated') : t('autoDebit.created') });
    setIsDialogOpen(false);
    resetForm();
    fetchData();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('automatic_debits').delete().eq('id', id);
    if (error) {
      toast({ title: t('common.error'), description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: t('autoDebit.deleted') });
    fetchData();
  };

  const handleToggleActive = async (debit: AutomaticDebit) => {
    const { error } = await supabase
      .from('automatic_debits')
      .update({ is_active: !debit.is_active })
      .eq('id', debit.id);
    if (error) {
      toast({ title: t('common.error'), description: error.message, variant: 'destructive' });
      return;
    }
    fetchData();
  };

  const getDebitTypeIcon = (type: string) => {
    switch (type) {
      case 'credit_card': return <CreditCard className="h-4 w-4" />;
      case 'one_time': return <FileText className="h-4 w-4" />;
      default: return <Banknote className="h-4 w-4" />;
    }
  };

  const getDebitTypeLabel = (type: string) => {
    switch (type) {
      case 'credit_card': return t('autoDebit.typeCreditCard');
      case 'one_time': return t('autoDebit.typeOneTime');
      default: return t('autoDebit.typeVariableBill');
    }
  };

  const getAccountName = (id: string) => accounts.find(a => a.id === id)?.name || '-';
  const getCardName = (id: string | null) => id ? cards.find(c => c.id === id)?.name || '-' : '-';

  const filteredDebits = debits.filter(d => {
    if (viewMode === 'both') return true;
    if (!coupleData) return true;
    if (viewMode === 'user1') return d.owner_user === coupleData.user1_id || !d.owner_user;
    if (viewMode === 'user2') return d.owner_user === coupleData.user2_id;
    return true;
  });

  const activeCount = filteredDebits.filter(d => d.is_active).length;

  if (loading) return <div className="text-center py-8 text-muted-foreground">{t('common.loading')}</div>;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-500" />
            <span className="text-xs text-muted-foreground">{t('autoDebit.activeDebits')}</span>
          </div>
          <p className="text-lg font-bold mt-1">{activeCount}</p>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <Banknote className="h-4 w-4 text-primary" />
            <span className="text-xs text-muted-foreground">{t('autoDebit.totalRegistered')}</span>
          </div>
          <p className="text-lg font-bold mt-1">{filteredDebits.length}</p>
        </Card>
      </div>

      {/* Add button + Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
        <DialogTrigger asChild>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            {t('autoDebit.addNew')}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingDebit ? t('autoDebit.editTitle') : t('autoDebit.newTitle')}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>{t('autoDebit.name')}</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder={t('autoDebit.namePlaceholder')} required />
            </div>

            <div>
              <Label>{t('autoDebit.type')}</Label>
              <Select value={debitType} onValueChange={setDebitType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="credit_card">{t('autoDebit.typeCreditCard')}</SelectItem>
                  <SelectItem value="variable_bill">{t('autoDebit.typeVariableBill')}</SelectItem>
                  <SelectItem value="one_time">{t('autoDebit.typeOneTime')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {debitType === 'credit_card' && (
              <div>
                <Label>{t('autoDebit.card')}</Label>
                <Select value={cardId} onValueChange={setCardId}>
                  <SelectTrigger><SelectValue placeholder={t('autoDebit.selectCard')} /></SelectTrigger>
                  <SelectContent>
                    {cards
                      .filter(c => {
                        if (c.card_type !== 'credit') return false;
                        // Rule: only show cards owned by the logged-in user
                        return c.user_id === user?.id;
                      })
                      .map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {debitType !== 'credit_card' && (
              <div>
                <Label>{t('autoDebit.fixedAmount')}</Label>
                <Input type="number" step="0.01" min="0" value={fixedAmount} onChange={e => setFixedAmount(e.target.value)} placeholder={t('autoDebit.fixedAmountPlaceholder')} />
              </div>
            )}

            <div>
              <Label>{t('autoDebit.account')}</Label>
              <Select value={accountId} onValueChange={setAccountId}>
                <SelectTrigger><SelectValue placeholder={t('autoDebit.selectAccount')} /></SelectTrigger>
                <SelectContent>
                  {accounts.map(a => (
                    <SelectItem key={a.id} value={a.id}>{a.name} (R$ {a.balance?.toFixed(2)})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>{t('autoDebit.debitDay')}</Label>
              <Input type="number" min="1" max="31" value={debitDay} onChange={e => setDebitDay(e.target.value)} required />
            </div>

            <div>
              <Label>{t('autoDebit.category')}</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger><SelectValue placeholder={t('autoDebit.selectCategory')} /></SelectTrigger>
                <SelectContent>
                  {categories.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>


            <div>
              <Label>{t('autoDebit.description')}</Label>
              <Input value={description} onChange={e => setDescription(e.target.value)} placeholder={t('autoDebit.descriptionPlaceholder')} />
            </div>

            <Button type="submit" className="w-full">
              {editingDebit ? t('common.save') : t('autoDebit.addNew')}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* List */}
      {filteredDebits.length === 0 ? (
        <Card className="p-6 text-center text-muted-foreground">
          <Zap className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>{t('autoDebit.noDebits')}</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredDebits.map(debit => {
            const account = accounts.find(a => a.id === debit.account_id);
            const isCardDebit = debit.debit_type === 'credit_card';
            const card = isCardDebit && debit.card_id ? cards.find(c => c.id === debit.card_id) : null;
            const estimatedAmount = isCardDebit && card ? Math.abs(card.current_balance || 0) : debit.fixed_amount;
            const hasInsufficientFunds = account && estimatedAmount && account.balance < estimatedAmount;

            return (
              <Card key={debit.id} className={`p-4 ${!debit.is_active ? 'opacity-60' : ''}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {getDebitTypeIcon(debit.debit_type)}
                      <span className="font-medium truncate">{debit.name}</span>
                      <Badge variant={debit.is_active ? "default" : "secondary"} className="text-[10px]">
                        {debit.is_active ? t('recurring.active') : t('recurring.inactive')}
                      </Badge>
                      {hasInsufficientFunds && debit.is_active && (
                        <Badge variant="destructive" className="text-[10px] flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          {t('autoDebit.insufficientFunds')}
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1 space-y-0.5">
                      <p>{t('autoDebit.debitDayLabel')}: {debit.debit_day} | {getDebitTypeLabel(debit.debit_type)}</p>
                      <p>{t('autoDebit.account')}: {getAccountName(debit.account_id)}</p>
                      {isCardDebit && <p>{t('autoDebit.card')}: {getCardName(debit.card_id)}</p>}
                      {estimatedAmount && estimatedAmount > 0 && (
                        <p className="font-medium text-foreground">
                          {isCardDebit ? t('autoDebit.currentDebt') : t('autoDebit.amount')}: R$ {estimatedAmount.toFixed(2)}
                        </p>
                      )}
                      {debit.last_processed_date && (
                        <p className="text-xs">{t('autoDebit.lastProcessed')}: {debit.last_processed_date}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Switch checked={debit.is_active} onCheckedChange={() => handleToggleActive(debit)} />
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(debit)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(debit.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
