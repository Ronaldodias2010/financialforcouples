import { useState, useEffect } from "react";
import { FinancialCard } from "./FinancialCard";
import { TransactionForm } from "./TransactionForm";
import { UserExpenseChart } from "./UserExpenseChart";
import { MonthlyExpensesView } from "./MonthlyExpensesView";
import { CategoryManager } from "./CategoryManager";
import { RecurringExpensesManager } from "./RecurringExpensesManager";
import { CardsPage } from "@/pages/CardsPage";
import { AccountsPage } from "@/pages/AccountsPage";
import { UserProfilePage } from "@/pages/UserProfilePage";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { Button } from "@/components/ui/button";
import { Wallet, TrendingUp, TrendingDown, CreditCard, User, Settings } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";

interface Transaction {
  id: string;
  type: "income" | "expense";
  amount: number;
  description: string;
  category_id: string;
  subcategory?: string;
  transaction_date: Date;
  payment_method: "cash" | "credit_card" | "debit_card";
  card_id?: string;
  user_id: string;
}

export const FinancialDashboard = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [currentPage, setCurrentPage] = useState<"dashboard" | "cards" | "accounts" | "profile">("dashboard");
  const [userDisplayName, setUserDisplayName] = useState<string>("");
  const [secondUserName, setSecondUserName] = useState<string>("");
  const [viewMode, setViewMode] = useState<"both" | "user1" | "user2">("both");
  const currentUser = "user1"; // Fixed to user1 (logged user)

  useEffect(() => {
    if (user) {
      fetchUserProfile();
    }
  }, [user]);

  const fetchUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("display_name, second_user_name")
        .eq("user_id", user?.id)
        .maybeSingle();

      if (data) {
        if (data.display_name) {
          setUserDisplayName(data.display_name);
        }
        if (data.second_user_name) {
          setSecondUserName(data.second_user_name);
        }
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const handleAddTransaction = (transaction: Transaction) => {
    // Transaction is now handled directly in the form component
    // Refresh can be handled via useEffect in child components
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
        <UserProfilePage onBack={() => setCurrentPage("dashboard")} />
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
                amount={3500}
                icon={Wallet}
                type="balance"
                change={2.5}
              />
              <FinancialCard
                title={t('dashboard.income')}
                amount={5000}
                icon={TrendingUp}
                type="income"
                change={8.2}
              />
              <FinancialCard
                title={t('dashboard.expenses')}
                amount={1500}
                icon={TrendingDown}
                type="expense"
                change={-3.1}
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button 
                variant="outline" 
                className="h-20 flex flex-col gap-2"
                onClick={() => setCurrentPage("cards")}
              >
                <CreditCard className="h-6 w-6" />
                <span>{t('nav.cards')}</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col gap-2">
                <TrendingUp className="h-6 w-6" />
                <span>Investimentos</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex flex-col gap-2"
                onClick={() => setCurrentPage("accounts")}
              >
                <Wallet className="h-6 w-6" />
                <span>{t('nav.accounts')}</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex flex-col gap-2"
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