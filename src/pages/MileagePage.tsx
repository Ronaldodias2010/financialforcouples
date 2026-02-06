import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { useLanguage } from '@/hooks/useLanguage';
import { MileageSystem } from '@/components/financial/MileageSystem';
// PromotionsSection removed - using ScrapedPromotionsList instead
import { ScrapedPromotionsList } from '@/components/financial/ScrapedPromotionsList';
import { TravelSuggestionsSection } from '@/components/financial/TravelSuggestionsSection';
import { SmartAlertsSection } from '@/components/financial/SmartAlertsSection';
import { NotificationCenter } from '@/components/financial/NotificationCenter';
import { PremiumFeatureGuard } from '@/components/subscription/PremiumFeatureGuard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Bell, TrendingUp, Gift, Clock, ArrowLeft, User } from 'lucide-react';

interface MileagePageProps {
  onBack: () => void;
}

export const MileagePage = ({ onBack }: MileagePageProps) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { hasAccess, subscriptionTier } = useSubscription();
  const [userTotalMiles, setUserTotalMiles] = useState(0);

  // Calculate user's total miles
  useEffect(() => {
    const calculateTotalMiles = async () => {
      if (!user?.id) return;

      try {
        // Get miles from mileage history
        const { data: historyMiles } = await supabase
          .from('mileage_history')
          .select('miles_earned')
          .eq('user_id', user.id);

        // Get existing miles from card rules
        const { data: existingMiles } = await supabase
          .from('card_mileage_rules')
          .select('existing_miles')
          .eq('user_id', user.id)
          .eq('is_active', true);

        const totalFromHistory = historyMiles?.reduce((sum, item) => sum + (item.miles_earned || 0), 0) || 0;
        const totalFromExisting = existingMiles?.reduce((sum, item) => sum + (item.existing_miles || 0), 0) || 0;

        setUserTotalMiles(totalFromHistory + totalFromExisting);
      } catch (error) {
        console.error('Error calculating total miles:', error);
      }
    };

    calculateTotalMiles();
  }, [user?.id]);

  const redemptionSuggestions = [
    { route: 'São Paulo → Paris', miles: 45000, value: 'R$ 2.800', availability: 'Alta' },
    { route: 'Rio → Miami', miles: 35000, value: 'R$ 1.950', availability: 'Média' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('back')}
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{t('mileage.title')}</h1>
          <p className="text-muted-foreground">{t('mileage.subtitle')}</p>
        </div>
        {subscriptionTier === 'premium' && (
          <Badge variant="default" className="bg-primary ml-auto">
            Premium Active
          </Badge>
        )}
      </div>

      {/* Basic Mileage System (Available for all) */}
      <MileageSystem />

      {/* Premium Features */}
      {hasAccess('aiMileage') ? (
        <div className="space-y-6">
          {/* Scraped Promotions - from Firecrawl */}
          <ScrapedPromotionsList userTotalMiles={userTotalMiles} />

          {/* Travel Suggestions from Scraper */}
          <TravelSuggestionsSection userTotalMiles={userTotalMiles} />
          
          {/* Smart alerts only - promotions handled by ScrapedPromotionsList */}
          <SmartAlertsSection userTotalMiles={userTotalMiles} />
          
          {/* Notification Center */}
          <NotificationCenter />

          {/* Redemption Suggestions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                Sugestões de Resgate Inteligentes
              </CardTitle>
              <CardDescription>
                Melhores oportunidades baseadas no seu saldo atual
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {redemptionSuggestions.map((suggestion, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div>
                      <h4 className="font-semibold">{suggestion.route}</h4>
                      <p className="text-sm text-muted-foreground">
                        {suggestion.miles.toLocaleString()} milhas • Valor: {suggestion.value}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant={suggestion.availability === 'Alta' ? 'default' : 'secondary'}>
                        {suggestion.availability}
                      </Badge>
                      <Button size="sm" className="ml-2">
                        Ver Detalhes
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        /* Premium Feature Preview */
        <PremiumFeatureGuard feature="aiMileage">
          <div className="grid gap-6 opacity-60 pointer-events-none">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gift className="h-5 w-5 text-primary" />
                    Promoções Ativas
                    <Badge variant="outline" className="ml-2">Premium</Badge>
                  </CardTitle>
                  <CardDescription>
                    Monitoramento automático de ofertas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="p-3 border rounded-lg">
                      <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-muted rounded w-full"></div>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <div className="h-4 bg-muted rounded w-2/3 mb-2"></div>
                      <div className="h-3 bg-muted rounded w-5/6"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5 text-orange-500" />
                    Alertas Inteligentes
                    <Badge variant="outline" className="ml-2">Premium</Badge>
                  </CardTitle>
                  <CardDescription>
                    IA monitora expiração e oportunidades
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="p-3 border rounded-lg">
                      <div className="h-3 bg-muted rounded w-full"></div>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <div className="h-3 bg-muted rounded w-4/5"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  Comparador de Resgates
                  <Badge variant="outline" className="ml-2">Premium</Badge>
                </CardTitle>
                <CardDescription>
                  Análise automática das melhores oportunidades
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {[1, 2].map((_, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-2">
                        <div className="h-4 bg-muted rounded w-32"></div>
                        <div className="h-3 bg-muted rounded w-48"></div>
                      </div>
                      <div className="h-8 bg-muted rounded w-20"></div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </PremiumFeatureGuard>
      )}
    </div>
  );
};