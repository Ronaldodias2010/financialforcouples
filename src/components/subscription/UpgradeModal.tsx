import { useState } from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import { useLanguage } from '@/hooks/useLanguage';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crown, Zap, Bot, Star, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature?: string;
}

export const UpgradeModal = ({ isOpen, onClose, feature }: UpgradeModalProps) => {
  const { t } = useLanguage();
  const { createCheckoutSession } = useSubscription();
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    try {
      setLoading(true);
      await createCheckoutSession();
      toast.success(t('subscription.redirectingToPayment'));
      onClose();
    } catch (error) {
      console.error('Error upgrading:', error);
      toast.error(t('subscription.upgradeError'));
    } finally {
      setLoading(false);
    }
  };

  const premiumFeatures = [
    { icon: <Bot className="h-4 w-4" />, key: 'voiceWhatsApp' },
    { icon: <Bot className="h-4 w-4" />, key: 'aiMiles' },
    { icon: <Bot className="h-4 w-4" />, key: 'aiPlanning' },
    { icon: <Star className="h-4 w-4" />, key: 'personalizedInvestments' },
    { icon: <Star className="h-4 w-4" />, key: 'customGoals' },
    { icon: <BarChart3 className="h-4 w-4" />, key: 'advancedAnalytics' },
    { icon: <Crown className="h-4 w-4" />, key: 'prioritySupport' }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-primary" />
            {t('subscription.upgradeRequired')}
          </DialogTitle>
          <DialogDescription>
            {feature 
              ? `${t('subscription.featureRequiresPremium')} ${t(`subscription.features.${feature}`)}`
              : t('subscription.unlockPremiumFeatures')
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Premium Plan Card */}
          <div className="border border-primary/20 rounded-lg p-4 bg-gradient-to-br from-primary/5 to-primary/10">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-primary" />
                <span className="font-semibold">{t('subscription.plans.premium')}</span>
              </div>
              <Badge variant="default" className="bg-primary">
                {t('subscription.recommended')}
              </Badge>
            </div>
            
            <div className="text-2xl font-bold text-primary mb-4">
              R$ 29,90<span className="text-sm font-normal text-muted-foreground">/{t('subscription.month')}</span>
            </div>

            <div className="space-y-2 mb-4">
              {premiumFeatures.slice(0, 4).map((premiumFeature, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  {premiumFeature.icon}
                  <span>{t(`subscription.features.${premiumFeature.key}`)}</span>
                </div>
              ))}
              <div className="text-xs text-muted-foreground">
                {t('subscription.andMoreFeatures')}
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              {t('subscription.maybeLater')}
            </Button>
            <Button 
              onClick={handleUpgrade} 
              disabled={loading}
              className="flex-1 bg-primary hover:bg-primary/90"
            >
              {loading ? t('subscription.loading') : t('subscription.upgradeToPremium')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};