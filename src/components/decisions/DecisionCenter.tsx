import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Clock, 
  Handshake, 
  Calendar,
  ArrowLeft,
  Heart,
  AlertCircle,
  CheckCircle2,
  Users
} from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { useDecisions } from '@/hooks/useDecisions';
import { DecisionWizard } from './DecisionWizard';
import { DecisionCard } from './DecisionCard';
import { AgreementCard } from './AgreementCard';

interface DecisionCenterProps {
  onBack: () => void;
}

export const DecisionCenter = ({ onBack }: DecisionCenterProps) => {
  const { t } = useLanguage();
  const { 
    decisions, 
    agreements, 
    loading, 
    isPartOfCouple,
    getPendingDecisions,
    getActiveAgreements
  } = useDecisions();
  
  const [showWizard, setShowWizard] = useState(false);
  const [activeView, setActiveView] = useState<'home' | 'pending' | 'agreements' | 'history'>('home');

  const pendingDecisions = getPendingDecisions();
  const activeAgreements = getActiveAgreements();
  const completedDecisions = decisions.filter(d => d.status === 'completed' || d.status === 'agreed');

  // Check if monthly review is needed (first of month)
  const isReviewTime = new Date().getDate() <= 7;

  if (!isPartOfCouple) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('common.back')}
          </Button>
        </div>
        
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950 dark:border-amber-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Users className="h-12 w-12 text-amber-600" />
              <div>
                <h3 className="text-lg font-semibold text-amber-800 dark:text-amber-200">
                  {t('decisions.coupleRequired')}
                </h3>
                <p className="text-amber-700 dark:text-amber-300">
                  {t('decisions.coupleRequiredDescription')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showWizard) {
    return (
      <DecisionWizard 
        onBack={() => setShowWizard(false)}
        onComplete={() => {
          setShowWizard(false);
          setActiveView('pending');
        }}
      />
    );
  }

  const renderHomeView = () => (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="text-center py-6">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Heart className="h-6 w-6 text-rose-500" />
          <h2 className="text-2xl font-bold">{t('decisions.welcomeTitle')}</h2>
        </div>
        <p className="text-muted-foreground">
          {t('decisions.welcomeSubtitle')}
        </p>
      </div>

      {/* Main Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Create Decision */}
        <Card 
          className="cursor-pointer hover:shadow-lg transition-shadow border-2 border-dashed border-primary/50 hover:border-primary"
          onClick={() => setShowWizard(true)}
        >
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Plus className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">{t('decisions.createNew')}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('decisions.createNewDescription')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pending Decisions */}
        <Card 
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => setActiveView('pending')}
        >
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-amber-100 dark:bg-amber-900">
                <Clock className="h-8 w-8 text-amber-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-lg">{t('decisions.pending')}</h3>
                  {pendingDecisions.length > 0 && (
                    <Badge variant="destructive">{pendingDecisions.length}</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {t('decisions.pendingDescription')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Couple Agreements */}
        <Card 
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => setActiveView('agreements')}
        >
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-100 dark:bg-green-900">
                <Handshake className="h-8 w-8 text-green-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-lg">{t('decisions.agreements')}</h3>
                  <Badge variant="secondary">{activeAgreements.length}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {t('decisions.agreementsDescription')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Review */}
        <Card 
          className={`cursor-pointer hover:shadow-lg transition-shadow ${isReviewTime ? 'ring-2 ring-blue-500' : ''}`}
          onClick={() => setActiveView('history')}
        >
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900">
                <Calendar className="h-8 w-8 text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-lg">{t('decisions.monthlyReview')}</h3>
                  {isReviewTime && (
                    <Badge className="bg-blue-500">{t('decisions.reviewTime')}</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {t('decisions.monthlyReviewDescription')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4 text-center">
            <div className="text-3xl font-bold text-primary">{completedDecisions.length}</div>
            <p className="text-xs text-muted-foreground">{t('decisions.completed')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <div className="text-3xl font-bold text-green-600">{activeAgreements.length}</div>
            <p className="text-xs text-muted-foreground">{t('decisions.activeAgreements')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <div className="text-3xl font-bold text-amber-600">{pendingDecisions.length}</div>
            <p className="text-xs text-muted-foreground">{t('decisions.awaitingVote')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Anti-Conflict Reminder */}
      <Card className="bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-950 dark:to-pink-950 border-rose-200 dark:border-rose-800">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Heart className="h-5 w-5 text-rose-500 mt-0.5" />
            <div>
              <h4 className="font-medium text-rose-800 dark:text-rose-200">
                {t('decisions.antiConflictTitle')}
              </h4>
              <p className="text-sm text-rose-700 dark:text-rose-300 mt-1">
                {t('decisions.antiConflictMessage')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderPendingView = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => setActiveView('home')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('common.back')}
        </Button>
        <h2 className="text-xl font-bold">{t('decisions.pending')}</h2>
      </div>

      {pendingDecisions.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="font-semibold text-lg">{t('decisions.noPending')}</h3>
            <p className="text-muted-foreground mt-2">{t('decisions.noPendingDescription')}</p>
            <Button className="mt-4" onClick={() => setShowWizard(true)}>
              <Plus className="h-4 w-4 mr-2" />
              {t('decisions.createNew')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {pendingDecisions.map(decision => (
            <DecisionCard key={decision.id} decision={decision} />
          ))}
        </div>
      )}
    </div>
  );

  const renderAgreementsView = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => setActiveView('home')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('common.back')}
        </Button>
        <h2 className="text-xl font-bold">{t('decisions.agreements')}</h2>
      </div>

      {activeAgreements.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <Handshake className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-lg">{t('decisions.noAgreements')}</h3>
            <p className="text-muted-foreground mt-2">{t('decisions.noAgreementsDescription')}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {activeAgreements.map(agreement => (
            <AgreementCard key={agreement.id} agreement={agreement} />
          ))}
        </div>
      )}
    </div>
  );

  const renderHistoryView = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => setActiveView('home')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('common.back')}
        </Button>
        <h2 className="text-xl font-bold">{t('decisions.history')}</h2>
      </div>

      {completedDecisions.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-lg">{t('decisions.noHistory')}</h3>
            <p className="text-muted-foreground mt-2">{t('decisions.noHistoryDescription')}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {completedDecisions.map(decision => (
            <DecisionCard key={decision.id} decision={decision} showActions={false} />
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('common.back')}
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{t('decisions.title')}</h1>
          <p className="text-muted-foreground">{t('decisions.subtitle')}</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : (
        <>
          {activeView === 'home' && renderHomeView()}
          {activeView === 'pending' && renderPendingView()}
          {activeView === 'agreements' && renderAgreementsView()}
          {activeView === 'history' && renderHistoryView()}
        </>
      )}
    </div>
  );
};
