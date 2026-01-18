import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, CheckCircle2, Clock, AlertCircle, Sparkles } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import type { GoalAnalysis, ViabilityStatus } from '@/hooks/useMileageAnalysis';

interface MileageGoalAnalysisProps {
  analysis: GoalAnalysis;
}

const viabilityConfig: Record<ViabilityStatus, {
  icon: React.ElementType;
  colorClass: string;
  bgClass: string;
  borderClass: string;
}> = {
  achievable: {
    icon: CheckCircle2,
    colorClass: 'text-green-600 dark:text-green-400',
    bgClass: 'bg-green-50 dark:bg-green-950/30',
    borderClass: 'border-green-200 dark:border-green-800'
  },
  partially_achievable: {
    icon: Clock,
    colorClass: 'text-amber-600 dark:text-amber-400',
    bgClass: 'bg-amber-50 dark:bg-amber-950/30',
    borderClass: 'border-amber-200 dark:border-amber-800'
  },
  not_achievable: {
    icon: AlertCircle,
    colorClass: 'text-muted-foreground',
    bgClass: 'bg-muted/50',
    borderClass: 'border-border'
  }
};

export const MileageGoalAnalysis: React.FC<MileageGoalAnalysisProps> = ({ analysis }) => {
  const { t } = useLanguage();
  const config = viabilityConfig[analysis.viability];
  const Icon = config.icon;
  
  return (
    <div className={`mt-3 p-3 rounded-lg border ${config.bgClass} ${config.borderClass}`}>
      {/* Viability Status */}
      <div className={`flex items-center gap-2 ${config.colorClass}`}>
        <Icon className="h-4 w-4 flex-shrink-0" />
        <span className="text-sm font-medium">{analysis.viabilityMessage}</span>
      </div>
      
      {/* Estimated time (if applicable) */}
      {analysis.estimatedMonthsToAchieve && analysis.viability !== 'achievable' && (
        <p className="text-xs text-muted-foreground mt-1 ml-6">
          {t('mileage.analysis.estimatedTime').replace('{months}', String(analysis.estimatedMonthsToAchieve))}
        </p>
      )}
      
      {/* Best promotion suggestion */}
      {analysis.bestPromotion && analysis.viability !== 'achievable' && (
        <div className="mt-2 pt-2 border-t border-dashed border-current/20">
          <div className="flex items-start gap-2">
            <Lightbulb className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground">
                {t('mileage.analysis.promotionHelps')}
              </p>
              <div className="flex flex-wrap items-center gap-1 mt-1">
                <Badge 
                  variant="outline" 
                  className="bg-primary/10 text-primary border-primary/30 text-xs"
                >
                  <Sparkles className="h-3 w-3 mr-1" />
                  {analysis.bestPromotion.airlineName}
                </Badge>
                <span className="text-xs text-muted-foreground truncate">
                  {analysis.bestPromotion.benefitDescription}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Achievable celebration */}
      {analysis.viability === 'achievable' && (
        <p className="text-xs text-green-600 dark:text-green-400 mt-1 ml-6">
          {t('mileage.analysis.readyToTravel')}
        </p>
      )}
    </div>
  );
};
