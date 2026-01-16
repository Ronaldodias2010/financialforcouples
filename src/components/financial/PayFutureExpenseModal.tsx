import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, CreditCard, Wallet, Building2, AlertTriangle, DollarSign, Tag } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useFutureExpensePayments } from '@/hooks/useFutureExpensePayments';
import { useManualFutureExpenses } from '@/hooks/useManualFutureExpenses';
import { useLanguage } from '@/hooks/useLanguage';
import { useCurrencyConverter, type CurrencyCode } from '@/hooks/useCurrencyConverter';
import { addMonetaryValues } from '@/utils/monetary';

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
    categoryId?: string; // ⭐ ID da categoria existente
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

interface Category {
  id: string;
  name: string;
  color: string;
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
  const { t, language } = useLanguage();
  const { formatCurrency: formatCurrencyWithConverter, convertCurrency } = useCurrencyConverter();
  
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [selectedAccount, setSelectedAccount] = useState('');
  const [selectedCard, setSelectedCard] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [notes, setNotes] = useState('');
  const [interestAmount, setInterestAmount] = useState('');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  // Calculate if expense is overdue
  const daysOverdue = useMemo(() => {
    const today = new Date();
    const dueDate = new Date(expense.due_date);
    const diffTime = today.getTime() - dueDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  }, [expense.due_date]);

  const isOverdue = daysOverdue > 0;

  // Calculate total amount with interest
  const parsedInterest = useMemo(() => {
    const value = parseFloat(interestAmount.replace(',', '.')) || 0;
    return value >= 0 ? value : 0;
  }, [interestAmount]);

  const totalAmount = useMemo(() => {
    return addMonetaryValues(expense.amount, parsedInterest);
  }, [expense.amount, parsedInterest]);

  useEffect(() => {
    if (isOpen && user) {
      fetchAccountsAndCards();
      fetchCategories();
    }
  }, [isOpen, user]);

  useEffect(() => {
    if (isOpen) {
      // Reset interest when modal opens
      setInterestAmount('');
      // ⭐ Pre-select category if expense has one, use 'none' for no category
      setSelectedCategory(expense.categoryId || 'none');
    }
  }, [isOpen, expense.categoryId]);

  const fetchAccountsAndCards = async () => {
    if (!user) return;

    try {
      // Check if user is part of a couple
      const { data: coupleData } = await supabase
        .from("user_couples")
        .select("user1_id, user2_id")
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .eq("status", "active")
        .maybeSingle();

      let userIds = [user.id];
      if (coupleData) {
        userIds = [coupleData.user1_id, coupleData.user2_id];
      }

      // Fetch accounts (including partner's accounts)
      const { data: accountsData, error: accountsError } = await supabase
        .from('accounts')
        .select('id, name, balance')
        .in('user_id', userIds)
        .eq('is_active', true);

      if (accountsError) {
        console.error('Error fetching accounts:', accountsError);
      } else {
        setAccounts(accountsData || []);
      }

      // Fetch cards (including partner's cards)
      const { data: cardsData, error: cardsError } = await supabase
        .from('cards')
        .select('id, name, card_type, initial_balance')
        .in('user_id', userIds);

      if (cardsError) {
        console.error('Error fetching cards:', cardsError);
      } else {
        setCards(cardsData || []);
      }
    } catch (error) {
      console.error('Error fetching accounts and cards:', error);
    }
  };

  // ⭐ Fetch expense categories for selection
  const fetchCategories = async () => {
    if (!user) return;

    try {
      // Check if user is part of a couple
      const { data: coupleData } = await supabase
        .from("user_couples")
        .select("user1_id, user2_id")
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .eq("status", "active")
        .maybeSingle();

      let userIds = [user.id];
      if (coupleData) {
        userIds = [coupleData.user1_id, coupleData.user2_id];
      }

      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('id, name, color')
        .in('user_id', userIds)
        .eq('category_type', 'expense')
        .is('deleted_at', null)
        .order('name');

      if (categoriesError) {
        console.error('Error fetching categories:', categoriesError);
      } else {
        setCategories(categoriesData || []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
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
        interestAmount: parsedInterest,
        categoryId: selectedCategory === 'none' ? undefined : selectedCategory, // ⭐ Passar categoria selecionada
      });
    } else {
      // Handle other types of expenses
      // ⭐ Determinar categoryId: usar selecionada, ou do cartão, ou original
      let finalCategoryId = selectedCategory === 'none' ? undefined : selectedCategory;
      if (expense.type === 'card_payment' && cardPaymentCategoryId) {
        finalCategoryId = cardPaymentCategoryId;
      }
      
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
        categoryId: finalCategoryId, // ⭐ Usar categoria selecionada
        interestAmount: parsedInterest,
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
    setSelectedCategory('none');
    setNotes('');
    setInterestAmount('');
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
            <div className="flex justify-between items-start">
              <span className="text-sm text-muted-foreground">{t('payFutureExpense.amount')}:</span>
              <div className="text-right">
                <span className="font-bold text-destructive block">
                  {formatCurrency(expense.amount, expense.currency)}
                </span>
                {language === 'pt' && expense.currency && expense.currency !== 'BRL' && (
                  <span className="text-xs text-muted-foreground block mt-1">
                    ≈ {formatCurrency(convertCurrency(expense.amount, expense.currency, 'BRL'), 'BRL')}
                  </span>
                )}
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">{t('payFutureExpense.dueDate')}:</span>
              <div className="flex items-center gap-2">
                <span>{formatDate(expense.due_date)}</span>
                {isOverdue && (
                  <span className="text-xs bg-destructive/10 text-destructive px-2 py-0.5 rounded-full font-medium">
                    {daysOverdue} {daysOverdue === 1 ? 'dia' : 'dias'} atraso
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Overdue Alert */}
          {isOverdue && (
            <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-amber-800 dark:text-amber-200">
                  {t('payFutureExpense.overdueAlert') || 'Despesa em atraso'}
                </p>
                <p className="text-amber-700 dark:text-amber-300 mt-0.5">
                  {t('payFutureExpense.interestHint') || 'Adicione juros/multa se aplicável'}
                </p>
              </div>
            </div>
          )}

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

            {/* Interest Amount */}
            <div className="space-y-2">
              <Label htmlFor="interestAmount" className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                {t('payFutureExpense.interest') || 'Juros/Multa'}
                <span className="text-muted-foreground text-xs font-normal">
                  ({t('common.optional') || 'opcional'})
                </span>
              </Label>
              <Input
                id="interestAmount"
                type="text"
                inputMode="decimal"
                placeholder="0,00"
                value={interestAmount}
                onChange={(e) => setInterestAmount(e.target.value)}
              />
            </div>

            {/* Total Amount Display */}
            {parsedInterest > 0 && (
              <div className="flex justify-between items-center p-3 bg-primary/10 rounded-lg">
                <span className="font-medium">
                  {t('payFutureExpense.totalToPay') || 'Total a pagar'}:
                </span>
                <span className="font-bold text-lg text-primary">
                  {formatCurrency(totalAmount)}
                </span>
              </div>
            )}

            {/* ⭐ Category Selection */}
            <div className="space-y-2">
              <Label htmlFor="category" className="flex items-center gap-2">
                <Tag className="w-4 h-4" />
                {t('payFutureExpense.category') || 'Categoria'}
              </Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="bg-background z-50">
                  <SelectValue placeholder={t('payFutureExpense.selectCategory') || 'Selecione uma categoria'} />
                </SelectTrigger>
                <SelectContent className="bg-background border shadow-md z-50 max-h-[200px]">
                  <SelectItem value="none">
                    <span className="text-muted-foreground">{t('common.noCategory') || 'Sem categoria'}</span>
                  </SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: category.color || '#888' }}
                        />
                        {category.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                {isProcessing ? t('payFutureExpense.processing') : (
                  parsedInterest > 0 
                    ? `${t('payFutureExpense.payButton')} ${formatCurrency(totalAmount)}`
                    : t('payFutureExpense.payButton')
                )}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};
