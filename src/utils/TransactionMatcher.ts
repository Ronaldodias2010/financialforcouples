export interface MatchCandidate {
  id: string;
  date: Date;
  amount: number;
  description: string;
  source: 'database' | 'imported';
}

export interface MatchResult {
  importedTransaction: MatchCandidate;
  existingTransaction: MatchCandidate | null;
  matchScore: number;
  matchReasons: string[];
  isLikelyDuplicate: boolean;
  confidence: 'high' | 'medium' | 'low';
}

export class TransactionMatcher {
  private readonly DATE_TOLERANCE_DAYS = 3;
  private readonly AMOUNT_TOLERANCE_PERCENT = 0.01; // 1%
  private readonly MIN_MATCH_SCORE = 0.6;

  /**
   * Find potential matches for imported transactions against existing database records
   */
  async findMatches(
    importedTransactions: MatchCandidate[],
    existingTransactions: MatchCandidate[]
  ): Promise<MatchResult[]> {
    const results: MatchResult[] = [];

    for (const imported of importedTransactions) {
      const matchResult = await this.findBestMatch(imported, existingTransactions);
      results.push(matchResult);
    }

    return results;
  }

  private async findBestMatch(
    importedTransaction: MatchCandidate,
    existingTransactions: MatchCandidate[]
  ): Promise<MatchResult> {
    let bestMatch: MatchCandidate | null = null;
    let bestScore = 0;
    let bestReasons: string[] = [];

    for (const existing of existingTransactions) {
      const { score, reasons } = this.calculateMatchScore(importedTransaction, existing);
      
      if (score > bestScore && score >= this.MIN_MATCH_SCORE) {
        bestScore = score;
        bestMatch = existing;
        bestReasons = reasons;
      }
    }

    return {
      importedTransaction,
      existingTransaction: bestMatch,
      matchScore: bestScore,
      matchReasons: bestReasons,
      isLikelyDuplicate: bestScore >= 0.8,
      confidence: this.getConfidenceLevel(bestScore)
    };
  }

  private calculateMatchScore(imported: MatchCandidate, existing: MatchCandidate): {
    score: number;
    reasons: string[];
  } {
    let score = 0;
    const reasons: string[] = [];
    const weights = {
      exactAmount: 0.4,
      similarAmount: 0.3,
      dateMatch: 0.3,
      descriptionSimilarity: 0.2
    };

    // Amount matching
    const amountDiff = Math.abs(imported.amount - existing.amount);
    const amountPercent = amountDiff / Math.abs(existing.amount);

    if (amountDiff === 0) {
      score += weights.exactAmount;
      reasons.push('Valor exato');
    } else if (amountPercent <= this.AMOUNT_TOLERANCE_PERCENT) {
      score += weights.similarAmount;
      reasons.push('Valor similar');
    }

    // Date matching
    const daysDiff = Math.abs(
      (imported.date.getTime() - existing.date.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysDiff === 0) {
      score += weights.dateMatch;
      reasons.push('Data exata');
    } else if (daysDiff <= this.DATE_TOLERANCE_DAYS) {
      score += weights.dateMatch * (1 - daysDiff / this.DATE_TOLERANCE_DAYS);
      reasons.push(`Data próxima (${Math.round(daysDiff)} dias)`);
    }

    // Description similarity using fuzzy matching
    const descriptionSimilarity = this.calculateStringSimilarity(
      this.normalizeDescription(imported.description),
      this.normalizeDescription(existing.description)
    );

    if (descriptionSimilarity >= 0.8) {
      score += weights.descriptionSimilarity;
      reasons.push('Descrição similar');
    } else if (descriptionSimilarity >= 0.5) {
      score += weights.descriptionSimilarity * descriptionSimilarity;
      reasons.push('Descrição parcialmente similar');
    }

    return { score: Math.min(score, 1), reasons };
  }

  private normalizeDescription(description: string): string {
    return description
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[^\w\s]/g, ' ') // Replace special chars with spaces
      .replace(/\s+/g, ' ') // Normalize spaces
      .trim();
  }

  private calculateStringSimilarity(str1: string, str2: string): number {
    // Jaro-Winkler similarity implementation
    if (str1 === str2) return 1;
    if (str1.length === 0 || str2.length === 0) return 0;

    const matchWindow = Math.floor(Math.max(str1.length, str2.length) / 2) - 1;
    if (matchWindow < 0) return 0;

    const str1Matches = new Array(str1.length).fill(false);
    const str2Matches = new Array(str2.length).fill(false);

    let matches = 0;
    let transpositions = 0;

    // Find matches
    for (let i = 0; i < str1.length; i++) {
      const start = Math.max(0, i - matchWindow);
      const end = Math.min(i + matchWindow + 1, str2.length);

      for (let j = start; j < end; j++) {
        if (str2Matches[j] || str1[i] !== str2[j]) continue;
        str1Matches[i] = true;
        str2Matches[j] = true;
        matches++;
        break;
      }
    }

    if (matches === 0) return 0;

    // Find transpositions
    let k = 0;
    for (let i = 0; i < str1.length; i++) {
      if (!str1Matches[i]) continue;
      while (!str2Matches[k]) k++;
      if (str1[i] !== str2[k]) transpositions++;
      k++;
    }

    const jaro = (matches / str1.length + matches / str2.length + 
                  (matches - transpositions / 2) / matches) / 3;

    // Jaro-Winkler prefix bonus
    let prefix = 0;
    for (let i = 0; i < Math.min(str1.length, str2.length, 4); i++) {
      if (str1[i] === str2[i]) prefix++;
      else break;
    }

    return jaro + 0.1 * prefix * (1 - jaro);
  }

  private getConfidenceLevel(score: number): 'high' | 'medium' | 'low' {
    if (score >= 0.8) return 'high';
    if (score >= 0.6) return 'medium';
    return 'low';
  }

  /**
   * Group transactions by similarity to identify potential duplicates within the imported set
   */
  findInternalDuplicates(transactions: MatchCandidate[]): MatchCandidate[][] {
    const groups: MatchCandidate[][] = [];
    const processed = new Set<string>();

    for (const transaction of transactions) {
      if (processed.has(transaction.id)) continue;

      const group = [transaction];
      processed.add(transaction.id);

      for (const other of transactions) {
        if (processed.has(other.id) || transaction.id === other.id) continue;

        const { score } = this.calculateMatchScore(transaction, other);
        if (score >= 0.8) {
          group.push(other);
          processed.add(other.id);
        }
      }

      if (group.length > 1) {
        groups.push(group);
      }
    }

    return groups;
  }

  /**
   * Suggest which transactions to keep from a duplicate group
   */
  suggestKeepTransaction(duplicateGroup: MatchCandidate[]): MatchCandidate {
    // Prefer transactions with more complete descriptions
    let best = duplicateGroup[0];
    
    for (const transaction of duplicateGroup) {
      if (transaction.description.length > best.description.length) {
        best = transaction;
      }
    }

    return best;
  }

  /**
   * Generate a reconciliation report
   */
  generateReconciliationReport(matchResults: MatchResult[]): {
    totalImported: number;
    exactMatches: number;
    likelyDuplicates: number;
    newTransactions: number;
    needsReview: number;
    confidence: {
      high: number;
      medium: number;
      low: number;
    };
  } {
    const total = matchResults.length;
    const exactMatches = matchResults.filter(r => r.matchScore === 1).length;
    const likelyDuplicates = matchResults.filter(r => r.isLikelyDuplicate).length;
    const newTransactions = matchResults.filter(r => !r.existingTransaction).length;
    const needsReview = matchResults.filter(r => 
      r.existingTransaction && r.confidence === 'medium'
    ).length;

    const confidence = {
      high: matchResults.filter(r => r.confidence === 'high').length,
      medium: matchResults.filter(r => r.confidence === 'medium').length,
      low: matchResults.filter(r => r.confidence === 'low').length
    };

    return {
      totalImported: total,
      exactMatches,
      likelyDuplicates,
      newTransactions,
      needsReview,
      confidence
    };
  }
}

export const transactionMatcher = new TransactionMatcher();