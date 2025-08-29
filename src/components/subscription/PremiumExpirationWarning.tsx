import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Clock, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface ExpirationWarning {
  daysUntilExpiration: number;
  endDate: string;
  language: string;
}

export const PremiumExpirationWarning = () => {
  const { user } = useAuth();
  const { t, language: currentLanguage } = useLanguage();
  const [warning, setWarning] = useState<ExpirationWarning | null>(null);
  const [isVisible, setIsVisible] = useState(true);

  const texts = {
    pt: {
      title: 'Seu acesso premium está expirando',
      warning7: 'Seu acesso premium expira em 7 dias',
      warning3: 'Seu acesso premium expira em 3 dias',
      warning1: 'Seu acesso premium expira amanhã!',
      description: 'Para continuar aproveitando todos os recursos premium, efetue o pagamento antes do vencimento.',
      gracePeriod: 'Seus dados ficam armazenados por 90 dias após o vencimento para facilitar sua renovação.',
      upgradeButton: 'Renovar Premium',
      dismissButton: 'Dispensar',
    },
    en: {
      title: 'Your premium access is expiring',
      warning7: 'Your premium access expires in 7 days',
      warning3: 'Your premium access expires in 3 days',
      warning1: 'Your premium access expires tomorrow!',
      description: 'To continue enjoying all premium features, make your payment before expiration.',
      gracePeriod: 'Your data will be stored for 90 days after expiration to facilitate renewal.',
      upgradeButton: 'Renew Premium',
      dismissButton: 'Dismiss',
    },
    es: {
      title: 'Tu acceso premium está expirando',
      warning7: 'Tu acceso premium expira en 7 días',
      warning3: 'Tu acceso premium expira en 3 días',
      warning1: '¡Tu acceso premium expira mañana!',
      description: 'Para continuar disfrutando todas las funciones premium, realiza el pago antes del vencimiento.',
      gracePeriod: 'Tus datos se almacenan por 90 días después del vencimiento para facilitar la renovación.',
      upgradeButton: 'Renovar Premium',
      dismissButton: 'Descartar',
    },
  };

  const currentTexts = texts[currentLanguage as keyof typeof texts] || texts.pt;

  useEffect(() => {
    const checkExpirationWarning = async () => {
      if (!user?.id) return;

      try {
        const { data, error } = await supabase
          .from('manual_premium_access')
          .select('end_date, language_preference')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .maybeSingle();

        if (error || !data) return;

        const endDate = new Date(data.end_date);
        const today = new Date();
        const daysUntilExpiration = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        // Show warning for 7, 3, or 1 day before expiration
        if (daysUntilExpiration <= 7 && daysUntilExpiration >= 1) {
          setWarning({
            daysUntilExpiration,
            endDate: data.end_date,
            language: data.language_preference || 'pt',
          });
        }
      } catch (error) {
        console.error('Error checking expiration warning:', error);
      }
    };

    checkExpirationWarning();
  }, [user?.id]);

  const getWarningMessage = () => {
    if (!warning) return '';
    
    if (warning.daysUntilExpiration === 7) return currentTexts.warning7;
    if (warning.daysUntilExpiration === 3) return currentTexts.warning3;
    if (warning.daysUntilExpiration === 1) return currentTexts.warning1;
    return `${currentTexts.title} (${warning.daysUntilExpiration} dias)`;
  };

  const getAlertVariant = () => {
    if (!warning) return 'default';
    if (warning.daysUntilExpiration <= 1) return 'destructive';
    if (warning.daysUntilExpiration <= 3) return 'destructive';
    return 'default';
  };

  if (!warning || !isVisible) return null;

  return (
    <Card className="mb-6 border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/20">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <div className="flex-shrink-0">
              {warning.daysUntilExpiration <= 1 ? (
                <AlertTriangle className="h-5 w-5 text-destructive" />
              ) : (
                <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              )}
            </div>
            <div className="space-y-2 flex-1">
              <h3 className="font-medium text-foreground">
                {getWarningMessage()}
              </h3>
              <p className="text-sm text-muted-foreground">
                {currentTexts.description}
              </p>
              <p className="text-xs text-muted-foreground">
                {currentTexts.gracePeriod}
              </p>
              <div className="flex gap-2 pt-2">
                <Button size="sm" variant="default">
                  {currentTexts.upgradeButton}
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => setIsVisible(false)}
                >
                  {currentTexts.dismissButton}
                </Button>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 flex-shrink-0"
            onClick={() => setIsVisible(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};