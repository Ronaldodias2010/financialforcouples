import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  ClipboardCheck,
  Loader2,
  Flag
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { TaxReportSummary } from '@/hooks/useIncomeTaxReport';

interface ChecklistItem {
  id: string;
  labelKey: string;
  passed: boolean;
  required: boolean;
}

interface TaxFinalChecklistProps {
  summary: TaxReportSummary;
  hasBlockingValidations: boolean;
  hasEstimate: boolean;
  onMarkReady: () => void;
  isMarking?: boolean;
}

export function TaxFinalChecklist({
  summary,
  hasBlockingValidations,
  hasEstimate,
  onMarkReady,
  isMarking,
}: TaxFinalChecklistProps) {
  const { t } = useLanguage();
  const [userConfirmed, setUserConfirmed] = React.useState(false);

  const checklistItems: ChecklistItem[] = [
    {
      id: 'identification',
      labelKey: 'tax.checklist.identification',
      passed: summary.progress >= 10, // Basic profile check
      required: true,
    },
    {
      id: 'income',
      labelKey: 'tax.checklist.income',
      passed: summary.taxableIncome > 0 || summary.exemptIncome > 0,
      required: true,
    },
    {
      id: 'deductions',
      labelKey: 'tax.checklist.deductions',
      passed: true, // Deductions are optional
      required: false,
    },
    {
      id: 'assets',
      labelKey: 'tax.checklist.assets',
      passed: true, // Assets are optional
      required: false,
    },
    {
      id: 'validations',
      labelKey: 'tax.checklist.validations',
      passed: !hasBlockingValidations,
      required: true,
    },
    {
      id: 'estimate',
      labelKey: 'tax.checklist.estimate',
      passed: hasEstimate,
      required: true,
    },
  ];

  const requiredItems = checklistItems.filter(item => item.required);
  const allRequiredPassed = requiredItems.every(item => item.passed);
  const canProceed = allRequiredPassed && userConfirmed;

  const passedCount = checklistItems.filter(item => item.passed).length;
  const progress = Math.round((passedCount / checklistItems.length) * 100);

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <ClipboardCheck className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">{t('tax.checklist.title')}</CardTitle>
            <CardDescription>{t('tax.checklist.subtitle')}</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress indicator */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{t('tax.checklist.progress')}</span>
          <Badge variant="outline" className={progress === 100 ? 'bg-green-500/10 text-green-500' : ''}>
            {passedCount}/{checklistItems.length} {t('tax.checklist.items')}
          </Badge>
        </div>

        {/* Checklist items */}
        <div className="space-y-3">
          {checklistItems.map((item) => (
            <div 
              key={item.id}
              className={`flex items-center gap-3 p-3 rounded-lg border ${
                item.passed 
                  ? 'bg-green-500/5 border-green-500/20' 
                  : item.required 
                    ? 'bg-red-500/5 border-red-500/20'
                    : 'bg-muted/50 border-muted'
              }`}
            >
              {item.passed ? (
                <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
              ) : item.required ? (
                <XCircle className="h-5 w-5 text-red-500 shrink-0" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-muted-foreground shrink-0" />
              )}
              
              <span className={`flex-1 text-sm ${item.passed ? '' : item.required ? 'text-red-700 dark:text-red-400' : 'text-muted-foreground'}`}>
                {t(item.labelKey)}
              </span>
              
              {item.required && (
                <Badge variant="outline" className="text-xs">
                  {t('tax.checklist.required')}
                </Badge>
              )}
            </div>
          ))}
        </div>

        {/* User confirmation */}
        <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg border">
          <Checkbox
            id="user-confirm"
            checked={userConfirmed}
            onCheckedChange={(checked) => setUserConfirmed(checked === true)}
            disabled={!allRequiredPassed}
          />
          <label 
            htmlFor="user-confirm" 
            className={`text-sm cursor-pointer ${!allRequiredPassed ? 'text-muted-foreground' : ''}`}
          >
            {t('tax.checklist.confirmation')}
          </label>
        </div>

        {/* Action button */}
        <Button
          className="w-full"
          size="lg"
          disabled={!canProceed || isMarking}
          onClick={onMarkReady}
        >
          {isMarking ? (
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
          ) : (
            <Flag className="h-5 w-5 mr-2" />
          )}
          {t('tax.checklist.markReady')}
        </Button>

        {!allRequiredPassed && (
          <p className="text-xs text-center text-muted-foreground">
            {t('tax.checklist.resolveFirst')}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
