import { useState, useEffect } from "react";
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

interface Account {
  id: string;
  name: string;
}

export const CardForm = ({ onCardAdded }: CardFormProps) => {
  const { user } = useAuth();
  const { couple, isPartOfCouple } = useCouple();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [cardData, setCardData] = useState({
    name: "",
    card_type: "",
    last_four_digits: "",
    credit_limit: "",
    current_balance: "",
    currency: "BRL",
    due_date: "",
    closing_date: "",
    account_id: ""
  });

  useEffect(() => {
    if (user) {
      fetchAccounts();
    }
  }, [user]);

  const fetchAccounts = async () => {
    try {
      const { data, error } = await supabase
        .from("accounts")
        .select("id, name")
        .eq("user_id", user?.id)
        .order("name");

      if (error) throw error;
      setAccounts(data || []);
    } catch (error) {
      console.error("Error fetching accounts:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validate required fields for debit cards
    if (cardData.card_type === "debit") {
      if (!cardData.account_id) {
        toast.error('Selecione uma conta para o cartão de débito.');
        return;
      }
    }

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
      if (!cardData.closing_date) {
        toast.error('Informe a data de fechamento.');
        return;
      }
    }

    setLoading(true);
    try {
        // Check for duplicate cards
        if (cardData.card_type && cardData.last_four_digits && (cardData.card_type === "credit" || cardData.card_type === "debit")) {
          const { data: existingCards, error: checkError } = await supabase
            .from("cards")
            .select("id")
            .eq("user_id", user.id)
            .eq("card_type", cardData.card_type)
            .eq("last_four_digits", cardData.last_four_digits);

          if (checkError) throw checkError;

          if (existingCards && existingCards.length > 0) {
            const cardTypeText = cardData.card_type === "credit" ? "crédito" : "débito";
            toast.error(`Já existe um cartão de ${cardTypeText} com os últimos 4 dígitos ${cardData.last_four_digits}`);
            setLoading(false);
            return;
          }
        }

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
            current_balance: 0, // Saldo de fatura atual (não usado para o "limite disponível")
            initial_balance: parseFloat(cardData.current_balance) || 0, // Limite disponível inicial informado pelo usuário
            initial_balance_original: cardData.card_type === "credit"
              ? Math.max(0, (parseFloat(cardData.credit_limit || '0') || 0) - (parseFloat(cardData.current_balance || '0') || 0))
              : 0, // Garante que qualquer trigger de recálculo resulte exatamente no disponível informado
            currency: cardData.currency as "BRL" | "USD" | "EUR",
            closing_date: cardData.card_type === "credit" && cardData.closing_date ? parseInt(cardData.closing_date) : null,
            due_date: cardData.card_type === "credit" && cardData.due_date ? parseInt(cardData.due_date) : null,
            account_id: cardData.card_type === "debit" && cardData.account_id ? cardData.account_id : null
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
        closing_date: "",
        account_id: ""
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

          {cardData.card_type === "debit" && (
            <div>
              <Label htmlFor="account_id">Conta Vinculada</Label>
              <Select 
                value={cardData.account_id} 
                onValueChange={(value) => setCardData(prev => ({ ...prev, account_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a conta" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

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

          {cardData.card_type === "credit" && (
            <div>
              <Label htmlFor="current_balance">Limite Disponível</Label>
              <Input
                id="current_balance"
                type="number"
                step="0.01"
                value={cardData.current_balance}
                onChange={(e) => setCardData(prev => ({ ...prev, current_balance: e.target.value }))}
                placeholder="0.00"
                required
              />
            </div>
          )}

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