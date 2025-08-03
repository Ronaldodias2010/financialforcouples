import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { CreditCard, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface CardData {
  id: string;
  name: string;
  card_type: string;
  last_four_digits: string;
  credit_limit: number | null;
  current_balance: number;
  initial_balance: number | null;
  currency: string;
  due_date: number | null;
  closing_date: number | null;
  owner_user: string;
}

interface CardListProps {
  refreshTrigger: number;
}

export const CardList = ({ refreshTrigger }: CardListProps) => {
  const { user } = useAuth();
  const [cards, setCards] = useState<CardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    if (user) {
      fetchUserProfile();
      fetchCards();
    }
  }, [user, refreshTrigger]);

  const fetchUserProfile = async () => {
    if (!user) return;

    try {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      setUserProfile(profile);
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  };

  const fetchCards = async () => {
    try {
      const { data, error } = await supabase
        .from("cards")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCards(data || []);
    } catch (error) {
      console.error("Error fetching cards:", error);
      toast.error("Erro ao carregar cartões");
    } finally {
      setLoading(false);
    }
  };

  const deleteCard = async (cardId: string) => {
    try {
      const { error } = await supabase
        .from("cards")
        .delete()
        .eq("id", cardId);

      if (error) throw error;

      toast.success("Cartão removido com sucesso!");
      fetchCards();
    } catch (error) {
      console.error("Error deleting card:", error);
      toast.error("Erro ao remover cartão");
    }
  };

  const formatCurrency = (value: number, currency: string) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: currency,
    }).format(value);
  };

  const getOwnerName = (ownerUser: string) => {
    if (ownerUser === 'user1') {
      return userProfile?.display_name || 'Usuário Principal';
    } else if (ownerUser === 'user2') {
      return userProfile?.second_user_name || 'Usuário 2';
    }
    return ownerUser;
  };

  if (loading) {
    return <div>Carregando cartões...</div>;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Seus Cartões</h3>
      
      {cards.length === 0 ? (
        <Card className="p-6 text-center text-muted-foreground">
          <CreditCard className="h-12 w-12 mx-auto mb-4" />
          <p>Nenhum cartão cadastrado</p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {cards.map((card) => (
            <Card key={card.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CreditCard className="h-8 w-8 text-primary" />
                  <div>
                    <h4 className="font-semibold">{card.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {card.card_type} • ****{card.last_four_digits}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {getOwnerName(card.owner_user)}
                    </p>
                    <p className="text-sm">
                      Limite Disponível: {formatCurrency(card.initial_balance || 0, card.currency)}
                    </p>
                    {card.credit_limit && (
                      <p className="text-sm text-muted-foreground">
                        Limite: {formatCurrency(card.credit_limit, card.currency)}
                      </p>
                    )}
                    {card.closing_date && card.card_type === "credit" && (
                      <p className="text-sm text-muted-foreground">
                        Fechamento: dia {card.closing_date}
                      </p>
                    )}
                    {card.due_date && card.card_type === "credit" && (
                      <p className="text-sm text-muted-foreground">
                        Vencimento: dia {card.due_date}
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => deleteCard(card.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};