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
import { useLanguage } from '@/hooks/useLanguage';
import { useCurrencyConverter, CURRENCY_INFO, type CurrencyCode } from '@/hooks/useCurrencyConverter';

interface PayCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  cardInfo: {
    id: string;
    name: string;
    totalAmount: number;
    minimumPayment?: number;
    allowsPartialPayment?: boolean;
    currency?: import('@/hooks/useCurrencyConverter').CurrencyCode;
  };
  onPaymentSuccess: () => void;
}

interface Account {
  id: string;
  name: string;
  balance: number;
  currency: import('@/hooks/useCurrencyConverter').CurrencyCode;
}

export const PayCardModal: React.FC<PayCardModalProps> = ({
  isOpen,
  onClose,
  cardInfo,
  onPaymentSuccess,
}) => {
  const { user } = useAuth();
  const { processCardPayment, isProcessing } = useCardPayments();
  const { t, language } = useLanguage();
  const { formatCurrency: formatCurrencyWithConverter, convertCurrency } = useCurrencyConverter();
  
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentAmount, setPaymentAmount] = useState(cardInfo.totalAmount.toString());
  const [selectedAccount, setSelectedAccount] = useState('');
  const [notes, setNotes] = useState('');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [paymentType, setPaymentType] = useState<'full' | 'minimum' | 'custom'>('full');
  const [paymentCurrency, setPaymentCurrency] = useState<CurrencyCode>(language === 'pt' ? 'BRL' : 'USD');

  useEffect(() => {
    if (isOpen && user) {
      fetchAccounts();
      // Reset form when modal opens
      setPaymentAmount(cardInfo.totalAmount.toString());
      setPaymentType('full');
      
      // Define moeda padrão baseada no idioma
      const defaultCurrency = language === 'pt' ? 'BRL' : 'USD';
      setPaymentCurrency(defaultCurrency);
    }
  }, [isOpen, user, cardInfo.totalAmount, language]);

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
        // Não force nenhum valor, deixe o usuário digitar livremente
        // Se estiver vazio, define como 0.01 (valor mínimo técnico)
        if (!paymentAmount) {
          setPaymentAmount('0.01');
        }
        break;
    }
  }, [paymentType, cardInfo.totalAmount, cardInfo.minimumPayment]);

  const fetchAccounts = async () => {
    if (!user) return;

    try {
      const { data: accountsData, error: accountsError } = await supabase
        .from('accounts')
        .select('id, name, balance, currency')
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
    
    // Converter valor da moeda de pagamento para moeda do cartão
    const cardCurrency = cardInfo.currency || 'BRL';
    const amountInCardCurrency = paymentCurrency === cardCurrency 
      ? amount 
      : convertCurrency(amount, paymentCurrency, cardCurrency);
    
    // Validações usando o valor convertido
    if (amountInCardCurrency <= 0 || amountInCardCurrency > cardInfo.totalAmount) {
      alert('Valor inválido para pagamento');
      return;
    }

    const minPayment = cardInfo.minimumPayment || cardInfo.totalAmount * 0.15;
    
    if (paymentType === 'minimum' && amountInCardCurrency < minPayment) {
      alert(`Valor mínimo de pagamento: ${formatCurrency(minPayment)}`);
      return;
    }

    if (paymentType === 'custom' && (amountInCardCurrency <= 0 || amountInCardCurrency > cardInfo.totalAmount)) {
      alert(`Valor deve estar entre ${formatCurrency(0.01)} e ${formatCurrency(cardInfo.totalAmount)}`);
      return;
    }

    // Quitação de dívida do cartão de crédito SEMPRE usa 'card_payment'
    // A origem do recurso (conta ou dinheiro) é controlada via accountId
    const mappedPaymentMethod = 'card_payment';
    
    // Enviar valor CONVERTIDO para a moeda do cartão
    const result = await processCardPayment({
      cardId: cardInfo.id,
      paymentAmount: amountInCardCurrency,
      paymentDate,
      paymentMethod: mappedPaymentMethod,
      accountId: paymentMethod === 'account' ? selectedAccount : undefined,
      notes: `${notes} (Pago em ${CURRENCY_INFO[paymentCurrency].symbol} ${amount.toFixed(2)})`,
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
    setPaymentCurrency(language === 'pt' ? 'BRL' : 'USD'); // Reset para padrão
  };

  const formatCurrency = (amount: number) => {
    const currency = cardInfo.currency || 'BRL';
    if (currency !== 'BRL') {
      return formatCurrencyWithConverter(amount, currency);
    }
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount);
  };
  
  const formatCurrencyWithConversion = (amount: number) => {
    const currency = cardInfo.currency || 'BRL';
    const mainValue = formatCurrency(amount);
    
    // Se for PT e moeda diferente de BRL, mostrar conversão
    if (language === 'pt' && currency !== 'BRL') {
      const convertedValue = convertCurrency(amount, currency, 'BRL');
      const convertedFormatted = formatCurrencyWithConverter(convertedValue, 'BRL');
      return { main: mainValue, converted: convertedFormatted };
    }
    
    return { main: mainValue, converted: null };
  };

  const formatAccountBalance = (account: Account) => {
    return formatCurrencyWithConverter(account.balance, account.currency);
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
      <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            {t('payCard.title')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Card Info */}
          <div className="bg-muted/50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">{t('payCard.card')}:</span>
              <span className="font-medium">{cardInfo.name}</span>
            </div>
            <div className="flex justify-between items-start">
              <span className="text-sm text-muted-foreground">{t('payCard.totalAmount')}:</span>
              <div className="text-right">
                {(() => {
                  const formatted = formatCurrencyWithConversion(cardInfo.totalAmount);
                  return (
                    <>
                      <span className="font-bold text-destructive block">{formatted.main}</span>
                      {formatted.converted && (
                        <span className="text-xs text-muted-foreground block mt-1">
                          ≈ {formatted.converted}
                        </span>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
            <div className="flex justify-between items-start">
              <span className="text-sm text-muted-foreground">{t('payCard.minimumPayment')}:</span>
              <div className="text-right">
                {(() => {
                  const formatted = formatCurrencyWithConversion(minPayment);
                  return (
                    <>
                      <span className="font-medium block">{formatted.main}</span>
                      {formatted.converted && (
                        <span className="text-xs text-muted-foreground block mt-1">
                          ≈ {formatted.converted}
                        </span>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Payment Type */}
            {cardInfo.allowsPartialPayment !== false && (
              <div className="space-y-2">
                <Label>{t('payCard.paymentType')}</Label>
                <Select value={paymentType} onValueChange={(value: 'full' | 'minimum' | 'custom') => setPaymentType(value)}>
                  <SelectTrigger className="bg-background z-50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background border shadow-md z-50">
                    <SelectItem value="full">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4" />
                        {t('payCard.fullPayment')} - {formatCurrency(cardInfo.totalAmount)}
                      </div>
                    </SelectItem>
                    <SelectItem value="minimum">
                      <div className="flex items-center gap-2">
                        <Calculator className="w-4 h-4" />
                        {t('payCard.minimumPaymentOption')} - {formatCurrency(minPayment)}
                      </div>
                    </SelectItem>
                    <SelectItem value="custom">
                      <div className="flex items-center gap-2">
                        <Wallet className="w-4 h-4" />
                        {t('payCard.customPayment')}
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Payment Currency */}
            <div className="space-y-2">
              <Label htmlFor="paymentCurrency">{t('payCard.paymentCurrency')}</Label>
              <Select 
                value={paymentCurrency} 
                onValueChange={(value) => setPaymentCurrency(value as CurrencyCode)}
              >
                <SelectTrigger className="bg-background z-50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background border shadow-md z-50">
                  {Object.values(CURRENCY_INFO).map((currencyInfo) => (
                    <SelectItem key={currencyInfo.code} value={currencyInfo.code}>
                      <div className="flex items-center gap-2">
                        <span>{currencyInfo.symbol}</span>
                        <span>{currencyInfo.name} ({currencyInfo.code})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Payment Amount */}
            <div className="space-y-2">
              <Label htmlFor="paymentAmount">
                {t('payCard.paymentAmount')} ({CURRENCY_INFO[paymentCurrency].symbol})
              </Label>
              <Input
                id="paymentAmount"
                type="number"
                step="0.01"
                min={paymentType === 'custom' ? 0.01 : minPayment}
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
              
              {/* Mostrar conversão se moedas forem diferentes */}
              {paymentCurrency !== (cardInfo.currency || 'BRL') && paymentAmount && (
                <p className="text-sm text-muted-foreground">
                  ≈ {formatCurrency(
                    convertCurrency(
                      parseFloat(paymentAmount), 
                      paymentCurrency, 
                      cardInfo.currency || 'BRL'
                    )
                  )} {t('payCard.willBeDebited')}
                </p>
              )}
              
              {paymentType === 'custom' && (
                <p className="text-sm text-muted-foreground">
                  {t('payCard.enterValueBetween')} {CURRENCY_INFO[paymentCurrency].symbol} 0.01 {t('payCard.and')} {formatCurrency(cardInfo.totalAmount)}
                </p>
              )}
            </div>

            {/* Payment Date */}
            <div className="space-y-2">
              <Label htmlFor="paymentDate">{t('payCard.paymentDate')}</Label>
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
              <Label htmlFor="paymentMethod">{t('payCard.paymentMethod')}</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger className="bg-background z-50">
                  <div className="flex items-center gap-2">
                    {getPaymentMethodIcon()}
                    <SelectValue placeholder={t('payCard.selectMethod')} />
                  </div>
                </SelectTrigger>
                <SelectContent className="bg-background border shadow-md z-50">
                  <SelectItem value="cash">
                    <div className="flex items-center gap-2">
                      <Wallet className="w-4 h-4" />
                      {t('payCard.cash')}
                    </div>
                  </SelectItem>
                  <SelectItem value="account">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      {t('payCard.bankAccount')}
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Account Selection */}
            {paymentMethod === 'account' && (
              <div className="space-y-2">
                <Label htmlFor="account">{t('payCard.account')}</Label>
                <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                  <SelectTrigger className="bg-background z-50">
                    <SelectValue placeholder={t('payCard.selectAccount')} />
                  </SelectTrigger>
                  <SelectContent className="bg-background border shadow-md z-50">
                    {accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.name} - {formatAccountBalance(account)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">{t('payCard.notes')}</Label>
              <Textarea
                id="notes"
                placeholder={t('payCard.notesPlaceholder')}
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
                {t('payCard.cancel')}
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={isProcessing || (paymentMethod === 'account' && !selectedAccount)}
              >
                {isProcessing ? t('payCard.processing') : t('payCard.payButton')}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};
