import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Gift, ExternalLink, Clock, CheckCircle, Plane } from 'lucide-react';

interface AirlinePromotion {
  id: string;
  airline_code: string;
  airline_name: string;
  title: string;
  description: string;
  promotion_type: string;
  miles_required?: number;
  bonus_percentage?: number;
  discount_percentage?: number;
  route_from?: string;
  route_to?: string;
  promotion_url?: string;
  start_date: string;
  end_date: string;
  is_eligible?: boolean;
}

interface PromotionsSectionProps {
  userTotalMiles: number;
}

export const PromotionsSection = ({ userTotalMiles }: PromotionsSectionProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [promotions, setPromotions] = useState<AirlinePromotion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadPromotions();
    }
  }, [user, userTotalMiles]);

  const loadPromotions = async () => {
    try {
      const { data, error } = await supabase
        .from('airline_promotions')
        .select('*')
        .eq('is_active', true)
        .gte('end_date', new Date().toISOString().split('T')[0])
        .order('start_date', { ascending: false });

      if (error) throw error;

      // Check eligibility for each promotion
      const promotionsWithEligibility = (data || []).map(promo => ({
        ...promo,
        is_eligible: !promo.miles_required || userTotalMiles >= promo.miles_required
      }));

      setPromotions(promotionsWithEligibility);
    } catch (error) {
      console.error('Error loading promotions:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar promoções',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getPromotionTypeLabel = (type: string) => {
    switch (type) {
      case 'transfer_bonus':
        return 'Bônus Transferência';
      case 'purchase_discount':
        return 'Desconto Compra';
      case 'route_promotion':
        return 'Promoção Rota';
      default:
        return 'Promoção';
    }
  };

  const getPromotionTypeColor = (type: string) => {
    switch (type) {
      case 'transfer_bonus':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'purchase_discount':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'route_promotion':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  const formatDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 0) return 'Expirada';
    if (diffDays === 1) return '1 dia restante';
    return `${diffDays} dias restantes`;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-primary" />
            Promoções Ativas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2].map(i => (
              <div key={i} className="p-3 border rounded-lg animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-full"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="h-5 w-5 text-primary" />
          Promoções Ativas
          <Badge variant="outline" className="ml-2">
            {promotions.length} disponíveis
          </Badge>
        </CardTitle>
        <CardDescription>
          Oportunidades personalizadas baseadas no seu saldo atual de {userTotalMiles.toLocaleString()} milhas
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {promotions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Plane className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma promoção ativa no momento</p>
            <p className="text-sm">Volte em breve para novas oportunidades!</p>
          </div>
        ) : (
          promotions.map((promo) => (
            <div 
              key={promo.id} 
              className={`p-4 border rounded-lg transition-all duration-200 ${
                promo.is_eligible 
                  ? 'border-primary bg-primary/5 hover:bg-primary/10' 
                  : 'border-border hover:bg-muted/50'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold text-sm">{promo.title}</h4>
                    {promo.is_eligible && (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={getPromotionTypeColor(promo.promotion_type)}>
                      {promo.airline_name}
                    </Badge>
                    <Badge variant="outline">
                      {getPromotionTypeLabel(promo.promotion_type)}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">
                    {promo.description}
                  </p>
                  
                  {/* Promotion details */}
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    {promo.route_from && promo.route_to && (
                      <span>📍 {promo.route_from} → {promo.route_to}</span>
                    )}
                    {promo.miles_required && (
                      <span className={promo.is_eligible ? 'text-green-600 font-medium' : ''}>
                        ✈️ {promo.miles_required.toLocaleString()} milhas
                      </span>
                    )}
                    {promo.bonus_percentage && (
                      <span className="text-blue-600 font-medium">
                        🎁 +{promo.bonus_percentage}% bônus
                      </span>
                    )}
                    {promo.discount_percentage && (
                      <span className="text-green-600 font-medium">
                        💰 {promo.discount_percentage}% desconto
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-col items-end gap-2">
                  {promo.is_eligible && (
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                      Elegível!
                    </Badge>
                  )}
                  {promo.promotion_url && (
                    <Button 
                      size="sm" 
                      variant={promo.is_eligible ? "default" : "outline"}
                      asChild
                    >
                      <a 
                        href={promo.promotion_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-1"
                      >
                        Resgatar
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </Button>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
                <Clock className="h-3 w-3" />
                <span>{formatDaysRemaining(promo.end_date)}</span>
                <span>•</span>
                <span>Válida até {new Date(promo.end_date).toLocaleDateString('pt-BR')}</span>
              </div>
            </div>
          ))
        )}
        
        <div className="text-center pt-4 border-t">
          <Button 
            variant="outline" 
            size="sm"
            onClick={loadPromotions}
            disabled={loading}
          >
            🔄 Atualizar Promoções
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};