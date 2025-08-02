import { useState, useEffect } from "react";
import { FinancialCard } from "./FinancialCard";
import { TransactionForm } from "./TransactionForm";
import { TransactionList } from "./TransactionList";
import { CardsPage } from "@/pages/CardsPage";
import { AccountsPage } from "@/pages/AccountsPage";
import { UserProfilePage } from "@/pages/UserProfilePage";
import { Button } from "@/components/ui/button";
import { Wallet, TrendingUp, TrendingDown, CreditCard, Users, User, Settings } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface Transaction {
  id: string;
  type: "income" | "expense";
  amount: number;
  description: string;
  category: string;
  date: string;
  user: "user1" | "user2";
}

export const FinancialDashboard = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [viewMode, setViewMode] = useState<"combined" | "user1" | "user2">("combined");
  const [currentPage, setCurrentPage] = useState<"dashboard" | "cards" | "accounts" | "profile">("dashboard");
  const [userDisplayName, setUserDisplayName] = useState<string>("");

  useEffect(() => {
    if (user) {
      fetchUserProfile();
    }
  }, [user]);

  const fetchUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("user_id", user?.id)
        .single();

      if (data?.display_name) {
        setUserDisplayName(data.display_name);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const handleAddTransaction = (transaction: Transaction) => {
    setTransactions(prev => [transaction, ...prev]);
  };

  const filteredTransactions = transactions.filter(transaction => {
    if (viewMode === "combined") return true;
    return transaction.user === viewMode;
  });

  const calculateTotals = (userFilter?: "user1" | "user2") => {
    const relevantTransactions = userFilter 
      ? transactions.filter(t => t.user === userFilter)
      : transactions;

    const income = relevantTransactions
      .filter(t => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = relevantTransactions
      .filter(t => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      income,
      expenses,
      balance: income - expenses
    };
  };

  const totals = calculateTotals(viewMode === "combined" ? undefined : viewMode);

  const getUserLabel = (userKey: "user1" | "user2") => {
    if (userKey === "user1" && userDisplayName) {
      return userDisplayName;
    }
    return userKey === "user1" ? "Usuário 1" : "Usuário 2";
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

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Relationship Financial
          </h1>
          <p className="text-lg text-muted-foreground">
            Controle financeiro inteligente para casais
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex justify-center">
          <div className="flex gap-2 p-1 bg-muted rounded-lg">
            <Button
              variant={viewMode === "combined" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("combined")}
              className="flex items-center gap-2"
            >
              <Users className="h-4 w-4" />
              Combinado
            </Button>
            <Button
              variant={viewMode === "user1" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("user1")}
              className="flex items-center gap-2"
            >
              <User className="h-4 w-4" />
              {getUserLabel("user1")}
            </Button>
            <Button
              variant={viewMode === "user2" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("user2")}
              className="flex items-center gap-2"
            >
              <User className="h-4 w-4" />
              {getUserLabel("user2")}
            </Button>
          </div>
        </div>

        {/* Financial Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FinancialCard
            title="Saldo Total"
            amount={totals.balance}
            icon={Wallet}
            type="balance"
            change={2.5}
          />
          <FinancialCard
            title="Entradas"
            amount={totals.income}
            icon={TrendingUp}
            type="income"
            change={8.2}
          />
          <FinancialCard
            title="Saídas"
            amount={totals.expenses}
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

          {/* Transaction List */}
          <div>
            <TransactionList transactions={filteredTransactions} />
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
            <span>Cartões</span>
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
            <span>Contas</span>
          </Button>
          <Button 
            variant="outline" 
            className="h-20 flex flex-col gap-2"
            onClick={() => setCurrentPage("profile")}
          >
            <Settings className="h-6 w-6" />
            <span>Configurações</span>
          </Button>
        </div>

        {/* Footer */}
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            Para funcionalidades avançadas como autenticação, banco de dados e integrações,
            <br />
            conecte seu projeto ao Supabase clicando no botão verde no topo da tela.
          </p>
        </div>
      </div>
    </div>
  );
};