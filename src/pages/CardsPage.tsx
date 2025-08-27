import { useEffect, useMemo, useState } from "react";
import { CardForm } from "@/components/cards/CardForm";
import { CardList } from "@/components/cards/CardList";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/useLanguage";
import { ArrowLeft, CreditCard, TrendingUp, Wallet } from "lucide-react";
import { FinancialCard } from "@/components/financial/FinancialCard";
import { supabase } from "@/integrations/supabase/client";
import { usePartnerNames } from "@/hooks/usePartnerNames";
import { type CurrencyCode } from "@/hooks/useCurrencyConverter";
import { useAuth } from "@/hooks/useAuth";
import { useCouple } from "@/hooks/useCouple";
import { useCurrencyConverter } from "@/hooks/useCurrencyConverter";

interface CardsPageProps {
  onBack: () => void;
}

interface CardRow {
  id?: string;
  user_id: string;
  owner_user: "user1" | "user2" | null;
  card_type: "credit" | "debit" | null;
  currency: CurrencyCode | null;
  credit_limit: number | null;
  current_balance: number | null;
  initial_balance_original: number | null;
  initial_balance: number | null;
}

export const CardsPage = ({ onBack }: CardsPageProps) => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { t } = useLanguage();
  const { names } = usePartnerNames();
  const { convertCurrency } = useCurrencyConverter();
  
  const [viewMode, setViewMode] = useState<"both" | "user1" | "user2">("both");
  const [cardsData, setCardsData] = useState<CardRow[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const displayCurrency: CurrencyCode = "BRL";

  const { user } = useAuth();
  const { getPartnerUserId, isUserOne } = useCouple();
  const partnerId = getPartnerUserId();

  const computeAvailable = (c: CardRow) => {
    if (c.card_type !== "credit") return 0;
    
    // initial_balance já representa o limite disponível calculado pelo trigger
    // (credit_limit - initial_balance_original - gastos_realizados)
    const availableLimit = Number(c.initial_balance ?? 0);
    
    console.log(`Card available limit calculation:`, {
      cardType: c.card_type,
      currency: c.currency,
      availableLimit,
      userId: c.user_id
    });

    // Sempre converter para BRL para somatório e exibição
    if (c.currency && c.currency !== "BRL") {
      const convertedValue = convertCurrency(availableLimit, c.currency as CurrencyCode, "BRL");
      console.log(`Converting ${availableLimit} ${c.currency} to BRL: ${convertedValue}`);
      return convertedValue;
    }

    return availableLimit;
  };

  const computeTotalLimit = (c: CardRow) => {
    if (c.card_type !== "credit") return 0;
    const totalLimit = Number(c.credit_limit ?? 0);
    
    if (c.currency && c.currency !== "BRL") {
      return convertCurrency(totalLimit, c.currency as CurrencyCode, "BRL");
    }
    
    return totalLimit;
  };

  useEffect(() => {
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
    const { data, error } = await supabase
      .from("cards")
      .select("user_id, owner_user, card_type, credit_limit, currency, current_balance, initial_balance_original, initial_balance")
      .eq("card_type", "credit"); // Apenas cartões de crédito para o cálculo de limite disponível
    if (!error && data) {
      console.log("Cards data from DB:", data); // Debug para verificar os valores
      setCardsData(
        data.map((c) => ({
          user_id: (c as any).user_id as string,
          owner_user: (c as any).owner_user as ("user1" | "user2" | null),
          card_type: (c as any).card_type as ("credit" | "debit" | null),
          currency: ((c as any).currency as CurrencyCode) ?? "BRL",
          credit_limit: (c as any).credit_limit !== null ? Number((c as any).credit_limit) : null,
          current_balance: Number((c as any).current_balance ?? 0),
          initial_balance_original: (c as any).initial_balance_original !== null ? Number((c as any).initial_balance_original) : null,
          initial_balance: (c as any).initial_balance !== null && (c as any).initial_balance !== undefined ? Number((c as any).initial_balance) : null,
        }))
      );
    }
  };

    if (user) {
      fetchUserProfile();
      fetchCards();
    }
  }, [refreshTrigger, user]);

  const currentUserTotal = useMemo(() => {
    if (!user?.id) return 0;
    const mine = cardsData.filter(c => c.user_id === user.id);
    const total = mine.reduce((sum, c) => sum + computeAvailable(c), 0);
    console.log(`Current User (${user.id}) cards:`, mine.map(c => ({
      user_id: c.user_id,
      currency: c.currency,
      initial_balance: c.initial_balance,
      converted: computeAvailable(c)
    })));
    console.log(`Current User Total: R$ ${total}`);
    return total;
  }, [cardsData, user?.id]);

  const partnerTotal = useMemo(() => {
    if (!partnerId) return 0;
    const theirs = cardsData.filter(c => c.user_id === partnerId);
    const total = theirs.reduce((sum, c) => sum + computeAvailable(c), 0);
    console.log(`Partner User (${partnerId}) cards:`, theirs.map(c => ({
      user_id: c.user_id,
      currency: c.currency,
      initial_balance: c.initial_balance,
      converted: computeAvailable(c)
    })));
    console.log(`Partner Total: R$ ${total}`);
    return total;
  }, [cardsData, partnerId]);

  const bothTotal = useMemo(() => {
    const total = currentUserTotal + partnerTotal;
    console.log(`Both Total Calculation: ${currentUserTotal} + ${partnerTotal} = ${total}`);
    return total;
  }, [currentUserTotal, partnerTotal]);

  // Calcular totais diretamente por user1/user2 para garantir consistência
  const user1Total = useMemo(() => {
    if (!user?.id) return 0;
    
    // Se não há partner, user1 = usuário atual, user2 = 0
    if (!partnerId) {
      const user1Cards = cardsData.filter(c => c.user_id === user.id);
      const total = user1Cards.reduce((sum, c) => sum + computeAvailable(c), 0);
      console.log(`User1 (no couple, ${user.id}) total: R$ ${total}`);
      return total;
    }
    
    // Identificar quem é user1 baseado na relação do casal
    const user1Id = isUserOne() ? user.id : partnerId;
    const user1Cards = cardsData.filter(c => c.user_id === user1Id);
    const total = user1Cards.reduce((sum, c) => sum + computeAvailable(c), 0);
    
    console.log(`User1 (${user1Id}) total: R$ ${total}`);
    return total;
  }, [cardsData, user?.id, partnerId, isUserOne]);

  const user2Total = useMemo(() => {
    if (!user?.id) return 0;
    
    // Se não há partner, user2 = 0
    if (!partnerId) {
      console.log(`User2 (no couple) total: R$ 0`);
      return 0;
    }
    
    // Identificar quem é user2 baseado na relação do casal
    const user2Id = isUserOne() ? partnerId : user.id;
    const user2Cards = cardsData.filter(c => c.user_id === user2Id);
    const total = user2Cards.reduce((sum, c) => sum + computeAvailable(c), 0);
    
    console.log(`User2 (${user2Id}) total: R$ ${total}`);
    return total;
  }, [cardsData, user?.id, partnerId, isUserOne]);

  // Total Limit calculations
  const currentUserTotalLimit = useMemo(() => {
    if (!user?.id) return 0;
    const mine = cardsData.filter(c => c.user_id === user.id);
    return mine.reduce((sum, c) => sum + computeTotalLimit(c), 0);
  }, [cardsData, user?.id]);

  const partnerTotalLimit = useMemo(() => {
    if (!partnerId) return 0;
    const theirs = cardsData.filter(c => c.user_id === partnerId);
    return theirs.reduce((sum, c) => sum + computeTotalLimit(c), 0);
  }, [cardsData, partnerId]);

  const bothTotalLimit = useMemo(() => {
    return currentUserTotalLimit + partnerTotalLimit;
  }, [currentUserTotalLimit, partnerTotalLimit]);

  const user1TotalLimit = useMemo(() => {
    if (!user?.id) return 0;
    
    // Se não há partner, user1 = usuário atual
    if (!partnerId) {
      const user1Cards = cardsData.filter(c => c.user_id === user.id);
      return user1Cards.reduce((sum, c) => sum + computeTotalLimit(c), 0);
    }
    
    const user1Id = isUserOne() ? user.id : partnerId;
    const user1Cards = cardsData.filter(c => c.user_id === user1Id);
    return user1Cards.reduce((sum, c) => sum + computeTotalLimit(c), 0);
  }, [cardsData, user?.id, partnerId, isUserOne]);

  const user2TotalLimit = useMemo(() => {
    if (!user?.id) return 0;
    
    // Se não há partner, user2 = 0
    if (!partnerId) return 0;
    
    const user2Id = isUserOne() ? partnerId : user.id;
    const user2Cards = cardsData.filter(c => c.user_id === user2Id);
    return user2Cards.reduce((sum, c) => sum + computeTotalLimit(c), 0);
  }, [cardsData, user?.id, partnerId, isUserOne]);

  // Used Limit calculations (Total - Available)
  const currentUserUsedLimit = currentUserTotalLimit - currentUserTotal;
  const partnerUsedLimit = partnerTotalLimit - partnerTotal;
  const bothUsedLimit = bothTotalLimit - bothTotal;
  const user1UsedLimit = user1TotalLimit - user1Total;
  const user2UsedLimit = user2TotalLimit - user2Total;

  const handleCardAdded = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const getUserLabel = (which: "user1" | "user2") =>
    which === "user1" ? (names.user1Name || t("dashboard.user1")) : (names.user2Name || t("dashboard.user2"));

  const getDisplayCurrency = () => {
    return displayCurrency; // Sempre BRL
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('back')}
        </Button>
        <h1 className="text-3xl font-bold">{t('cards.manage')}</h1>
      </div>

      {/* View selector + summary card (Limite disponível) */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{t('dashboard.viewMode')}:</span>
          <div className="flex gap-2">
            <Button variant={viewMode === 'both' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('both')}>
              {t('dashboard.both')}
            </Button>
            <Button variant={viewMode === 'user1' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('user1')}>
              {getUserLabel('user1')}
            </Button>
            <Button variant={viewMode === 'user2' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('user2')}>
              {getUserLabel('user2')}
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {viewMode === 'both' ? (
            <>
              <FinancialCard
                title={t('cards.totalLimit') + " — Ambos"}
                amount={bothTotalLimit}
                currency={getDisplayCurrency()}
                icon={CreditCard}
                type="balance"
              />
              <FinancialCard
                title={t('cards.usedLimit') + " — Ambos"}
                amount={bothUsedLimit}
                currency={getDisplayCurrency()}
                icon={TrendingUp}
                type="expense"
              />
              <FinancialCard
                title={t('cards.availableLimit') + " — Ambos"}
                amount={bothTotal}
                currency={getDisplayCurrency()}
                icon={Wallet}
                type="income"
              />
            </>
          ) : (
            <>
              <FinancialCard
                title={`${t('cards.totalLimit')} — ${getUserLabel(viewMode)}`}
                amount={viewMode === 'user1' ? user1TotalLimit : user2TotalLimit}
                currency={getDisplayCurrency()}
                icon={CreditCard}
                type="balance"
              />
              <FinancialCard
                title={`${t('cards.usedLimit')} — ${getUserLabel(viewMode)}`}
                amount={viewMode === 'user1' ? user1UsedLimit : user2UsedLimit}
                currency={getDisplayCurrency()}
                icon={TrendingUp}
                type="expense"
              />
              <FinancialCard
                title={`${t('cards.availableLimit')} — ${getUserLabel(viewMode)}`}
                amount={viewMode === 'user1' ? user1Total : user2Total}
                currency={getDisplayCurrency()}
                icon={Wallet}
                type="income"
              />
            </>
          )}
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <CardForm onCardAdded={handleCardAdded} />
        <CardList refreshTrigger={refreshTrigger} />
      </div>
    </div>
  );
};