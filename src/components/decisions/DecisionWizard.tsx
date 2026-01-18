import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DateInput } from '@/components/ui/date-input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowLeft, 
  ArrowRight,
  Check,
  Home,
  Car,
  Plane,
  ShoppingCart,
  PiggyBank,
  Pencil,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Heart,
  Pause
} from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { useDecisions, DECISION_TEMPLATES, DecisionScenario } from '@/hooks/useDecisions';
import { useFinancialData } from '@/hooks/useFinancialData';

interface DecisionWizardProps {
  onBack: () => void;
  onComplete: () => void;
}

const TEMPLATE_ICONS: Record<string, any> = {
  'buy_vs_rent': Home,
  'pay_debt_vs_invest': PiggyBank,
  'change_car': Car,
  'travel_miles_vs_money': Plane,
  'big_purchase': ShoppingCart,
  'custom': Pencil
};

export const DecisionWizard = ({ onBack, onComplete }: DecisionWizardProps) => {
  const { t } = useLanguage();
  const { createDecision, updateDecision, submitVote } = useDecisions();
  const { userPreferredCurrency, getAccountsBalance } = useFinancialData();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1 - Template
    decision_type: '',
    
    // Step 2 - Context
    title: '',
    description: '',
    estimated_value: '',
    urgency: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    category: '',
    who_wants: 'both' as 'user1' | 'user2' | 'both',
    motivation: '' as 'necessity' | 'dream' | 'comfort' | 'investment' | 'other' | '',
    target_date: '',
    
    // Step 3 - Restrictions
    monthlyLimit: '',
    canInstall: true,
    maxInstallments: '',
    canDefer: true,
    affectsGoals: false,
    affectsEmergencyFund: false,
    
    // Step 4 - Scenarios (generated)
    scenarios: [] as DecisionScenario[],
    
    // Step 5 - Vote
    vote: '' as 'agree' | 'agree_with_condition' | 'disagree' | '',
    selectedScenario: '',
    condition: '',
    
    // Step 6 - Agreement rules
    spendingLimitWithoutNotice: '',
    maxInstallmentWithoutConsensus: '',
    categoriesRequireConsensus: [] as string[]
  });

  const totalSteps = 6;
  const progress = (currentStep / totalSteps) * 100;

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const generateScenarios = (): DecisionScenario[] => {
    const value = parseFloat(formData.estimated_value) || 0;
    const monthlyImpact = value / 12;
    
    return [
      {
        id: 'A',
        name: t('decisions.scenario.immediate'),
        description: t('decisions.scenario.immediateDesc'),
        estimatedValue: value,
        monthlyImpact: value,
        cashFlowImpact: -value,
        emergencyFundImpact: value > 5000 ? -10 : -5,
        investmentImpact: -15,
        projections: {
          month3: -value * 0.1,
          month6: -value * 0.05,
          month12: 0
        }
      },
      {
        id: 'B',
        name: t('decisions.scenario.installments'),
        description: t('decisions.scenario.installmentsDesc'),
        estimatedValue: value * 1.1, // With interest
        monthlyImpact: monthlyImpact * 1.1,
        cashFlowImpact: -monthlyImpact * 1.1,
        emergencyFundImpact: -2,
        investmentImpact: -5,
        projections: {
          month3: -monthlyImpact * 3.3,
          month6: -monthlyImpact * 6.6,
          month12: -value * 1.1
        }
      },
      {
        id: 'C',
        name: t('decisions.scenario.postpone'),
        description: t('decisions.scenario.postponeDesc'),
        estimatedValue: 0,
        monthlyImpact: 0,
        cashFlowImpact: 0,
        emergencyFundImpact: 5,
        investmentImpact: 10,
        projections: {
          month3: monthlyImpact * 3,
          month6: monthlyImpact * 6,
          month12: monthlyImpact * 12
        }
      }
    ];
  };

  const handleComplete = async () => {
    // Generate scenarios if not already done
    const scenarios = formData.scenarios.length > 0 ? formData.scenarios : generateScenarios();
    
    const decision = await createDecision({
      decision_type: formData.decision_type || 'custom',
      title: formData.title,
      description: formData.description,
      estimated_value: parseFloat(formData.estimated_value) || null,
      currency: userPreferredCurrency,
      urgency: formData.urgency,
      category: formData.category,
      motivation: formData.motivation || null,
      target_date: formData.target_date || null,
      who_wants: formData.who_wants,
      context_data: {
        monthlyLimit: formData.monthlyLimit,
        affectsGoals: formData.affectsGoals,
        affectsEmergencyFund: formData.affectsEmergencyFund
      },
      restrictions: {
        canInstall: formData.canInstall,
        maxInstallments: formData.maxInstallments,
        canDefer: formData.canDefer
      },
      scenarios: scenarios,
      status: 'voting'
    });

    if (decision && formData.vote) {
      await submitVote(
        decision.id,
        formData.vote,
        formData.selectedScenario,
        formData.condition
      );
    }

    onComplete();
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold">{t('decisions.step1.title')}</h2>
        <p className="text-muted-foreground">{t('decisions.step1.subtitle')}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {DECISION_TEMPLATES.map((template) => {
          const Icon = TEMPLATE_ICONS[template.type] || Pencil;
          const isSelected = formData.decision_type === template.type;
          
          return (
            <Card 
              key={template.id}
              className={`cursor-pointer transition-all ${
                isSelected 
                  ? 'ring-2 ring-primary bg-primary/5' 
                  : 'hover:shadow-md'
              }`}
              onClick={() => setFormData({ ...formData, decision_type: template.type })}
            >
              <CardContent className="pt-6 text-center">
                <div className="text-3xl mb-2">{template.icon}</div>
                <Icon className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                <h3 className="font-medium text-sm">
                  {t(`decisions.template.${template.type}`)}
                </h3>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold">{t('decisions.step2.title')}</h2>
        <p className="text-muted-foreground">{t('decisions.step2.subtitle')}</p>
      </div>

      <div className="space-y-4">
        <div>
          <Label>{t('decisions.field.title')}</Label>
          <Input
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder={t('decisions.field.titlePlaceholder')}
          />
        </div>

        <div>
          <Label>{t('decisions.field.description')}</Label>
          <Textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder={t('decisions.field.descriptionPlaceholder')}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>{t('decisions.field.estimatedValue')}</Label>
            <Input
              type="number"
              value={formData.estimated_value}
              onChange={(e) => setFormData({ ...formData, estimated_value: e.target.value })}
              placeholder="0.00"
            />
          </div>
          <div>
            <Label>{t('decisions.field.targetDate')}</Label>
            <DateInput
              value={formData.target_date}
              onChange={(value) => setFormData({ ...formData, target_date: value })}
            />
          </div>
        </div>

        <div>
          <Label>{t('decisions.field.urgency')}</Label>
          <RadioGroup
            value={formData.urgency}
            onValueChange={(v) => setFormData({ ...formData, urgency: v as any })}
            className="flex flex-wrap gap-4 mt-2"
          >
            {['low', 'medium', 'high', 'urgent'].map((level) => (
              <div key={level} className="flex items-center space-x-2">
                <RadioGroupItem value={level} id={`urgency-${level}`} />
                <Label htmlFor={`urgency-${level}`}>{t(`decisions.urgency.${level}`)}</Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        <div>
          <Label>{t('decisions.field.whoWants')}</Label>
          <RadioGroup
            value={formData.who_wants}
            onValueChange={(v) => setFormData({ ...formData, who_wants: v as any })}
            className="flex flex-wrap gap-4 mt-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="user1" id="who-user1" />
              <Label htmlFor="who-user1">{t('decisions.whoWants.user1')}</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="user2" id="who-user2" />
              <Label htmlFor="who-user2">{t('decisions.whoWants.user2')}</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="both" id="who-both" />
              <Label htmlFor="who-both">{t('decisions.whoWants.both')}</Label>
            </div>
          </RadioGroup>
        </div>

        <div>
          <Label>{t('decisions.field.motivation')}</Label>
          <RadioGroup
            value={formData.motivation}
            onValueChange={(v) => setFormData({ ...formData, motivation: v as any })}
            className="flex flex-wrap gap-4 mt-2"
          >
            {['necessity', 'dream', 'comfort', 'investment'].map((m) => (
              <div key={m} className="flex items-center space-x-2">
                <RadioGroupItem value={m} id={`motivation-${m}`} />
                <Label htmlFor={`motivation-${m}`}>{t(`decisions.motivation.${m}`)}</Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold">{t('decisions.step3.title')}</h2>
        <p className="text-muted-foreground">{t('decisions.step3.subtitle')}</p>
      </div>

      <div className="space-y-4">
        <div>
          <Label>{t('decisions.field.monthlyLimit')}</Label>
          <Input
            type="number"
            value={formData.monthlyLimit}
            onChange={(e) => setFormData({ ...formData, monthlyLimit: e.target.value })}
            placeholder={t('decisions.field.monthlyLimitPlaceholder')}
          />
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="canInstall"
            checked={formData.canInstall}
            onCheckedChange={(checked) => setFormData({ ...formData, canInstall: !!checked })}
          />
          <Label htmlFor="canInstall">{t('decisions.field.canInstall')}</Label>
        </div>

        {formData.canInstall && (
          <div>
            <Label>{t('decisions.field.maxInstallments')}</Label>
            <Input
              type="number"
              value={formData.maxInstallments}
              onChange={(e) => setFormData({ ...formData, maxInstallments: e.target.value })}
              placeholder="12"
            />
          </div>
        )}

        <div className="flex items-center space-x-2">
          <Checkbox
            id="canDefer"
            checked={formData.canDefer}
            onCheckedChange={(checked) => setFormData({ ...formData, canDefer: !!checked })}
          />
          <Label htmlFor="canDefer">{t('decisions.field.canDefer')}</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="affectsEmergencyFund"
            checked={formData.affectsEmergencyFund}
            onCheckedChange={(checked) => setFormData({ ...formData, affectsEmergencyFund: !!checked })}
          />
          <Label htmlFor="affectsEmergencyFund">{t('decisions.field.affectsEmergencyFund')}</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="affectsGoals"
            checked={formData.affectsGoals}
            onCheckedChange={(checked) => setFormData({ ...formData, affectsGoals: !!checked })}
          />
          <Label htmlFor="affectsGoals">{t('decisions.field.affectsGoals')}</Label>
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => {
    const scenarios = generateScenarios();
    
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold">{t('decisions.step4.title')}</h2>
          <p className="text-muted-foreground">{t('decisions.step4.subtitle')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {scenarios.map((scenario, index) => (
            <Card 
              key={scenario.id}
              className={`${
                formData.selectedScenario === scenario.id 
                  ? 'ring-2 ring-primary' 
                  : ''
              }`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Badge variant={index === 0 ? 'destructive' : index === 1 ? 'default' : 'secondary'}>
                    {t('decisions.scenario.option')} {scenario.id}
                  </Badge>
                </div>
                <CardTitle className="text-lg">{scenario.name}</CardTitle>
                <CardDescription>{scenario.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t('decisions.scenario.value')}</span>
                  <span className="font-medium">
                    {new Intl.NumberFormat(undefined, { 
                      style: 'currency', 
                      currency: userPreferredCurrency 
                    }).format(scenario.estimatedValue)}
                  </span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t('decisions.scenario.monthlyImpact')}</span>
                  <span className={`font-medium ${scenario.monthlyImpact > 0 ? 'text-red-500' : 'text-green-500'}`}>
                    {scenario.monthlyImpact > 0 ? '-' : '+'}
                    {new Intl.NumberFormat(undefined, { 
                      style: 'currency', 
                      currency: userPreferredCurrency 
                    }).format(Math.abs(scenario.monthlyImpact))}
                  </span>
                </div>

                <div className="pt-2 border-t space-y-2">
                  <div className="flex justify-between text-xs">
                    <span>{t('decisions.scenario.emergencyFund')}</span>
                    <span className={scenario.emergencyFundImpact >= 0 ? 'text-green-500' : 'text-red-500'}>
                      {scenario.emergencyFundImpact >= 0 ? '+' : ''}{scenario.emergencyFundImpact}%
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>{t('decisions.scenario.investments')}</span>
                    <span className={scenario.investmentImpact >= 0 ? 'text-green-500' : 'text-red-500'}>
                      {scenario.investmentImpact >= 0 ? '+' : ''}{scenario.investmentImpact}%
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground mb-2">{t('decisions.scenario.projections')}</p>
                  <div className="grid grid-cols-3 gap-2 text-xs text-center">
                    <div>
                      <div className="font-medium">3m</div>
                      <div className={scenario.projections.month3 >= 0 ? 'text-green-500' : 'text-red-500'}>
                        {scenario.projections.month3 >= 0 ? '+' : ''}
                        {new Intl.NumberFormat(undefined, { 
                          style: 'currency', 
                          currency: userPreferredCurrency,
                          notation: 'compact'
                        }).format(scenario.projections.month3)}
                      </div>
                    </div>
                    <div>
                      <div className="font-medium">6m</div>
                      <div className={scenario.projections.month6 >= 0 ? 'text-green-500' : 'text-red-500'}>
                        {scenario.projections.month6 >= 0 ? '+' : ''}
                        {new Intl.NumberFormat(undefined, { 
                          style: 'currency', 
                          currency: userPreferredCurrency,
                          notation: 'compact'
                        }).format(scenario.projections.month6)}
                      </div>
                    </div>
                    <div>
                      <div className="font-medium">12m</div>
                      <div className={scenario.projections.month12 >= 0 ? 'text-green-500' : 'text-red-500'}>
                        {scenario.projections.month12 >= 0 ? '+' : ''}
                        {new Intl.NumberFormat(undefined, { 
                          style: 'currency', 
                          currency: userPreferredCurrency,
                          notation: 'compact'
                        }).format(scenario.projections.month12)}
                      </div>
                    </div>
                  </div>
                </div>

                <Button 
                  variant={formData.selectedScenario === scenario.id ? 'default' : 'outline'}
                  className="w-full mt-2"
                  onClick={() => setFormData({ ...formData, selectedScenario: scenario.id })}
                >
                  {formData.selectedScenario === scenario.id ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      {t('decisions.scenario.selected')}
                    </>
                  ) : (
                    t('decisions.scenario.select')
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  const renderStep5 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold">{t('decisions.step5.title')}</h2>
        <p className="text-muted-foreground">{t('decisions.step5.subtitle')}</p>
      </div>

      {/* Anti-conflict reminder */}
      <Card className="bg-rose-50 dark:bg-rose-950 border-rose-200 dark:border-rose-800">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <Heart className="h-5 w-5 text-rose-500 mt-0.5" />
            <p className="text-sm text-rose-700 dark:text-rose-300">
              {t('decisions.step5.reminder')}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Label className="text-lg">{t('decisions.field.yourVote')}</Label>
        <RadioGroup
          value={formData.vote}
          onValueChange={(v) => setFormData({ ...formData, vote: v as any })}
          className="space-y-3"
        >
          <Card className={`cursor-pointer ${formData.vote === 'agree' ? 'ring-2 ring-green-500' : ''}`}>
            <CardContent className="pt-4">
              <div className="flex items-center space-x-3">
                <RadioGroupItem value="agree" id="vote-agree" />
                <Label htmlFor="vote-agree" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-500" />
                    <span className="font-medium">{t('decisions.vote.agree')}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t('decisions.vote.agreeDesc')}
                  </p>
                </Label>
              </div>
            </CardContent>
          </Card>

          <Card className={`cursor-pointer ${formData.vote === 'agree_with_condition' ? 'ring-2 ring-amber-500' : ''}`}>
            <CardContent className="pt-4">
              <div className="flex items-center space-x-3">
                <RadioGroupItem value="agree_with_condition" id="vote-condition" />
                <Label htmlFor="vote-condition" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-amber-500" />
                    <span className="font-medium">{t('decisions.vote.agreeWithCondition')}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t('decisions.vote.agreeWithConditionDesc')}
                  </p>
                </Label>
              </div>
            </CardContent>
          </Card>

          <Card className={`cursor-pointer ${formData.vote === 'disagree' ? 'ring-2 ring-red-500' : ''}`}>
            <CardContent className="pt-4">
              <div className="flex items-center space-x-3">
                <RadioGroupItem value="disagree" id="vote-disagree" />
                <Label htmlFor="vote-disagree" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Pause className="h-5 w-5 text-red-500" />
                    <span className="font-medium">{t('decisions.vote.disagree')}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t('decisions.vote.disagreeDesc')}
                  </p>
                </Label>
              </div>
            </CardContent>
          </Card>
        </RadioGroup>

        {formData.vote === 'agree_with_condition' && (
          <div>
            <Label>{t('decisions.field.condition')}</Label>
            <Textarea
              value={formData.condition}
              onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
              placeholder={t('decisions.field.conditionPlaceholder')}
            />
          </div>
        )}
      </div>
    </div>
  );

  const renderStep6 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold">{t('decisions.step6.title')}</h2>
        <p className="text-muted-foreground">{t('decisions.step6.subtitle')}</p>
      </div>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('decisions.summary.title')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t('decisions.field.title')}</span>
            <span className="font-medium">{formData.title || '-'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t('decisions.field.estimatedValue')}</span>
            <span className="font-medium">
              {formData.estimated_value 
                ? new Intl.NumberFormat(undefined, { 
                    style: 'currency', 
                    currency: userPreferredCurrency 
                  }).format(parseFloat(formData.estimated_value))
                : '-'
              }
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t('decisions.field.yourVote')}</span>
            <Badge variant={
              formData.vote === 'agree' ? 'default' : 
              formData.vote === 'agree_with_condition' ? 'secondary' : 
              'destructive'
            }>
              {t(`decisions.vote.${formData.vote || 'pending'}`)}
            </Badge>
          </div>
          {formData.selectedScenario && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('decisions.scenario.selected')}</span>
              <span className="font-medium">{t('decisions.scenario.option')} {formData.selectedScenario}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Optional: Create agreement rules */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('decisions.step6.createRules')}</CardTitle>
          <CardDescription>{t('decisions.step6.createRulesDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>{t('decisions.field.spendingLimitWithoutNotice')}</Label>
            <Input
              type="number"
              value={formData.spendingLimitWithoutNotice}
              onChange={(e) => setFormData({ ...formData, spendingLimitWithoutNotice: e.target.value })}
              placeholder="500"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {t('decisions.field.spendingLimitWithoutNoticeDesc')}
            </p>
          </div>

          <div>
            <Label>{t('decisions.field.maxInstallmentWithoutConsensus')}</Label>
            <Input
              type="number"
              value={formData.maxInstallmentWithoutConsensus}
              onChange={(e) => setFormData({ ...formData, maxInstallmentWithoutConsensus: e.target.value })}
              placeholder="6"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <Check className="h-5 w-5 text-green-500 mt-0.5" />
            <div>
              <p className="font-medium text-green-800 dark:text-green-200">
                {t('decisions.step6.readyToSubmit')}
              </p>
              <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                {t('decisions.step6.partnerWillVote')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return !!formData.decision_type;
      case 2:
        return !!formData.title;
      case 3:
        return true;
      case 4:
        return true;
      case 5:
        return !!formData.vote;
      case 6:
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('common.cancel')}
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">{t('decisions.wizard.title')}</h1>
      <p className="text-sm text-muted-foreground">
            {t('decisions.wizard.step').replace('{current}', String(currentStep)).replace('{total}', String(totalSteps))}
          </p>
        </div>
      </div>

      {/* Progress */}
      <Progress value={progress} className="h-2" />

      {/* Step Content */}
      <Card>
        <CardContent className="pt-6">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
          {currentStep === 5 && renderStep5()}
          {currentStep === 6 && renderStep6()}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={handlePrev}
          disabled={currentStep === 1}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('common.previous')}
        </Button>

        {currentStep < totalSteps ? (
          <Button 
            onClick={handleNext}
            disabled={!canProceed()}
          >
            {t('common.next')}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button 
            onClick={handleComplete}
            className="bg-green-600 hover:bg-green-700"
          >
            <Check className="h-4 w-4 mr-2" />
            {t('decisions.wizard.submit')}
          </Button>
        )}
      </div>
    </div>
  );
};
