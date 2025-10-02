import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { ManualFutureIncome } from '@/hooks/useManualFutureIncomes';
import { Badge } from '@/components/ui/badge';
import { AlertCircle } from 'lucide-react';

interface ReceiveFutureIncomeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  income: ManualFutureIncome | null;
  onReceive: (incomeId: string, receiptDate: string, accountId?: string, paymentMethod?: string) => Promise<void>;
}

export const ReceiveFutureIncomeModal = ({ open, onOpenChange, income, onReceive }: ReceiveFutureIncomeModalProps) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [receiptDate, setReceiptDate] = useState('');
  const [accountId, setAccountId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');

  useEffect(() => {
    if (open && user) {
      const today = new Date().toISOString().split('T')[0];
      setReceiptDate(today);
      fetchAccounts();
      if (income?.account_id) {
        setAccountId(income.account_id);
      }
      if (income?.payment_method) {
        setPaymentMethod(income.payment_method);
      }
    }
  }, [open, user, income]);

  const fetchAccounts = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('accounts')
      .select('id, name, account_type')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('name');

    if (data) setAccounts(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!income) return;

    setLoading(true);
    try {
      await onReceive(income.id, receiptDate, accountId || undefined, paymentMethod);
      onOpenChange(false);
    } catch (error) {
      console.error('Error receiving income:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!income) return null;

  const isLate = receiptDate > income.due_date;
  const daysLate = isLate ? Math.floor((new Date(receiptDate).getTime() - new Date(income.due_date).getTime()) / (1000 * 60 * 60 * 24)) : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t('futureIncomes.receiveTitle')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <Label className="text-base font-semibold">{income.description}</Label>
                <p className="text-sm text-muted-foreground">
                  {t('futureIncomes.dueDate')}: {new Date(income.due_date).toLocaleDateString()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-primary">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(income.amount)}
                </p>
              </div>
            </div>

            {income.category && (
              <Badge variant="outline" className="mt-2">
                {income.category.name}
              </Badge>
            )}
          </div>

          {isLate && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <div className="text-sm">
                <p className="font-semibold text-destructive">{t('futureIncomes.lateReceipt')}</p>
                <p className="text-muted-foreground">
                  {daysLate} {daysLate === 1 ? t('futureIncomes.dayLate') : t('futureIncomes.daysLate')}
                </p>
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="receipt_date">{t('futureIncomes.receiptDate')}</Label>
            <Input
              id="receipt_date"
              type="date"
              value={receiptDate}
              onChange={(e) => setReceiptDate(e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="account">{t('futureIncomes.account')}</Label>
            <Select value={accountId} onValueChange={setAccountId}>
              <SelectTrigger>
                <SelectValue placeholder={t('futureIncomes.selectAccount')} />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((acc) => (
                  <SelectItem key={acc.id} value={acc.id}>
                    {acc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="payment_method">{t('futureIncomes.paymentMethod')}</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">{t('transactionForm.cash')}</SelectItem>
                <SelectItem value="deposit">{t('transactionForm.deposit')}</SelectItem>
                <SelectItem value="transfer">{t('transactionForm.receivedTransfer')}</SelectItem>
                <SelectItem value="pix">PIX</SelectItem>
                <SelectItem value="check">{t('converter.paymentMethods.check')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? t('common.processing') : t('futureIncomes.confirmReceipt')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
