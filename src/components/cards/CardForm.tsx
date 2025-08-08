import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useCouple } from "@/hooks/useCouple";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CreditCard, Plus } from "lucide-react";

interface CardFormProps {
  onCardAdded: () => void;
}

export const CardForm = ({ onCardAdded }: CardFormProps) => {
  const { user } = useAuth();
  const { couple, isPartOfCouple } = useCouple();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [cardData, setCardData] = useState({
    name: "",
    card_type: "",
    last_four_digits: "",
    credit_limit: "",
    current_balance: "",
    currency: "BRL",
    due_date: "",
    closing_date: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validate required fields for credit cards
    if (cardData.card_type === "credit") {
      if (!cardData.credit_limit) {
        toast.error('Informe o limite total do cartão.');
        return;
      }
      if (!cardData.current_balance) {
        toast.error('Informe o limite disponível inicial.');
        return;
      }
      if (!cardData.due_date) {
        toast.error('Informe a data de vencimento.');
        return;
      }
    }

    setLoading(true);
    try {
        // Determinar o dono com base no relacionamento do casal
        let ownerUser: "user1" | "user2" = "user1";
        if (isPartOfCouple && couple) {
          ownerUser = user.id === couple.user1_id ? "user1" : "user2";
        }

        const { error } = await supabase
          .from("cards")
          .insert({
            user_id: user.id,
            owner_user: ownerUser,
            name: cardData.name,
            card_type: cardData.card_type as "credit" | "debit",
            last_four_digits: cardData.last_four_digits,
            credit_limit: cardData.card_type === "credit" && cardData.credit_limit ? parseFloat(cardData.credit_limit) : null,
            current_balance: 0, // Será calculado pelo trigger baseado nas transações
            initial_balance_original: parseFloat(cardData.current_balance) || 0, // Valor inicial já utilizado
            currency: cardData.currency as "BRL" | "USD" | "EUR",
            due_date: cardData.card_type === "credit" && cardData.due_date ? parseInt(cardData.due_date) : null,
            closing_date: cardData.card_type === "credit" && cardData.closing_date ? parseInt(cardData.closing_date) : null
          });

      if (error) throw error;

      toast.success(t('messages.cardAdded'));
      setCardData({
        name: "",
        card_type: "",
        last_four_digits: "",
        credit_limit: "",
        current_balance: "",
        currency: "BRL",
        due_date: "",
        closing_date: ""
      });
      onCardAdded();
    } catch (error) {
      console.error("Error adding card:", error);
      toast.error(t('messages.cardError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Plus className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">{t('cards.add')}</h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">{t('cards.name')}</Label>
            <Input
              id="name"
              value={cardData.name}
              onChange={(e) => setCardData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Ex: Cartão Principal"
              required
            />
          </div>

          <div>
            <Label htmlFor="card_type">{t('cards.type')}</Label>
            <Select 
              value={cardData.card_type} 
              onValueChange={(value) => setCardData(prev => ({ ...prev, card_type: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('cards.selectType')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="credit">{t('cards.credit')}</SelectItem>
                <SelectItem value="debit">{t('cards.debit')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="last_four_digits">{t('cards.lastFourDigits')}</Label>
            <Input
              id="last_four_digits"
              value={cardData.last_four_digits}
              onChange={(e) => setCardData(prev => ({ ...prev, last_four_digits: e.target.value }))}
              placeholder="1234"
              maxLength={4}
            />
          </div>

          {cardData.card_type === "credit" && (
            <>
              <div>
                <Label htmlFor="credit_limit">{t('cards.creditLimit')}</Label>
                <Input
                  id="credit_limit"
                  type="number"
                  step="0.01"
                  value={cardData.credit_limit}
                  onChange={(e) => setCardData(prev => ({ ...prev, credit_limit: e.target.value }))}
                  placeholder="0.00"
                  required={cardData.card_type === "credit"}
                />
              </div>
              
              <div>
                <Label htmlFor="closing_date">Data de Fechamento</Label>
                <Select 
                  value={cardData.closing_date} 
                  onValueChange={(value) => setCardData(prev => ({ ...prev, closing_date: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o dia" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                      <SelectItem key={day} value={day.toString()}>
                        {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="due_date">{t('cards.dueDate')}</Label>
                <Select 
                  value={cardData.due_date} 
                  onValueChange={(value) => setCardData(prev => ({ ...prev, due_date: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('cards.selectDay')} />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                      <SelectItem key={day} value={day.toString()}>
                        {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          <div>
            <Label htmlFor="current_balance">Limite Disponível</Label>
            <Input
              id="current_balance"
              type="number"
              step="0.01"
              value={cardData.current_balance}
              onChange={(e) => setCardData(prev => ({ ...prev, current_balance: e.target.value }))}
              placeholder="0.00"
              required={cardData.card_type === "credit"}
            />
          </div>

          <div>
            <Label htmlFor="currency">{t('cards.currency')}</Label>
            <Select 
              value={cardData.currency} 
              onValueChange={(value) => setCardData(prev => ({ ...prev, currency: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BRL">Real (BRL)</SelectItem>
                <SelectItem value="USD">Dólar (USD)</SelectItem>
                <SelectItem value="EUR">Euro (EUR)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? t('cards.adding') : t('cards.addCard')}
          </Button>
        </form>
      </div>
    </Card>
  );
};