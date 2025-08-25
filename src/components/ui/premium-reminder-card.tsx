import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Crown, Zap, MessageCircle, Plane } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';

interface PremiumReminderCardProps {
  onDismiss: () => void;
  onUpgradeClick: () => void;
}

export const PremiumReminderCard = ({ onDismiss, onUpgradeClick }: PremiumReminderCardProps) => {
  const { t } = useLanguage();

  return (
    <Card 
      className="ml-1 xs:ml-2 border-2 border-dashed border-yellow-500/60 bg-gradient-to-br from-red-500/10 via-yellow-500/10 to-red-500/5 cursor-pointer hover:border-yellow-500/80 transition-all duration-200 animate-pulse shadow-lg"
      onClick={onUpgradeClick}
    >
      <CardContent className="p-2 xs:p-3 relative">
        <Button
          variant="ghost"
          size="sm"
          className="absolute -top-1 -right-1 h-5 w-5 xs:h-6 xs:w-6 p-0 hover:bg-destructive/10 z-10"
          onClick={(e) => {
            e.stopPropagation();
            onDismiss();
          }}
        >
          <X className="h-2.5 w-2.5 xs:h-3 xs:w-3" />
        </Button>
        
        <div className="flex items-start gap-1 xs:gap-2 pr-3 xs:pr-4">
          <div className="flex items-center gap-0.5 xs:gap-1 shrink-0 mt-0.5">
            <Crown className="h-3 w-3 xs:h-4 xs:w-4 text-yellow-600 animate-bounce" />
            <Zap className="h-2.5 w-2.5 xs:h-3 xs:w-3 text-red-500" />
          </div>
          <div className="text-xs min-w-0 flex-1">
            <div className="font-bold text-red-600 mb-1 text-[10px] xs:text-xs">
              {t('premiumReminder.title')}
            </div>
            <div className="text-muted-foreground text-[9px] xs:text-[10px] leading-tight">
              {t('premiumReminder.description')}
            </div>
            <div className="flex items-center gap-1 mt-1 flex-wrap">
              <div className="flex items-center gap-0.5">
                <Zap className="h-2 w-2 text-blue-500" />
                <span className="text-[8px] xs:text-[9px] text-blue-600 font-medium">IA</span>
              </div>
              <div className="flex items-center gap-0.5">
                <Plane className="h-2 w-2 text-green-500" />
                <span className="text-[8px] xs:text-[9px] text-green-600 font-medium">{t('premiumReminder.mileage')}</span>
              </div>
              <div className="flex items-center gap-0.5">
                <MessageCircle className="h-2 w-2 text-purple-500" />
                <span className="text-[8px] xs:text-[9px] text-purple-600 font-medium">WhatsApp</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};