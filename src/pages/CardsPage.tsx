import { useEffect, useMemo, useState } from "react";
import { CardForm } from "@/components/cards/CardForm";
import { CardList } from "@/components/cards/CardList";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/useLanguage";
import { ArrowLeft, CreditCard } from "lucide-react";
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
    const value = Number(c.initial_balance ?? 0);
    
    // Convert to user's preferred currency if different
    if (userProfile?.preferred_currency && c.currency && c.currency !== userProfile.preferred_currency) {
      return convertCurrency(value, c.currency as CurrencyCode, userProfile.preferred_currency as CurrencyCode);
    }
    
    return value;
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
        .select("user_id, owner_user, card_type, credit_limit, currency, current_balance, initial_balance_original, initial_balance");
      if (!error && data) {
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
    return mine.reduce((sum, c) => sum + computeAvailable(c), 0);
  }, [cardsData, user?.id]);

  const partnerTotal = useMemo(() => {
    if (!partnerId) return 0;
    const theirs = cardsData.filter(c => c.user_id === partnerId);
    return theirs.reduce((sum, c) => sum + computeAvailable(c), 0);
  }, [cardsData, partnerId]);

  const bothTotal = useMemo(() => currentUserTotal + partnerTotal, [currentUserTotal, partnerTotal]);

  const user1Total = isUserOne() ? currentUserTotal : partnerTotal;
  const user2Total = isUserOne() ? partnerTotal : currentUserTotal;

  const handleCardAdded = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const getUserLabel = (which: "user1" | "user2") =>
    which === "user1" ? (names.user1Name || t("dashboard.user1")) : (names.user2Name || t("dashboard.user2"));

  const getDisplayCurrency = () => {
    return (userProfile?.preferred_currency as CurrencyCode) || displayCurrency;
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
        {viewMode === 'both' ? (
          <FinancialCard
            title="Seus Cartões — Ambos"
            amount={bothTotal}
            currency={getDisplayCurrency()}
            icon={CreditCard}
            type="balance"
          />
        ) : (
          <FinancialCard
            title={`Seus Cartões — ${getUserLabel(viewMode)}`}
            amount={viewMode === 'user1' ? user1Total : user2Total}
            currency={getDisplayCurrency()}
            icon={CreditCard}
            type="balance"
          />
        )}

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <CardForm onCardAdded={handleCardAdded} />
        <CardList refreshTrigger={refreshTrigger} />
      </div>
    </div>
  );
};