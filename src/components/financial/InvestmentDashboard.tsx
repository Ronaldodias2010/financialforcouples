import { useState, useEffect } from "react";
import { FinancialCard } from "./FinancialCard";
import { InvestmentForm } from "./InvestmentForm";
import { InvestmentList } from "./InvestmentList";
import { GoalsManager } from "./GoalsManager";
import { PortfolioChart } from "./PortfolioChart";
import { RentabilitySimulator } from "./RentabilitySimulator";
import { useLanguage } from "@/hooks/useLanguage";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, Target, PieChart, Calculator, Plus, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useCurrencyConverter } from "@/hooks/useCurrencyConverter";
import { useToast } from "@/hooks/use-toast";

interface Investment {
  id: string;
  name: string;
  type: string;
  amount: number;
  current_value: number;
  purchase_date: string;
  currency: string;
  is_shared: boolean;
  owner_user: string;
  broker?: string;
  notes?: string;
  goal_id?: string;
}

interface InvestmentGoal {
  id: string;
  name: string;
  description?: string;
  target_amount: number;
  current_amount: number;
  target_date?: string;
  currency: string;
}

interface PortfolioSummary {
  totalInvested: number;
  currentValue: number;
  totalReturn: number;
  returnPercentage: number;
  distributionByType: { [key: string]: number };
}

interface InvestmentDashboardProps {
  onBack: () => void;
  viewMode: "both" | "user1" | "user2";
}

export const InvestmentDashboard = ({ onBack, viewMode }: InvestmentDashboardProps) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const { convertCurrency, formatCurrency, getCurrencySymbol } = useCurrencyConverter();
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [goals, setGoals] = useState<InvestmentGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [userPreferredCurrency, setUserPreferredCurrency] = useState<string>("BRL");
  const [activeTab, setActiveTab] = useState("overview");
  const [showInvestmentForm, setShowInvestmentForm] = useState(false);

  useEffect(() => {
    if (user) {
      fetchUserPreferredCurrency();
      fetchInvestments();
      fetchGoals();
    }
  }, [user]);

  const fetchUserPreferredCurrency = async () => {
    try {
      const { data } = await supabase
        .from("profiles")
        .select("preferred_currency")
        .eq("user_id", user?.id)
        .single();
      
      if (data?.preferred_currency) {
        setUserPreferredCurrency(data.preferred_currency);
      }
    } catch (error) {
      console.error("Error fetching preferred currency:", error);
    }
  };

  const fetchInvestments = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from("investments")
        .select("*")
        .eq("user_id", user?.id);

      if (viewMode === "user1") {
        query = query.eq("owner_user", "user1");
      } else if (viewMode === "user2") {
        query = query.eq("owner_user", "user2");
      }

      const { data, error } = await query.order("created_at", { ascending: false });

      if (error) throw error;
      setInvestments(data || []);
    } catch (error) {
      console.error("Error fetching investments:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar investimentos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchGoals = async () => {
    try {
      const { data, error } = await supabase
        .from("investment_goals")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setGoals(data || []);
    } catch (error) {
      console.error("Error fetching goals:", error);
    }
  };

  const calculatePortfolioSummary = (): PortfolioSummary => {
    const summary: PortfolioSummary = {
      totalInvested: 0,
      currentValue: 0,
      totalReturn: 0,
      returnPercentage: 0,
      distributionByType: {}
    };

    investments.forEach((investment) => {
      const investedAmount = convertCurrency(investment.amount, investment.currency as any, userPreferredCurrency as any);
      const currentValue = convertCurrency(investment.current_value, investment.currency as any, userPreferredCurrency as any);

      summary.totalInvested += investedAmount;
      summary.currentValue += currentValue;
      
      // Distribuição por tipo
      if (!summary.distributionByType[investment.type]) {
        summary.distributionByType[investment.type] = 0;
      }
      summary.distributionByType[investment.type] += currentValue;
    });

    summary.totalReturn = summary.currentValue - summary.totalInvested;
    summary.returnPercentage = summary.totalInvested > 0 ? (summary.totalReturn / summary.totalInvested) * 100 : 0;

    return summary;
  };

  const portfolioSummary = calculatePortfolioSummary();

  const getTypeLabel = (type: string) => {
    const types: { [key: string]: string } = {
      'renda_fixa': 'Renda Fixa',
      'renda_variavel': 'Renda Variável',
      'cripto': 'Criptomoedas',
      'fundos': 'Fundos',
      'tesouro_direto': 'Tesouro Direto'
    };
    return types[type] || type;
  };

  const handleAddInvestment = async () => {
    await fetchInvestments();
    await fetchGoals();
    setShowInvestmentForm(false);
    toast({
      title: "Sucesso",
      description: "Investimento adicionado com sucesso!",
    });
  };

  if (showInvestmentForm) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowInvestmentForm(false)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <h2 className="text-2xl font-bold">Adicionar Investimento</h2>
        </div>
        <InvestmentForm 
          goals={goals}
          onSuccess={handleAddInvestment}
          onCancel={() => setShowInvestmentForm(false)}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={onBack}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            {t('investments.title')}
          </h1>
        </div>
        <Button onClick={() => setShowInvestmentForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          {t('investments.newInvestment')}
        </Button>
      </div>

      {/* Resumo do Portfólio */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <FinancialCard
          title={t('investments.totalInvested')}
          amount={portfolioSummary.totalInvested}
          currency={userPreferredCurrency as any}
          icon={TrendingUp}
          type="income"
        />
        <FinancialCard
          title={t('investments.currentValue')}
          amount={portfolioSummary.currentValue}
          currency={userPreferredCurrency as any}
          icon={PieChart}
          type="balance"
        />
        <FinancialCard
          title={t('investments.totalReturn')}
          amount={portfolioSummary.totalReturn}
          currency={userPreferredCurrency as any}
          icon={TrendingUp}
          type={portfolioSummary.totalReturn >= 0 ? "income" : "expense"}
        />
        <FinancialCard
          title={t('investments.returnPercentage')}
          amount={portfolioSummary.returnPercentage}
          currency={"BRL" as any}
          icon={Calculator}
          type={portfolioSummary.returnPercentage >= 0 ? "income" : "expense"}
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">{t('investments.overview')}</TabsTrigger>
          <TabsTrigger value="investments">{t('investments.title')}</TabsTrigger>
          <TabsTrigger value="goals">{t('investments.goals')}</TabsTrigger>
          <TabsTrigger value="charts">{t('investments.portfolioChart')}</TabsTrigger>
          <TabsTrigger value="simulator">{t('investments.profitabilitySimulator')}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  {t('investments.distribution')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {Object.keys(portfolioSummary.distributionByType).length > 0 ? (
                  <div className="space-y-3">
                    {Object.entries(portfolioSummary.distributionByType).map(([type, value]) => {
                      const percentage = ((value / portfolioSummary.currentValue) * 100).toFixed(1);
                      return (
                        <div key={type} className="flex justify-between items-center">
                          <span className="font-medium">{getTypeLabel(type)}</span>
                          <div className="text-right">
                            <div className="font-semibold">
                              {formatCurrency(value, userPreferredCurrency as any)}
                            </div>
                            <div className="text-sm text-muted-foreground">{percentage}%</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    Nenhum investimento encontrado. Adicione seu primeiro investimento!
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  {t('investments.activeGoals')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {goals.length > 0 ? (
                  <div className="space-y-4">
                    {goals.slice(0, 3).map((goal) => {
                      const progress = goal.target_amount > 0 ? (goal.current_amount / goal.target_amount) * 100 : 0;
                      return (
                        <div key={goal.id} className="space-y-2">
                          <div className="flex justify-between">
                            <span className="font-medium">{goal.name}</span>
                            <span className="text-sm text-muted-foreground">
                              {progress.toFixed(1)}%
                            </span>
                          </div>
                          <div className="w-full bg-secondary rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full transition-all duration-300"
                              style={{ width: `${Math.min(progress, 100)}%` }}
                            />
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatCurrency(goal.current_amount, goal.currency as any)} / {formatCurrency(goal.target_amount, goal.currency as any)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    Nenhum objetivo definido ainda.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="investments">
          <InvestmentList 
            investments={investments} 
            goals={goals}
            onRefresh={fetchInvestments}
            userPreferredCurrency={userPreferredCurrency}
          />
        </TabsContent>

        <TabsContent value="goals">
          <GoalsManager 
            goals={goals}
            onRefresh={fetchGoals}
            userPreferredCurrency={userPreferredCurrency}
          />
        </TabsContent>

        <TabsContent value="charts">
          <PortfolioChart 
            investments={investments}
            userPreferredCurrency={userPreferredCurrency}
          />
        </TabsContent>

        <TabsContent value="simulator">
          <RentabilitySimulator 
            userPreferredCurrency={userPreferredCurrency}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};