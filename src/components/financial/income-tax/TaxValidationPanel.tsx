import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  ChevronDown,
  CheckCircle,
  XCircle,
  Shield
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { TaxValidation, ValidationLevel } from '@/hooks/useTaxValidation';

const levelConfig: Record<ValidationLevel, {
  icon: React.ElementType;
  className: string;
  bgClass: string;
  labelKey: string;
}> = {
  blocking: {
    icon: XCircle,
    className: 'text-red-500',
    bgClass: 'bg-red-500/10 border-red-500/20',
    labelKey: 'tax.validation.blocking',
  },
  warning: {
    icon: AlertTriangle,
    className: 'text-amber-500',
    bgClass: 'bg-amber-500/10 border-amber-500/20',
    labelKey: 'tax.validation.warning',
  },
  info: {
    icon: Info,
    className: 'text-blue-500',
    bgClass: 'bg-blue-500/10 border-blue-500/20',
    labelKey: 'tax.validation.info',
  },
};

interface TaxValidationPanelProps {
  validations: TaxValidation[];
  blockingCount: number;
  warningCount: number;
  infoCount: number;
}

export function TaxValidationPanel({
  validations,
  blockingCount,
  warningCount,
  infoCount,
}: TaxValidationPanelProps) {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = React.useState(blockingCount > 0 || warningCount > 0);

  const hasIssues = blockingCount > 0 || warningCount > 0;
  const totalIssues = blockingCount + warningCount;

  if (validations.length === 0) {
    return (
      <Card className="border-green-500/20 bg-green-500/5">
        <CardContent className="p-4 flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-green-500" />
          <div>
            <p className="font-medium text-sm text-green-700 dark:text-green-400">
              {t('tax.validation.allClear')}
            </p>
            <p className="text-xs text-muted-foreground">
              {t('tax.validation.allClearDesc')}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className={hasIssues ? 'border-amber-500/20' : 'border-muted'}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${hasIssues ? 'bg-amber-500/10' : 'bg-green-500/10'}`}>
                  <Shield className={`h-5 w-5 ${hasIssues ? 'text-amber-500' : 'text-green-500'}`} />
                </div>
                <div>
                  <CardTitle className="text-base">{t('tax.validation.title')}</CardTitle>
                  <CardDescription className="text-sm">
                    {hasIssues 
                      ? t('tax.validation.issuesFound').replace('{count}', totalIssues.toString())
                      : t('tax.validation.noIssues')
                    }
                  </CardDescription>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {blockingCount > 0 && (
                  <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">
                    {blockingCount} {t('tax.validation.blocking')}
                  </Badge>
                )}
                {warningCount > 0 && (
                  <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20">
                    {warningCount} {t('tax.validation.warnings')}
                  </Badge>
                )}
                {infoCount > 0 && (
                  <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                    {infoCount} {t('tax.validation.infos')}
                  </Badge>
                )}
                <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0 space-y-3">
            {/* Blocking Issues */}
            {validations.filter(v => v.level === 'blocking').map(validation => (
              <ValidationItem key={validation.id} validation={validation} />
            ))}

            {/* Warnings */}
            {validations.filter(v => v.level === 'warning').map(validation => (
              <ValidationItem key={validation.id} validation={validation} />
            ))}

            {/* Info */}
            {validations.filter(v => v.level === 'info').map(validation => (
              <ValidationItem key={validation.id} validation={validation} />
            ))}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

interface ValidationItemProps {
  validation: TaxValidation;
}

function ValidationItem({ validation }: ValidationItemProps) {
  const { t } = useLanguage();
  const config = levelConfig[validation.level];
  const Icon = config.icon;

  return (
    <Alert className={config.bgClass}>
      <Icon className={`h-4 w-4 ${config.className}`} />
      <AlertDescription className="ml-2">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <p className="font-medium text-sm">
              {t(validation.messageKey)}
            </p>
            {validation.details && (
              <p className="text-xs text-muted-foreground mt-1">
                {validation.details}
              </p>
            )}
          </div>
          {validation.actionKey && (
            <Button size="sm" variant="outline" className="shrink-0">
              {t(validation.actionKey)}
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}
