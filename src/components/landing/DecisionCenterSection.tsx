import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Scale, Users, Vote, FileCheck, Sparkles, MessageSquare, History, ThumbsUp, ThumbsDown, Crown } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNavigate } from "react-router-dom";

const DecisionCenterSection = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const features = [
    {
      icon: Sparkles,
      title: t('decisionSection.feature1'),
    },
    {
      icon: History,
      title: t('decisionSection.feature2'),
    },
    {
      icon: Vote,
      title: t('decisionSection.feature3'),
    },
    {
      icon: FileCheck,
      title: t('decisionSection.feature4'),
    },
  ];

  return (
    <section className="py-20 bg-gradient-to-b from-muted/20 via-background to-muted/10 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-primary/20 to-secondary/20 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6 border border-primary/20">
            <Crown className="w-4 h-4" />
            {t('decisionSection.badge')}
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
            {t('decisionSection.title')}
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {t('decisionSection.subtitle')}
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="space-y-8">
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-foreground">
                {t('decisionSection.howItWorks')}
              </h3>
              
              {/* Steps */}
              <div className="space-y-4">
                <Card className="p-4 border-l-4 border-l-primary bg-card/80 backdrop-blur-sm">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold shrink-0">
                      1
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">{t('decisionSection.step1.title')}</h4>
                      <p className="text-muted-foreground text-sm">
                        {t('decisionSection.step1.description')}
                      </p>
                    </div>
                  </div>
                </Card>
                
                <Card className="p-4 border-l-4 border-l-secondary bg-card/80 backdrop-blur-sm">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center text-sm font-bold shrink-0">
                      2
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">{t('decisionSection.step2.title')}</h4>
                      <p className="text-muted-foreground text-sm">
                        {t('decisionSection.step2.description')}
                      </p>
                    </div>
                  </div>
                </Card>
                
                <Card className="p-4 border-l-4 border-l-accent bg-card/80 backdrop-blur-sm">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-sm font-bold shrink-0">
                      3
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">{t('decisionSection.step3.title')}</h4>
                      <p className="text-muted-foreground text-sm">
                        {t('decisionSection.step3.description')}
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
            
            {/* Benefits */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-foreground">
                {t('decisionSection.benefitsTitle')}
              </h4>
              <ul className="space-y-2 text-muted-foreground">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <feature.icon className="w-4 h-4 text-primary" />
                    {feature.title}
                  </li>
                ))}
              </ul>
            </div>
            
            {/* CTA */}
            <Button 
              size="lg" 
              className="w-full sm:w-auto bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
              onClick={() => navigate('/auth')}
            >
              <Scale className="w-5 h-5" />
              {t('decisionSection.cta')}
            </Button>
          </div>

          {/* Decision Mockup */}
          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden shadow-elegant bg-gradient-to-br from-card to-card/80 border p-6 space-y-4">
              {/* Decision Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Scale className="w-5 h-5 text-primary" />
                  <span className="font-semibold text-foreground">{t('decisionSection.mockup.title')}</span>
                </div>
                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">{t('decisionSection.mockup.pending')}</span>
              </div>
              
              {/* Decision Value */}
              <div className="text-center py-4">
                <p className="text-3xl font-bold text-foreground">R$ 45.000</p>
                <p className="text-sm text-muted-foreground">{t('decisionSection.mockup.estimatedValue')}</p>
              </div>
              
              {/* Pros and Cons */}
              <div className="grid grid-cols-2 gap-3">
                <Card className="p-3 bg-emerald-50 border-emerald-200">
                  <div className="flex items-center gap-2 mb-2">
                    <ThumbsUp className="w-4 h-4 text-emerald-600" />
                    <span className="text-sm font-medium text-emerald-700">{t('decisionSection.mockup.pros')}</span>
                  </div>
                  <ul className="text-xs text-emerald-600 space-y-1">
                    <li>• {t('decisionSection.mockup.pro1')}</li>
                    <li>• {t('decisionSection.mockup.pro2')}</li>
                  </ul>
                </Card>
                
                <Card className="p-3 bg-rose-50 border-rose-200">
                  <div className="flex items-center gap-2 mb-2">
                    <ThumbsDown className="w-4 h-4 text-rose-600" />
                    <span className="text-sm font-medium text-rose-700">{t('decisionSection.mockup.cons')}</span>
                  </div>
                  <ul className="text-xs text-rose-600 space-y-1">
                    <li>• {t('decisionSection.mockup.con1')}</li>
                    <li>• {t('decisionSection.mockup.con2')}</li>
                  </ul>
                </Card>
              </div>
              
              {/* AI Suggestion */}
              <Card className="p-3 bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
                <div className="flex items-start gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-primary">{t('decisionSection.mockup.aiLabel')}</p>
                    <p className="text-sm text-muted-foreground">{t('decisionSection.mockup.aiSuggestion')}</p>
                  </div>
                </div>
              </Card>
              
              {/* Voting */}
              <div className="flex items-center justify-center gap-4 pt-2">
                <div className="flex items-center gap-2 bg-muted rounded-full px-4 py-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{t('decisionSection.mockup.waitingVote')}</span>
                </div>
              </div>
            </div>
            
            {/* Floating Premium indicator */}
            <div className="absolute -top-4 -right-4 animate-pulse">
              <Card className="p-3 bg-gradient-to-r from-primary to-secondary text-white shadow-lg border-0">
                <div className="flex items-center gap-2">
                  <Crown className="w-4 h-4" />
                  <span className="text-sm font-medium">{t('decisionSection.premium')}</span>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DecisionCenterSection;
