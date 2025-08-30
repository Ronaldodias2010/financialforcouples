import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { useCouple } from "@/hooks/useCouple";
import { usePartnerNames } from "@/hooks/usePartnerNames";
import { useCurrencyConverter, type CurrencyCode } from "@/hooks/useCurrencyConverter";
import { supabase } from "@/integrations/supabase/client";
import { Plane, CreditCard, Target, TrendingUp, Calendar, Plus, Edit, Trash2, User } from "lucide-react";
import { PromotionsSection } from './PromotionsSection';
import { format } from "date-fns";

interface Card {
  id: string;
  name: string;
  card_type: string;
  user_id?: string;
}

interface MileageRule {
  id: string;
  user_id?: string;
  card_id: string;
  bank_name: string;
  card_brand: string;
  miles_per_amount: number;
  amount_threshold: number;
  currency: string;
  is_active: boolean;
  existing_miles?: number;
  card?: Card;
}

interface MileageGoal {
  id: string;
  user_id: string;
  name: string;
  description: string;
  target_miles: number;
  current_miles: number;
  target_date: string;
  is_completed: boolean;
  source_card_id?: string;
}

interface MileageHistory {
  id: string;
  user_id: string;
  card_id: string;
  amount_spent: number;
  miles_earned: number;
  calculation_date: string;
  month_year: string;
  transaction_id?: string;
  card?: Card;
  rule?: { currency: string; miles_per_amount: number; amount_threshold: number };
}

export const MileageSystem = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const { couple, isPartOfCouple, getPartnerUserId } = useCouple();
  const { names } = usePartnerNames();
  const { convertCurrency, getCurrencySymbol } = useCurrencyConverter();
  
  const [cards, setCards] = useState<Card[]>([]);
  const [mileageRules, setMileageRules] = useState<MileageRule[]>([]);
  const [mileageGoals, setMileageGoals] = useState<MileageGoal[]>([]);
  const [mileageHistory, setMileageHistory] = useState<MileageHistory[]>([]);
  const [totalMiles, setTotalMiles] = useState(0);
  
  // View mode state
  const [viewMode, setViewMode] = useState<'both' | 'user1' | 'user2'>('both');
  
  // Form states
  const [showRuleForm, setShowRuleForm] = useState(false);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [editingRule, setEditingRule] = useState<MileageRule | null>(null);
  const [editingGoal, setEditingGoal] = useState<MileageGoal | null>(null);

  const [ruleForm, setRuleForm] = useState({
    card_id: "",
    bank_name: "",
    card_brand: "",
    miles_per_amount: 1,
    amount_threshold: 1,
    currency: "BRL" as "BRL" | "USD" | "EUR",
    existing_miles: 0
  });

  const [goalForm, setGoalForm] = useState({
    name: "",
    description: "",
    target_miles: "",
    target_date: "",
    card_id: "",
    initial_miles: 0
  });

  useEffect(() => {
    if (user && couple !== undefined) { // Wait for couple data to be loaded
      console.log('MileageSystem: useEffect triggered, user:', !!user, 'viewMode:', viewMode, 'couple:', couple);
      loadData();
    }
  }, [user, viewMode, couple]);

  // Force refresh when couple data changes
  useEffect(() => {
    if (user && couple !== undefined) {
      console.log('MileageSystem: Couple data changed, reloading data');
      loadData();
    }
  }, [couple, user]);

  // Get user IDs to query based on view mode
  const getUserIdsToQuery = () => {
    if (!isPartOfCouple || !couple) {
      console.log('MileageSystem: Single user mode, returning current user ID:', user?.id);
      return [user?.id].filter(Boolean);
    }

    console.log('MileageSystem: Couple mode, viewMode:', viewMode, 'couple:', couple);
    switch (viewMode) {
      case 'user1':
        console.log('MileageSystem: Returning user1 ID:', couple.user1_id);
        return [couple.user1_id];
      case 'user2':
        console.log('MileageSystem: Returning user2 ID:', couple.user2_id);
        return [couple.user2_id];
      case 'both':
      default:
        console.log('MileageSystem: Returning both IDs:', [couple.user1_id, couple.user2_id]);
        return [couple.user1_id, couple.user2_id];
    }
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
  };

  const loadData = async () => {
    console.log('MileageSystem: loadData called with viewMode:', viewMode);
    await Promise.all([
      loadCards(),
      loadMileageRules(),
      loadMileageGoals(),
      loadMileageHistory(),
      loadTotalMiles()
    ]);
  };

  const loadCards = async () => {
    const userIds = getUserIdsToQuery();
    
    const { data, error } = await supabase
      .from("cards")
      .select("id, name, card_type, user_id")
      .in("user_id", userIds.filter(Boolean))
      .eq("card_type", "credit");

    if (error) {
      console.error("Error loading cards:", error);
      return;
    }

    setCards(data || []);
  };

  const loadMileageRules = async () => {
    const userIds = (isPartOfCouple && couple)
      ? [couple.user1_id, couple.user2_id]
      : getUserIdsToQuery();
    
    const { data, error } = await supabase
      .from("card_mileage_rules")
      .select(`
        *,
        cards:card_id (id, name, card_type, user_id)
      `)
      .in("user_id", userIds.filter(Boolean))
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading mileage rules:", error);
      return;
    }

    setMileageRules(data || []);
  };

  const loadMileageGoals = async () => {
    // Sempre carregar metas de ambos os usuários quando for um casal
    const userIds = (isPartOfCouple && couple)
      ? [couple.user1_id, couple.user2_id]
      : getUserIdsToQuery();
    console.log('MileageSystem: loadMileageGoals called with userIds:', userIds);
    
    const { data, error } = await supabase
      .from("mileage_goals")
      .select("*")
      .in("user_id", userIds.filter(Boolean))
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading mileage goals:", error);
      return;
    }

    console.log('MileageSystem: loadMileageGoals data received:', data);
    setMileageGoals(data || []);
  };

  const loadMileageHistory = async () => {
    const userIds = getUserIdsToQuery();
    
    const { data, error } = await supabase
      .from("mileage_history")
      .select(`
        id,
        user_id,
        card_id,
        amount_spent,
        miles_earned,
        calculation_date,
        month_year,
        transaction_id,
        cards:card_id (id, name, card_type, user_id),
        rule:rule_id (currency, miles_per_amount, amount_threshold)
      `)
      .in("user_id", userIds.filter(Boolean))
      .order("calculation_date", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Error loading mileage history:", error);
      return;
    }

    setMileageHistory(data || []);
  };

  const loadTotalMiles = async () => {
    const userIds = getUserIdsToQuery();
    
    // Get miles from history
    const { data: historyData, error: historyError } = await supabase
      .from("mileage_history")
      .select("miles_earned")
      .in("user_id", userIds.filter(Boolean));

    if (historyError) {
      console.error("Error loading miles history:", historyError);
      return;
    }

    // Get existing miles from active rules
    const { data: rulesData, error: rulesError } = await supabase
      .from("card_mileage_rules")
      .select("existing_miles")
      .in("user_id", userIds.filter(Boolean))
      .eq("is_active", true);

    if (rulesError) {
      console.error("Error loading rules:", rulesError);
      return;
    }

    const historyMiles = historyData?.reduce((sum, record) => sum + Number(record.miles_earned), 0) || 0;
    const existingMiles = rulesData?.reduce((sum, rule) => sum + Number(rule.existing_miles || 0), 0) || 0;
    
    setTotalMiles(historyMiles + existingMiles);
  };

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { error } = await supabase
      .from("card_mileage_rules")
      .insert({
        user_id: user?.id,
        ...ruleForm
      });

    if (error) {
      toast({
        title: "Erro",
        description: t('mileage.ruleCreateError'),
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Sucesso",
      description: t('mileage.ruleCreated')
    });

    setRuleForm({
      card_id: "",
      bank_name: "",
      card_brand: "",
      miles_per_amount: 1,
      amount_threshold: 1,
      currency: "BRL",
      existing_miles: 0
    });
    setShowRuleForm(false);
    loadMileageRules();
    loadTotalMiles();
  };

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.id) return;
    
    try {
      let initialMiles = goalForm.initial_miles || 0;
      
      // Se selecionou um cartão, calcular milhas totais (iniciais + histórico)
      if (goalForm.card_id && goalForm.card_id !== "none") {
        const selectedRule = mileageRules.find(rule => rule.card_id === goalForm.card_id);
        if (selectedRule?.existing_miles) {
          initialMiles = selectedRule.existing_miles;
          
          // Somar as milhas do histórico deste cartão específico
          const { data: cardHistory } = await supabase
            .from('mileage_history')
            .select('miles_earned')
            .eq('user_id', user.id)
            .eq('card_id', goalForm.card_id);
          
          if (cardHistory) {
            const historyMiles = cardHistory.reduce((sum, record) => sum + (record.miles_earned || 0), 0);
            initialMiles += historyMiles;
          }
        }
      }

      const { error } = await supabase
        .from("mileage_goals")
        .insert({
          user_id: user.id,
          name: goalForm.name,
          description: goalForm.description,
          target_miles: Number(goalForm.target_miles),
          current_miles: initialMiles,
          target_date: goalForm.target_date || null,
          source_card_id: goalForm.card_id || null
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: t('mileage.goalCreated')
      });

      setGoalForm({
        name: "",
        description: "",
        target_miles: "",
        target_date: "",
        card_id: "",
        initial_miles: 0
      });
      setShowGoalForm(false);
      loadMileageGoals();
    } catch (error: any) {
      console.error('Error creating goal:', error);
      toast({
        title: "Erro",
        description: error.message || t('mileage.goalCreateError'),
        variant: "destructive"
      });
    }
  };

  const toggleRuleStatus = async (ruleId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from("card_mileage_rules")
      .update({ is_active: !currentStatus })
      .eq("id", ruleId);

    if (error) {
      toast({
        title: "Erro",
        description: t('mileage.ruleStatusError'),
        variant: "destructive"
      });
      return;
    }

    loadMileageRules();
    loadTotalMiles();
  };

  const deleteRule = async (ruleId: string) => {
    const { error } = await supabase
      .from("card_mileage_rules")
      .delete()
      .eq("id", ruleId);

    if (error) {
      toast({
        title: "Erro",
        description: t('mileage.ruleDeleteError'),
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Sucesso",
      description: t('mileage.ruleDeleted')
    });

    loadMileageRules();
    loadTotalMiles();
  };

  const deleteGoal = async (goalId: string) => {
    const { error } = await supabase
      .from("mileage_goals")
      .delete()
      .eq("id", goalId);

    if (error) {
      toast({
        title: "Erro",
        description: t('mileage.goalDeleteError'),
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Sucesso",
      description: t('mileage.goalDeleted')
    });

    loadMileageGoals();
  };

  const handleCardSelect = (cardId: string) => {
    setGoalForm(prev => ({ ...prev, card_id: cardId }));
    
    if (cardId && cardId !== "none") {
      // Buscar milhas existentes do cartão selecionado
      const selectedRule = mileageRules.find(rule => 
        rule.card_id === cardId && rule.is_active && rule.user_id === user?.id
      );
      
      if (selectedRule && selectedRule.existing_miles) {
        setGoalForm(prev => ({ 
          ...prev, 
          initial_miles: Number(selectedRule.existing_miles) || 0 
        }));
      } else {
        setGoalForm(prev => ({ ...prev, initial_miles: 0 }));
      }
    } else {
      setGoalForm(prev => ({ ...prev, initial_miles: 0 }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          {t('mileage.title')}
        </h1>
        <p className="text-muted-foreground">
          {t('mileage.subtitle')}
        </p>
      </div>

      {/* View Mode Selector - simplified for small screens */}
      {isPartOfCouple && (
        <div className="flex items-center justify-center gap-2">
          <User className="h-4 w-4" />
          {/* Hide "Modo de visualização" on small screens */}
          <span className="hidden sm:inline text-sm font-medium">{t('dashboard.viewMode')}:</span>
          <div className="flex gap-2">
            <Button
              variant={viewMode === "both" ? "default" : "outline"}
              size="sm"
              onClick={() => {
                console.log('MileageSystem: Clicking "Ambos" button, changing viewMode to "both"');
                setViewMode("both");
              }}
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
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card 
          className="border"
          style={{
            background: "linear-gradient(135deg, hsl(var(--cherry-light) / 0.08), hsl(var(--background)))",
            borderColor: "hsl(var(--cherry-light) / 0.2)"
          }}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('mileage.totalMiles')}</CardTitle>
            <Plane 
              className="h-4 w-4"
              style={{ color: "hsl(var(--cherry-light))" }}
            />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMiles.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{t('mileage.milesAccumulated')}</p>
          </CardContent>
        </Card>

        <Card 
          className="border"
          style={{
            background: "linear-gradient(135deg, hsl(var(--blue-soft) / 0.1), hsl(var(--background)))",
            borderColor: "hsl(var(--blue-soft) / 0.3)"
          }}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('mileage.activeCards')}</CardTitle>
            <CreditCard 
              className="h-4 w-4"
              style={{ color: "hsl(var(--blue-soft) / 0.8)" }}
            />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mileageRules.filter(r => r.is_active).length}</div>
            <p className="text-xs text-muted-foreground">{t('mileage.rulesConfigured')}</p>
          </CardContent>
        </Card>

        <Card 
          className="border"
          style={{
            background: "linear-gradient(135deg, hsl(var(--primary) / 0.05), hsl(var(--background)))",
            borderColor: "hsl(var(--primary) / 0.2)"
          }}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('mileage.activeGoals')}</CardTitle>
            <Target className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mileageGoals.filter(g => !g.is_completed).length}</div>
            <p className="text-xs text-muted-foreground">{t('mileage.inProgress')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Promotions Section */}
      <PromotionsSection userTotalMiles={totalMiles} />

      {/* Main Content */}
      <Tabs defaultValue="rules" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="rules" className="text-xs sm:text-sm">
            <span className="hidden sm:inline">{t('mileage.rules')}</span>
            <span className="sm:hidden">Regras</span>
          </TabsTrigger>
          <TabsTrigger value="goals" className="text-xs sm:text-sm">{t('mileage.goals')}</TabsTrigger>
          <TabsTrigger value="history" className="text-xs sm:text-sm">{t('mileage.history')}</TabsTrigger>
        </TabsList>

        <TabsContent value="rules" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">{t('mileage.rules')}</h3>
            <Button onClick={() => setShowRuleForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              {t('mileage.newRule')}
            </Button>
          </div>

          {showRuleForm && (
            <Card>
              <CardHeader>
                <CardTitle>{t('mileage.ruleTitle')}</CardTitle>
                <CardDescription>
                  {t('mileage.ruleDescription')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateRule} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="card">{t('mileage.card')}</Label>
                      <Select value={ruleForm.card_id} onValueChange={(value) => setRuleForm({...ruleForm, card_id: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder={t('mileage.selectCard')} />
                        </SelectTrigger>
                         <SelectContent>
                           {cards.filter(card => card.user_id === user?.id).map((card) => (
                             <SelectItem key={card.id} value={card.id}>
                               {card.name}
                             </SelectItem>
                           ))}
                         </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bank_name">{t('mileage.bankName')}</Label>
                      <Input
                        id="bank_name"
                        value={ruleForm.bank_name}
                        onChange={(e) => setRuleForm({...ruleForm, bank_name: e.target.value})}
                        placeholder={t('mileage.bankPlaceholder')}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="card_brand">{t('mileage.cardBrand')}</Label>
                      <Input
                        id="card_brand"
                        value={ruleForm.card_brand}
                        onChange={(e) => setRuleForm({...ruleForm, card_brand: e.target.value})}
                        placeholder={t('mileage.brandPlaceholder')}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="currency">{t('mileage.currency')}</Label>
                      <Select value={ruleForm.currency} onValueChange={(value: "BRL" | "USD" | "EUR") => setRuleForm({...ruleForm, currency: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="BRL">Real (BRL)</SelectItem>
                          <SelectItem value="USD">Dólar (USD)</SelectItem>
                          <SelectItem value="EUR">Euro (EUR)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="miles_per_amount">{t('mileage.milesPerAmount')}</Label>
                      <Input
                        id="miles_per_amount"
                        type="number"
                        step="0.1"
                        value={ruleForm.miles_per_amount}
                        onChange={(e) => setRuleForm({...ruleForm, miles_per_amount: Number(e.target.value)})}
                        placeholder={t('mileage.milesPlaceholder')}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="amount_threshold">{t('mileage.amountThreshold')}</Label>
                      <Input
                        id="amount_threshold"
                        type="number"
                        step="0.01"
                        value={ruleForm.amount_threshold}
                        onChange={(e) => setRuleForm({...ruleForm, amount_threshold: Number(e.target.value)})}
                        placeholder={t('mileage.thresholdPlaceholder')}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="existing_miles">{t('mileage.existingMiles')}</Label>
                      <Input
                        id="existing_miles"
                        type="number"
                        step="1"
                        value={ruleForm.existing_miles}
                        onChange={(e) => setRuleForm({...ruleForm, existing_miles: Number(e.target.value)})}
                        placeholder="Ex: 15000"
                      />
                      <p className="text-xs text-muted-foreground">
                        {t('mileage.existingMilesDescription')}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit">{t('mileage.createRule')}</Button>
                    <Button type="button" variant="outline" onClick={() => setShowRuleForm(false)}>
                      {t('common.cancel')}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4">
            {mileageRules.map((rule) => (
              <Card key={rule.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{rule.card?.name}</h4>
                        <Badge variant={rule.is_active ? "default" : "secondary"}>
                          {rule.is_active ? t('mileage.active') : t('mileage.inactive')}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {rule.bank_name} • {rule.card_brand}
                      </p>
                      <p className="text-sm">
                        {rule.miles_per_amount} {t('mileage.milesEarned')} {t('mileage.amountThreshold')} {rule.currency} {rule.amount_threshold}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleRuleStatus(rule.id, rule.is_active)}
                      >
                        {rule.is_active ? t('mileage.deactivate') : t('mileage.activate')}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteRule(rule.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="goals" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">{t('mileage.goals')}</h3>
            <Button onClick={() => setShowGoalForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              {t('mileage.newGoal')}
            </Button>
          </div>

          {showGoalForm && (
            <Card>
              <CardHeader>
                <CardTitle>{t('mileage.goalTitle')}</CardTitle>
                <CardDescription>
                  {t('mileage.goalDescription')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateGoal} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="goal_name">{t('mileage.goalName')}</Label>
                      <Input
                        id="goal_name"
                        value={goalForm.name}
                        onChange={(e) => setGoalForm({...goalForm, name: e.target.value})}
                        placeholder={t('mileage.goalNamePlaceholder')}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="target_miles">{t('mileage.targetMiles')}</Label>
                      <Input
                        id="target_miles"
                        type="number"
                        value={goalForm.target_miles}
                        onChange={(e) => setGoalForm({...goalForm, target_miles: e.target.value})}
                        placeholder={t('mileage.targetMilesPlaceholder')}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="card_select">{t('mileage.selectCard')}</Label>
                      <Select value={goalForm.card_id} onValueChange={handleCardSelect}>
                        <SelectTrigger>
                          <SelectValue placeholder={t('mileage.selectCardPlaceholder')} />
                        </SelectTrigger>
                        <SelectContent className="bg-background border border-border shadow-lg z-50">
                           <SelectItem value="none">{t('mileage.noCard')}</SelectItem>
                           {mileageRules
                             .filter(rule => {
                               // Filtrar regras ativas com milhas existentes
                               if (!rule.is_active || rule.user_id !== user?.id || !rule.existing_miles || rule.existing_miles <= 0) {
                                 return false;
                               }
                               
                               // Verificar se o cartão já está vinculado a uma meta ativa
                               const isCardAlreadyLinked = mileageGoals.some(goal => 
                                 goal.source_card_id === rule.card_id && !goal.is_completed
                               );
                               
                               return !isCardAlreadyLinked;
                             })
                             .map((rule) => {
                               // Calcular milhas totais disponíveis (existentes + histórico)
                               const cardHistoryMiles = mileageHistory
                                 .filter(h => h.card_id === rule.card_id)
                                 .reduce((sum, h) => sum + (h.miles_earned || 0), 0);
                               
                               const totalAvailableMiles = (rule.existing_miles || 0) + cardHistoryMiles;
                               
                               return (
                                 <SelectItem key={rule.card_id} value={rule.card_id}>
                                   {rule.card?.name} - {totalAvailableMiles.toLocaleString()} milhas
                                 </SelectItem>
                               );
                             })}
                        </SelectContent>
                      </Select>
                       {mileageRules
                         .filter(rule => {
                           if (!rule.is_active || rule.user_id !== user?.id || !rule.existing_miles || rule.existing_miles <= 0) {
                             return false;
                           }
                           const isCardAlreadyLinked = mileageGoals.some(goal => 
                             goal.source_card_id === rule.card_id && !goal.is_completed
                           );
                           return !isCardAlreadyLinked;
                         }).length === 0 ? (
                         <p className="text-xs text-orange-600 italic">
                           {t('mileage.allCardsLinked')}
                         </p>
                       ) : (
                         <p className="text-xs text-muted-foreground">
                           Selecione um cartão para adicionar suas milhas existentes à meta
                         </p>
                       )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="target_date">{t('mileage.targetDate')}</Label>
                      <Input
                        id="target_date"
                        type="date"
                        value={goalForm.target_date}
                        onChange={(e) => setGoalForm({...goalForm, target_date: e.target.value})}
                      />
                    </div>

                    {goalForm.initial_miles > 0 && (
                      <div className="md:col-span-2">
                        <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                          <p className="text-sm font-medium text-primary">
                            Milhas iniciais: {goalForm.initial_miles.toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Estas milhas serão adicionadas como progresso inicial da meta
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="goal_description">{t('mileage.description')}</Label>
                    <Textarea
                      id="goal_description"
                      value={goalForm.description}
                      onChange={(e) => setGoalForm({...goalForm, description: e.target.value})}
                      placeholder={t('mileage.descriptionPlaceholder')}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit">{t('mileage.createGoal')}</Button>
                    <Button type="button" variant="outline" onClick={() => setShowGoalForm(false)}>
                      {t('common.cancel')}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

<div className="grid gap-4">
  {isPartOfCouple && viewMode === 'both' && couple ? (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <h4 className="font-semibold mb-2">{getUserLabel('user1')}</h4>
        {mileageGoals.filter(g => g.user_id === couple.user1_id).length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('mileage.noGoals')}</p>
        ) : (
          mileageGoals
            .filter(g => g.user_id === couple.user1_id)
            .map((goal) => {
              // Use current_miles that is already correctly calculated by recalculate_mileage_goals()
              const totalCurrentMiles = goal.current_miles;
              
              // Get existing miles for informational display only (not for calculation)
              const existingMilesFromCards = mileageRules
                .filter(rule => rule.is_active && rule.user_id === goal.user_id)
                .reduce((total, rule) => total + (Number(rule.existing_miles) || 0), 0);
              const remainingMiles = Math.max(0, goal.target_miles - totalCurrentMiles);
              const progress = Math.min((totalCurrentMiles / goal.target_miles) * 100, 100);
              return (
                <Card key={goal.id}>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold">{goal.name}</h4>
                          {goal.description && (
                            <p className="text-sm text-muted-foreground">{goal.description}</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Badge variant={progress >= 100 ? 'default' : 'secondary'}>
                            {progress >= 100 ? t('mileage.completed') : t('mileage.inProgress')}
                          </Badge>
                          <Button size="sm" variant="outline" onClick={() => deleteGoal(goal.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>{totalCurrentMiles.toLocaleString()} {t('mileage.milesEarned')}</span>
                          <span>{goal.target_miles.toLocaleString()} {t('mileage.milesTarget')}</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                        <div className="text-sm text-muted-foreground space-y-1">
                          <div>{progress.toFixed(1)}% {t('mileage.progressText')}</div>
                          {existingMilesFromCards > 0 && (
                            <div className="text-xs text-muted-foreground">
                              {t('mileage.includesExisting')}: {existingMilesFromCards.toLocaleString()} {t('mileage.milesEarned')}
                            </div>
                          )}
                          {remainingMiles > 0 && (
                            <div className="text-xs font-medium text-primary">
                              {t('mileage.remaining')}: {remainingMiles.toLocaleString()} {t('mileage.milesEarned')}
                            </div>
                          )}
                          {goal.target_date && (
                            <span className="block">• {t('mileage.target')}: {format(new Date(goal.target_date), 'dd/MM/yyyy')}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
        )}
      </div>
      <div>
        <h4 className="font-semibold mb-2">{getUserLabel('user2')}</h4>
        {mileageGoals.filter(g => g.user_id === couple.user2_id).length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('mileage.noGoals')}</p>
        ) : (
          mileageGoals
            .filter(g => g.user_id === couple.user2_id)
            .map((goal) => {
              // Use current_miles that is already correctly calculated by recalculate_mileage_goals()
              const totalCurrentMiles = goal.current_miles;
              
              // Get existing miles for informational display only (not for calculation)
              const existingMilesFromCards = mileageRules
                .filter(rule => rule.is_active && rule.user_id === goal.user_id)
                .reduce((total, rule) => total + (Number(rule.existing_miles) || 0), 0);
              const remainingMiles = Math.max(0, goal.target_miles - totalCurrentMiles);
              const progress = Math.min((totalCurrentMiles / goal.target_miles) * 100, 100);
              return (
                <Card key={goal.id}>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold">{goal.name}</h4>
                          {goal.description && (
                            <p className="text-sm text-muted-foreground">{goal.description}</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Badge variant={progress >= 100 ? 'default' : 'secondary'}>
                            {progress >= 100 ? t('mileage.completed') : t('mileage.inProgress')}
                          </Badge>
                          <Button size="sm" variant="outline" onClick={() => deleteGoal(goal.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>{totalCurrentMiles.toLocaleString()} {t('mileage.milesEarned')}</span>
                          <span>{goal.target_miles.toLocaleString()} {t('mileage.milesTarget')}</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                        <div className="text-sm text-muted-foreground space-y-1">
                          <div>{progress.toFixed(1)}% {t('mileage.progressText')}</div>
                          {existingMilesFromCards > 0 && (
                            <div className="text-xs text-muted-foreground">
                              {t('mileage.includesExisting')}: {existingMilesFromCards.toLocaleString()} {t('mileage.milesEarned')}
                            </div>
                          )}
                          {remainingMiles > 0 && (
                            <div className="text-xs font-medium text-primary">
                              {t('mileage.remaining')}: {remainingMiles.toLocaleString()} {t('mileage.milesEarned')}
                            </div>
                          )}
                          {goal.target_date && (
                            <span className="block">• {t('mileage.target')}: {format(new Date(goal.target_date), 'dd/MM/yyyy')}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
        )}
      </div>
    </div>
  ) : (
    (isPartOfCouple && couple ? (viewMode === 'user1' ? mileageGoals.filter(g => g.user_id === couple.user1_id) : viewMode === 'user2' ? mileageGoals.filter(g => g.user_id === couple.user2_id) : mileageGoals) : mileageGoals).map((goal) => {
      // Use current_miles that is already correctly calculated by recalculate_mileage_goals()
      const totalCurrentMiles = goal.current_miles;
      
      // Get existing miles for informational display only (not for calculation)
      const existingMilesFromCards = mileageRules
        .filter(rule => rule.is_active && rule.user_id === goal.user_id)
        .reduce((total, rule) => total + (Number(rule.existing_miles) || 0), 0);
      const remainingMiles = Math.max(0, goal.target_miles - totalCurrentMiles);
      const progress = Math.min((totalCurrentMiles / goal.target_miles) * 100, 100);
      return (
        <Card key={goal.id}>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold">{goal.name}</h4>
                  {goal.description && (
                    <p className="text-sm text-muted-foreground">{goal.description}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Badge variant={progress >= 100 ? 'default' : 'secondary'}>
                    {progress >= 100 ? t('mileage.completed') : t('mileage.inProgress')}
                  </Badge>
                  <Button size="sm" variant="outline" onClick={() => deleteGoal(goal.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{totalCurrentMiles.toLocaleString()} {t('mileage.milesEarned')}</span>
                  <span>{goal.target_miles.toLocaleString()} {t('mileage.milesTarget')}</span>
                </div>
                <Progress value={progress} className="h-2" />
                <div className="text-sm text-muted-foreground space-y-1">
                  <div>{progress.toFixed(1)}% {t('mileage.progressText')}</div>
                  {existingMilesFromCards > 0 && (
                    <div className="text-xs text-muted-foreground">
                      {t('mileage.includesExisting')}: {existingMilesFromCards.toLocaleString()} {t('mileage.milesEarned')}
                    </div>
                  )}
                  {remainingMiles > 0 && (
                    <div className="text-xs font-medium text-primary">
                      {t('mileage.remaining')}: {remainingMiles.toLocaleString()} {t('mileage.milesEarned')}
                    </div>
                  )}
                  {goal.target_date && (
                    <span className="block">• {t('mileage.target')}: {format(new Date(goal.target_date), 'dd/MM/yyyy')}</span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    })
  )}
</div>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <h3 className="text-lg font-semibold">{t('mileage.historyTitle')}</h3>
          
          <div className="grid gap-4">
            {mileageHistory.map((record) => {
              // Get user name for this record
              const recordUserName = record.user_id === user?.id 
                ? names.currentUserName || 'Você'
                : names.partnerName || 'Parceiro(a)';

              // Conversion and rule context for explanation
              const ruleCurrency = (record.rule?.currency as CurrencyCode) || 'USD';
              const convertedAmount = convertCurrency(record.amount_spent, 'BRL', ruleCurrency as CurrencyCode);
              const currencySymbol = getCurrencySymbol(ruleCurrency as CurrencyCode);
              const threshold = record.rule?.amount_threshold || 1;
              const milesPerAmount = record.rule?.miles_per_amount || 1;
              const milesCalc = (convertedAmount / threshold) * milesPerAmount;

              return (
                <Card key={record.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{record.card?.name}</h4>
                          <Badge variant="outline">
                            +{record.miles_earned.toLocaleString()} {t('mileage.milesEarned')}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {recordUserName} ganhou {record.miles_earned.toLocaleString()} milhas
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {t('mileage.spent')}: R$ {record.amount_spent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          ≈ {currencySymbol}{convertedAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          {' → '}{Math.round(milesCalc).toLocaleString()} milhas
                          {' ('}regra: {milesPerAmount} milha(s) por {currencySymbol}{threshold}{')'}
                        </p>
                        {record.transaction_id && (
                          <p className="text-xs text-muted-foreground">
                            Transação: {record.transaction_id.substring(0, 8)}...
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(record.calculation_date), "dd/MM/yyyy")}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};