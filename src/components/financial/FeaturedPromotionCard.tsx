import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ExternalLink, Plane, MapPin, Sparkles, Target, TrendingDown, CheckCircle2, X } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { formatDistanceToNow } from 'date-fns';
import { ptBR, enUS, es } from 'date-fns/locale';

interface FeaturedPromotionCardProps {
  promotion: {
    id: string;
    programa: string;
    origem: string | null;
    destino: string;
    milhas_min: number;
    link: string;
    titulo: string | null;
    descricao: string | null;
    created_at: string;
    fonte: string;
  };
  matchedGoal: {
    id?: string;
    name: string;
    current_miles: number;
    target_miles: number;
  };
  userTotalMiles: number;
  onDismiss?: (promotionId: string) => void;
}

export const FeaturedPromotionCard = ({ 
  promotion, 
  matchedGoal, 
  userTotalMiles,
  onDismiss
}: FeaturedPromotionCardProps) => {
  const { t, language } = useLanguage();
  
  const canRedeem = userTotalMiles >= promotion.milhas_min;
  const milesNeeded = promotion.milhas_min - userTotalMiles;
  const progressPercent = Math.min((userTotalMiles / promotion.milhas_min) * 100, 100);

  const getLocale = () => {
    if (language === 'pt') return ptBR;
    if (language === 'es') return es;
    return enUS;
  };

  const formatMiles = (miles: number) => {
    return new Intl.NumberFormat('pt-BR').format(miles);
  };

  const getProgramColor = (programa: string) => {
    const colors: Record<string, string> = {
      'Smiles': 'bg-orange-500 text-white',
      'LATAM Pass': 'bg-red-500 text-white',
      'TudoAzul': 'bg-blue-500 text-white',
      'Livelo': 'bg-purple-500 text-white',
      'Esfera': 'bg-green-600 text-white',
      'AAdvantage': 'bg-sky-500 text-white',
      'Avianca': 'bg-rose-500 text-white',
      'Diversos': 'bg-gray-500 text-white',
    };
    return colors[programa] || colors['Diversos'];
  };

  return (
    <Card className="relative overflow-hidden border-2 border-primary/50 bg-gradient-to-br from-primary/5 via-background to-secondary/5 shadow-lg hover:shadow-xl transition-all duration-300">
      {/* Animated glow effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-secondary/10 animate-pulse pointer-events-none" />
      
      {/* Dismiss button */}
      {onDismiss && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-1 right-1 z-10 h-7 w-7 p-0 bg-background/80 hover:bg-destructive/10 hover:text-destructive rounded-full"
                onClick={() => onDismiss(promotion.id)}
              >
                <X className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">{t('promotions.dismissPromotion') || 'Dispensar esta promoção'}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
      
      {/* Featured badge */}
      <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-primary to-secondary text-primary-foreground py-1.5 px-4 flex items-center justify-center gap-2">
        <Sparkles className="h-4 w-4" />
        <span className="text-sm font-semibold">
          {t('promotions.matchesYourGoal') || 'Combina com sua meta!'}
        </span>
        <Target className="h-4 w-4" />
      </div>

      <CardContent className="pt-12 pb-5 px-5">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Left side - Promotion info */}
          <div className="flex-1 space-y-3">
            {/* Program badge */}
            <Badge className={`${getProgramColor(promotion.programa)} shadow-sm`}>
              <Plane className="h-3 w-3 mr-1" />
              {promotion.programa}
            </Badge>

            {/* Title */}
            <h3 className="font-bold text-lg text-foreground leading-tight">
              {promotion.titulo || `${promotion.programa} - ${promotion.destino}`}
            </h3>

            {/* Route */}
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span className="font-medium">
                {promotion.origem && promotion.origem !== 'Brasil' 
                  ? `${promotion.origem} → ${promotion.destino}`
                  : promotion.destino
                }
              </span>
            </div>

            {/* Description */}
            {promotion.descricao && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {promotion.descricao}
              </p>
            )}

            {/* Matched goal indicator */}
            <div className="flex items-center gap-2 bg-primary/10 rounded-lg px-3 py-2">
              <Target className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">
                {t('promotions.perfectFor') || 'Perfeito para sua meta:'} {matchedGoal.name}
              </span>
            </div>
          </div>

          {/* Right side - Miles and CTA */}
          <div className="lg:w-64 flex flex-col justify-between gap-4 lg:border-l lg:pl-4">
            {/* Miles required */}
            <div className="text-center lg:text-left">
              <div className="flex items-center justify-center lg:justify-start gap-2 mb-1">
                <TrendingDown className="h-5 w-5 text-primary" />
                <span className="text-3xl font-bold text-foreground">
                  {formatMiles(promotion.milhas_min)}
                </span>
              </div>
              <span className="text-sm text-muted-foreground">milhas necessárias</span>
            </div>

            {/* Progress indicator */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Seu saldo</span>
                <span className="font-medium">{formatMiles(userTotalMiles)}</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    canRedeem 
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                      : 'bg-gradient-to-r from-primary to-secondary'
                  }`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              {canRedeem ? (
                <div className="flex items-center justify-center gap-1 text-green-600 dark:text-green-400 font-semibold text-sm">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{t('promotions.youCanRedeem') || 'Você pode resgatar!'}</span>
                </div>
              ) : (
                <p className="text-xs text-center text-muted-foreground">
                  {t('promotions.needMore') || 'Faltam'} {formatMiles(milesNeeded)} milhas
                </p>
              )}
            </div>

            {/* CTA Button */}
            <Button 
              className={`w-full ${
                canRedeem 
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg' 
                  : 'bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-primary-foreground'
              }`}
              asChild
            >
              <a href={promotion.link} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                {canRedeem 
                  ? (t('promotions.redeemNow') || 'Resgatar Agora!')
                  : (t('promotions.seeDetails') || 'Ver Detalhes')
                }
              </a>
            </Button>

            {/* Time */}
            <p className="text-xs text-center text-muted-foreground">
              {formatDistanceToNow(new Date(promotion.created_at), { 
                addSuffix: true, 
                locale: getLocale() 
              })}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
