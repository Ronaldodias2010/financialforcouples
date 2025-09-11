import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, CreditCard, Wallet, Building2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useFutureExpensePayments } from '@/hooks/useFutureExpensePayments';
import { useManualFutureExpenses } from '@/hooks/useManualFutureExpenses';
import { useLanguage } from '@/hooks/useLanguage';
import { useCurrencyConverter, type CurrencyCode } from '@/hooks/useCurrencyConverter';

interface PayFutureExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  expense: {
    id: string;
    description: string;
    amount: number;
    due_date: string;
    type: 'recurring' | 'installment' | 'card_payment' | 'card_transaction' | 'manual_future';
    category?: string;
    recurringExpenseId?: string;
    installmentTransactionId?: string;
    cardPaymentInfo?: any;
    manualFutureExpenseId?: string;
    currency?: import('@/hooks/useCurrencyConverter').CurrencyCode;
  };
  onPaymentSuccess: () => void;
}

interface Account {
  id: string;
  name: string;
  balance: number;
}

interface Card {
  id: string;
  name: string;
  card_type: string;
  initial_balance: number;
}

export const PayFutureExpenseModal: React.FC<PayFutureExpenseModalProps> = ({
  isOpen,
  onClose,
  expense,
  onPaymentSuccess,
}) => {
  const { user } = useAuth();
  const { processPayment, isProcessing } = useFutureExpensePayments();
  const { payManualExpense } = useManualFutureExpenses();
  const { t } = useLanguage();
  const { formatCurrency: formatCurrencyWithConverter } = useCurrencyConverter();
  
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [selectedAccount, setSelectedAccount] = useState('');
  const [selectedCard, setSelectedCard] = useState('');
  const [notes, setNotes] = useState('');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [cards, setCards] = useState<Card[]>([]);

  useEffect(() => {
    if (isOpen && user) {
      fetchAccountsAndCards();
    }
  }, [isOpen, user]);

  const fetchAccountsAndCards = async () => {
    if (!user) return;

    try {
      // Fetch accounts
      const { data: accountsData, error: accountsError } = await supabase
        .from('accounts')
        .select('id, name, balance')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (accountsError) {
        console.error('Error fetching accounts:', accountsError);
      } else {
        setAccounts(accountsData || []);
      }

      // Fetch cards
      const { data: cardsData, error: cardsError } = await supabase
        .from('cards')
        .select('id, name, card_type, initial_balance')
        .eq('user_id', user.id);

      if (cardsError) {
        console.error('Error fetching cards:', cardsError);
      } else {
        setCards(cardsData || []);
      }
    } catch (error) {
      console.error('Error fetching accounts and cards:', error);
    }
  };

  const getCorrectPaymentMethod = async (): Promise<string> => {
    if (paymentMethod === 'cash') return 'cash';
    if (paymentMethod === 'account') return 'deposit'; // FIXED: Map account to deposit so it appears in dashboard
    
    if (paymentMethod === 'card' && selectedCard) {
      // Get the card type to determine if it's credit or debit
      const selectedCardData = cards.find(card => card.id === selectedCard);
      if (selectedCardData) {
        return selectedCardData.card_type === 'credit' ? 'credit_card' : 'debit_card';
      }
    }
    
    return 'cash'; // fallback
  };

  const getCardPaymentCategory = async (): Promise<string | undefined> => {
    if (!user || expense.type !== 'card_payment') return undefined;
    
    try {
      // Find "Pagamento de Cartão de Crédito" category
      const { data: categories, error } = await supabase
        .from('categories')
        .select('id, name')
        .eq('user_id', user.id)
        .eq('category_type', 'expense');
      
      if (error) throw error;
      
      const cardPaymentCategory = categories?.find(cat => 
        cat.name.toLowerCase().includes('pagamento') && 
        cat.name.toLowerCase().includes('cartão')
      );
      
      return cardPaymentCategory?.id;
    } catch (error) {
      console.error('Error finding card payment category:', error);
      return undefined;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;

    let result;
    const correctPaymentMethod = await getCorrectPaymentMethod();
    const cardPaymentCategoryId = await getCardPaymentCategory();

    if (expense.type === 'manual_future' && expense.manualFutureExpenseId) {
      // Handle manual future expense payment
      result = await payManualExpense({
        expenseId: expense.manualFutureExpenseId,
        paymentDate,
        accountId: paymentMethod === 'account' ? selectedAccount : undefined,
        cardId: paymentMethod === 'card' ? selectedCard : undefined,
        paymentMethod: correctPaymentMethod,
      });
    } else {
      // Handle other types of expenses
      const paymentParams = {
        recurringExpenseId: expense.recurringExpenseId,
        installmentTransactionId: expense.installmentTransactionId,
        cardPaymentInfo: expense.cardPaymentInfo,
        originalDueDate: expense.due_date,
        paymentDate,
        amount: expense.amount,
        description: `${expense.description}${notes ? ` - ${notes}` : ''}`,
        paymentMethod: correctPaymentMethod,
        accountId: paymentMethod === 'account' ? selectedAccount : undefined,
        cardId: paymentMethod === 'card' ? selectedCard : undefined,
        // FIXED: Force card payment category for card payments to ensure proper dashboard display
        categoryId: expense.type === 'card_payment' ? cardPaymentCategoryId : undefined,
      };

      result = await processPayment(paymentParams);
    }
    
    if (result) {
      onPaymentSuccess();
      onClose();
      resetForm();
    }
  };

  const resetForm = () => {
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setPaymentMethod('cash');
    setSelectedAccount('');
    setSelectedCard('');
    setNotes('');
  };

  const formatCurrency = (amount: number, currency?: CurrencyCode) => {
    if (currency && currency !== 'BRL') {
      return formatCurrencyWithConverter(amount, currency);
    }
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getPaymentMethodIcon = () => {
    switch (paymentMethod) {
      case 'cash':
        return <Wallet className="w-4 h-4" />;
      case 'account':
        return <Building2 className="w-4 h-4" />;
      case 'card':
        return <CreditCard className="w-4 h-4" />;
      default:
        return <Wallet className="w-4 h-4" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            {t('payFutureExpense.title')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Expense Info */}
          <div className="bg-muted/50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">{t('payFutureExpense.description')}:</span>
              <span className="font-medium">{expense.description}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">{t('payFutureExpense.amount')}:</span>
              <span className="font-bold text-destructive">{formatCurrency(expense.amount, expense.currency)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">{t('payFutureExpense.dueDate')}:</span>
              <span>{formatDate(expense.due_date)}</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Payment Date */}
            <div className="space-y-2">
              <Label htmlFor="paymentDate">{t('payFutureExpense.paymentDate')}</Label>
              <Input
                id="paymentDate"
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                required
              />
            </div>

            {/* Payment Method */}
            <div className="space-y-2">
              <Label htmlFor="paymentMethod">{t('payFutureExpense.paymentMethod')}</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger className="bg-background z-50">
                  <div className="flex items-center gap-2">
                    {getPaymentMethodIcon()}
                    <SelectValue placeholder={t('payFutureExpense.selectMethod')} />
                  </div>
                </SelectTrigger>
                <SelectContent className="bg-background border shadow-md z-50">
                  <SelectItem value="cash">
                    <div className="flex items-center gap-2">
                      <Wallet className="w-4 h-4" />
                      {t('payFutureExpense.cash')}
                    </div>
                  </SelectItem>
                  <SelectItem value="account">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      {t('payFutureExpense.bankAccount')}
                    </div>
                  </SelectItem>
                  <SelectItem value="card">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      {t('payFutureExpense.card')}
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Account Selection */}
            {paymentMethod === 'account' && (
              <div className="space-y-2">
                <Label htmlFor="account">{t('payFutureExpense.account')}</Label>
                <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                  <SelectTrigger className="bg-background z-50">
                    <SelectValue placeholder={t('payFutureExpense.selectAccount')} />
                  </SelectTrigger>
                  <SelectContent className="bg-background border shadow-md z-50">
                    {accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.name} - {formatCurrency(account.balance)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Card Selection */}
            {paymentMethod === 'card' && (
              <div className="space-y-2">
                <Label htmlFor="card">{t('payFutureExpense.card')}</Label>
                <Select value={selectedCard} onValueChange={setSelectedCard}>
                  <SelectTrigger className="bg-background z-50">
                    <SelectValue placeholder={t('payFutureExpense.selectCard')} />
                  </SelectTrigger>
                  <SelectContent className="bg-background border shadow-md z-50">
                    {cards.map((card) => (
                      <SelectItem key={card.id} value={card.id}>
                        {card.name} ({card.card_type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">{t('payFutureExpense.notes')}</Label>
              <Textarea
                id="notes"
                placeholder={t('payFutureExpense.notesPlaceholder')}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
                disabled={isProcessing}
              >
                {t('payFutureExpense.cancel')}
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={isProcessing || (paymentMethod === 'account' && !selectedAccount) || (paymentMethod === 'card' && !selectedCard)}
              >
                {isProcessing ? t('payFutureExpense.processing') : t('payFutureExpense.payButton')}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};