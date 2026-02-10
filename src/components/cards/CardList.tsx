import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useAuth } from "@/hooks/useAuth";
import { useCouple } from "@/hooks/useCouple";
import { usePartnerNames } from "@/hooks/usePartnerNames";
import { useCurrencyConverter, type CurrencyCode } from "@/hooks/useCurrencyConverter";
import { supabase } from "@/integrations/supabase/client";
import { CreditCard, Trash2, Edit, Info } from "lucide-react";
import { toast } from "sonner";
import { CardEditForm } from "./CardEditForm";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/hooks/useLanguage";

interface CardData {
  id: string;
  user_id: string;
  name: string;
  card_type: "credit" | "debit";
  last_four_digits: string;
  credit_limit: number | null;
  current_balance: number;
  initial_balance: number | null;
  initial_balance_original: number | null;
  currency: string;
  due_date: number | null;
  closing_date: number | null;
  owner_user: string;
  account_id: string | null;
}

interface CardListProps {
  refreshTrigger: number;
}

export const CardList = ({ refreshTrigger }: CardListProps) => {
  const { user } = useAuth();
  const { couple, isPartOfCouple } = useCouple();
  const { names } = usePartnerNames();
  const { convertCurrency, formatCurrency: currencyFormat } = useCurrencyConverter();
  const { t } = useLanguage();
  const [cards, setCards] = useState<CardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [accounts, setAccounts] = useState<Record<string, string>>({});
  const [editingCard, setEditingCard] = useState<CardData | null>(null);

  useEffect(() => {
    if (user) {
      fetchUserProfile();
      fetchCards();
      fetchAccounts();
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

  const fetchAccounts = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("accounts")
        .select("id, name")
        .eq("user_id", user.id);

      if (error) throw error;
      
      const accountMap: Record<string, string> = {};
      data?.forEach(account => {
        accountMap[account.id] = account.name;
      });
      setAccounts(accountMap);
    } catch (error) {
      console.error("Error fetching accounts:", error);
    }
  };

  const fetchCards = async () => {
    try {
      const { data, error } = await supabase
        .from("cards")
        .select("*, accounts(name)")
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

  const handleEditSuccess = () => {
    fetchCards(); // Refresh the cards list to show updated data
    setEditingCard(null);
  };

  const handleEditCancel = () => {
    setEditingCard(null);
  };

  const formatCurrency = (value: number, currency: string) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: currency,
    }).format(value);
  };

  const getConvertedValue = (value: number, cardCurrency: string) => {
    if (!userProfile?.preferred_currency) return value;
    
    const preferredCurrency = userProfile.preferred_currency as CurrencyCode;
    const cardCurrencyCode = cardCurrency as CurrencyCode;
    
    if (cardCurrencyCode === preferredCurrency) return value;
    
    return convertCurrency(value, cardCurrencyCode, preferredCurrency);
  };

  const getDisplayCurrency = (cardCurrency: string) => {
    return userProfile?.preferred_currency || cardCurrency;
  };

// Logos de bancos para cartões
const bankLogos: Record<string, string> = {
  nubank: "/banks/nubank.svg",
  itau: "/banks/itau.svg",
  bradesco: "/banks/bradesco.svg",
  bancodobrasil: "/banks/banco-do-brasil.svg",
  santander: "/banks/santander.svg",
  inter: "/banks/inter.svg",
  c6: "/banks/c6bank.svg",
  caixa: "/banks/caixa.svg",
  sicredi: "/banks/sicredi.png",
  bankofamerica: "/banks/bank-of-america.svg",
  mercadopago: "/lovable-uploads/b5dc9fff-ca93-4a0b-89a9-43e807cb1f7c.png",
  chase: "/banks/chase.svg",
  wellsfargo: "/banks/wells-fargo.svg",
  avenue: "/banks/avenue.svg",
  capitalone: "/banks/capital-one.svg",
};

const detectBankKey = (name: string): keyof typeof bankLogos | null => {
  const n = name.toLowerCase();
  if (n.includes("nubank") || n.includes("nu ") || n.includes("nuconta") || n.includes("nu conta")) return "nubank";
  if (n.includes("itaú") || n.includes("itau")) return "itau";
  if (n.includes("bradesco")) return "bradesco";
  if (n.includes("banco do brasil") || n === "bb" || n.includes("bb ")) return "bancodobrasil";
  if (n.includes("santander")) return "santander";
  if (n.includes("inter")) return "inter";
  if (n.includes("c6")) return "c6";
  if (n.includes("caixa") || n.includes("cef")) return "caixa";
  if (n.includes("sicredi")) return "sicredi";
  if (n.includes("bank of america") || n.includes("bofa") || n.includes("boa") || n === "boa") return "bankofamerica";
  if (n.includes("mercado pago") || n.includes("mercadopago")) return "mercadopago";
  if (n.includes("chase")) return "chase";
  if (n.includes("wells fargo") || n.includes("weels fargo") || n.includes("wells")) return "wellsfargo";
  if (n.includes("avenue")) return "avenue";
  if (n.includes("capital one") || n.includes("capitalone")) return "capitalone";
  return null;
};

const getBankLogo = (name: string): string | null => {
  const key = detectBankKey(name);
  return key ? bankLogos[key] : null;
};

const getOwnerNameForCard = (card: CardData) => {
  if (isPartOfCouple && couple) {
    return card.user_id === couple.user1_id
      ? (names.user1Name || 'Usuário 1')
      : (names.user2Name || 'Usuário 2');
  }
  return names.currentUserName || 'Usuário Principal';
};

  if (loading) {
    return <div>Carregando cartões...</div>;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">{t('cards.yourCards')}</h3>
      
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
{(() => {
                    const logo = getBankLogo(card.name);
                    return logo ? (
                      <img src={logo} alt={`Logo do ${card.name}`} className="h-8 w-8 rounded-sm object-contain" loading="lazy" />
                    ) : (
                      <CreditCard className="h-8 w-8 text-primary" />
                    );
                  })()}
                  <div>
                    <h4 className="font-semibold">{card.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {card.card_type} • ****{card.last_four_digits}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {getOwnerNameForCard(card)}
                    </p>
                    {card.card_type === "debit" && card.account_id && (
                      <p className="text-sm text-muted-foreground">
                        Conta: {accounts[card.account_id] || "Conta não encontrada"}
                      </p>
                    )}
                    {card.credit_limit && (
                      <p className="text-sm text-muted-foreground">
                        Limite: {formatCurrency(getConvertedValue(card.credit_limit, card.currency), getDisplayCurrency(card.currency))}
                        {card.currency !== getDisplayCurrency(card.currency) && (
                          <span className="text-xs text-muted-foreground ml-1">
                            (orig: {formatCurrency(card.credit_limit, card.currency)})
                          </span>
                        )}
                      </p>
                    )}
                    {card.card_type === "credit" && card.credit_limit && (
                      (() => {
                        // Limite disponível = initial_balance (informado pelo usuário) - current_balance (gastos acumulados)
                        const availableLimit = (card.initial_balance ?? card.credit_limit) - (card.current_balance ?? 0);
                        return (
                          <p className={cn(
                            "text-sm",
                            availableLimit < 0 ? "text-destructive font-semibold" : ""
                          )}>
                            Limite Disponível: {formatCurrency(getConvertedValue(availableLimit, card.currency), getDisplayCurrency(card.currency))}
                            {card.currency !== getDisplayCurrency(card.currency) && (
                              <span className="text-xs text-muted-foreground ml-1">
                                (orig: {formatCurrency(availableLimit, card.currency)})
                              </span>
                            )}
                          </p>
                        );
                      })()
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
                <div className="flex items-center gap-2">
                  {card.card_type === "credit" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingCard(card)}
                      title="Editar cartão"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        title="Excluir cartão"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja excluir o cartão "{card.name}"? Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => deleteCard(card.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Nota explicativa sobre pagamentos de cartão */}
      <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 text-muted-foreground text-sm">
        <Info className="h-4 w-4 mt-0.5 shrink-0" />
        <p>{t('cards.paymentNote')}</p>
      </div>

      <CardEditForm
        card={editingCard}
        isOpen={!!editingCard}
        onClose={handleEditCancel}
        onSuccess={handleEditSuccess}
      />
    </div>
  );
};