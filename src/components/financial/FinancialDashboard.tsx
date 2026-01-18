import { useState, useEffect } from "react";
import { FinancialCard } from "./FinancialCard";
import { TransactionForm } from "./TransactionForm";
import { UserExpenseChart } from "./UserExpenseChart";
import { MonthlyExpensesView } from "./MonthlyExpensesView";
import { MonthlyIncomeView } from "./MonthlyIncomeView";
import CategoryManager from "./CategoryManager";
import { RecurringExpensesManager } from "./RecurringExpensesManager";
import { ExpensesPieChart } from "./ExpensesPieChart";
import { AIRecommendations } from "./AIRecommendations";
import { InvestmentDashboard } from "./InvestmentDashboard";
import { MileageSystem } from "./MileageSystem";
import { SmartCardPaymentForm } from "./SmartCardPaymentForm";
import { ConverterDashboard } from "../converter/ConverterDashboard";
import { CardsPage } from "@/pages/CardsPage";
import { AccountsPage } from "@/pages/AccountsPage";
import { UserProfilePage } from "@/pages/UserProfilePage";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
// TEMPORARIAMENTE REMOVIDO: import { ThemeSwitcher } from "@/components/ui/theme-switcher";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wallet, TrendingUp, TrendingDown, CreditCard, User, Settings, Plane, RotateCcw, Brain, MessageCircle, ArrowLeftRight, Banknote, Info } from "lucide-react";
import { CashFlowDashboard } from "./CashFlowDashboard";
import { useAuth } from "@/hooks/useAuth";
import { openWhatsApp } from "@/utils/whatsapp";
import { useLanguage } from "@/hooks/useLanguage";
import { usePWA } from "@/hooks/usePWA";
import { supabase } from "@/integrations/supabase/client";
import { useFinancialData } from "@/hooks/useFinancialData";
import { useCouple } from "@/hooks/useCouple";
import { usePartnerNames } from "@/hooks/usePartnerNames";
import { PremiumFeatureGuard } from "@/components/subscription/PremiumFeatureGuard";
import { useSubscription } from "@/hooks/useSubscription";
import { UserInviteCard } from "@/components/ui/user-invite-card";
import { PremiumReminderCard } from "@/components/ui/premium-reminder-card";
import { usePremiumReminder } from "@/hooks/usePremiumReminder";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTodayFutureIncomes } from "@/hooks/useTodayFutureIncomes";
import { useTodayFutureExpenses } from "@/hooks/useTodayFutureExpenses";
import { TodayExpensesAlert } from "./future-expenses/TodayExpensesAlert";
import { EmergencyFundCard } from "./EmergencyFundCard";

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
  const { t, language } = useLanguage();
  const { getFinancialSummary, getFinancialComparison, userPreferredCurrency, refreshData, getAccountsBalance, getTransactionsIncome, getTransactionsExpenses, getTransactionsTotalOutflows } = useFinancialData();
  const { isPartOfCouple, couple, loading: coupleLoading, refreshCoupleData } = useCouple();
  const { names, loading: namesLoading } = usePartnerNames();
  const { hasAccess, checkSubscription, subscriptionTier, subscribed } = useSubscription();
  const { shouldShow: shouldShowPremiumReminder, dismissReminder } = usePremiumReminder();
  const { isInstalled } = usePWA();
  const { count: todayIncomesCount } = useTodayFutureIncomes();
  const { count: todayExpensesCount } = useTodayFutureExpenses();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [currentPage, setCurrentPage] = useState<"dashboard" | "cards" | "accounts" | "profile" | "investments" | "mileage">("dashboard");
  const [activeTabForProfile, setActiveTabForProfile] = useState<string>("");
  const [viewMode, setViewMode] = useState<"both" | "user1" | "user2">("both");
  const [financialComparison, setFinancialComparison] = useState({ incomeChange: 0, expenseChange: 0, balanceChange: 0 });
  const currentUser = "user1"; // Fixed to user1 (logged user)
  
  const financialSummary = getFinancialSummary(viewMode);
  const accountsBalance = getAccountsBalance(viewMode);
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
    if (!done) {
      setOnboardingStep(1);
      
      // Scroll to the bottom where the buttons are after a short delay
      setTimeout(() => {
        const accountsBtn = document.getElementById('onboarding-accounts-btn');
        if (accountsBtn) {
          accountsBtn.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
        }
      }, 1000);
    }
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
        <CardsPage 
          onBack={() => setCurrentPage("dashboard")} 
          onNavigateToAccounts={() => setCurrentPage("accounts")}
        />
      </div>
    );
  }

  if (currentPage === "accounts") {
    return (
      <div className="container mx-auto p-6">
        <AccountsPage 
          onBack={() => setCurrentPage("dashboard")}
          onNavigateToCards={() => setCurrentPage("cards")}
        />
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
    return <InvestmentDashboard onBack={() => {
      setCurrentPage("dashboard");
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }} viewMode={viewMode} />;
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
    console.log('🔍 [DEBUG] Active Tab:', activeTab);
    
    switch (activeTab) {
      case "dashboard":
        return (
          <>
            {/* Today Expenses Alert */}
            <TodayExpensesAlert viewMode={isPartOfCouple ? 'couple' : 'individual'} />
            
            {/* Dashboard Info Notice */}
            <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
              <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <p className="text-sm text-blue-700 dark:text-blue-300">
                {t('dashboard.infoNotice')}
              </p>
            </div>
            
            {/* Financial Cards - Dashboard Principal: TODAS as saídas de caixa */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FinancialCard
                title={t('dashboard.balance')}
                amount={getTransactionsIncome(viewMode) - getTransactionsTotalOutflows(viewMode)}
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
                amount={getTransactionsTotalOutflows(viewMode)}
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

            {/* Emergency Fund Card */}
            <EmergencyFundCard 
              monthlyExpensesAverage={getTransactionsTotalOutflows(viewMode)}
              onDepositClick={() => setCurrentPage("accounts")}
            />

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
        console.log('✅ [DEBUG] Rendering RecurringExpensesManager with viewMode:', viewMode);
        return <RecurringExpensesManager viewMode={viewMode} />;
      case "converter":
        return <ConverterDashboard />;
      case "cashFlow":
        return <CashFlowDashboard viewMode={viewMode} />;
      case "aiRecommendations":
        return <AIRecommendations />;
      case "cardPayment":
        return <SmartCardPaymentForm onPaymentSuccess={() => window.location.reload()} />;
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
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">
                👤 {user?.email} | Status: {subscribed ? 'Premium' : 'Essential'}
              </div>
              
              {/* WhatsApp Smart - Automação */}
              <div className="p-2 bg-green-500/10 border border-green-500/20 rounded-lg max-w-xs cursor-pointer hover:bg-green-500/20 transition-colors" onClick={() => openWhatsApp(language === 'pt' ? 'Olá! Gostaria de saber mais sobre o WhatsApp Smart.' : language === 'es' ? 'Hola! Me gustaría saber más sobre WhatsApp Smart.' : 'Hello! I would like to know more about WhatsApp Smart.')}>
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-green-500" />
                  <span className="text-xs text-green-400 font-medium">
                    {language === 'pt' 
                      ? 'WhatsApp Smart: (11) 98806-6403'
                      : 'WhatsApp Smart: +55(11) 98806-6403'
                    }
                  </span>
                </div>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  {language === 'pt' 
                    ? 'Envie suas despesas para nossa IA'
                    : language === 'es'
                    ? 'Envía tus gastos a nuestra IA'
                    : 'Send your expenses to our AI'
                  }
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              {/* TEMPORARIAMENTE REMOVIDO: <ThemeSwitcher /> */}
              <LanguageSwitcher />
            </div>
          </div>
          {/* Logo and title close together */}
          <div className="flex flex-col items-center space-y-2">
            <img 
              src="/lovable-uploads/1f5e0469-b056-4cf9-9583-919702fa8736.png" 
              alt="Couples Financials" 
              className="h-48 w-48 object-contain"
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
           
            {/* Premium Reminder Card */}
            {shouldShowPremiumReminder && (
              <div className="flex justify-center">
                <PremiumReminderCard
                  onDismiss={dismissReminder}
                  onUpgradeClick={() => {
                    setActiveTabForProfile("billing");
                    setCurrentPage("profile");
                  }}
                />
             </div>
           )}
           
           {/* User Controls */}
          <div className="pt-4 space-y-3">
            {/* Desktop: inline layout */}
            <div className="hidden sm:flex items-center justify-center gap-4">
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

            {/* Mobile: stacked layout */}
            <div className="sm:hidden space-y-2">
              <div className="flex items-center justify-center gap-2">
                <User className="h-4 w-4" />
                <div className="flex gap-1.5">
                  <Button
                    variant={viewMode === "both" ? "default" : "outline"}
                    size="sm"
                    className="text-xs px-2"
                    onClick={() => setViewMode("both")}
                  >
                    {t('dashboard.both')}
                  </Button>
                  <Button
                    variant={viewMode === "user1" ? "default" : "outline"}
                    size="sm"
                    className="text-xs px-2"
                    onClick={() => setViewMode("user1")}
                  >
                    {getUserLabel("user1")}
                  </Button>
                  <Button
                    variant={viewMode === "user2" ? "default" : "outline"}
                    size="sm"
                    className="text-xs px-2"
                    onClick={() => setViewMode("user2")}
                  >
                    {getUserLabel("user2")}
                  </Button>
                </div>
              </div>
              
              {/* Invite card below buttons on mobile */}
              {!isPartOfCouple && !coupleLoading && (
                <div className="flex justify-center">
                  <UserInviteCard
                    showCard={true}
                    onInviteClick={() => {
                      setActiveTabForProfile("users");
                      setCurrentPage("profile");
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b">
          <nav className="flex justify-center pb-px">
            {/* Desktop layout - single line centered */}
            <div className="hidden sm:flex space-x-8">
              {[
                { id: "dashboard", label: t('nav.dashboard'), icon: TrendingUp },
                { id: "transactions", label: t('nav.monthlyExpenses'), icon: Wallet },
                { id: "income", label: t('nav.monthlyIncome'), icon: TrendingUp },
                { id: "categories", label: t('nav.categories'), icon: Settings },
                { id: "recurring", label: t('nav.recurring'), icon: TrendingDown },
                { id: "converter", label: t('nav.converter'), icon: ArrowLeftRight },
                { id: "cashFlow", label: t('nav.cashFlow'), icon: Banknote },
                { id: "aiRecommendations", label: t('nav.aiRecommendations'), icon: Brain }
              ].map((tab) => {
                const Icon = tab.icon;
                const showBadge = tab.id === "income" && todayIncomesCount > 0;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      console.log('🖱️ [DEBUG] Clicking tab:', tab.id);
                      setActiveTab(tab.id);
                    }}
                    className={`
                      flex items-center gap-2 whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium transition-colors
                      ${activeTab === tab.id
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:border-gray-300 hover:text-gray-700"
                      }
                    `}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                    {showBadge && (
                      <Badge variant="destructive" className="ml-1 animate-pulse">
                        {todayIncomesCount}
                      </Badge>
                    )}
                  </button>
                );
              })}
            </div>
            
            {/* Mobile layout - two lines with optimized spacing */}
            <div className="sm:hidden flex flex-col gap-1 w-full">
              <div className="flex space-x-1 justify-center">
                {[
                  { id: "dashboard", label: t('nav.dashboard'), icon: TrendingUp },
                  { id: "transactions", label: t('nav.monthlyExpenses'), icon: Wallet },
                  { id: "income", label: t('nav.monthlyIncome'), icon: TrendingUp }
                ].map((tab) => {
                  const Icon = tab.icon;
                  const showBadge = tab.id === "income" && todayIncomesCount > 0;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`
                        relative flex flex-col items-center gap-0.5 border-b-2 px-2 py-1.5 text-xs font-medium transition-colors min-w-0 flex-1
                        ${activeTab === tab.id
                          ? "border-primary text-primary"
                          : "border-transparent text-muted-foreground hover:border-gray-300 hover:text-gray-700"
                        }
                      `}
                    >
                      <Icon className="h-3 w-3 shrink-0" />
                      <span className="text-[10px] leading-tight text-center truncate w-full">{t(`nav.short.${tab.id}`)}</span>
                      {showBadge && (
                        <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[8px] animate-pulse">
                          {todayIncomesCount}
                        </Badge>
                      )}
                    </button>
                  );
                })}
              </div>
              <div className="flex space-x-1 justify-center">
                {[
                  { id: "categories", label: t('nav.categories'), icon: Settings },
                  { id: "recurring", label: t('nav.recurring'), icon: TrendingDown },
                  { id: "converter", label: t('nav.converter'), icon: ArrowLeftRight },
                  { id: "cashFlow", label: t('nav.cashFlow'), icon: Banknote },
                  { id: "aiRecommendations", label: t('nav.aiRecommendations'), icon: Brain }
                ].map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        console.log('🖱️ [DEBUG] Clicking mobile tab:', tab.id);
                        setActiveTab(tab.id);
                      }}
                      className={`
                        flex flex-col items-center gap-0.5 border-b-2 px-2 py-1.5 text-xs font-medium transition-colors min-w-0 flex-1
                        ${activeTab === tab.id
                          ? "border-primary text-primary"
                          : "border-transparent text-muted-foreground hover:border-gray-300 hover:text-gray-700"
                        }
                      `}
                    >
                      <Icon className="h-3 w-3 shrink-0" />
                      <span className="text-[10px] leading-tight text-center truncate w-full">{t(`nav.short.${tab.id}`)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </nav>
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
