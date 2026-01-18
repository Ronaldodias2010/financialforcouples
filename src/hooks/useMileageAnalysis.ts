import { useMemo } from 'react';
import { useLanguage } from '@/hooks/useLanguage';

// Types
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

interface AirlinePromotion {
  id: string;
  airline_code: string;
  airline_name: string;
  title: string;
  description: string | null;
  promotion_type: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  miles_required: number | null;
  route_from: string | null;
  route_to: string | null;
  bonus_percentage: number | null;
  discount_percentage: number | null;
}

interface MileageHistory {
  id: string;
  user_id: string;
  miles_earned: number;
  calculation_date: string;
  month_year: string;
}

export type ViabilityStatus = 'achievable' | 'partially_achievable' | 'not_achievable';

export interface HelpfulPromotion {
  promotionId: string;
  promotionTitle: string;
  airlineName: string;
  type: 'reduces_cost' | 'bonus_purchase' | 'route_discount' | 'accelerates_earning';
  benefitDescription: string;
  adjustedMilesNeeded: number | null;
  savingsPercent: number | null;
  savingsMiles: number | null;
}

export interface GoalAnalysis {
  goalId: string;
  goalName: string;
  targetMiles: number;
  currentMiles: number;
  missingMiles: number;
  viability: ViabilityStatus;
  viabilityMessage: string;
  percentComplete: number;
  estimatedMonthsToAchieve: number | null;
  helpfulPromotions: HelpfulPromotion[];
  bestPromotion: HelpfulPromotion | null;
}

export interface MileageEvent {
  type: 'promotion_detected' | 'goal_status_change' | 'milestone_reached';
  goalId?: string;
  promotionId?: string;
  message: string;
  timestamp: Date;
}

export interface PromotionGoalMatch {
  promotionId: string;
  goalIds: string[];
  goalNames: string[];
}

export interface MileageAnalysisResult {
  goalAnalyses: GoalAnalysis[];
  promotionMatches: Map<string, PromotionGoalMatch>;
  events: MileageEvent[];
  summary: {
    tripsReady: number;
    tripsSoon: number;
    promotionsHelpingGoals: number;
    bestOpportunity: {
      goalName: string;
      promotionTitle: string;
      savingsDescription: string;
    } | null;
  };
}

// Helper function to extract destination hints from goal name/description
const extractDestinationHints = (goal: MileageGoal): string[] => {
  const text = `${goal.name} ${goal.description || ''}`.toLowerCase();
  
  // Common Brazilian destinations
  const destinations: Record<string, string[]> = {
    'GRU': ['são paulo', 'sp', 'guarulhos', 'sampa'],
    'GIG': ['rio de janeiro', 'rj', 'galeão', 'rio'],
    'SDU': ['santos dumont', 'sdu'],
    'BSB': ['brasília', 'brasilia', 'bsb'],
    'CNF': ['belo horizonte', 'bh', 'confins', 'minas'],
    'SSA': ['salvador', 'bahia', 'ssa'],
    'REC': ['recife', 'pernambuco', 'rec'],
    'FOR': ['fortaleza', 'ceará', 'for'],
    'POA': ['porto alegre', 'poa', 'rs'],
    'CWB': ['curitiba', 'cwb', 'paraná'],
    'FLN': ['florianópolis', 'floripa', 'fln'],
    'NAT': ['natal', 'rn', 'nat'],
    // International
    'LIS': ['lisboa', 'portugal', 'lis'],
    'CDG': ['paris', 'frança', 'cdg'],
    'FCO': ['roma', 'itália', 'fco'],
    'MAD': ['madri', 'espanha', 'mad'],
    'MIA': ['miami', 'flórida', 'mia'],
    'JFK': ['nova york', 'new york', 'nyc', 'jfk'],
    'LAX': ['los angeles', 'la', 'lax'],
    'LHR': ['londres', 'london', 'lhr'],
    'EZE': ['buenos aires', 'argentina', 'eze'],
    'SCL': ['santiago', 'chile', 'scl'],
  };
  
  const matchedCodes: string[] = [];
  
  for (const [code, keywords] of Object.entries(destinations)) {
    if (keywords.some(keyword => text.includes(keyword))) {
      matchedCodes.push(code);
    }
  }
  
  return matchedCodes;
};

// Find promotions that help a specific goal
const findHelpfulPromotions = (
  goal: MileageGoal,
  promotions: AirlinePromotion[],
  userMiles: number,
  t: (key: string) => string
): HelpfulPromotion[] => {
  const helpful: HelpfulPromotion[] = [];
  const milesNeeded = goal.target_miles - goal.current_miles;
  const goalDestinations = extractDestinationHints(goal);
  
  for (const promo of promotions) {
    if (!promo.is_active) continue;
    
    // Check if promotion has expired
    const endDate = new Date(promo.end_date);
    if (endDate < new Date()) continue;
    
    // Type 1: Transfer bonus promotions
    if ((promo.promotion_type === 'transfer_bonus' || promo.promotion_type === 'buy_miles') && promo.bonus_percentage) {
      const effectiveMiles = milesNeeded / (1 + promo.bonus_percentage / 100);
      const savings = milesNeeded - effectiveMiles;
      
      helpful.push({
        promotionId: promo.id,
        promotionTitle: promo.title,
        airlineName: promo.airline_name,
        type: 'bonus_purchase',
        benefitDescription: t('mileage.analysis.bonusBenefit').replace('{savings}', Math.floor(savings).toLocaleString()).replace('{percent}', String(promo.bonus_percentage)),
        adjustedMilesNeeded: Math.floor(effectiveMiles),
        savingsPercent: promo.bonus_percentage,
        savingsMiles: Math.floor(savings)
      });
    }
    
    // Type 2: Route discounts that match goal destination
    if ((promo.promotion_type === 'route_discount' || promo.promotion_type === 'route_promotion') && promo.route_to) {
      const matchesDestination = goalDestinations.some(dest => 
        promo.route_to?.toUpperCase().includes(dest) || 
        dest.includes(promo.route_to?.toUpperCase() || '')
      );
      
      if (matchesDestination && promo.miles_required) {
        const discount = promo.discount_percentage || 0;
        const adjustedMiles = promo.miles_required * (1 - discount / 100);
        
        helpful.push({
          promotionId: promo.id,
          promotionTitle: promo.title,
          airlineName: promo.airline_name,
          type: 'route_discount',
          benefitDescription: discount > 0 
            ? t('mileage.analysis.routeDiscount').replace('{percent}', String(discount)).replace('{route}', promo.route_to)
            : t('mileage.analysis.routePromotion').replace('{route}', `${promo.route_from} → ${promo.route_to}`),
          adjustedMilesNeeded: Math.floor(adjustedMiles),
          savingsPercent: discount,
          savingsMiles: discount > 0 ? Math.floor(promo.miles_required * discount / 100) : null
        });
      }
    }
    
    // Type 3: Double points for future accumulation
    if (promo.promotion_type === 'double_points' && promo.bonus_percentage) {
      helpful.push({
        promotionId: promo.id,
        promotionTitle: promo.title,
        airlineName: promo.airline_name,
        type: 'accelerates_earning',
        benefitDescription: t('mileage.analysis.doublePoints').replace('{percent}', String(promo.bonus_percentage)),
        adjustedMilesNeeded: null,
        savingsPercent: promo.bonus_percentage,
        savingsMiles: null
      });
    }
  }
  
  // Sort by savings (highest first)
  return helpful.sort((a, b) => (b.savingsMiles || 0) - (a.savingsMiles || 0));
};

// Calculate average monthly miles earned
const calculateMonthlyAverage = (history: MileageHistory[]): number => {
  if (history.length === 0) return 0;
  
  // Get last 3 months of data
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  
  const recentHistory = history.filter(h => new Date(h.calculation_date) >= threeMonthsAgo);
  
  if (recentHistory.length === 0) return 0;
  
  const totalMiles = recentHistory.reduce((sum, h) => sum + h.miles_earned, 0);
  
  // Calculate months span
  const dates = recentHistory.map(h => new Date(h.calculation_date));
  const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
  const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
  
  const monthsSpan = Math.max(1, 
    (maxDate.getFullYear() - minDate.getFullYear()) * 12 + 
    (maxDate.getMonth() - minDate.getMonth()) + 1
  );
  
  return totalMiles / monthsSpan;
};

// Main hook
export function useMileageAnalysis(
  goals: MileageGoal[],
  promotions: AirlinePromotion[],
  totalMiles: number,
  mileageHistory: MileageHistory[]
): MileageAnalysisResult {
  const { t } = useLanguage();
  
  return useMemo(() => {
    const monthlyAverage = calculateMonthlyAverage(mileageHistory);
    const goalAnalyses: GoalAnalysis[] = [];
    const promotionMatches = new Map<string, PromotionGoalMatch>();
    const events: MileageEvent[] = [];
    
    let tripsReady = 0;
    let tripsSoon = 0;
    let bestOpportunity: MileageAnalysisResult['summary']['bestOpportunity'] = null;
    let bestSavings = 0;
    
    // Analyze each goal
    for (const goal of goals) {
      if (goal.is_completed) continue;
      
      const missingMiles = Math.max(0, goal.target_miles - goal.current_miles);
      const percentComplete = Math.min((goal.current_miles / goal.target_miles) * 100, 100);
      
      // Find helpful promotions for this goal
      const helpfulPromotions = findHelpfulPromotions(goal, promotions, totalMiles, t);
      const bestPromotion = helpfulPromotions.length > 0 ? helpfulPromotions[0] : null;
      
      // Build promotion matches (for PromotionsSection badges)
      for (const hp of helpfulPromotions) {
        if (!promotionMatches.has(hp.promotionId)) {
          promotionMatches.set(hp.promotionId, {
            promotionId: hp.promotionId,
            goalIds: [],
            goalNames: []
          });
        }
        const match = promotionMatches.get(hp.promotionId)!;
        if (!match.goalIds.includes(goal.id)) {
          match.goalIds.push(goal.id);
          match.goalNames.push(goal.name);
        }
      }
      
      // Determine viability
      let viability: ViabilityStatus;
      let viabilityMessage: string;
      
      if (missingMiles <= 0) {
        viability = 'achievable';
        viabilityMessage = t('mileage.analysis.achievable');
        tripsReady++;
      } else if (percentComplete >= 50 || (bestPromotion && bestPromotion.savingsMiles && goal.current_miles + bestPromotion.savingsMiles >= goal.target_miles * 0.8)) {
        viability = 'partially_achievable';
        viabilityMessage = monthlyAverage > 0 
          ? t('mileage.analysis.partiallyAchievable')
              .replace('{miles}', Math.floor(missingMiles).toLocaleString())
              .replace('{months}', String(Math.ceil(missingMiles / monthlyAverage)))
          : t('mileage.analysis.partiallyAchievableNoEstimate').replace('{miles}', Math.floor(missingMiles).toLocaleString());
        tripsSoon++;
      } else {
        viability = 'not_achievable';
        viabilityMessage = t('mileage.analysis.notAchievable').replace('{miles}', Math.floor(missingMiles).toLocaleString());
      }
      
      // Calculate estimated months to achieve
      const estimatedMonthsToAchieve = monthlyAverage > 0 && missingMiles > 0
        ? Math.ceil(missingMiles / monthlyAverage)
        : null;
      
      goalAnalyses.push({
        goalId: goal.id,
        goalName: goal.name,
        targetMiles: goal.target_miles,
        currentMiles: goal.current_miles,
        missingMiles,
        viability,
        viabilityMessage,
        percentComplete,
        estimatedMonthsToAchieve,
        helpfulPromotions,
        bestPromotion
      });
      
      // Track best opportunity overall
      if (bestPromotion && (bestPromotion.savingsMiles || 0) > bestSavings) {
        bestSavings = bestPromotion.savingsMiles || 0;
        bestOpportunity = {
          goalName: goal.name,
          promotionTitle: bestPromotion.promotionTitle,
          savingsDescription: t('mileage.analysis.savingsDescription')
            .replace('{savings}', Math.floor(bestSavings).toLocaleString())
            .replace('{goal}', goal.name)
        };
      }
    }
    
    // Count promotions helping goals
    const promotionsHelpingGoals = promotionMatches.size;
    
    return {
      goalAnalyses,
      promotionMatches,
      events,
      summary: {
        tripsReady,
        tripsSoon,
        promotionsHelpingGoals,
        bestOpportunity
      }
    };
  }, [goals, promotions, totalMiles, mileageHistory, t]);
}
