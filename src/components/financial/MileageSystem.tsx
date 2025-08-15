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
import { supabase } from "@/integrations/supabase/client";
import { Plane, CreditCard, Target, TrendingUp, Calendar, Plus, Edit, Trash2, User } from "lucide-react";
import { format } from "date-fns";

interface Card {
  id: string;
  name: string;
  card_type: string;
  user_id?: string;
}

interface MileageRule {
  id: string;
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
  name: string;
  description: string;
  target_miles: number;
  current_miles: number;
  target_date: string;
  is_completed: boolean;
}

interface MileageHistory {
  id: string;
  card_id: string;
  amount_spent: number;
  miles_earned: number;
  calculation_date: string;
  month_year: string;
  card?: Card;
}

export const MileageSystem = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const { couple, isPartOfCouple, getPartnerUserId } = useCouple();
  const { names } = usePartnerNames();
  
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
    target_date: ""
  });

  useEffect(() => {
    if (user) {
      console.log('MileageSystem: useEffect triggered, user:', !!user, 'viewMode:', viewMode);
      loadData();
    }
  }, [user, viewMode]);

  // Force reload when switching to "both" mode
  useEffect(() => {
    if (viewMode === "both" && isPartOfCouple && user) {
      console.log('MileageSystem: Force reload for "both" mode');
      setTimeout(() => {
        loadData();
      }, 100);
    }
  }, [viewMode, isPartOfCouple, user]);

  // Get user IDs to query based on view mode
  const getUserIdsToQuery = () => {
    if (!isPartOfCouple || !couple) {
      console.log('MileageSystem: Single user mode, returning current user ID:', user?.id);
      return [user?.id];
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
    const userIds = getUserIdsToQuery();
    
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
    const userIds = getUserIdsToQuery();
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
        *,
        cards:card_id (id, name, card_type, user_id)
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
    
    const { error } = await supabase
      .from("mileage_goals")
      .insert({
        user_id: user?.id,
        name: goalForm.name,
        description: goalForm.description,
        target_miles: Number(goalForm.target_miles),
        target_date: goalForm.target_date || null
      });

    if (error) {
      toast({
        title: "Erro",
        description: t('mileage.goalCreateError'),
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Sucesso",
      description: t('mileage.goalCreated')
    });

    setGoalForm({
      name: "",
      description: "",
      target_miles: "",
      target_date: ""
    });
    setShowGoalForm(false);
    loadMileageGoals();
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

      {/* View Mode Selector - Only show if part of couple */}
      {isPartOfCouple && (
        <div className="flex items-center gap-2">
          <User className="h-4 w-4" />
          <span className="text-sm font-medium">{t('dashboard.viewMode')}:</span>
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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('mileage.totalMiles')}</CardTitle>
            <Plane className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMiles.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{t('mileage.milesAccumulated')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('mileage.activeCards')}</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mileageRules.filter(r => r.is_active).length}</div>
            <p className="text-xs text-muted-foreground">{t('mileage.rulesConfigured')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('mileage.activeGoals')}</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mileageGoals.filter(g => !g.is_completed).length}</div>
            <p className="text-xs text-muted-foreground">{t('mileage.inProgress')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="rules" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="rules">{t('mileage.rules')}</TabsTrigger>
          <TabsTrigger value="goals">{t('mileage.goals')}</TabsTrigger>
          <TabsTrigger value="history">{t('mileage.history')}</TabsTrigger>
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
                      <Label htmlFor="target_date">{t('mileage.targetDate')}</Label>
                      <Input
                        id="target_date"
                        type="date"
                        value={goalForm.target_date}
                        onChange={(e) => setGoalForm({...goalForm, target_date: e.target.value})}
                      />
                    </div>
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
            {mileageGoals.map((goal) => {
              const progress = Math.min((goal.current_miles / goal.target_miles) * 100, 100);
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
                          <Badge variant={goal.is_completed ? "default" : "secondary"}>
                            {goal.is_completed ? t('mileage.completed') : t('mileage.inProgress')}
                          </Badge>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deleteGoal(goal.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>{goal.current_miles.toLocaleString()} {t('mileage.milesEarned')}</span>
                          <span>{goal.target_miles.toLocaleString()} {t('mileage.milesEarned')}</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                        <div className="text-sm text-muted-foreground">
                          {progress.toFixed(1)}% {t('mileage.progressText')}
                          {goal.target_date && (
                            <span className="ml-2">
                              • {t('mileage.target')}: {format(new Date(goal.target_date), "dd/MM/yyyy")}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <h3 className="text-lg font-semibold">{t('mileage.historyTitle')}</h3>
          
          <div className="grid gap-4">
            {mileageHistory.map((record) => (
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
                        {t('mileage.spent')}: R$ {record.amount_spent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(record.calculation_date), "dd/MM/yyyy")}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};