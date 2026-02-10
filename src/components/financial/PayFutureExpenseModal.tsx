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
import { useCashBalance } from '@/hooks/useCashBalance';
import { useToast } from '@/hooks/use-toast';
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
  owner_user: string | null;
}

interface Card {
  id: string;
  name: string;
  card_type: string;
  initial_balance: number;
  credit_limit: number | null;
  current_balance: number | null;
  owner_user: string | null;
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
  const { getCashBalance } = useCashBalance();
  const { toast } = useToast();
  
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
  const [cashAccountId, setCashAccountId] = useState<string | null>(null);
  const [ownerNames, setOwnerNames] = useState<{ user1: string; user2: string }>({ user1: '', user2: '' });

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

  // Balance validation for cash payments
  const cashBalance = useMemo(() => {
    return getCashBalance((expense.currency as CurrencyCode) || 'BRL');
  }, [getCashBalance, expense.currency]);

  const hasSufficientCashBalance = useMemo(() => {
    if (paymentMethod !== 'cash') return true;
    return cashBalance >= totalAmount;
  }, [paymentMethod, cashBalance, totalAmount]);

  // Balance validation for account payments
  const selectedAccountData = useMemo(() => {
    return accounts.find(acc => acc.id === selectedAccount);
  }, [accounts, selectedAccount]);

  const hasSufficientAccountBalance = useMemo(() => {
    if (paymentMethod !== 'account' || !selectedAccountData) return true;
    return selectedAccountData.balance >= totalAmount;
  }, [paymentMethod, selectedAccountData, totalAmount]);

  // Balance validation for card payments
  const selectedCardData = useMemo(() => {
    return cards.find(card => card.id === selectedCard);
  }, [cards, selectedCard]);

  const hasSufficientCardLimit = useMemo(() => {
    if (paymentMethod !== 'card' || !selectedCardData) return true;
    // For credit cards, check available limit (credit_limit - current_balance)
    if (selectedCardData.card_type === 'credit') {
      const creditLimit = selectedCardData.credit_limit || 0;
      const currentBalance = selectedCardData.current_balance || 0;
      const availableLimit = creditLimit - currentBalance;
      return availableLimit >= totalAmount;
    }
    // For debit cards, we don't validate here (uses linked account)
    return true;
  }, [paymentMethod, selectedCardData, totalAmount]);

  // Combined validation
  const hasInsufficientFunds = useMemo(() => {
    if (paymentMethod === 'cash') return !hasSufficientCashBalance;
    if (paymentMethod === 'account') return !hasSufficientAccountBalance;
    if (paymentMethod === 'card') return !hasSufficientCardLimit;
    return false;
  }, [paymentMethod, hasSufficientCashBalance, hasSufficientAccountBalance, hasSufficientCardLimit]);

  const balanceErrorMessage = useMemo(() => {
    const currency = (expense.currency as CurrencyCode) || 'BRL';
    if (paymentMethod === 'cash' && !hasSufficientCashBalance) {
      return `Saldo em dinheiro insuficiente. Disponível: ${formatCurrencyWithConverter(cashBalance, currency)}`;
    }
    if (paymentMethod === 'account' && selectedAccountData && !hasSufficientAccountBalance) {
      return `Saldo insuficiente na conta "${selectedAccountData.name}". Disponível: ${formatCurrencyWithConverter(selectedAccountData.balance, currency)}`;
    }
    if (paymentMethod === 'card' && selectedCardData && !hasSufficientCardLimit) {
      const creditLimit = selectedCardData.credit_limit || 0;
      const currentBalance = selectedCardData.current_balance || 0;
      const availableLimit = creditLimit - currentBalance;
      return `Limite insuficiente no cartão "${selectedCardData.name}". Disponível: ${formatCurrencyWithConverter(availableLimit, currency)}`;
    }
    return null;
  }, [paymentMethod, hasSufficientCashBalance, hasSufficientAccountBalance, hasSufficientCardLimit, cashBalance, selectedAccountData, selectedCardData, expense.currency, formatCurrencyWithConverter]);

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
        
        // Fetch profile names for both users
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id, display_name, second_user_name')
          .in('user_id', userIds);

        if (profilesData && profilesData.length > 0) {
          // Find user1 and user2 profiles
          const user1Profile = profilesData.find(p => p.user_id === coupleData.user1_id);
          const user2Profile = profilesData.find(p => p.user_id === coupleData.user2_id);
          
          // Get display names - for user2, check if it's in second_user_name or separate profile
          const user1Name = user1Profile?.display_name?.split(' ')[0] || 'Usuário 1';
          const user2Name = user2Profile?.display_name?.split(' ')[0] || 
                           user1Profile?.second_user_name || 'Usuário 2';
          
          setOwnerNames({ user1: user1Name, user2: user2Name });
        }
      }

      // Fetch accounts (including partner's accounts) - excluding cash accounts
      const { data: accountsData, error: accountsError } = await supabase
        .from('accounts')
        .select('id, name, balance, owner_user')
        .in('user_id', userIds)
        .eq('is_active', true)
        .or('is_cash_account.is.null,is_cash_account.eq.false');

      if (accountsError) {
        console.error('Error fetching accounts:', accountsError);
      } else {
        setAccounts(accountsData || []);
      }

      // Fetch cash account for the expense currency
      const expenseCurrency = expense.currency || 'BRL';
      const { data: cashAccountData } = await supabase
        .from('accounts')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_cash_account', true)
        .eq('currency', expenseCurrency)
        .eq('is_active', true)
        .maybeSingle();

      setCashAccountId(cashAccountData?.id || null);

      // Fetch cards (including partner's cards)
      const { data: cardsData, error: cardsError } = await supabase
        .from('cards')
        .select('id, name, card_type, initial_balance, credit_limit, current_balance, owner_user')
        .in('user_id', userIds)
        .is('deleted_at', null);

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

    // Validate balance before processing
    if (hasInsufficientFunds) {
      toast({
        title: "Saldo insuficiente",
        description: balanceErrorMessage || "Você não tem saldo suficiente para realizar este pagamento.",
        variant: "destructive",
      });
      return;
    }

    let result;
    const correctPaymentMethod = await getCorrectPaymentMethod();
    const cardPaymentCategoryId = await getCardPaymentCategory();

    if (expense.type === 'manual_future' && expense.manualFutureExpenseId) {
      // Handle manual future expense payment
      // For cash payments, use the cash account ID so the balance is deducted
      const accountIdForPayment = paymentMethod === 'cash' 
        ? cashAccountId || undefined
        : (paymentMethod === 'account' ? selectedAccount : undefined);

      result = await payManualExpense({
        expenseId: expense.manualFutureExpenseId,
        paymentDate,
        accountId: accountIdForPayment,
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
      
      // For cash payments, use the cash account ID so the balance is deducted
      const accountIdForPayment = paymentMethod === 'cash' 
        ? cashAccountId || undefined
        : (paymentMethod === 'account' ? selectedAccount : undefined);

      const paymentParams = {
        recurringExpenseId: expense.recurringExpenseId,
        installmentTransactionId: expense.installmentTransactionId,
        cardPaymentInfo: expense.cardPaymentInfo,
        originalDueDate: expense.due_date,
        paymentDate,
        amount: expense.amount,
        description: `${expense.description}${notes ? ` - ${notes}` : ''}`,
        paymentMethod: correctPaymentMethod,
        accountId: accountIdForPayment,
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
      <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Pagar Despesa
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Expense Info */}
          <div className="bg-muted/50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Descrição:</span>
              <span className="font-medium">{expense.description}</span>
            </div>
            <div className="flex justify-between items-start">
              <span className="text-sm text-muted-foreground">Valor:</span>
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
              <span className="text-sm text-muted-foreground">Vencimento:</span>
              <div className="flex items-center gap-2">
                <span>{formatDate(expense.due_date)}</span>
                {isOverdue && (
                  <span className="text-xs bg-destructive/10 text-destructive px-2 py-0.5 rounded-full font-medium">
                    {daysOverdue} {daysOverdue === 1 ? 'dia' : 'dias'} de atraso
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
                  Despesa em atraso
                </p>
                <p className="text-amber-700 dark:text-amber-300 mt-0.5">
                  Adicione juros/multa se aplicável
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Payment Date */}
            <div className="space-y-2">
              <Label htmlFor="paymentDate">Data do Pagamento</Label>
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
                Juros/Multa
                <span className="text-muted-foreground text-xs font-normal">
                  (opcional)
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
                  Total a pagar:
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
                Categoria
              </Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="bg-background z-50">
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent className="bg-background border shadow-md z-50 max-h-[200px]">
                  <SelectItem value="none">
                    <span className="text-muted-foreground">Sem categoria</span>
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
              <Label htmlFor="paymentMethod">Forma de Pagamento</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger className="bg-background z-50">
                  <div className="flex items-center gap-2">
                    {getPaymentMethodIcon()}
                    <SelectValue placeholder="Selecione" />
                  </div>
                </SelectTrigger>
                <SelectContent className="bg-background border shadow-md z-50">
                  <SelectItem value="cash">
                    <div className="flex items-center gap-2">
                      <Wallet className="w-4 h-4" />
                      Dinheiro
                    </div>
                  </SelectItem>
                  <SelectItem value="account">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      Conta Bancária
                    </div>
                  </SelectItem>
                  <SelectItem value="card">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      Cartão
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Account Selection */}
            {paymentMethod === 'account' && (
              <div className="space-y-2">
                <Label htmlFor="account">Conta</Label>
                <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                  <SelectTrigger className="bg-background z-50">
                    <SelectValue placeholder="Selecione uma conta" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border shadow-md z-50">
                    {accounts.map((account) => {
                      const ownerDisplayName = account.owner_user === 'user1' 
                        ? ownerNames.user1 
                        : account.owner_user === 'user2' 
                          ? ownerNames.user2 
                          : null;
                      
                      return (
                        <SelectItem key={account.id} value={account.id}>
                          {account.name} - {formatCurrency(account.balance)}
                          {ownerDisplayName && (
                            <span className="text-muted-foreground ml-1">• {ownerDisplayName}</span>
                          )}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Card Selection */}
            {paymentMethod === 'card' && (
              <div className="space-y-2">
                <Label htmlFor="card">Cartão</Label>
                <Select value={selectedCard} onValueChange={setSelectedCard}>
                  <SelectTrigger className="bg-background z-50">
                    <SelectValue placeholder="Selecione um cartão" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border shadow-md z-50">
                    {cards.map((card) => {
                      const ownerDisplayName = card.owner_user === 'user1' 
                        ? ownerNames.user1 
                        : card.owner_user === 'user2' 
                          ? ownerNames.user2 
                          : null;
                      
                      return (
                        <SelectItem key={card.id} value={card.id}>
                          {card.name} ({card.card_type === 'credit' ? 'Crédito' : 'Débito'})
                          {ownerDisplayName && (
                            <span className="text-muted-foreground ml-1">• {ownerDisplayName}</span>
                          )}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Observações (opcional)</Label>
              <Textarea
                id="notes"
                placeholder="Adicione observações sobre este pagamento..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>

            {/* Insufficient Funds Alert */}
            {hasInsufficientFunds && balanceErrorMessage && (
              <div className="flex items-start gap-3 p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-destructive">
                    Saldo Insuficiente
                  </p>
                  <p className="text-destructive/80 mt-0.5">
                    {balanceErrorMessage}
                  </p>
                </div>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
                disabled={isProcessing}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={isProcessing || hasInsufficientFunds || (paymentMethod === 'account' && !selectedAccount) || (paymentMethod === 'card' && !selectedCard)}
              >
                {isProcessing ? 'Processando...' : (
                  parsedInterest > 0 
                    ? `Pagar ${formatCurrency(totalAmount)}`
                    : 'Pagar Gasto'
                )}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};
