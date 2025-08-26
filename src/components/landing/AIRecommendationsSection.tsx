import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Brain, BookOpen, MessageSquare, TrendingUp, Target, Lightbulb } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import aiRecommendations from "@/assets/ai-recommendations.jpg";

const AIRecommendationsSection = () => {
  const { t } = useLanguage();

  const features = [
    {
      icon: Brain,
      title: t('aiSection.feature1'),
    },
    {
      icon: TrendingUp,
      title: t('aiSection.feature2'),
    },
    {
      icon: Target,
      title: t('aiSection.feature3'),
    },
  ];

  return (
    <section className="py-20 bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Lightbulb className="w-4 h-4" />
            {t('aiSection.badge')}
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
            {t('aiSection.title')}
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {t('aiSection.subtitle')}
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="space-y-8">
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-foreground">
                {t('aiSection.howItWorks')}
              </h3>
              
              {/* Steps */}
              <div className="space-y-4">
                <Card className="p-4 border-l-4 border-l-primary">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold">
                      1
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">{t('aiSection.step1.title')}</h4>
                      <p className="text-muted-foreground text-sm">
                        {t('aiSection.step1.description')}
                      </p>
                    </div>
                  </div>
                </Card>
                
                <Card className="p-4 border-l-4 border-l-secondary">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center text-sm font-bold">
                      2
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">{t('aiSection.step2.title')}</h4>
                      <p className="text-muted-foreground text-sm">
                        {t('aiSection.step2.description')}
                      </p>
                    </div>
                  </div>
                </Card>
                
                <Card className="p-4 border-l-4 border-l-accent">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-sm font-bold">
                      3
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">{t('aiSection.step3.title')}</h4>
                      <p className="text-muted-foreground text-sm">
                        {t('aiSection.step3.description')}
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
            
            {/* Benefits */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-foreground">
                {t('aiSection.benefitsTitle')}
              </h4>
              <ul className="space-y-2 text-muted-foreground">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <feature.icon className="w-4 h-4 text-primary" />
                    {feature.title}
                  </li>
                ))}
                <li className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-primary" />
                  {t('aiSection.educationalContent')}
                </li>
              </ul>
            </div>
            
            {/* CTA */}
            <Button size="lg" className="w-full sm:w-auto">
              <MessageSquare className="w-5 h-5" />
              {t('aiSection.cta')}
            </Button>
          </div>

          {/* AI Interface Image */}
          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden shadow-elegant">
              <img 
                src={aiRecommendations} 
                alt={t('aiSection.imageAlt')} 
                className="w-full h-auto object-cover"
              />
            </div>
            {/* Floating AI indicator */}
            <div className="absolute -top-4 -right-4 animate-pulse">
              <Card className="p-3 bg-primary text-white shadow-lg">
                <div className="flex items-center gap-2">
                  <Brain className="w-4 h-4" />
                  <span className="text-sm font-medium">{t('aiSection.processing')}</span>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AIRecommendationsSection;