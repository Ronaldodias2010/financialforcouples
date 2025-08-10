import { useState } from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import { useLanguage } from '@/hooks/useLanguage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Check, Crown, Zap, Shield, Star, BarChart3, Bot } from 'lucide-react';
import { toast } from 'sonner';

interface SubscriptionPageProps {
  onBack: () => void;
}

export const SubscriptionPage = ({ onBack }: SubscriptionPageProps) => {
  const { t } = useLanguage();
  const { subscribed, subscriptionTier, subscriptionEnd, loading, createCheckoutSession, openCustomerPortal } = useSubscription();
  const [creatingSession, setCreatingSession] = useState(false);
  const [openingPortal, setOpeningPortal] = useState(false);

  const handleUpgrade = async () => {
    try {
      setCreatingSession(true);
      await createCheckoutSession();
      toast.success(t('subscription.redirectingToPayment'));
    } catch (error) {
      console.error('Error upgrading:', error);
      toast.error(t('subscription.upgradeError'));
    } finally {
      setCreatingSession(false);
    }
  };

  const handleManageSubscription = async () => {
    try {
      setOpeningPortal(true);
      await openCustomerPortal();
      toast.success(t('subscription.redirectingToPortal'));
    } catch (error) {
      console.error('Error opening portal:', error);
      toast.error(t('subscription.portalError'));
    } finally {
      setOpeningPortal(false);
    }
  };

  const essentialFeatures = [
    { icon: <Zap className="h-4 w-4" />, key: 'basicFinancials' },
    { icon: <BarChart3 className="h-4 w-4" />, key: 'multiCurrency' },
    { icon: <Shield className="h-4 w-4" />, key: 'jointAnalysis' },
    { icon: <Star className="h-4 w-4" />, key: 'multiLanguage' },
    { icon: <BarChart3 className="h-4 w-4" />, key: 'investmentControl' },
    { icon: <Star className="h-4 w-4" />, key: 'manualMiles' },
    { icon: <BarChart3 className="h-4 w-4" />, key: 'profitabilitySimulator' },
    { icon: <Shield className="h-4 w-4" />, key: 'basicSecurity' }
  ];

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
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('back')}
        </Button>
        <h1 className="text-2xl font-bold">{t('subscription.title')}</h1>
      </div>

      {/* Current Plan Status */}
      {subscribed && (
        <Card className="border-primary/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-primary" />
                  {t('subscription.currentPlan')}
                </CardTitle>
                <CardDescription>
                  {subscriptionEnd && new Intl.DateTimeFormat(undefined, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }).format(new Date(subscriptionEnd))}
                </CardDescription>
              </div>
              <Badge variant="default" className="bg-primary">
                {t(`subscription.plans.${subscriptionTier}`)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleManageSubscription} 
              disabled={openingPortal}
              className="w-full"
            >
              {openingPortal ? t('subscription.loading') : t('subscription.manageSubscription')}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Plans Comparison */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Essential Plan */}
        <Card className={`relative ${subscriptionTier === 'essential' ? 'border-primary' : ''}`}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  {t('subscription.plans.essential')}
                </CardTitle>
                <CardDescription>{t('subscription.plans.essentialDescription')}</CardDescription>
              </div>
              {subscriptionTier === 'essential' && (
                <Badge variant="outline">{t('subscription.current')}</Badge>
              )}
            </div>
            <div className="text-3xl font-bold">
              {t('subscription.free')}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              {essentialFeatures.map((feature, index) => (
                <div key={index} className="flex items-center gap-2">
                  {feature.icon}
                  <span className="text-sm">{t(`subscription.features.${feature.key}`)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Premium Plan */}
        <Card className={`relative ${subscriptionTier === 'premium' ? 'border-primary' : 'border-primary/50 bg-gradient-to-br from-primary/5 to-primary/10'}`}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-primary" />
                  {t('subscription.plans.premium')}
                </CardTitle>
                <CardDescription>{t('subscription.plans.premiumDescription')}</CardDescription>
              </div>
              {subscriptionTier === 'premium' && (
                <Badge variant="default" className="bg-primary">{t('subscription.current')}</Badge>
              )}
            </div>
            <div className="text-3xl font-bold text-primary">
              R$ 19,90<span className="text-sm font-normal text-muted-foreground">/{t('subscription.month')}</span>
            </div>
            <div className="text-lg font-semibold text-primary">
              R$ 179,80<span className="text-sm font-normal text-muted-foreground">/{t('subscription.year')}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {t('subscription.annualDiscount')}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground mb-2">{t('subscription.includesEssential')}</p>
              {premiumFeatures.map((feature, index) => (
                <div key={index} className="flex items-center gap-2">
                  {feature.icon}
                  <span className="text-sm">{t(`subscription.features.${feature.key}`)}</span>
                  <Badge variant="secondary" className="ml-auto text-xs">{t('subscription.plans.premium')}</Badge>
                </div>
              ))}
            </div>
            
            {subscriptionTier !== 'premium' && (
              <Button 
                onClick={handleUpgrade} 
                disabled={creatingSession || loading}
                className="w-full bg-primary hover:bg-primary/90"
              >
                {creatingSession ? t('subscription.loading') : t('subscription.upgradeToPremium')}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Benefits Section */}
      <Card>
        <CardHeader>
          <CardTitle>{t('subscription.whyPremium')}</CardTitle>
          <CardDescription>{t('subscription.premiumBenefits')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span className="text-sm">{t('subscription.benefits.aiPowered')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span className="text-sm">{t('subscription.benefits.smartRecommendations')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span className="text-sm">{t('subscription.benefits.advancedReports')}</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span className="text-sm">{t('subscription.benefits.voiceControl')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span className="text-sm">{t('subscription.benefits.prioritySupport')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span className="text-sm">{t('subscription.benefits.unlimitedFeatures')}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};