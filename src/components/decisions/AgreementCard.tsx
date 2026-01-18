import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Handshake, 
  Check, 
  Calendar,
  Edit,
  Trash2
} from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { Agreement } from '@/hooks/useDecisions';
import { formatDistanceToNow } from 'date-fns';
import { ptBR, es, enUS } from 'date-fns/locale';

interface AgreementCardProps {
  agreement: Agreement;
}

export const AgreementCard = ({ agreement }: AgreementCardProps) => {
  const { t, language } = useLanguage();
  const dateLocale = language === 'pt' ? ptBR : language === 'es' ? es : enUS;

  const getTypeLabel = () => {
    switch (agreement.agreement_type) {
      case 'spending_limit':
        return t('decisions.agreementType.spendingLimit');
      case 'category_consensus':
        return t('decisions.agreementType.categoryConsensus');
      case 'installment_limit':
        return t('decisions.agreementType.installmentLimit');
      case 'priority':
        return t('decisions.agreementType.priority');
      case 'savings_goal':
        return t('decisions.agreementType.savingsGoal');
      default:
        return t('decisions.agreementType.custom');
    }
  };

  const isFullyAccepted = agreement.accepted_by_user1 && agreement.accepted_by_user2;

  return (
    <Card className={isFullyAccepted ? 'border-green-200 dark:border-green-800' : 'border-amber-200 dark:border-amber-800'}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <Handshake className={`h-5 w-5 ${isFullyAccepted ? 'text-green-500' : 'text-amber-500'}`} />
            <div>
              <CardTitle className="text-lg">{agreement.title}</CardTitle>
              <Badge variant="outline" className="mt-1">
                {getTypeLabel()}
              </Badge>
            </div>
          </div>
          {isFullyAccepted && (
            <Badge className="bg-green-500">
              <Check className="h-3 w-3 mr-1" />
              {t('decisions.agreement.accepted')}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {agreement.description && (
          <p className="text-sm text-muted-foreground">{agreement.description}</p>
        )}

        {/* Rules Display */}
        {agreement.rules && Object.keys(agreement.rules).length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">{t('decisions.agreement.rules')}:</p>
            <div className="space-y-1">
              {Object.entries(agreement.rules).map(([key, value]) => (
                <div key={key} className="flex justify-between text-sm p-2 bg-muted/50 rounded">
                  <span className="text-muted-foreground">{t(`decisions.rule.${key}`) || key}</span>
                  <span className="font-medium">{String(value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Acceptance Status */}
        <div className="grid grid-cols-2 gap-4">
          <div className={`p-3 rounded-lg ${agreement.accepted_by_user1 ? 'bg-green-50 dark:bg-green-950' : 'bg-muted/50'}`}>
            <div className="flex items-center gap-2">
              {agreement.accepted_by_user1 ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <div className="h-4 w-4 rounded-full border-2 border-muted-foreground" />
              )}
              <span className="text-sm">
                {agreement.accepted_by_user1 
                  ? t('decisions.agreement.user1Accepted')
                  : t('decisions.agreement.user1Pending')
                }
              </span>
            </div>
          </div>
          <div className={`p-3 rounded-lg ${agreement.accepted_by_user2 ? 'bg-green-50 dark:bg-green-950' : 'bg-muted/50'}`}>
            <div className="flex items-center gap-2">
              {agreement.accepted_by_user2 ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <div className="h-4 w-4 rounded-full border-2 border-muted-foreground" />
              )}
              <span className="text-sm">
                {agreement.accepted_by_user2 
                  ? t('decisions.agreement.user2Accepted')
                  : t('decisions.agreement.user2Pending')
                }
              </span>
            </div>
          </div>
        </div>

        {/* Review Date */}
        {agreement.review_date && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>
              {t('decisions.agreement.reviewDate')}: {new Date(agreement.review_date).toLocaleDateString()}
            </span>
          </div>
        )}

        {/* Created Date */}
        <div className="text-xs text-muted-foreground">
          {t('decisions.agreement.created')} {formatDistanceToNow(new Date(agreement.created_at), { 
            addSuffix: true, 
            locale: dateLocale 
          })}
        </div>

        {/* Actions */}
        {!isFullyAccepted && (
          <div className="flex gap-2 pt-2 border-t">
            <Button size="sm" className="bg-green-600 hover:bg-green-700">
              <Check className="h-4 w-4 mr-2" />
              {t('decisions.agreement.accept')}
            </Button>
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-2" />
              {t('decisions.agreement.propose')}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
