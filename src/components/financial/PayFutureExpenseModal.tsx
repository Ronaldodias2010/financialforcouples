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

interface PayFutureExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  expense: {
    id: string;
    description: string;
    amount: number;
    due_date: string;
    type: 'recurring' | 'installment' | 'card_payment';
    category?: string;
    recurringExpenseId?: string;
    installmentTransactionId?: string;
    cardPaymentInfo?: any;
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;

    const paymentParams = {
      recurringExpenseId: expense.recurringExpenseId,
      installmentTransactionId: expense.installmentTransactionId,
      cardPaymentInfo: expense.cardPaymentInfo,
      originalDueDate: expense.due_date,
      paymentDate,
      amount: expense.amount,
      description: `${expense.description}${notes ? ` - ${notes}` : ''}`,
      paymentMethod,
      accountId: paymentMethod === 'account' ? selectedAccount : undefined,
      cardId: paymentMethod === 'card' ? selectedCard : undefined,
    };

    const result = await processPayment(paymentParams);
    
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

  const formatCurrency = (amount: number) => {
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
            Pagar Gasto Futuro
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Expense Info */}
          <div className="bg-muted/50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Descrição:</span>
              <span className="font-medium">{expense.description}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Valor:</span>
              <span className="font-bold text-destructive">{formatCurrency(expense.amount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Vencimento:</span>
              <span>{formatDate(expense.due_date)}</span>
            </div>
          </div>

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

            {/* Payment Method */}
            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Método de Pagamento</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <div className="flex items-center gap-2">
                    {getPaymentMethodIcon()}
                    <SelectValue placeholder="Selecione o método" />
                  </div>
                </SelectTrigger>
                <SelectContent>
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
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a conta" />
                  </SelectTrigger>
                  <SelectContent>
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
                <Label htmlFor="card">Cartão</Label>
                <Select value={selectedCard} onValueChange={setSelectedCard}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o cartão" />
                  </SelectTrigger>
                  <SelectContent>
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
              <Label htmlFor="notes">Observações (opcional)</Label>
              <Textarea
                id="notes"
                placeholder="Adicione observações sobre este pagamento..."
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
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={isProcessing || (paymentMethod === 'account' && !selectedAccount) || (paymentMethod === 'card' && !selectedCard)}
              >
                {isProcessing ? 'Processando...' : 'Pagar Gasto'}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};