import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle, 
  XCircle,
  Briefcase,
  Building2,
  Banknote,
  Heart,
  GraduationCap,
  Users,
  Home,
  TrendingUp,
  Loader2,
  Sparkles
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTaxDiagnostic, DIAGNOSTIC_QUESTIONS, DiagnosticAnswers, SectionClassification } from '@/hooks/useTaxDiagnostic';

const iconMap: Record<string, React.ElementType> = {
  Briefcase,
  Building2,
  Banknote,
  Heart,
  GraduationCap,
  Users,
  Home,
  TrendingUp,
};

interface TaxDiagnosticWizardProps {
  taxYear: number;
  onComplete: () => void;
  onSkip: () => void;
}

export function TaxDiagnosticWizard({ taxYear, onComplete, onSkip }: TaxDiagnosticWizardProps) {
  const { t } = useLanguage();
  const {
    currentStep,
    answers,
    progress,
    canComplete,
    isSaving,
    answerQuestion,
    nextStep,
    prevStep,
    completeDiagnostic,
    setCurrentStep,
  } = useTaxDiagnostic({ taxYear });

  const currentQuestion = DIAGNOSTIC_QUESTIONS[currentStep];
  const isLastStep = currentStep === DIAGNOSTIC_QUESTIONS.length - 1;
  const currentAnswer = answers[currentQuestion.id];
  const IconComponent = iconMap[currentQuestion.icon] || Briefcase;

  const handleAnswer = (value: boolean) => {
    answerQuestion(currentQuestion.id, value);
    if (!isLastStep) {
      setTimeout(nextStep, 300);
    }
  };

  const handleComplete = async () => {
    await completeDiagnostic();
    onComplete();
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="border-primary/20">
        <CardHeader className="text-center pb-2">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
              {t('tax.diagnostic.badge')}
            </Badge>
          </div>
          <CardTitle className="text-xl">{t('tax.diagnostic.title')}</CardTitle>
          <CardDescription>{t('tax.diagnostic.subtitle')}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{t('tax.diagnostic.question')} {currentStep + 1} {t('tax.diagnostic.of')} {DIAGNOSTIC_QUESTIONS.length}</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Question Steps */}
          <div className="flex justify-center gap-1">
            {DIAGNOSTIC_QUESTIONS.map((q, idx) => {
              const answer = answers[q.id];
              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentStep(idx)}
                  className={`w-3 h-3 rounded-full transition-all ${
                    idx === currentStep 
                      ? 'bg-primary scale-125' 
                      : answer === null 
                        ? 'bg-muted hover:bg-muted-foreground/30' 
                        : answer 
                          ? 'bg-green-500' 
                          : 'bg-muted-foreground/50'
                  }`}
                />
              );
            })}
          </div>

          {/* Current Question */}
          <Card className="bg-muted/30 border-0">
            <CardContent className="p-6 text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <IconComponent className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                {t(currentQuestion.questionKey)}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t(currentQuestion.descriptionKey)}
              </p>
            </CardContent>
          </Card>

          {/* Answer Buttons */}
          <div className="flex gap-4 justify-center">
            <Button
              variant={currentAnswer === true ? 'default' : 'outline'}
              size="lg"
              className={`flex-1 max-w-[140px] ${currentAnswer === true ? 'bg-green-600 hover:bg-green-700' : ''}`}
              onClick={() => handleAnswer(true)}
            >
              <CheckCircle className="h-5 w-5 mr-2" />
              {t('common.yes')}
            </Button>
            <Button
              variant={currentAnswer === false ? 'default' : 'outline'}
              size="lg"
              className={`flex-1 max-w-[140px] ${currentAnswer === false ? 'bg-muted-foreground hover:bg-muted-foreground/80' : ''}`}
              onClick={() => handleAnswer(false)}
            >
              <XCircle className="h-5 w-5 mr-2" />
              {t('common.no')}
            </Button>
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center pt-4 border-t">
            <Button
              variant="ghost"
              onClick={prevStep}
              disabled={currentStep === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              {t('common.back')}
            </Button>

            <Button
              variant="link"
              onClick={onSkip}
              className="text-muted-foreground"
            >
              {t('tax.diagnostic.skip')}
            </Button>

            {isLastStep ? (
              <Button
                onClick={handleComplete}
                disabled={!canComplete || isSaving}
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                {t('tax.diagnostic.finish')}
              </Button>
            ) : (
              <Button
                onClick={nextStep}
                disabled={currentAnswer === null}
              >
                {t('common.next')}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Section status badge component
interface SectionStatusBadgeProps {
  status: SectionClassification;
}

export function SectionStatusBadge({ status }: SectionStatusBadgeProps) {
  const { t } = useLanguage();
  
  const config = {
    required: {
      className: 'bg-red-500/10 text-red-500 border-red-500/20',
      labelKey: 'tax.diagnostic.required',
    },
    attention: {
      className: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
      labelKey: 'tax.diagnostic.attention',
    },
    optional: {
      className: 'bg-muted text-muted-foreground',
      labelKey: 'tax.diagnostic.optional',
    },
  };

  const { className, labelKey } = config[status];

  return (
    <Badge variant="outline" className={`text-xs ${className}`}>
      {t(labelKey)}
    </Badge>
  );
}
