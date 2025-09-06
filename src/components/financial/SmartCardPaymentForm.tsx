import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { useSmartCardPayments } from "@/hooks/useSmartCardPayments";
import { supabase } from "@/integrations/supabase/client";
import { CreditCard, ArrowRight, TrendingDown, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface SmartCardPaymentFormProps {
  onPaymentSuccess: () => void;
}

interface Account {
  id: string;
  name: string;
  balance: number;
  currency: string;
}

interface CardInfo {
  id: string;
  name: string;
  current_balance: number;
  initial_balance: number | null;
  minimum_payment_amount: number | null;
  due_date: number | null;
}

export const SmartCardPaymentForm = ({ onPaymentSuccess }: SmartCardPaymentFormProps) => {
  const { user } = useAuth();
  const { processSmartCardPayment, getCardsWithPendingBalance, getCardPaymentStatus, isProcessing } = useSmartCardPayments();
  
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [cards, setCards] = useState<CardInfo[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [selectedCardId, setSelectedCardId] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [cardStatus, setCardStatus] = useState<{ status: string; color: string } | null>(null);

  useEffect(() => {
    if (user) {
      fetchAccounts();
      fetchCardsWithBalance();
    }
  }, [user]);

  useEffect(() => {
    if (selectedCardId) {
      fetchCardStatus();
    }
  }, [selectedCardId]);

  const fetchAccounts = async () => {
    try {
      const { data, error } = await supabase
        .from('accounts')
        .select('id, name, balance, currency')
        .eq('user_id', user?.id)
        .eq('is_active', true)
        .eq('is_cash_account', false) // Excluir contas de dinheiro
        .order('name');

      if (error) throw error;
      setAccounts(data || []);
    } catch (error) {
      console.error('Error fetching accounts:', error);
    }
  };

  const fetchCardsWithBalance = async () => {
    const cardsData = await getCardsWithPendingBalance();
    setCards(cardsData);
  };

  const fetchCardStatus = async () => {
    if (selectedCardId) {
      const status = await getCardPaymentStatus(selectedCardId);
      setCardStatus(status);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedAccountId || !selectedCardId || !paymentAmount) {
      return;
    }

    const result = await processSmartCardPayment({
      cardId: selectedCardId,
      paymentAmount: parseFloat(paymentAmount),
      sourceAccountId: selectedAccountId,
      notes: notes || undefined,
    });

    if (result?.success) {
      // Reset form
      setSelectedAccountId("");
      setSelectedCardId("");
      setPaymentAmount("");
      setNotes("");
      setCardStatus(null);
      
      // Refresh cards list to update balances
      await fetchCardsWithBalance();
      
      onPaymentSuccess();
    }
  };

  const selectedCard = cards.find(c => c.id === selectedCardId);
  const selectedAccount = accounts.find(a => a.id === selectedAccountId);
  const paymentValue = parseFloat(paymentAmount) || 0;
  const hasInsufficientFunds = selectedAccount && paymentValue > selectedAccount.balance;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Pagamento Inteligente de Cartão</h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Seleção de conta origem */}
          <div>
            <Label htmlFor="account">Conta de Origem</Label>
            <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a conta que pagará" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    <div className="flex justify-between items-center w-full">
                      <span>{account.name}</span>
                      <span className="text-sm text-muted-foreground ml-2">
                        {formatCurrency(account.balance)}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Seleção de cartão destino */}
          <div>
            <Label htmlFor="card">Cartão a Pagar</Label>
            <Select value={selectedCardId} onValueChange={setSelectedCardId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o cartão para pagamento" />
              </SelectTrigger>
              <SelectContent>
                {cards.map((card) => (
                  <SelectItem key={card.id} value={card.id}>
                    <div className="flex justify-between items-center w-full">
                      <span>{card.name}</span>
                      <div className="flex items-center gap-2 ml-2">
                        <span className="text-sm text-destructive">
                          {formatCurrency(card.current_balance)}
                        </span>
                        {card.minimum_payment_amount && (
                          <Badge variant="outline" className="text-xs">
                            Mín: {formatCurrency(card.minimum_payment_amount)}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status atual do cartão */}
          {cardStatus && selectedCard && (
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Status Atual</p>
                  <p className={`text-sm ${cardStatus.color}`}>{cardStatus.status}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Dívida Total</p>
                  <p className="text-sm font-semibold text-destructive">
                    {formatCurrency(selectedCard.current_balance)}
                  </p>
                </div>
              </div>
              {selectedCard.minimum_payment_amount && (
                <div className="mt-2 pt-2 border-t">
                  <p className="text-xs text-muted-foreground">
                    Pagamento mínimo: {formatCurrency(selectedCard.minimum_payment_amount)}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Valor do pagamento */}
          <div>
            <Label htmlFor="amount">Valor do Pagamento</Label>
            <div className="relative">
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="0.00"
                required
                className={hasInsufficientFunds ? "border-destructive" : ""}
              />
              {selectedCard && (
                <div className="flex gap-2 mt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setPaymentAmount(selectedCard.minimum_payment_amount?.toString() || "")}
                    disabled={!selectedCard.minimum_payment_amount}
                  >
                    Mínimo
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setPaymentAmount(selectedCard.current_balance.toString())}
                  >
                    Total
                  </Button>
                </div>
              )}
            </div>
            {hasInsufficientFunds && (
              <div className="flex items-center gap-2 mt-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span>Saldo insuficiente na conta selecionada</span>
              </div>
            )}
          </div>

          {/* Preview do pagamento */}
          {selectedAccount && selectedCard && paymentValue > 0 && (
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-sm font-medium">{selectedAccount.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Saldo: {formatCurrency(selectedAccount.balance)}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-primary" />
                <div className="text-center">
                  <p className="text-sm font-medium">{selectedCard.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Dívida: {formatCurrency(selectedCard.current_balance)}
                  </p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Valor a pagar:</span>
                  <span className="font-semibold text-primary">{formatCurrency(paymentValue)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Saldo restante no cartão:</span>
                  <span className="font-semibold">
                    {formatCurrency(Math.max(0, selectedCard.current_balance - paymentValue))}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Observações */}
          <div>
            <Label htmlFor="notes">Observações (opcional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Adicione observações sobre este pagamento..."
              rows={3}
            />
          </div>

          {/* Botão de submissão */}
          <Button 
            type="submit" 
            className="w-full" 
            disabled={
              isProcessing || 
              !selectedAccountId || 
              !selectedCardId || 
              !paymentAmount || 
              hasInsufficientFunds ||
              paymentValue <= 0
            }
          >
            {isProcessing ? (
              <>
                <TrendingDown className="mr-2 h-4 w-4 animate-spin" />
                Processando Pagamento...
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4" />
                Pagar Cartão
              </>
            )}
          </Button>
        </form>

        {cards.length === 0 && (
          <div className="text-center py-6 text-muted-foreground">
            <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum cartão com saldo devedor encontrado</p>
          </div>
        )}
      </div>
    </Card>
  );
};