import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, BarChart3 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import appInterface from "@/assets/app-interface.jpg";

const AppDemoSection = () => {
  const { t } = useLanguage();

  const features = [
    {
      icon: DollarSign,
      title: t('demo.balance.title'),
      description: t('demo.balance.description'),
    },
    {
      icon: [TrendingUp, TrendingDown],
      title: t('demo.transactions.title'),
      description: t('demo.transactions.description'),
    },
    {
      icon: BarChart3,
      title: t('demo.analysis.title'),
      description: t('demo.analysis.description'),
    },
  ];

  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12 lg:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4 lg:mb-6">
            {t('demo.title')}
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
            {t('demo.subtitle')}
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* App Screenshot */}
          <div className="relative order-2 lg:order-1 px-4 sm:px-8 lg:px-0">
            <div className="relative rounded-lg sm:rounded-xl lg:rounded-2xl overflow-hidden shadow-elegant">
              <img 
                src={appInterface} 
                alt={t('demo.subtitle')} 
                className="w-full h-auto object-cover aspect-[3/4] sm:aspect-[4/5] lg:aspect-auto"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent"></div>
            </div>
            {/* Floating UI elements - Hidden on small screens */}
            <div className="hidden sm:block absolute -top-2 sm:-top-4 -right-2 sm:-right-4 animate-bounce delay-300">
              <Card className="p-2 sm:p-3 bg-card border-primary/20 shadow-glow-green">
                <div className="flex items-center gap-1 sm:gap-2">
                  <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
                  <span className="text-xs sm:text-sm font-medium text-card-foreground">{t('demo.growth')}</span>
                </div>
              </Card>
            </div>
          </div>
          
          {/* Features */}
          <div className="space-y-4 sm:space-y-6 order-1 lg:order-2">
            <div className="space-y-4 sm:space-y-6 lg:space-y-8">
              {/* Saldo Total */}
              <Card className="p-4 sm:p-6 border-l-4 border-l-primary hover:shadow-elegant transition-all duration-300">
                <div className="flex items-start sm:items-center gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base sm:text-lg font-semibold text-foreground mb-1">{t('demo.balance.title')}</h3>
                    <p className="text-sm sm:text-base text-muted-foreground">{t('demo.balance.description')}</p>
                  </div>
                </div>
              </Card>
              
              {/* Receitas e Despesas */}
              <Card className="p-4 sm:p-6 border-l-4 border-l-secondary hover:shadow-elegant transition-all duration-300">
                <div className="flex items-start sm:items-center gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-secondary/10 flex items-center justify-center flex-shrink-0">
                    <div className="flex gap-0.5 sm:gap-1">
                      <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
                      <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4 text-destructive" />
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base sm:text-lg font-semibold text-foreground mb-1">{t('demo.transactions.title')}</h3>
                    <p className="text-sm sm:text-base text-muted-foreground">{t('demo.transactions.description')}</p>
                  </div>
                </div>
              </Card>
              
              {/* Análise por Usuário */}
              <Card className="p-4 sm:p-6 border-l-4 border-l-accent hover:shadow-elegant transition-all duration-300">
                <div className="flex items-start sm:items-center gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                    <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-accent" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base sm:text-lg font-semibold text-foreground mb-1">{t('demo.analysis.title')}</h3>
                    <p className="text-sm sm:text-base text-muted-foreground">{t('demo.analysis.description')}</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AppDemoSection;