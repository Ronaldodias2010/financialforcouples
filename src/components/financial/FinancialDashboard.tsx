import { useState, useEffect } from "react";
import { FinancialCard } from "./FinancialCard";
import { TransactionForm } from "./TransactionForm";
import { UserExpenseChart } from "./UserExpenseChart";
import { MonthlyExpensesView } from "./MonthlyExpensesView";
import { MonthlyIncomeView } from "./MonthlyIncomeView";
import { CategoryManager } from "./CategoryManager";
import { RecurringExpensesManager } from "./RecurringExpensesManager";
import { ExpensesPieChart } from "./ExpensesPieChart";
import { InvestmentDashboard } from "./InvestmentDashboard";
import { MileageSystem } from "./MileageSystem";
import { CardsPage } from "@/pages/CardsPage";
import { AccountsPage } from "@/pages/AccountsPage";
import { UserProfilePage } from "@/pages/UserProfilePage";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
// TEMPORARIAMENTE REMOVIDO: import { ThemeSwitcher } from "@/components/ui/theme-switcher";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wallet, TrendingUp, TrendingDown, CreditCard, User, Settings, Plane } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";
import { useFinancialData } from "@/hooks/useFinancialData";
import { useCouple } from "@/hooks/useCouple";
import { usePartnerNames } from "@/hooks/usePartnerNames";
import { PremiumFeatureGuard } from "@/components/subscription/PremiumFeatureGuard";
import { useSubscription } from "@/hooks/useSubscription";
import { UserInviteCard } from "@/components/ui/user-invite-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
interface Transaction {
  id: string;
  type: "income" | "expense";
  amount: number;
  description: string;
  category_id: string;
  subcategory?: string;
  transaction_date: Date;
  payment_method: "cash" | "deposit" | "transfer" | "debit_card" | "credit_card" | "payment_transfer";
  card_id?: string;
  user_id: string;
}

export const FinancialDashboard = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { getFinancialSummary, getFinancialComparison, userPreferredCurrency, refreshData, getAccountsIncome, getTransactionsIncome, getTransactionsExpenses } = useFinancialData();
  const { isPartOfCouple, couple, loading: coupleLoading, refreshCoupleData } = useCouple();
  const { names, loading: namesLoading } = usePartnerNames();
  const { hasAccess, checkSubscription, subscriptionTier, subscribed } = useSubscription();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [currentPage, setCurrentPage] = useState<"dashboard" | "cards" | "accounts" | "profile" | "investments" | "mileage">("dashboard");
  const [activeTabForProfile, setActiveTabForProfile] = useState<string>("");
  const [viewMode, setViewMode] = useState<"both" | "user1" | "user2">("both");
  const [financialComparison, setFinancialComparison] = useState({ incomeChange: 0, expenseChange: 0, balanceChange: 0 });
  const currentUser = "user1"; // Fixed to user1 (logged user)
  
  const financialSummary = getFinancialSummary(viewMode);
  const accountsIncome = getAccountsIncome(viewMode);
  const formatCurrency = (value: number) => {
    try {
      return new Intl.NumberFormat(undefined, { style: 'currency', currency: financialSummary.currency }).format(value);
    } catch {
      return value.toFixed(2);
    }
  };

  useEffect(() => {
    if (user) {
      loadFinancialComparison();
    }
  }, [user, viewMode]);

  // Real-time synchronization for unified dashboard
  useEffect(() => {
    if (!user) return;

    // Listen for real-time changes that affect dashboard sync
    const dashboardSyncChannel = supabase
      .channel('dashboard-sync')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_couples'
        },
        (payload) => {
          console.log('Dashboard sync - couple change detected:', payload);
          const data = payload.new || payload.old;
          if (data && 'user1_id' in data && 'user2_id' in data && 
              (data.user1_id === user.id || data.user2_id === user.id)) {
            refreshCoupleData();
            refreshData();
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles'
        },
        (payload) => {
          console.log('Dashboard sync - profile change detected:', payload);
          // Refresh data when any profile is updated
          refreshData();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions'
        },
        (payload) => {
          console.log('Dashboard sync - transaction change detected:', payload);
          // Immediately refresh data when transactions change
          refreshData();
          loadFinancialComparison();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(dashboardSyncChannel);
    };
  }, [user, refreshCoupleData, refreshData]);

  const loadFinancialComparison = async () => {
    const comparison = await getFinancialComparison();
    setFinancialComparison(comparison);
  };
  const [onboardingStep, setOnboardingStep] = useState<0 | 1 | 2>(0);

  useEffect(() => {
    const done = typeof window !== 'undefined' && localStorage.getItem('onboarding_v1_done') === 'true';
    if (!done) setOnboardingStep(1);
  }, []);

  const handleAddTransaction = async (transaction: Transaction) => {
    // Transaction is now handled directly in the form component
    // Force immediate refresh of all data for couple synchronization
    console.log("Transação adicionada - refreshing dashboard data:", transaction);
    
    // Force refresh couple data and financial data
    await Promise.all([
      refreshData(),
      refreshCoupleData(),
      loadFinancialComparison()
    ]);
    
    console.log("Dashboard data refreshed after transaction");
  };

  const getUserLabel = (userKey: "user1" | "user2") => {
    // Always show consistent names regardless of who is viewing
    if (userKey === "user1") {
      // Always show User1 name (the creator of the couple)
      return names.user1Name && names.user1Name !== 'Usuário 1' ? names.user1Name : t('dashboard.user1');
    }
    if (userKey === "user2") {
      // Always show User2 name (the invited user) when available
      return names.user2Name && names.user2Name !== 'Usuário 2' ? names.user2Name : t('dashboard.user2');
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
                amount={getTransactionsIncome(viewMode) - getTransactionsExpenses(viewMode)}
                currency={financialSummary.currency}
                icon={Wallet}
                type="balance"
                change={financialComparison.balanceChange}
              />
              <FinancialCard
                title={t('dashboard.income')}
                amount={getTransactionsIncome(viewMode)}
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

            {/* Expenses by Category Chart */}
            <div className="w-full">
              <ExpensesPieChart viewMode={viewMode} />
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <Button 
                id="onboarding-accounts-btn"
                variant="outline" 
                className={`h-20 flex flex-col gap-2 w-full ${onboardingStep === 1 ? 'ring-4 ring-destructive ring-offset-2 ring-offset-background animate-pulse' : ''}`}
                onClick={() => setCurrentPage("accounts")}
              >
                <Wallet className="h-6 w-6" />
                <span>{t('nav.accounts')}</span>
              </Button>
              <Button 
                id="onboarding-cards-btn"
                variant="outline" 
                className={`h-20 flex flex-col gap-2 w-full ${onboardingStep === 2 ? 'ring-4 ring-destructive ring-offset-2 ring-offset-background animate-pulse' : ''}`}
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
                <PremiumFeatureGuard 
                  feature="aiMileage"
                  fallback={
                    <Button 
                      variant="outline" 
                      className="h-20 flex flex-col gap-2 w-full opacity-50 cursor-not-allowed"
                      disabled
                    >
                      <Plane className="h-6 w-6" />
                      <span>{t('nav.mileage')}</span>
                      
                    </Button>
                  }
                >
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
      case "income":
        return <MonthlyIncomeView viewMode={viewMode} />;
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
        <div className="text-center space-y-2">
          <div className="flex justify-between items-start mb-2">
            <div className="text-sm text-muted-foreground">
              👤 {user?.email} | Status: {subscribed ? 'Premium' : 'Essential'}
            </div>
            <div className="flex gap-2">
              {/* TEMPORARIAMENTE REMOVIDO: <ThemeSwitcher /> */}
              <LanguageSwitcher />
            </div>
          </div>
          {/* Logo and title close together */}
          <div className="flex flex-col items-center space-y-2">
            <img 
              src="/lovable-uploads/a3413c4f-0329-4c0f-8e9d-4a6a7447c4dd.png" 
              alt="Couples Financials" 
              className="h-40 w-40 object-contain"
            />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              {t('dashboard.title')}
            </h1>
          </div>
          <p className="text-lg text-muted-foreground">
            {t('dashboard.subtitle')}
          </p>
          
          {/* Couple Status Indicator */}
          {!coupleLoading && (
            <>
              {isPartOfCouple && couple ? (
                <div className="bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded-lg p-3 mx-auto max-w-md">
                  <div className="flex items-center justify-center gap-2 text-green-800 dark:text-green-200">
                    <span className="text-sm font-medium">
                      💚 {t('dashboard.sharedActiveBanner')}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700 rounded-lg p-3 mx-auto max-w-md">
                  <div className="flex items-center justify-center gap-2 text-blue-800 dark:text-blue-200">
                    <span className="text-sm font-medium">
                      👤 {t('dashboard.individualInviteBanner')}
                    </span>
                  </div>
                </div>
              )}
            </>
          )}
          
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
            {!isPartOfCouple && !coupleLoading && (
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
            variant={activeTab === "income" ? "default" : "ghost"}
            onClick={() => setActiveTab("income")}
            className="pb-2"
          >
            {t('nav.monthlyIncome')}
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

        {onboardingStep > 0 && currentPage === "dashboard" && activeTab === "dashboard" && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
            <Card className="max-w-lg border-destructive">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{t('onboarding.manualTitle')}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm">
                  {onboardingStep === 1
                    ? t('onboarding.step1')
                    : t('onboarding.step2')}
                </p>
                <div className="mt-4 flex justify-end gap-2">
                  <Button variant="ghost" onClick={() => { localStorage.setItem('onboarding_v1_done', 'true'); setOnboardingStep(0); }}>
                    {t('onboarding.skip')}
                  </Button>
                  {onboardingStep === 1 ? (
                    <Button onClick={() => setOnboardingStep(2)}>{t('onboarding.next')}</Button>
                  ) : (
                    <Button onClick={() => { localStorage.setItem('onboarding_v1_done', 'true'); setOnboardingStep(0); }}>{t('onboarding.finish')}</Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

      </div>
    </div>
  );
};