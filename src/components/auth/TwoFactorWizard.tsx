import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, 
  Smartphone, 
  Mail, 
  ArrowRight, 
  ArrowLeft,
  Check,
  X,
  Info,
  AlertTriangle,
  Lock,
  Key
} from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { TwoFactorMethod } from '@/hooks/use2FA';

interface TwoFactorWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectMethod: (method: TwoFactorMethod) => void;
  onSkip: () => void;
}

interface MethodInfo {
  id: TwoFactorMethod;
  icon: React.ReactNode;
  color: string;
  security: 'high' | 'medium' | 'low';
  pros: string[];
  cons: string[];
}

export function TwoFactorWizard({ open, onOpenChange, onSelectMethod, onSkip }: TwoFactorWizardProps) {
  const { t } = useLanguage();
  const [step, setStep] = useState(0);
  const [selectedMethod, setSelectedMethod] = useState<TwoFactorMethod | null>(null);

  const methods: MethodInfo[] = [
    {
      id: 'totp',
      icon: <Smartphone className="h-8 w-8" />,
      color: 'text-primary',
      security: 'high',
      pros: [
        t('2fa.wizard.totp.pro1'),
        t('2fa.wizard.totp.pro2'),
        t('2fa.wizard.totp.pro3'),
      ],
      cons: [
        t('2fa.wizard.totp.con1'),
      ],
    },
    {
      id: 'sms',
      icon: <Smartphone className="h-8 w-8" />,
      color: 'text-blue-500',
      security: 'medium',
      pros: [
        t('2fa.wizard.sms.pro1'),
        t('2fa.wizard.sms.pro2'),
      ],
      cons: [
        t('2fa.wizard.sms.con1'),
        t('2fa.wizard.sms.con2'),
      ],
    },
    {
      id: 'email',
      icon: <Mail className="h-8 w-8" />,
      color: 'text-purple-500',
      security: 'low',
      pros: [
        t('2fa.wizard.email.pro1'),
        t('2fa.wizard.email.pro2'),
      ],
      cons: [
        t('2fa.wizard.email.con1'),
        t('2fa.wizard.email.con2'),
      ],
    },
  ];

  const getSecurityBadge = (level: 'high' | 'medium' | 'low') => {
    switch (level) {
      case 'high':
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/30">{t('2fa.wizard.security.high')}</Badge>;
      case 'medium':
        return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/30">{t('2fa.wizard.security.medium')}</Badge>;
      case 'low':
        return <Badge className="bg-orange-500/10 text-orange-500 border-orange-500/30">{t('2fa.wizard.security.low')}</Badge>;
    }
  };

  const handleNext = () => {
    if (step === 0) {
      setStep(1);
    } else if (step === 1 && selectedMethod) {
      onSelectMethod(selectedMethod);
      onOpenChange(false);
      setStep(0);
      setSelectedMethod(null);
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const handleSkip = () => {
    onSkip();
    onOpenChange(false);
    setStep(0);
    setSelectedMethod(null);
  };

  const progress = ((step + 1) / 2) * 100;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-full">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <DialogTitle>{t('2fa.wizard.title')}</DialogTitle>
            </div>
            <span className="text-sm text-muted-foreground">
              {step + 1}/2
            </span>
          </div>
          <Progress value={progress} className="h-1" />
        </DialogHeader>

        <div className="py-4 min-h-[300px]">
          {/* Step 0: Introduction */}
          {step === 0 && (
            <div className="space-y-6">
              <div className="text-center space-y-4">
                <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
                  <Lock className="h-10 w-10 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{t('2fa.wizard.intro.title')}</h3>
                  <p className="text-muted-foreground mt-2">
                    {t('2fa.wizard.intro.description')}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-sm">{t('2fa.wizard.benefit1.title')}</p>
                    <p className="text-sm text-muted-foreground">{t('2fa.wizard.benefit1.description')}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-sm">{t('2fa.wizard.benefit2.title')}</p>
                    <p className="text-sm text-muted-foreground">{t('2fa.wizard.benefit2.description')}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-sm">{t('2fa.wizard.benefit3.title')}</p>
                    <p className="text-sm text-muted-foreground">{t('2fa.wizard.benefit3.description')}</p>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-amber-600 dark:text-amber-400">
                    {t('2fa.wizard.optional')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 1: Choose Method */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <h3 className="text-lg font-semibold">{t('2fa.wizard.choose.title')}</h3>
                <p className="text-sm text-muted-foreground">{t('2fa.wizard.choose.description')}</p>
              </div>

              <div className="space-y-3">
                {methods.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setSelectedMethod(method.id)}
                    className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                      selectedMethod === method.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50 hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`p-2 rounded-full bg-muted ${method.color}`}>
                        {method.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium">{t(`2fa.method.${method.id}`)}</span>
                          {getSecurityBadge(method.security)}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {t(`2fa.method.${method.id}.description`)}
                        </p>
                        
                        {selectedMethod === method.id && (
                          <div className="mt-3 space-y-2 animate-in fade-in slide-in-from-top-2">
                            <div className="space-y-1">
                              {method.pros.map((pro, i) => (
                                <div key={i} className="flex items-center gap-2 text-sm">
                                  <Check className="h-3 w-3 text-green-500 flex-shrink-0" />
                                  <span className="text-green-600 dark:text-green-400">{pro}</span>
                                </div>
                              ))}
                            </div>
                            <div className="space-y-1">
                              {method.cons.map((con, i) => (
                                <div key={i} className="flex items-center gap-2 text-sm">
                                  <X className="h-3 w-3 text-orange-500 flex-shrink-0" />
                                  <span className="text-orange-600 dark:text-orange-400">{con}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      {selectedMethod === method.id && (
                        <Check className="h-5 w-5 text-primary flex-shrink-0" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <div className="flex gap-2 w-full sm:w-auto">
            {step > 0 && (
              <Button variant="outline" onClick={handleBack} className="flex-1 sm:flex-none">
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t('2fa.wizard.back')}
              </Button>
            )}
            <Button 
              variant="ghost" 
              onClick={handleSkip}
              className="flex-1 sm:flex-none text-muted-foreground hover:text-foreground"
            >
              {t('2fa.wizard.skip')}
            </Button>
          </div>
          <Button 
            onClick={handleNext}
            disabled={step === 1 && !selectedMethod}
            className="w-full sm:w-auto"
          >
            {step === 0 ? t('2fa.wizard.start') : t('2fa.wizard.configure')}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
