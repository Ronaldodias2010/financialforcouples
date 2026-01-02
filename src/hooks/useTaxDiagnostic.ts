import { useState, useMemo, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface DiagnosticAnswers {
  hasCLTIncome: boolean | null;
  hasProLaboreOrPJ: boolean | null;
  hasExemptIncome: boolean | null;
  hasMedicalExpenses: boolean | null;
  hasEducationExpenses: boolean | null;
  hasDependents: boolean | null;
  boughtOrSoldAssets: boolean | null;
  hasInvestments: boolean | null;
}

export type SectionClassification = 'required' | 'attention' | 'optional';

export interface SectionStatus {
  identification: SectionClassification;
  taxableIncome: SectionClassification;
  exemptIncome: SectionClassification;
  deductions: SectionClassification;
  assets: SectionClassification;
  pending: SectionClassification;
}

export interface DiagnosticQuestion {
  id: keyof DiagnosticAnswers;
  questionKey: string;
  descriptionKey: string;
  icon: string;
}

export const DIAGNOSTIC_QUESTIONS: DiagnosticQuestion[] = [
  { id: 'hasCLTIncome', questionKey: 'tax.diagnostic.q.clt', descriptionKey: 'tax.diagnostic.q.cltDesc', icon: 'Briefcase' },
  { id: 'hasProLaboreOrPJ', questionKey: 'tax.diagnostic.q.pj', descriptionKey: 'tax.diagnostic.q.pjDesc', icon: 'Building2' },
  { id: 'hasExemptIncome', questionKey: 'tax.diagnostic.q.exempt', descriptionKey: 'tax.diagnostic.q.exemptDesc', icon: 'Banknote' },
  { id: 'hasMedicalExpenses', questionKey: 'tax.diagnostic.q.medical', descriptionKey: 'tax.diagnostic.q.medicalDesc', icon: 'Heart' },
  { id: 'hasEducationExpenses', questionKey: 'tax.diagnostic.q.education', descriptionKey: 'tax.diagnostic.q.educationDesc', icon: 'GraduationCap' },
  { id: 'hasDependents', questionKey: 'tax.diagnostic.q.dependents', descriptionKey: 'tax.diagnostic.q.dependentsDesc', icon: 'Users' },
  { id: 'boughtOrSoldAssets', questionKey: 'tax.diagnostic.q.assets', descriptionKey: 'tax.diagnostic.q.assetsDesc', icon: 'Home' },
  { id: 'hasInvestments', questionKey: 'tax.diagnostic.q.investments', descriptionKey: 'tax.diagnostic.q.investmentsDesc', icon: 'TrendingUp' },
];

const DEFAULT_ANSWERS: DiagnosticAnswers = {
  hasCLTIncome: null,
  hasProLaboreOrPJ: null,
  hasExemptIncome: null,
  hasMedicalExpenses: null,
  hasEducationExpenses: null,
  hasDependents: null,
  boughtOrSoldAssets: null,
  hasInvestments: null,
};

interface UseTaxDiagnosticParams {
  taxYear: number;
}

export function useTaxDiagnostic({ taxYear }: UseTaxDiagnosticParams) {
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<DiagnosticAnswers>(DEFAULT_ANSWERS);

  // Fetch existing diagnostic data
  const { data: diagnosticData, isLoading } = useQuery({
    queryKey: ['tax-diagnostic', taxYear],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('tax_report_config')
        .select('diagnostic_answers, diagnostic_completed_at, section_status')
        .eq('user_id', user.id)
        .eq('tax_year', taxYear)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    }
  });

  const isDiagnosticCompleted = useMemo(() => {
    if (!diagnosticData?.diagnostic_completed_at) return false;
    const completedDate = new Date(diagnosticData.diagnostic_completed_at);
    const currentYear = new Date().getFullYear();
    return completedDate.getFullYear() === currentYear;
  }, [diagnosticData]);

  const savedAnswers = diagnosticData?.diagnostic_answers as unknown as DiagnosticAnswers | null;
  const savedSectionStatus = diagnosticData?.section_status as unknown as SectionStatus | null;

  // Calculate section status based on answers
  const calculateSectionStatus = useCallback((ans: DiagnosticAnswers): SectionStatus => {
    return {
      identification: 'required',
      taxableIncome: ans.hasCLTIncome || ans.hasProLaboreOrPJ ? 'required' : 'optional',
      exemptIncome: ans.hasExemptIncome || ans.hasInvestments ? 'attention' : 'optional',
      deductions: ans.hasMedicalExpenses || ans.hasEducationExpenses || ans.hasDependents ? 'required' : 'optional',
      assets: ans.boughtOrSoldAssets || ans.hasInvestments ? 'required' : 'optional',
      pending: 'attention',
    };
  }, []);

  // Save diagnostic mutation
  const saveMutation = useMutation({
    mutationFn: async (data: { answers: DiagnosticAnswers; sectionStatus: SectionStatus }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Check if record exists
      const { data: existing } = await supabase
        .from('tax_report_config')
        .select('id')
        .eq('user_id', user.id)
        .eq('tax_year', taxYear)
        .maybeSingle();

      const answersJson = JSON.parse(JSON.stringify(data.answers));
      const statusJson = JSON.parse(JSON.stringify(data.sectionStatus));

      if (existing) {
        const { error } = await supabase
          .from('tax_report_config')
          .update({
            diagnostic_answers: answersJson,
            diagnostic_completed_at: new Date().toISOString(),
            section_status: statusJson,
            progress_percentage: 10
          })
          .eq('user_id', user.id)
          .eq('tax_year', taxYear);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('tax_report_config')
          .insert({
            user_id: user.id,
            tax_year: taxYear,
            diagnostic_answers: answersJson,
            diagnostic_completed_at: new Date().toISOString(),
            section_status: statusJson,
            status: 'incomplete',
            progress_percentage: 10
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tax-diagnostic', taxYear] });
      queryClient.invalidateQueries({ queryKey: ['income-tax-report'] });
    }
  });

  const answerQuestion = useCallback((questionId: keyof DiagnosticAnswers, value: boolean) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  }, []);

  const nextStep = useCallback(() => {
    if (currentStep < DIAGNOSTIC_QUESTIONS.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  }, [currentStep]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const completeDiagnostic = useCallback(async () => {
    const sectionStatus = calculateSectionStatus(answers);
    await saveMutation.mutateAsync({ answers, sectionStatus });
  }, [answers, calculateSectionStatus, saveMutation]);

  const resetDiagnostic = useCallback(() => {
    setAnswers(DEFAULT_ANSWERS);
    setCurrentStep(0);
  }, []);

  const progress = useMemo(() => {
    const answeredCount = Object.values(answers).filter(v => v !== null).length;
    return Math.round((answeredCount / DIAGNOSTIC_QUESTIONS.length) * 100);
  }, [answers]);

  const canComplete = useMemo(() => {
    return Object.values(answers).every(v => v !== null);
  }, [answers]);

  return {
    // State
    currentStep,
    answers,
    progress,
    canComplete,
    isLoading,
    isSaving: saveMutation.isPending,
    
    // Saved data
    isDiagnosticCompleted,
    savedAnswers,
    savedSectionStatus,
    
    // Actions
    answerQuestion,
    nextStep,
    prevStep,
    completeDiagnostic,
    resetDiagnostic,
    setCurrentStep,
  };
}
