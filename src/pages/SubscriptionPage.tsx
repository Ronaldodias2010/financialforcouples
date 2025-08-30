import { useState } from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import { useLanguage } from '@/hooks/useLanguage';
import { usePromoCode } from '@/hooks/usePromoCode';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Check, Crown, Zap, Shield, Star, BarChart3, Bot, Tag, X } from 'lucide-react';
import { toast } from 'sonner';

interface SubscriptionPageProps {
  onBack: () => void;
}

export const SubscriptionPage = ({ onBack }: SubscriptionPageProps) => {
  const { t: tBase, language, tFor, inBrazil } = useLanguage();
  const { subscribed, subscriptionTier, subscriptionEnd, loading, createCheckoutSession, openCustomerPortal } = useSubscription();
  const { validatePromoCode, validating } = usePromoCode();
  const t = (key: string) => (!inBrazil ? tFor('en', key) : tBase(key));
  const [creatingSession, setCreatingSession] = useState(false);
  const [openingPortal, setOpeningPortal] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<any>(null);

  // Language-based pricing and Stripe price IDs
  const isEnglishPricing = !inBrazil || language === 'en';
  const monthlyDisplay = isEnglishPricing ? '$ 9.90' : 'R$ 25,90';
  const annualDisplay = isEnglishPricing ? '$ 67.10' : 'R$ 217,10';
  // NOTE: Using the provided USD price IDs for English pricing
  const monthlyPriceId = isEnglishPricing ? 'price_1Ruut0FOhUY5r0H1vV43Vj4L' : 'price_1S1qdSFOhUY5r0H1b7o1WG2Z';
  const annualPriceId = isEnglishPricing ? 'price_1RuutYFOhUY5r0H1VSEQO2oI' : 'price_1S1qudFOhUY5r0H1ZqGYFERQ';
  const handleApplyPromo = async () => {
    if (!promoCode.trim()) {
      toast.error('Digite um código promocional');
      return;
    }

    try {
      const country = inBrazil ? 'BR' : 'US';
      const result = await validatePromoCode(promoCode.trim(), country);
      
      if (result.valid) {
        setAppliedPromo(result);
        toast.success('Cupom aplicado com sucesso!');
      } else {
        toast.error(result.message || 'Código promocional inválido');
      }
    } catch (error) {
      console.error('Error validating promo code:', error);
      toast.error('Erro ao validar código promocional');
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoCode('');
    toast.success('Cupom removido');
  };

  const handleUpgrade = async (priceId: string) => {
    try {
      setCreatingSession(true);
      await createCheckoutSession(priceId, appliedPromo);
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
              {monthlyDisplay}<span className="text-sm font-normal text-muted-foreground">/{t('subscription.month')}</span>
            </div>
            <div className="text-lg font-semibold text-primary">
              {annualDisplay}<span className="text-sm font-normal text-muted-foreground">/{t('subscription.year')}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {language === 'en' ? 'With the annual plan you get approximately 30% off.' : t('subscription.annualDiscount')}
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
              <>
                {/* Coupon Section */}
                <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Cupom Promocional</span>
                  </div>
                  
                  {appliedPromo ? (
                    <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600" />
                        <div>
                          <p className="text-sm font-medium text-green-800">
                            Cupom aplicado: {promoCode.toUpperCase()}
                          </p>
                          <p className="text-xs text-green-600">
                            {appliedPromo.discount_type === 'percentage' 
                              ? `${appliedPromo.discount_value}% de desconto`
                              : `${isEnglishPricing ? '$' : 'R$'} ${appliedPromo.discount_value} de desconto`
                            }
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleRemovePromo}
                        className="text-green-700 hover:text-green-800"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Input
                        placeholder="Digite seu código promocional"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                        className="flex-1"
                      />
                      <Button
                        onClick={handleApplyPromo}
                        disabled={validating || !promoCode.trim()}
                        variant="outline"
                        size="sm"
                      >
                        {validating ? 'Validando...' : 'Aplicar Cupom'}
                      </Button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Button 
                    onClick={() => handleUpgrade(monthlyPriceId)} 
                    disabled={creatingSession || loading}
                    className="w-full bg-primary hover:bg-primary/90"
                  >
                    {creatingSession ? t('subscription.loading') : t('subscription.subscribeMonthly')}
                  </Button>
                  <Button 
                    onClick={() => handleUpgrade(annualPriceId)} 
                    disabled={creatingSession || loading}
                    variant="outline"
                    className="w-full"
                  >
                    {creatingSession ? t('subscription.loading') : t('subscription.subscribeAnnually')}
                  </Button>
                </div>
              </>
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