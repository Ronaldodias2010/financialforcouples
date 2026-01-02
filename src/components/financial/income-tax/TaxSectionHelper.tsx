import React from 'react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  HelpCircle, 
  ChevronDown, 
  CheckCircle, 
  XCircle,
  Lightbulb,
  MessageCircle
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { TAX_HELP_CONTENT, TaxHelpSection } from '@/data/taxHelpContent';

interface TaxSectionHelperProps {
  section: keyof typeof TAX_HELP_CONTENT;
  showAIButton?: boolean;
  onAIHelp?: () => void;
}

export function TaxSectionHelper({ 
  section, 
  showAIButton = false,
  onAIHelp 
}: TaxSectionHelperProps) {
  const { t } = useLanguage();
  const [isExpanded, setIsExpanded] = React.useState(false);
  
  const helpContent = TAX_HELP_CONTENT[section];
  
  if (!helpContent) return null;

  return (
    <div className="flex items-start gap-2">
      {/* Tooltip with quick help */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
              <HelpCircle className="h-4 w-4 text-muted-foreground" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right" className="max-w-xs">
            <p className="text-sm">{t(helpContent.tooltipKey)}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Expandable detailed help */}
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded} className="flex-1">
        <div className="flex items-center gap-2">
          <CollapsibleTrigger asChild>
            <Button variant="link" size="sm" className="h-auto p-0 text-xs text-muted-foreground hover:text-primary">
              {t('tax.help.learnMore')}
              <ChevronDown className={`h-3 w-3 ml-1 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>
          
          {showAIButton && onAIHelp && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-auto p-0 text-xs text-primary hover:text-primary/80"
              onClick={onAIHelp}
            >
              <MessageCircle className="h-3 w-3 mr-1" />
              {t('tax.help.needHelp')}
            </Button>
          )}
        </div>

        <CollapsibleContent className="mt-3 space-y-4">
          <div className="bg-muted/50 rounded-lg p-4 space-y-4">
            {/* Examples */}
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                {t('tax.help.examples')}
              </h4>
              <div className="flex flex-wrap gap-2">
                {helpContent.examples.map((example, idx) => (
                  <span 
                    key={idx}
                    className="px-2 py-1 bg-background rounded text-xs"
                  >
                    {example}
                  </span>
                ))}
              </div>
            </div>

            {/* Where to find */}
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                {t('tax.help.whereToFind')}
              </h4>
              <p className="text-sm">{t(helpContent.whereToFindKey)}</p>
            </div>

            {/* What counts */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-xs font-semibold text-green-600 dark:text-green-400 uppercase tracking-wide mb-2 flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  {t('tax.help.whatCounts')}
                </h4>
                <ul className="space-y-1">
                  {helpContent.whatCountsKeys.map((key, idx) => (
                    <li key={idx} className="text-sm flex items-start gap-2">
                      <span className="text-green-500 mt-1">•</span>
                      {t(key)}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wide mb-2 flex items-center gap-1">
                  <XCircle className="h-3 w-3" />
                  {t('tax.help.whatDoesNot')}
                </h4>
                <ul className="space-y-1">
                  {helpContent.whatDoesNotKeys.map((key, idx) => (
                    <li key={idx} className="text-sm flex items-start gap-2">
                      <span className="text-red-500 mt-1">•</span>
                      {t(key)}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Tip */}
            {helpContent.tipKey && (
              <div className="flex items-start gap-2 p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                <Lightbulb className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  {t(helpContent.tipKey)}
                </p>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
