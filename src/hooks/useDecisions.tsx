import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useCouple } from '@/hooks/useCouple';
import { toast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/useLanguage';
import { Json } from '@/integrations/supabase/types';
import { useRealtimeTable } from '@/hooks/useRealtimeManager';

export type DecisionStatus = 'draft' | 'voting' | 'agreed' | 'rejected' | 'paused' | 'completed';
export type DecisionUrgency = 'low' | 'medium' | 'high' | 'urgent';
export type DecisionMotivation = 'necessity' | 'dream' | 'comfort' | 'investment' | 'other';
export type VoteType = 'agree' | 'agree_with_condition' | 'disagree';

export interface DecisionScenario {
  id: string;
  name: string;
  description: string;
  estimatedValue: number;
  monthlyImpact: number;
  cashFlowImpact: number;
  emergencyFundImpact: number;
  investmentImpact: number;
  projections: {
    month3: number;
    month6: number;
    month12: number;
  };
}

export interface Decision {
  id: string;
  couple_id: string;
  created_by: string;
  status: DecisionStatus;
  decision_type: string;
  title: string;
  description: string | null;
  estimated_value: number | null;
  currency: string;
  urgency: DecisionUrgency;
  category: string | null;
  motivation: DecisionMotivation | null;
  target_date: string | null;
  who_wants: 'user1' | 'user2' | 'both' | null;
  context_data: Record<string, any>;
  restrictions: Record<string, any>;
  scenarios: DecisionScenario[];
  final_decision: Record<string, any> | null;
  action_plan: any[];
  paused_until: string | null;
  created_at: string;
  updated_at: string;
}

export interface DecisionVote {
  id: string;
  decision_id: string;
  user_id: string;
  vote: VoteType;
  selected_scenario: string | null;
  condition: string | null;
  notes: string | null;
  created_at: string;
}

// Helper to convert DB row to Decision type
const mapDbRowToDecision = (row: any): Decision => ({
  ...row,
  scenarios: Array.isArray(row.scenarios) ? row.scenarios : [],
  context_data: row.context_data || {},
  restrictions: row.restrictions || {},
  action_plan: Array.isArray(row.action_plan) ? row.action_plan : [],
  final_decision: row.final_decision || null
});

export interface Agreement {
  id: string;
  couple_id: string;
  decision_id: string | null;
  agreement_type: string;
  title: string;
  description: string | null;
  rules: Record<string, any>;
  is_active: boolean;
  review_date: string | null;
  created_by: string | null;
  accepted_by_user1: boolean;
  accepted_by_user2: boolean;
  created_at: string;
}

// Decision templates
export const DECISION_TEMPLATES = [
  {
    id: 'buy_vs_rent',
    type: 'buy_vs_rent',
    icon: '🏠',
    defaultRestrictions: { canInstall: true, canDefer: true }
  },
  {
    id: 'pay_debt_vs_invest',
    type: 'pay_debt_vs_invest',
    icon: '💰',
    defaultRestrictions: { canInstall: false, canDefer: true }
  },
  {
    id: 'change_car',
    type: 'change_car',
    icon: '🚗',
    defaultRestrictions: { canInstall: true, canDefer: true }
  },
  {
    id: 'travel_miles_vs_money',
    type: 'travel_miles_vs_money',
    icon: '✈️',
    defaultRestrictions: { canInstall: true, canDefer: true }
  },
  {
    id: 'big_purchase',
    type: 'big_purchase',
    icon: '🛒',
    defaultRestrictions: { canInstall: true, canDefer: true }
  },
  {
    id: 'custom',
    type: 'custom',
    icon: '✏️',
    defaultRestrictions: {}
  }
];

export const useDecisions = () => {
  const { user } = useAuth();
  const { couple, isPartOfCouple } = useCouple();
  const { t } = useLanguage();
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDecisions = useCallback(async () => {
    if (!couple?.id) {
      setDecisions([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await (supabase as any)
        .from('couple_decisions')
        .select('*')
        .eq('couple_id', couple.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDecisions((data || []).map(mapDbRowToDecision));
    } catch (error) {
      console.error('Error fetching decisions:', error);
    } finally {
      setLoading(false);
    }
  }, [couple?.id]);

  const fetchAgreements = useCallback(async () => {
    if (!couple?.id) {
      setAgreements([]);
      return;
    }

    try {
      const { data, error } = await (supabase as any)
        .from('couple_agreements')
        .select('*')
        .eq('couple_id', couple.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAgreements((data || []) as Agreement[]);
    } catch (error) {
      console.error('Error fetching agreements:', error);
    }
  }, [couple?.id]);

  useEffect(() => {
    if (isPartOfCouple && couple?.id) {
      fetchDecisions();
      fetchAgreements();
    } else {
      setLoading(false);
    }
  }, [isPartOfCouple, couple?.id, fetchDecisions, fetchAgreements]);

  // Use centralized realtime manager
  useRealtimeTable('couple_decisions', () => {
    fetchDecisions();
  }, !!couple?.id);

  useRealtimeTable('couple_agreements', () => {
    fetchAgreements();
  }, !!couple?.id);

  const createDecision = async (decisionData: Partial<Decision>): Promise<Decision | null> => {
    if (!couple?.id || !user?.id) {
      toast({
        title: t('decisions.error.noCouple'),
        variant: 'destructive'
      });
      return null;
    }

    try {
      const insertData = {
        couple_id: couple.id,
        created_by: user.id,
        decision_type: decisionData.decision_type || 'custom',
        title: decisionData.title || '',
        description: decisionData.description || null,
        estimated_value: decisionData.estimated_value || null,
        currency: decisionData.currency || 'BRL',
        urgency: decisionData.urgency || 'medium',
        category: decisionData.category || null,
        motivation: decisionData.motivation || null,
        target_date: decisionData.target_date || null,
        who_wants: decisionData.who_wants || null,
        context_data: (decisionData.context_data || {}) as Json,
        restrictions: (decisionData.restrictions || {}) as Json,
        scenarios: (decisionData.scenarios || []) as unknown as Json,
        status: decisionData.status || 'draft'
      };

      const { data, error } = await (supabase as any)
        .from('couple_decisions')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: t('decisions.created'),
        description: t('decisions.createdDescription')
      });

      await fetchDecisions();
      return mapDbRowToDecision(data);
    } catch (error) {
      console.error('Error creating decision:', error);
      toast({
        title: t('decisions.error.create'),
        variant: 'destructive'
      });
      return null;
    }
  };

  const updateDecision = async (id: string, updates: Partial<Decision>): Promise<boolean> => {
    try {
      // Convert scenarios to Json if present
      const dbUpdates: any = { ...updates };
      if (updates.scenarios) {
        dbUpdates.scenarios = updates.scenarios as unknown as Json;
      }
      if (updates.context_data) {
        dbUpdates.context_data = updates.context_data as Json;
      }
      if (updates.restrictions) {
        dbUpdates.restrictions = updates.restrictions as Json;
      }
      
      const { error } = await (supabase as any)
        .from('couple_decisions')
        .update(dbUpdates)
        .eq('id', id);

      if (error) throw error;

      await fetchDecisions();
      return true;
    } catch (error) {
      console.error('Error updating decision:', error);
      toast({
        title: t('decisions.error.update'),
        variant: 'destructive'
      });
      return false;
    }
  };

  const submitVote = async (
    decisionId: string,
    vote: VoteType,
    selectedScenario?: string,
    condition?: string,
    notes?: string
  ): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      const { error } = await (supabase as any)
        .from('couple_decision_votes')
        .upsert({
          decision_id: decisionId,
          user_id: user.id,
          vote,
          selected_scenario: selectedScenario,
          condition,
          notes
        }, {
          onConflict: 'decision_id,user_id'
        });

      if (error) throw error;

      toast({
        title: t('decisions.voteSubmitted'),
        description: t('decisions.voteSubmittedDescription')
      });

      return true;
    } catch (error) {
      console.error('Error submitting vote:', error);
      toast({
        title: t('decisions.error.vote'),
        variant: 'destructive'
      });
      return false;
    }
  };

  const getVotesForDecision = async (decisionId: string): Promise<DecisionVote[]> => {
    try {
      const { data, error } = await (supabase as any)
        .from('couple_decision_votes')
        .select('*')
        .eq('decision_id', decisionId);

      if (error) throw error;
      return (data || []) as DecisionVote[];
    } catch (error) {
      console.error('Error fetching votes:', error);
      return [];
    }
  };

  const createAgreement = async (agreementData: Partial<Agreement>): Promise<Agreement | null> => {
    if (!couple?.id || !user?.id) return null;

    try {
      const { data, error } = await (supabase as any)
        .from('couple_agreements')
        .insert({
          couple_id: couple.id,
          decision_id: agreementData.decision_id,
          agreement_type: agreementData.agreement_type || 'custom',
          title: agreementData.title || '',
          description: agreementData.description,
          rules: agreementData.rules || {},
          created_by: user.id,
          review_date: agreementData.review_date
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: t('decisions.agreementCreated'),
        description: t('decisions.agreementCreatedDescription')
      });

      await fetchAgreements();
      return data as Agreement;
    } catch (error) {
      console.error('Error creating agreement:', error);
      toast({
        title: t('decisions.error.createAgreement'),
        variant: 'destructive'
      });
      return null;
    }
  };

  const pauseDecision = async (decisionId: string, hours: number = 24): Promise<boolean> => {
    const pausedUntil = new Date();
    pausedUntil.setHours(pausedUntil.getHours() + hours);

    return updateDecision(decisionId, {
      status: 'paused',
      paused_until: pausedUntil.toISOString()
    });
  };

  const getPendingDecisions = () => decisions.filter(d => d.status === 'voting' || d.status === 'draft');
  const getCompletedDecisions = () => decisions.filter(d => d.status === 'completed' || d.status === 'agreed');
  const getActiveAgreements = () => agreements.filter(a => a.is_active);

  return {
    decisions,
    agreements,
    loading,
    createDecision,
    updateDecision,
    submitVote,
    getVotesForDecision,
    createAgreement,
    pauseDecision,
    getPendingDecisions,
    getCompletedDecisions,
    getActiveAgreements,
    refreshDecisions: fetchDecisions,
    refreshAgreements: fetchAgreements,
    isPartOfCouple
  };
};
