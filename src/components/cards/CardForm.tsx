import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CreditCard, Plus } from "lucide-react";

interface CardFormProps {
  onCardAdded: () => void;
}

export const CardForm = ({ onCardAdded }: CardFormProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [cardData, setCardData] = useState({
    name: "",
    card_type: "",
    last_four_digits: "",
    credit_limit: "",
    current_balance: "",
    currency: "BRL",
    due_date: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
        const { error } = await supabase
          .from("cards")
          .insert({
            user_id: user.id,
            owner_user: user.email || "user1",
            name: cardData.name,
            card_type: cardData.card_type as "credit" | "debit",
            last_four_digits: cardData.last_four_digits,
            credit_limit: cardData.credit_limit ? parseFloat(cardData.credit_limit) : null,
            current_balance: parseFloat(cardData.current_balance) || 0,
            currency: cardData.currency as "BRL" | "USD" | "EUR",
            due_date: cardData.due_date ? parseInt(cardData.due_date) : null
          });

      if (error) throw error;

      toast.success("Cartão adicionado com sucesso!");
      setCardData({
        name: "",
        card_type: "",
        last_four_digits: "",
        credit_limit: "",
        current_balance: "",
        currency: "BRL",
        due_date: ""
      });
      onCardAdded();
    } catch (error) {
      console.error("Error adding card:", error);
      toast.error("Erro ao adicionar cartão");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Plus className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Adicionar Cartão</h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Nome do Cartão</Label>
            <Input
              id="name"
              value={cardData.name}
              onChange={(e) => setCardData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Ex: Cartão Principal"
              required
            />
          </div>

          <div>
            <Label htmlFor="card_type">Tipo do Cartão</Label>
            <Select 
              value={cardData.card_type} 
              onValueChange={(value) => setCardData(prev => ({ ...prev, card_type: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="credit">Crédito</SelectItem>
                <SelectItem value="debit">Débito</SelectItem>
                
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="last_four_digits">Últimos 4 Dígitos</Label>
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
                <Label htmlFor="credit_limit">Limite de Crédito</Label>
                <Input
                  id="credit_limit"
                  type="number"
                  step="0.01"
                  value={cardData.credit_limit}
                  onChange={(e) => setCardData(prev => ({ ...prev, credit_limit: e.target.value }))}
                  placeholder="0.00"
                />
              </div>
              
              <div>
                <Label htmlFor="due_date">Dia de Vencimento</Label>
                <Select 
                  value={cardData.due_date} 
                  onValueChange={(value) => setCardData(prev => ({ ...prev, due_date: value }))}
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
            </>
          )}

          <div>
            <Label htmlFor="current_balance">Saldo Atual</Label>
            <Input
              id="current_balance"
              type="number"
              step="0.01"
              value={cardData.current_balance}
              onChange={(e) => setCardData(prev => ({ ...prev, current_balance: e.target.value }))}
              placeholder="0.00"
            />
          </div>

          <div>
            <Label htmlFor="currency">Moeda</Label>
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
            {loading ? "Adicionando..." : "Adicionar Cartão"}
          </Button>
        </form>
      </div>
    </Card>
  );
};