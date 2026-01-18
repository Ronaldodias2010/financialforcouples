import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  Check, 
  X, 
  AlertCircle,
  Pause,
  MessageCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { useDecisions, Decision, DecisionVote } from '@/hooks/useDecisions';
import { useAuth } from '@/hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';
import { ptBR, es, enUS } from 'date-fns/locale';

interface DecisionCardProps {
  decision: Decision;
  showActions?: boolean;
}

export const DecisionCard = ({ decision, showActions = true }: DecisionCardProps) => {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const { getVotesForDecision, updateDecision, pauseDecision } = useDecisions();
  const [votes, setVotes] = useState<DecisionVote[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);

  const dateLocale = language === 'pt' ? ptBR : language === 'es' ? es : enUS;

  useEffect(() => {
    const fetchVotes = async () => {
      const fetchedVotes = await getVotesForDecision(decision.id);
      setVotes(fetchedVotes);
    };
    fetchVotes();
  }, [decision.id]);

  const getStatusBadge = () => {
    switch (decision.status) {
      case 'draft':
        return <Badge variant="secondary">{t('decisions.status.draft')}</Badge>;
      case 'voting':
        return <Badge className="bg-amber-500">{t('decisions.status.voting')}</Badge>;
      case 'agreed':
        return <Badge className="bg-green-500">{t('decisions.status.agreed')}</Badge>;
      case 'rejected':
        return <Badge variant="destructive">{t('decisions.status.rejected')}</Badge>;
      case 'paused':
        return <Badge variant="outline">{t('decisions.status.paused')}</Badge>;
      case 'completed':
        return <Badge className="bg-blue-500">{t('decisions.status.completed')}</Badge>;
      default:
        return null;
    }
  };

  const getUrgencyBadge = () => {
    const colors = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800'
    };
    return (
      <Badge className={colors[decision.urgency]}>
        {t(`decisions.urgency.${decision.urgency}`)}
      </Badge>
    );
  };

  const userVote = votes.find(v => v.user_id === user?.id);
  const partnerVote = votes.find(v => v.user_id !== user?.id);

  const handlePause = async () => {
    setLoading(true);
    await pauseDecision(decision.id, 24);
    setLoading(false);
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              {getStatusBadge()}
              {getUrgencyBadge()}
            </div>
            <CardTitle className="text-lg">{decision.title}</CardTitle>
            {decision.description && (
              <CardDescription className="mt-1">{decision.description}</CardDescription>
            )}
          </div>
          <div className="text-right text-sm text-muted-foreground">
            {formatDistanceToNow(new Date(decision.created_at), { 
              addSuffix: true, 
              locale: dateLocale 
            })}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Value and Date */}
        <div className="flex flex-wrap gap-4 text-sm">
          {decision.estimated_value && (
            <div>
              <span className="text-muted-foreground">{t('decisions.field.estimatedValue')}: </span>
              <span className="font-semibold">
                {new Intl.NumberFormat(undefined, { 
                  style: 'currency', 
                  currency: decision.currency 
                }).format(decision.estimated_value)}
              </span>
            </div>
          )}
          {decision.target_date && (
            <div>
              <span className="text-muted-foreground">{t('decisions.field.targetDate')}: </span>
              <span className="font-medium">
                {new Date(decision.target_date).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>

        {/* Votes Status */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground mb-1">{t('decisions.yourVote')}</p>
            {userVote ? (
              <div className="flex items-center gap-2">
                {userVote.vote === 'agree' && <Check className="h-4 w-4 text-green-500" />}
                {userVote.vote === 'agree_with_condition' && <AlertCircle className="h-4 w-4 text-amber-500" />}
                {userVote.vote === 'disagree' && <X className="h-4 w-4 text-red-500" />}
                <span className="text-sm font-medium">
                  {t(`decisions.vote.${userVote.vote}`)}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span className="text-sm">{t('decisions.vote.pending')}</span>
              </div>
            )}
          </div>

          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground mb-1">{t('decisions.partnerVote')}</p>
            {partnerVote ? (
              <div className="flex items-center gap-2">
                {partnerVote.vote === 'agree' && <Check className="h-4 w-4 text-green-500" />}
                {partnerVote.vote === 'agree_with_condition' && <AlertCircle className="h-4 w-4 text-amber-500" />}
                {partnerVote.vote === 'disagree' && <X className="h-4 w-4 text-red-500" />}
                <span className="text-sm font-medium">
                  {t(`decisions.vote.${partnerVote.vote}`)}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span className="text-sm">{t('decisions.vote.waiting')}</span>
              </div>
            )}
          </div>
        </div>

        {/* Conditions */}
        {(userVote?.condition || partnerVote?.condition) && (
          <div className="space-y-2">
            {userVote?.condition && (
              <div className="p-2 rounded bg-amber-50 dark:bg-amber-950 text-sm">
                <span className="font-medium">{t('decisions.yourCondition')}: </span>
                {userVote.condition}
              </div>
            )}
            {partnerVote?.condition && (
              <div className="p-2 rounded bg-amber-50 dark:bg-amber-950 text-sm">
                <span className="font-medium">{t('decisions.partnerCondition')}: </span>
                {partnerVote.condition}
              </div>
            )}
          </div>
        )}

        {/* Expandable Scenarios */}
        {decision.scenarios && decision.scenarios.length > 0 && (
          <Button 
            variant="ghost" 
            className="w-full justify-between"
            onClick={() => setExpanded(!expanded)}
          >
            <span>{t('decisions.viewScenarios')}</span>
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        )}

        {expanded && decision.scenarios && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {decision.scenarios.map((scenario: any) => (
              <div 
                key={scenario.id} 
                className={`p-3 rounded-lg border ${
                  userVote?.selected_scenario === scenario.id || partnerVote?.selected_scenario === scenario.id
                    ? 'border-primary bg-primary/5'
                    : 'border-muted'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm">{scenario.name}</span>
                  {(userVote?.selected_scenario === scenario.id || partnerVote?.selected_scenario === scenario.id) && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{scenario.description}</p>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        {showActions && decision.status === 'voting' && (
          <div className="flex gap-2 pt-2 border-t">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handlePause}
              disabled={loading}
            >
              <Pause className="h-4 w-4 mr-2" />
              {t('decisions.action.pause24h')}
            </Button>
            <Button variant="outline" size="sm">
              <MessageCircle className="h-4 w-4 mr-2" />
              {t('decisions.action.discuss')}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
