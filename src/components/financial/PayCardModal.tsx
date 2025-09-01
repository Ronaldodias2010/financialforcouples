import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, CreditCard, Wallet, Building2, Calculator } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useCardPayments } from '@/hooks/useCardPayments';

interface PayCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  cardInfo: {
    id: string;
    name: string;
    totalAmount: number;
    minimumPayment?: number;
    allowsPartialPayment?: boolean;
  };
  onPaymentSuccess: () => void;
}

interface Account {
  id: string;
  name: string;
  balance: number;
}

export const PayCardModal: React.FC<PayCardModalProps> = ({
  isOpen,
  onClose,
  cardInfo,
  onPaymentSuccess,
}) => {
  const { user } = useAuth();
  const { processCardPayment, isProcessing } = useCardPayments();
  
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentAmount, setPaymentAmount] = useState(cardInfo.totalAmount.toString());
  const [selectedAccount, setSelectedAccount] = useState('');
  const [notes, setNotes] = useState('');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [paymentType, setPaymentType] = useState<'full' | 'minimum' | 'custom'>('full');

  useEffect(() => {
    if (isOpen && user) {
      fetchAccounts();
      // Reset form when modal opens
      setPaymentAmount(cardInfo.totalAmount.toString());
      setPaymentType('full');
    }
  }, [isOpen, user, cardInfo.totalAmount]);

  useEffect(() => {
    // Update payment amount based on selected type
    switch (paymentType) {
      case 'full':
        setPaymentAmount(cardInfo.totalAmount.toString());
        break;
      case 'minimum':
        const minPayment = cardInfo.minimumPayment || cardInfo.totalAmount * 0.15; // 15% default minimum
        setPaymentAmount(minPayment.toString());
        break;
      case 'custom':
        // Keep current value or set minimum if empty
        if (!paymentAmount || parseFloat(paymentAmount) < (cardInfo.minimumPayment || 0)) {
          const minPayment = cardInfo.minimumPayment || cardInfo.totalAmount * 0.15;
          setPaymentAmount(minPayment.toString());
        }
        break;
    }
  }, [paymentType, cardInfo.totalAmount, cardInfo.minimumPayment]);

  const fetchAccounts = async () => {
    if (!user) return;

    try {
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
    } catch (error) {
      console.error('Error fetching accounts:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;

    const amount = parseFloat(paymentAmount);
    if (amount <= 0 || amount > cardInfo.totalAmount) {
      alert('Valor inválido para pagamento');
      return;
    }

    const minPayment = cardInfo.minimumPayment || cardInfo.totalAmount * 0.15;
    if (amount < minPayment && paymentType !== 'full') {
      alert(`Valor mínimo de pagamento: ${formatCurrency(minPayment)}`);
      return;
    }

    const result = await processCardPayment({
      cardId: cardInfo.id,
      paymentAmount: amount,
      paymentDate,
      paymentMethod,
      accountId: paymentMethod === 'account' ? selectedAccount : undefined,
      notes,
    });
    
    if (result) {
      onPaymentSuccess();
      onClose();
      resetForm();
    }
  };

  const resetForm = () => {
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setPaymentMethod('cash');
    setPaymentAmount(cardInfo.totalAmount.toString());
    setPaymentType('full');
    setSelectedAccount('');
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
      default:
        return <Wallet className="w-4 h-4" />;
    }
  };

  const minPayment = cardInfo.minimumPayment || cardInfo.totalAmount * 0.15;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Pagar Cartão de Crédito
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Card Info */}
          <div className="bg-muted/50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Cartão:</span>
              <span className="font-medium">{cardInfo.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Total da Fatura:</span>
              <span className="font-bold text-destructive">{formatCurrency(cardInfo.totalAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Pagamento Mínimo:</span>
              <span className="font-medium">{formatCurrency(minPayment)}</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Payment Type */}
            {cardInfo.allowsPartialPayment !== false && (
              <div className="space-y-2">
                <Label>Tipo de Pagamento</Label>
                <Select value={paymentType} onValueChange={(value: 'full' | 'minimum' | 'custom') => setPaymentType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4" />
                        Pagamento Total - {formatCurrency(cardInfo.totalAmount)}
                      </div>
                    </SelectItem>
                    <SelectItem value="minimum">
                      <div className="flex items-center gap-2">
                        <Calculator className="w-4 h-4" />
                        Pagamento Mínimo - {formatCurrency(minPayment)}
                      </div>
                    </SelectItem>
                    <SelectItem value="custom">
                      <div className="flex items-center gap-2">
                        <Wallet className="w-4 h-4" />
                        Valor Personalizado
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Payment Amount */}
            <div className="space-y-2">
              <Label htmlFor="paymentAmount">Valor do Pagamento</Label>
              <Input
                id="paymentAmount"
                type="number"
                step="0.01"
                min={minPayment}
                max={cardInfo.totalAmount}
                value={paymentAmount}
                onChange={(e) => {
                  setPaymentAmount(e.target.value);
                  if (parseFloat(e.target.value) === cardInfo.totalAmount) {
                    setPaymentType('full');
                  } else if (parseFloat(e.target.value) === minPayment) {
                    setPaymentType('minimum');
                  } else {
                    setPaymentType('custom');
                  }
                }}
                disabled={paymentType !== 'custom'}
                required
              />
              {paymentType === 'custom' && (
                <p className="text-sm text-muted-foreground">
                  Valor entre {formatCurrency(minPayment)} e {formatCurrency(cardInfo.totalAmount)}
                </p>
              )}
            </div>

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
                disabled={isProcessing || (paymentMethod === 'account' && !selectedAccount)}
              >
                {isProcessing ? 'Processando...' : 'Pagar Cartão'}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};
