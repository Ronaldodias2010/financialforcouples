import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plane, Clock, Lightbulb, Sparkles, TrendingUp } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import type { MileageAnalysisResult } from '@/hooks/useMileageAnalysis';

interface MileageSmartSummaryProps {
  analysis: MileageAnalysisResult;
}

export const MileageSmartSummary: React.FC<MileageSmartSummaryProps> = ({ analysis }) => {
  const { t } = useLanguage();
  const { summary } = analysis;
  
  // Don't show if no meaningful data
  if (summary.tripsReady === 0 && summary.tripsSoon === 0 && summary.promotionsHelpingGoals === 0) {
    return null;
  }
  
  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-background">
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h4 className="font-semibold text-sm">{t('mileage.analysis.smartSummary')}</h4>
          <Badge variant="secondary" className="text-xs">
            {t('mileage.analysis.basedOnMiles')}
          </Badge>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Trips Ready */}
          {summary.tripsReady > 0 && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
              <Plane className="h-4 w-4 text-green-600 dark:text-green-400" />
              <div>
                <p className="text-sm font-medium text-green-700 dark:text-green-300">
                  {t('mileage.analysis.tripsReady').replace('{count}', String(summary.tripsReady))}
                </p>
              </div>
            </div>
          )}
          
          {/* Trips Soon */}
          {summary.tripsSoon > 0 && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
              <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <div>
                <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
                  {t('mileage.analysis.tripsSoon').replace('{count}', String(summary.tripsSoon))}
                </p>
              </div>
            </div>
          )}
          
          {/* Promotions Helping */}
          {summary.promotionsHelpingGoals > 0 && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
              <Lightbulb className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <div>
                <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  {t('mileage.analysis.promotionsHelp').replace('{count}', String(summary.promotionsHelpingGoals))}
                </p>
              </div>
            </div>
          )}
        </div>
        
        {/* Best Opportunity */}
        {summary.bestOpportunity && (
          <div className="mt-3 pt-3 border-t border-dashed border-primary/20">
            <div className="flex items-start gap-2">
              <Sparkles className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                  {t('mileage.analysis.bestOpportunity')}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  "{summary.bestOpportunity.promotionTitle}" - {summary.bestOpportunity.savingsDescription}
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Disclaimer */}
        <p className="text-[10px] text-muted-foreground mt-3 italic">
          {t('mileage.analysis.disclaimer')}
        </p>
      </CardContent>
    </Card>
  );
};
