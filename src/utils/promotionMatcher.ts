// Utility to match promotions with user mileage goals

interface MileageGoal {
  id: string;
  name: string;
  description: string | null;
  target_miles: number;
  current_miles: number;
}

interface ScrapedPromotion {
  id: string;
  programa: string;
  origem: string | null;
  destino: string;
  milhas_min: number;
  link: string;
  titulo: string | null;
  descricao: string | null;
  created_at: string;
  fonte: string;
}

// Extended destination mapping for better matching
const destinationKeywords: Record<string, string[]> = {
  // USA Cities
  'Miami': ['miami', 'eua', 'estados unidos', 'usa', 'flórida', 'florida', 'america'],
  'Orlando': ['orlando', 'eua', 'estados unidos', 'usa', 'disney', 'flórida', 'florida', 'america'],
  'New York': ['nova york', 'new york', 'nyc', 'eua', 'estados unidos', 'usa', 'america', 'manhattan'],
  'Los Angeles': ['los angeles', 'la', 'eua', 'estados unidos', 'usa', 'california', 'hollywood', 'america'],
  'Las Vegas': ['las vegas', 'vegas', 'eua', 'estados unidos', 'usa', 'america'],
  
  // Europe
  'Lisboa': ['lisboa', 'lisbon', 'portugal', 'europa', 'europe'],
  'Paris': ['paris', 'frança', 'france', 'europa', 'europe'],
  'Londres': ['londres', 'london', 'inglaterra', 'uk', 'reino unido', 'europa', 'europe'],
  'Madri': ['madri', 'madrid', 'espanha', 'spain', 'europa', 'europe'],
  'Roma': ['roma', 'rome', 'itália', 'italy', 'europa', 'europe'],
  'Barcelona': ['barcelona', 'espanha', 'spain', 'europa', 'europe'],
  'Amsterdam': ['amsterdam', 'holanda', 'netherlands', 'europa', 'europe'],
  
  // South America
  'Buenos Aires': ['buenos aires', 'argentina', 'america do sul', 'south america'],
  'Santiago': ['santiago', 'chile', 'america do sul', 'south america'],
  'Lima': ['lima', 'peru', 'america do sul', 'south america'],
  'Bogotá': ['bogotá', 'bogota', 'colombia', 'colômbia', 'america do sul', 'south america'],
  
  // Brazil
  'São Paulo': ['são paulo', 'sp', 'sampa'],
  'Rio de Janeiro': ['rio de janeiro', 'rio', 'rj'],
  'Salvador': ['salvador', 'bahia', 'nordeste'],
  'Recife': ['recife', 'pernambuco', 'nordeste'],
  'Fortaleza': ['fortaleza', 'ceará', 'nordeste'],
  'Natal': ['natal', 'rn', 'nordeste'],
  'Florianópolis': ['florianópolis', 'floripa', 'santa catarina', 'sc'],
  'Porto Alegre': ['porto alegre', 'poa', 'rs', 'rio grande do sul'],
  
  // Caribbean
  'Cancun': ['cancun', 'cancún', 'méxico', 'mexico', 'caribe', 'caribbean'],
  'Punta Cana': ['punta cana', 'república dominicana', 'caribe', 'caribbean'],
  'Aruba': ['aruba', 'caribe', 'caribbean'],
  
  // Asia
  'Tóquio': ['tóquio', 'tokyo', 'japão', 'japan', 'ásia', 'asia'],
  'Dubai': ['dubai', 'emirados', 'uae', 'oriente médio', 'middle east'],
};

export interface PromotionMatch {
  promotion: ScrapedPromotion;
  goal: MileageGoal;
  matchScore: number; // Higher = better match
  matchReason: string;
}

/**
 * Find promotions that match user's mileage goals
 */
export function findMatchingPromotions(
  promotions: ScrapedPromotion[],
  goals: MileageGoal[]
): PromotionMatch[] {
  const matches: PromotionMatch[] = [];

  for (const promotion of promotions) {
    for (const goal of goals) {
      const match = checkMatch(promotion, goal);
      if (match) {
        matches.push({
          promotion,
          goal,
          matchScore: match.score,
          matchReason: match.reason,
        });
      }
    }
  }

  // Sort by match score (highest first) and then by miles (lowest first for best deals)
  return matches.sort((a, b) => {
    if (b.matchScore !== a.matchScore) {
      return b.matchScore - a.matchScore;
    }
    return a.promotion.milhas_min - b.promotion.milhas_min;
  });
}

function checkMatch(
  promotion: ScrapedPromotion,
  goal: MileageGoal
): { score: number; reason: string } | null {
  const goalText = `${goal.name} ${goal.description || ''}`.toLowerCase();
  const promoDestination = promotion.destino.toLowerCase();
  const promoTitle = (promotion.titulo || '').toLowerCase();
  
  // Check if promotion destination directly matches goal text
  if (goalText.includes(promoDestination)) {
    return {
      score: 100, // Perfect match
      reason: `Destino exato: ${promotion.destino}`,
    };
  }

  // Check using keyword mapping
  for (const [destination, keywords] of Object.entries(destinationKeywords)) {
    const destinationLower = destination.toLowerCase();
    
    // Check if promotion is for this destination
    const isPromoForDestination = 
      promoDestination.includes(destinationLower) || 
      destinationLower.includes(promoDestination);
    
    if (!isPromoForDestination) continue;

    // Check if goal mentions any of the keywords for this destination
    for (const keyword of keywords) {
      if (goalText.includes(keyword)) {
        // Higher score for more specific matches
        const score = keyword === promoDestination ? 95 : 80;
        return {
          score,
          reason: `Corresponde a "${keyword}" na sua meta`,
        };
      }
    }
  }

  // Generic country/region matching
  const countryPatterns = [
    { pattern: /\beua\b|\bestados unidos\b|\busa\b|\bamerica\b/i, destinations: ['miami', 'orlando', 'new york', 'los angeles', 'las vegas'] },
    { pattern: /\beuropa\b|\beurope\b/i, destinations: ['lisboa', 'paris', 'londres', 'london', 'madrid', 'madri', 'roma', 'rome', 'amsterdam', 'barcelona'] },
    { pattern: /\bnordeste\b/i, destinations: ['salvador', 'recife', 'fortaleza', 'natal', 'maceió', 'joão pessoa'] },
    { pattern: /\bcaribe\b|\bcaribbean\b/i, destinations: ['cancun', 'cancún', 'punta cana', 'aruba', 'curaçao'] },
  ];

  for (const { pattern, destinations } of countryPatterns) {
    if (pattern.test(goalText)) {
      if (destinations.some(d => promoDestination.includes(d) || d.includes(promoDestination))) {
        return {
          score: 70,
          reason: `Região correspondente`,
        };
      }
    }
  }

  return null;
}

/**
 * Get the best matching promotion for a specific goal
 */
export function getBestPromotionForGoal(
  promotions: ScrapedPromotion[],
  goal: MileageGoal,
  userMiles: number
): PromotionMatch | null {
  const matches = findMatchingPromotions(promotions, [goal]);
  
  if (matches.length === 0) return null;

  // Prioritize redeemable promotions
  const redeemable = matches.filter(m => userMiles >= m.promotion.milhas_min);
  if (redeemable.length > 0) {
    return redeemable[0];
  }

  return matches[0];
}
