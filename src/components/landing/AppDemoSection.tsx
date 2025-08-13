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
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
            {t('demo.title')}
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {t('demo.subtitle')}
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* App Screenshot */}
          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden shadow-elegant">
              <img 
                src={appInterface} 
                alt={t('demo.subtitle')} 
                className="w-full h-auto object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent"></div>
            </div>
            {/* Floating UI elements */}
            <div className="absolute -top-4 -right-4 animate-bounce delay-300">
              <Card className="p-3 bg-card border-primary/20 shadow-glow-green">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-card-foreground">{t('demo.growth')}</span>
                </div>
              </Card>
            </div>
          </div>
          
          {/* Features */}
          <div className="space-y-6">
            <div className="space-y-8">
              {/* Saldo Total */}
              <Card className="p-6 border-l-4 border-l-primary hover:shadow-elegant transition-all duration-300">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">{t('demo.balance.title')}</h3>
                    <p className="text-muted-foreground">{t('demo.balance.description')}</p>
                  </div>
                </div>
              </Card>
              
              {/* Receitas e Despesas */}
              <Card className="p-6 border-l-4 border-l-secondary hover:shadow-elegant transition-all duration-300">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center">
                    <div className="flex gap-1">
                      <TrendingUp className="w-4 h-4 text-primary" />
                      <TrendingDown className="w-4 h-4 text-destructive" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">{t('demo.transactions.title')}</h3>
                    <p className="text-muted-foreground">{t('demo.transactions.description')}</p>
                  </div>
                </div>
              </Card>
              
              {/* Análise por Usuário */}
              <Card className="p-6 border-l-4 border-l-accent hover:shadow-elegant transition-all duration-300">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                    <BarChart3 className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">{t('demo.analysis.title')}</h3>
                    <p className="text-muted-foreground">{t('demo.analysis.description')}</p>
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