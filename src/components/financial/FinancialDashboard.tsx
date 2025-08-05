import { useState, useEffect } from "react";
import { FinancialCard } from "./FinancialCard";
import { TransactionForm } from "./TransactionForm";
import { UserExpenseChart } from "./UserExpenseChart";
import { MonthlyExpensesView } from "./MonthlyExpensesView";
import { CategoryManager } from "./CategoryManager";
import { RecurringExpensesManager } from "./RecurringExpensesManager";
import { InvestmentDashboard } from "./InvestmentDashboard";
import { MileageSystem } from "./MileageSystem";
import { CardsPage } from "@/pages/CardsPage";
import { AccountsPage } from "@/pages/AccountsPage";
import { UserProfilePage } from "@/pages/UserProfilePage";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { Button } from "@/components/ui/button";
import { Wallet, TrendingUp, TrendingDown, CreditCard, User, Settings, Plane } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";
import { useFinancialData } from "@/hooks/useFinancialData";
import { PremiumFeatureGuard } from "@/components/subscription/PremiumFeatureGuard";
import { useSubscription } from "@/hooks/useSubscription";
import { UserInviteCard } from "@/components/ui/user-invite-card";

interface Transaction {
  id: string;
  type: "income" | "expense";
  amount: number;
  description: string;
  category_id: string;
  subcategory?: string;
  transaction_date: Date;
  payment_method: "cash" | "deposit" | "transfer" | "debit_card" | "credit_card";
  card_id?: string;
  user_id: string;
}

export const FinancialDashboard = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { getFinancialSummary, getFinancialComparison, userPreferredCurrency, refreshData } = useFinancialData();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [currentPage, setCurrentPage] = useState<"dashboard" | "cards" | "accounts" | "profile" | "investments" | "mileage">("dashboard");
  const [activeTabForProfile, setActiveTabForProfile] = useState<string>("");
  const [userDisplayName, setUserDisplayName] = useState<string>("");
  const [secondUserName, setSecondUserName] = useState<string>("");
  const [viewMode, setViewMode] = useState<"both" | "user1" | "user2">("both");
  const [financialComparison, setFinancialComparison] = useState({ incomeChange: 0, expenseChange: 0, balanceChange: 0 });
  const currentUser = "user1"; // Fixed to user1 (logged user)
  
  const financialSummary = getFinancialSummary();

  useEffect(() => {
    if (user) {
      fetchUserProfile();
      loadFinancialComparison();
    }
  }, [user, financialSummary.balance, financialSummary.totalIncome, financialSummary.totalExpenses]);

  const loadFinancialComparison = async () => {
    const comparison = await getFinancialComparison();
    setFinancialComparison(comparison);
  };

  const fetchUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("user_id", user?.id)
        .maybeSingle();

      if (data?.display_name) {
        setUserDisplayName(data.display_name);
      }

      // Only show second user if there's an active couple relationship
      const { data: coupleData, error: coupleError } = await supabase
        .from("user_couples")
        .select("user1_id, user2_id")
        .or(`user1_id.eq.${user?.id},user2_id.eq.${user?.id}`)
        .eq("status", "active")
        .maybeSingle();

      if (coupleData) {
        // Get partner's ID (the other user in the couple)
        const partnerId = coupleData.user1_id === user?.id ? coupleData.user2_id : coupleData.user1_id;
        
        // Get partner's profile
        const { data: partnerData, error: partnerError } = await supabase
          .from("profiles")
          .select("display_name")
          .eq("user_id", partnerId)
          .maybeSingle();

        if (partnerData?.display_name) {
          setSecondUserName(partnerData.display_name);
        } else {
          setSecondUserName("");
        }
      } else {
        setSecondUserName("");
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const handleAddTransaction = async (transaction: Transaction) => {
    // Transaction is now handled directly in the form component
    // Refresh data after transaction is added
    console.log("Transação adicionada:", transaction);
    await refreshData();
    await loadFinancialComparison();
  };

  const getUserLabel = (userKey: "user1" | "user2") => {
    if (userKey === "user1" && userDisplayName) {
      return userDisplayName;
    }
    if (userKey === "user2" && secondUserName) {
      return secondUserName;
    }
    return userKey === "user1" ? t('dashboard.user1') : t('dashboard.user2');
  };

  if (currentPage === "cards") {
    return (
      <div className="container mx-auto p-6">
        <CardsPage onBack={() => setCurrentPage("dashboard")} />
      </div>
    );
  }

  if (currentPage === "accounts") {
    return (
      <div className="container mx-auto p-6">
        <AccountsPage onBack={() => setCurrentPage("dashboard")} />
      </div>
    );
  }

  if (currentPage === "profile") {
    return (
      <div className="container mx-auto p-6">
        <UserProfilePage 
          onBack={() => setCurrentPage("dashboard")} 
          activeTab={activeTabForProfile}
        />
      </div>
    );
  }

  if (currentPage === "investments") {
    return <InvestmentDashboard onBack={() => setCurrentPage("dashboard")} viewMode={viewMode} />;
  }

  if (currentPage === "mileage") {
    return (
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <Button variant="outline" onClick={() => setCurrentPage("dashboard")}>
            ← {t('mileage.backToDashboard')}
          </Button>
        </div>
        <MileageSystem />
      </div>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <>
            {/* Financial Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FinancialCard
                title={t('dashboard.balance')}
                amount={financialSummary.balance}
                currency={financialSummary.currency}
                icon={Wallet}
                type="balance"
                change={financialComparison.balanceChange}
              />
              <FinancialCard
                title={t('dashboard.income')}
                amount={financialSummary.totalIncome}
                currency={financialSummary.currency}
                icon={TrendingUp}
                type="income"
                change={financialComparison.incomeChange}
              />
              <FinancialCard
                title={t('dashboard.expenses')}
                amount={financialSummary.totalExpenses}
                currency={financialSummary.currency}
                icon={TrendingDown}
                type="expense"
                change={financialComparison.expenseChange}
              />
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Transaction Form */}
              <div>
                <TransactionForm onSubmit={handleAddTransaction} />
              </div>
              
              {/* User Expense Comparison Chart */}
              <div>
                <UserExpenseChart />
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <Button 
                variant="outline" 
                className="h-20 flex flex-col gap-2 w-full"
                onClick={() => setCurrentPage("accounts")}
              >
                <Wallet className="h-6 w-6" />
                <span>{t('nav.accounts')}</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex flex-col gap-2 w-full"
                onClick={() => setCurrentPage("cards")}
              >
                <CreditCard className="h-6 w-6" />
                <span>{t('nav.cards')}</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex flex-col gap-2 w-full"
                onClick={() => setCurrentPage("investments")}
              >
                <TrendingUp className="h-6 w-6" />
                <span>{t('nav.investments')}</span>
              </Button>
              <div className="w-full">
                <PremiumFeatureGuard feature="aiMileage">
                  <Button 
                    variant="outline" 
                    className="h-20 flex flex-col gap-2 w-full"
                    onClick={() => setCurrentPage("mileage")}
                  >
                    <Plane className="h-6 w-6" />
                    <span>{t('nav.mileage')}</span>
                  </Button>
                </PremiumFeatureGuard>
              </div>
              <Button 
                variant="outline" 
                className="h-20 flex flex-col gap-2 w-full"
                onClick={() => setCurrentPage("profile")}
              >
                <Settings className="h-6 w-6" />
                <span>{t('nav.profile')}</span>
              </Button>
            </div>
          </>
        );
      case "transactions":
        return <MonthlyExpensesView viewMode={viewMode} />;
      case "categories":
        return <CategoryManager />;
      case "recurring":
        return <RecurringExpensesManager />;
      case "investments":
        return (
          <div className="text-center py-8">
            <h2 className="text-2xl font-bold mb-4">🎉 Módulo de Investimentos Criado!</h2>
            <p className="text-muted-foreground mb-4">
              Todas as funcionalidades foram implementadas com sucesso
            </p>
            <Button 
              onClick={() => setCurrentPage("investments")}
              className="bg-gradient-to-r from-green-500 to-blue-500 text-white"
            >
              Acessar Módulo de Investimentos
            </Button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-between items-start mb-4">
            <div></div>
            <LanguageSwitcher />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            {t('dashboard.title')}
          </h1>
          <p className="text-lg text-muted-foreground">
            {t('dashboard.subtitle')}
          </p>
          
          {/* User Controls */}
          <div className="flex items-center justify-center gap-4 pt-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="text-sm font-medium">{t('dashboard.viewMode')}:</span>
              <div className="flex gap-2">
                <Button
                  variant={viewMode === "both" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("both")}
                >
                  {t('dashboard.both')}
                </Button>
                <Button
                  variant={viewMode === "user1" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("user1")}
                >
                  {getUserLabel("user1")}
                </Button>
                <Button
                  variant={viewMode === "user2" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("user2")}
                >
                  {getUserLabel("user2")}
                </Button>
              </div>
              {getUserLabel("user2") === t('dashboard.user2') && (
                <UserInviteCard
                  showCard={true}
                  onInviteClick={() => {
                    setActiveTabForProfile("users");
                    setCurrentPage("profile");
                  }}
                />
              )}
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex justify-center gap-4 border-b">
          <Button
            variant={activeTab === "dashboard" ? "default" : "ghost"}
            onClick={() => setActiveTab("dashboard")}
            className="pb-2"
          >
            {t('nav.dashboard')}
          </Button>
          <Button
            variant={activeTab === "transactions" ? "default" : "ghost"}
            onClick={() => setActiveTab("transactions")}
            className="pb-2"
          >
            {t('nav.monthlyExpenses')}
          </Button>
          <Button
            variant={activeTab === "categories" ? "default" : "ghost"}
            onClick={() => setActiveTab("categories")}
            className="pb-2"
          >
            {t('nav.categories')}
          </Button>
          <Button
            variant={activeTab === "recurring" ? "default" : "ghost"}
            onClick={() => setActiveTab("recurring")}
            className="pb-2"
          >
            {t('nav.recurring')}
          </Button>
        </div>

        {renderTabContent()}

      </div>
    </div>
  );
};