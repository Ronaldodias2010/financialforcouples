import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { useCouple } from "@/hooks/useCouple";
import { usePartnerNames } from "@/hooks/usePartnerNames";
import { useCurrencyConverter, type CurrencyCode } from "@/hooks/useCurrencyConverter";
import { useMileageAnalysis } from "@/hooks/useMileageAnalysis";
import { supabase } from "@/integrations/supabase/client";
import { Plane, CreditCard, Target, TrendingUp, Calendar, Plus, Edit, Trash2, User, Globe, MapPin, ArrowRight, Info } from "lucide-react";
import { ScrapedPromotionsList } from './ScrapedPromotionsList';
// ConnectedProgramsCard removed - sync via extension integrated into MileageProgramsSection
import { MileageRuleWizard, type RuleFormData } from './MileageRuleWizard';
import { MileageGoalAnalysis } from './MileageGoalAnalysis';
import { MileageSmartSummary } from './MileageSmartSummary';
import { MileageProgramsSection } from './MileageProgramsSection';
import { format } from "date-fns";
import { parseLocalDate } from "@/utils/date";

interface Card {
  id: string;
  name: string;
  card_type: string;
  user_id?: string;
}

interface MileageRule {
  id: string;
  user_id?: string;
  card_id: string | null;
  bank_name: string;
  card_brand: string;
  miles_per_amount: number;
  amount_threshold: number;
  currency: string;
  is_active: boolean;
  existing_miles?: number | null;
  purchase_type?: string | null;
  card?: Card | null;
  cards?: Card | null;
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
  const [promotions, setPromotions] = useState<any[]>([]);

  const mileageAnalysis = useMileageAnalysis(mileageGoals, promotions, totalMiles, mileageHistory);
  
  // View mode state
  const [viewMode, setViewMode] = useState<'both' | 'user1' | 'user2'>('both');
  
  // Form states
  const [showRuleForm, setShowRuleForm] = useState(false);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [editingRule, setEditingRule] = useState<MileageRule | null>(null);
  const [editingGoal, setEditingGoal] = useState<MileageGoal | null>(null);

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
      loadTotalMiles(),
      loadPromotions()
    ]);
  };

  const loadPromotions = async () => {
    try {
      const { data, error } = await supabase
        .from('airline_promotions')
        .select('*')
        .eq('is_active', true)
        .gte('end_date', new Date().toISOString().split('T')[0])
        .order('start_date', { ascending: false });

      if (error) throw error;
      setPromotions(data || []);
    } catch (error) {
      console.error('Error loading promotions:', error);
      setPromotions([]);
    }
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

    if (!data) {
      setMileageRules([]);
      return;
    }

    // Map to local interface - explicitly construct to avoid Supabase type conflicts
    const rules = data.map((rule): MileageRule => {
      return {
        id: rule.id,
        user_id: rule.user_id,
        card_id: rule.card_id,
        bank_name: rule.bank_name,
        card_brand: rule.card_brand,
        miles_per_amount: rule.miles_per_amount,
        amount_threshold: rule.amount_threshold,
        currency: rule.currency,
        is_active: rule.is_active,
        existing_miles: rule.existing_miles,
        purchase_type: rule.purchase_type || 'domestic',
        card: rule.cards as Card | null,
        cards: rule.cards as Card | null
      };
    });
    setMileageRules(rules);
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
    console.log('MileageSystem: loadTotalMiles with userIds:', userIds, 'viewMode:', viewMode);

    // REGRA SIMPLIFICADA: Somar APENAS os programas de milhagem conectados
    // Milhas em cartões de crédito ficam separadas (podem ser transferidas com bônus 2x, 3x, etc.)
    // Não misturamos existing_miles nem mileage_history aqui
    const { data: programsData, error: programsError } = await supabase
      .from("mileage_programs")
      .select("balance_miles, user_id, program_name")
      .in("user_id", userIds.filter(Boolean))
      .eq("status", "connected");

    if (programsError) {
      console.error("Error loading mileage programs:", programsError);
      return;
    }

    // Total = APENAS saldo dos programas conectados (LATAM, Azul, Smiles, Livelo, etc.)
    const total = programsData?.reduce((sum, prog) => sum + Number(prog.balance_miles || 0), 0) || 0;

    console.log('MileageSystem: Total miles (APENAS programas conectados):', {
      programs: programsData,
      total,
      userIds
    });

    setTotalMiles(total);
  };

  const handleCreateRule = async (formData: RuleFormData) => {
    // Verificar se pelo menos uma regra está ativada
    if (!formData.domestic.enabled && !formData.international.enabled) {
      toast({
        title: "Erro",
        description: "Ative pelo menos uma regra (Nacional ou Internacional).",
        variant: "destructive"
      });
      return;
    }

    const rulesToCreate: Array<{
      user_id: string | undefined;
      card_id: string;
      bank_name: string;
      card_brand: string;
      existing_miles: number;
      purchase_type: string;
      currency: "BRL" | "USD" | "EUR";
      miles_per_amount: number;
      amount_threshold: number;
    }> = [];

    // Verificar e preparar regra nacional
    if (formData.domestic.enabled) {
      const existingDomestic = mileageRules.find(
        r => r.card_id === formData.card_id && r.purchase_type === 'domestic' && r.user_id === user?.id
      );
      if (existingDomestic) {
        toast({
          title: "Erro",
          description: "Já existe uma regra para compras nacionais neste cartão.",
          variant: "destructive"
        });
        return;
      }
      rulesToCreate.push({
        user_id: user?.id,
        card_id: formData.card_id,
        bank_name: formData.bank_name,
        card_brand: formData.card_brand,
        existing_miles: formData.existing_miles,
        purchase_type: 'domestic',
        currency: formData.domestic.currency,
        miles_per_amount: formData.domestic.miles_per_amount,
        amount_threshold: formData.domestic.amount_threshold,
      });
    }

    // Verificar e preparar regra internacional
    if (formData.international.enabled) {
      const existingInternational = mileageRules.find(
        r => r.card_id === formData.card_id && r.purchase_type === 'international' && r.user_id === user?.id
      );
      if (existingInternational) {
        toast({
          title: "Erro",
          description: "Já existe uma regra para compras internacionais neste cartão.",
          variant: "destructive"
        });
        return;
      }
      rulesToCreate.push({
        user_id: user?.id,
        card_id: formData.card_id,
        bank_name: formData.bank_name,
        card_brand: formData.card_brand,
        existing_miles: 0, // Milhas existentes só na regra nacional
        purchase_type: 'international',
        currency: formData.international.currency,
        miles_per_amount: formData.international.miles_per_amount,
        amount_threshold: formData.international.amount_threshold,
      });
    }
    
    const { error } = await supabase
      .from("card_mileage_rules")
      .insert(rulesToCreate);

    if (error) {
      toast({
        title: "Erro",
        description: t('mileage.ruleCreateError'),
        variant: "destructive"
      });
      return;
    }

    const rulesCreated = rulesToCreate.length;
    toast({
      title: "Sucesso",
      description: rulesCreated > 1 
        ? `${rulesCreated} regras criadas com sucesso!` 
        : t('mileage.ruleCreated')
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

  // Group rules by card_id for consolidated display
  const groupedRules = useMemo(() => {
    const groups = new Map<string, MileageRule[]>();
    
    mileageRules.forEach(rule => {
      const key = rule.card_id || rule.id;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(rule);
    });
    
    return Array.from(groups.entries()).map(([cardId, rules]) => ({
      cardId,
      rules,
      card: rules[0].card,
      bank_name: rules[0].bank_name,
      card_brand: rules[0].card_brand,
      user_id: rules[0].user_id,
      // Sum existing miles from all rules (usually only domestic has it)
      totalExistingMiles: rules.reduce((sum, r) => sum + (r.existing_miles || 0), 0),
      // Check activation status
      allActive: rules.every(r => r.is_active),
      someActive: rules.some(r => r.is_active),
      // Purchase types present
      purchaseTypes: rules.map(r => r.purchase_type || 'domestic'),
      // Rates by type for display
      ratesByType: rules.reduce((acc, r) => {
        acc[r.purchase_type || 'domestic'] = {
          miles_per_amount: r.miles_per_amount,
          amount_threshold: r.amount_threshold,
          currency: r.currency
        };
        return acc;
      }, {} as Record<string, { miles_per_amount: number; amount_threshold: number; currency: string }>),
      // Get all rule IDs for bulk operations
      ruleIds: rules.map(r => r.id)
    }));
  }, [mileageRules]);

  const toggleRuleStatus = async (ruleIds: string[], currentStatus: boolean) => {
    const { error } = await supabase
      .from("card_mileage_rules")
      .update({ is_active: !currentStatus })
      .in("id", ruleIds);

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

  const deleteRule = async (ruleIds: string[]) => {
    const { error } = await supabase
      .from("card_mileage_rules")
      .delete()
      .in("id", ruleIds);

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
            background: "linear-gradient(135deg, hsl(8 85% 72% / 0.08), hsl(var(--background)))",
            borderColor: "hsl(8 85% 72% / 0.2)"
          }}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('mileage.totalMiles')}</CardTitle>
            <Plane 
              className="h-4 w-4"
              style={{ color: "hsl(8 85% 72%)" }}
            />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.floor(totalMiles).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{t('mileage.milesAccumulated')}</p>
          </CardContent>
        </Card>

        <Card 
          className="border"
          style={{
            background: "linear-gradient(135deg, hsl(205 95% 90% / 0.15), hsl(var(--background)))",
            borderColor: "hsl(205 95% 90% / 0.4)"
          }}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('mileage.activeCards')}</CardTitle>
            <CreditCard 
              className="h-4 w-4"
              style={{ color: "hsl(205 70% 65%)" }}
            />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{groupedRules.filter(g => g.someActive).length}</div>
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

      {/* Connected Mileage Programs Section */}
      <MileageProgramsSection onMilesUpdate={loadTotalMiles} />

      {/* "How it works" section for browser extension sync */}
      <Card className="bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800">
        <CardContent className="pt-4 pb-4">
          <h4 className="font-medium text-sm mb-2 flex items-center gap-2 text-green-800 dark:text-green-200">
            <Info className="w-4 h-4" />
            Como sincronizar via extensão?
          </h4>
          <ol className="text-xs text-green-700 dark:text-green-300 space-y-1 list-decimal list-inside">
            <li>
              <button 
                onClick={() => window.open('https://chromewebstore.google.com/detail/couples-miles/geljknggffoclfolggaifadbmonkibma', '_blank')}
                className="underline hover:text-green-900 dark:hover:text-green-100 font-medium text-left"
              >
                Instale a extensão Couples Miles no Chrome →
              </button>
            </li>
            <li>Faça login na sua conta Couples pela extensão</li>
            <li>Acesse o site da companhia aérea e faça login normalmente</li>
            <li>Clique em "Sincronizar Milhas" na extensão</li>
            <li>Pronto! Seu saldo será atualizado automaticamente aqui</li>
          </ol>
        </CardContent>
      </Card>

      {/* Main Content - Regras, Metas e Histórico */}
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
            <MileageRuleWizard
              cards={cards}
              userId={user?.id}
              onSubmit={handleCreateRule}
              onCancel={() => setShowRuleForm(false)}
            />
          )}

          <div className="grid gap-4 md:grid-cols-2">
            {groupedRules.map((group) => {
              const hasDomestic = group.purchaseTypes.includes('domestic');
              const hasInternational = group.purchaseTypes.includes('international');
              const domesticRate = group.ratesByType['domestic'];
              const internationalRate = group.ratesByType['international'];
              
              // Check if rates are the same (for display purposes)
              const ratesAreSame = domesticRate && internationalRate && 
                domesticRate.miles_per_amount === internationalRate.miles_per_amount &&
                domesticRate.amount_threshold === internationalRate.amount_threshold &&
                domesticRate.currency === internationalRate.currency;
              
              return (
                <Card key={group.cardId}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-semibold">{group.card?.name}</h4>
                          <Badge variant={group.allActive ? "default" : group.someActive ? "outline" : "secondary"}>
                            {group.allActive ? t('mileage.active') : group.someActive ? "Parcial" : t('mileage.inactive')}
                          </Badge>
                          {/* Badges for purchase types */}
                          {hasDomestic && (
                            <Badge 
                              variant="outline" 
                              className="border-green-500 text-green-600 bg-green-50 dark:bg-green-950"
                            >
                              <MapPin className="h-3 w-3 mr-1" />Nacional
                            </Badge>
                          )}
                          {hasInternational && (
                            <Badge 
                              variant="outline" 
                              className="border-blue-500 text-blue-600 bg-blue-50 dark:bg-blue-950"
                            >
                              <Globe className="h-3 w-3 mr-1" />Internacional
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {group.bank_name} • {group.card_brand}
                        </p>
                        
                        {/* Rate display */}
                        <div className="text-sm space-y-0.5">
                          {ratesAreSame || (hasDomestic && !hasInternational) || (!hasDomestic && hasInternational) ? (
                            // Single rate display
                            <div>
                              <span className="font-medium">
                                {(domesticRate || internationalRate).miles_per_amount} pontos
                              </span> por {(domesticRate || internationalRate).currency} {(domesticRate || internationalRate).amount_threshold}
                              {(domesticRate || internationalRate).currency !== 'BRL' && hasDomestic && (
                                <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">
                                  (converte BRL → {(domesticRate || internationalRate).currency})
                                </span>
                              )}
                            </div>
                          ) : (
                            // Different rates display
                            <>
                              {domesticRate && (
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3 text-green-600" />
                                  <span className="font-medium">{domesticRate.miles_per_amount} pts</span>
                                  <span className="text-muted-foreground">por {domesticRate.currency} {domesticRate.amount_threshold}</span>
                                </div>
                              )}
                              {internationalRate && (
                                <div className="flex items-center gap-1">
                                  <Globe className="h-3 w-3 text-blue-600" />
                                  <span className="font-medium">{internationalRate.miles_per_amount} pts</span>
                                  <span className="text-muted-foreground">por {internationalRate.currency} {internationalRate.amount_threshold}</span>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                        
                        {group.totalExistingMiles > 0 && (
                          <div className="flex items-center gap-1">
                            <p className="text-xs text-muted-foreground">
                              Milhas existentes: {Math.floor(group.totalExistingMiles).toLocaleString()}
                            </p>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Info className="h-3 w-3 text-muted-foreground hover:text-primary cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs p-3">
                                  <p className="text-xs">
                                    {t('mileage.cardPointsInfoTooltip')}
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleRuleStatus(group.ruleIds, group.allActive)}
                        >
                          {group.allActive ? t('mileage.deactivate') : t('mileage.activate')}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteRule(group.ruleIds)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="goals" className="space-y-4">
          {/* Smart Summary - Intelligent Mileage Analysis */}
          <>
            <MileageSmartSummary analysis={mileageAnalysis} />
            
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">{t('mileage.goals')}</h3>
              <Button onClick={() => setShowGoalForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                {t('mileage.newGoal')}
              </Button>
            </div>
          </>

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
                                    {rule.card?.name} - {Math.floor(totalAvailableMiles).toString()} milhas
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
                             Milhas iniciais: {Math.floor(goalForm.initial_miles).toString()}
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
                          <span>{Math.floor(totalCurrentMiles).toString()} {t('mileage.milesEarned')}</span>
                          <span>{Math.floor(goal.target_miles).toString()} {t('mileage.milesTarget')}</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                        <div className="text-sm text-muted-foreground space-y-1">
                          <div>{progress.toFixed(1)}% {t('mileage.progressText')}</div>
                          {existingMilesFromCards > 0 && (
                            <div className="text-xs text-muted-foreground">
                              {t('mileage.includesExisting')}: {Math.floor(existingMilesFromCards).toString()} {t('mileage.milesEarned')}
                            </div>
                          )}
                          {remainingMiles > 0 && (
                            <div className="text-xs font-medium text-primary">
                              {t('mileage.remaining')}: {Math.floor(remainingMiles).toString()} {t('mileage.milesEarned')}
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
                           <span>{Math.floor(totalCurrentMiles).toString()} {t('mileage.milesEarned')}</span>
                           <span>{Math.floor(goal.target_miles).toString()} {t('mileage.milesTarget')}</span>
                         </div>
                        <Progress value={progress} className="h-2" />
                        <div className="text-sm text-muted-foreground space-y-1">
                          <div>{progress.toFixed(1)}% {t('mileage.progressText')}</div>
                          {existingMilesFromCards > 0 && (
                            <div className="text-xs text-muted-foreground">
                              {t('mileage.includesExisting')}: {Math.floor(existingMilesFromCards).toString()} {t('mileage.milesEarned')}
                            </div>
                          )}
                          {remainingMiles > 0 && (
                            <div className="text-xs font-medium text-primary">
                              {t('mileage.remaining')}: {Math.floor(remainingMiles).toString()} {t('mileage.milesEarned')}
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
                   <span>{Math.floor(totalCurrentMiles).toString()} {t('mileage.milesEarned')}</span>
                   <span>{Math.floor(goal.target_miles).toString()} {t('mileage.milesTarget')}</span>
                 </div>
                <Progress value={progress} className="h-2" />
                <div className="text-sm text-muted-foreground space-y-1">
                  <div>{progress.toFixed(1)}% {t('mileage.progressText')}</div>
                  {existingMilesFromCards > 0 && (
                     <div className="text-xs text-muted-foreground">
                       {t('mileage.includesExisting')}: {Math.floor(existingMilesFromCards).toString()} {t('mileage.milesEarned')}
                     </div>
                  )}
                  {remainingMiles > 0 && (
                     <div className="text-xs font-medium text-primary">
                       {t('mileage.remaining')}: {Math.floor(remainingMiles).toString()} {t('mileage.milesEarned')}
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
                             +{Math.floor(record.miles_earned).toString()} {t('mileage.milesEarned')}
                           </Badge>
                        </div>
                         <p className="text-sm text-muted-foreground">
                           {recordUserName} ganhou {Math.floor(record.miles_earned).toString()} milhas
                         </p>
                        <p className="text-sm text-muted-foreground">
                          {t('mileage.spent')}: R$ {record.amount_spent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                         <p className="text-xs text-muted-foreground">
                           ≈ {currencySymbol}{convertedAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                           {' → '}{Math.floor(milesCalc).toString()} milhas
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
                          {format(parseLocalDate(record.calculation_date), "dd/MM/yyyy")}
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

      {/* Promoções (Scraper Python) */}
      <ScrapedPromotionsList userTotalMiles={totalMiles} />
    </div>
  );
};