import { Card } from "@/components/ui/card";
import { Heart, Globe, Bot, Plane, Mic, Shield } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import useInView from "@/hooks/use-in-view";

const BenefitsSection = () => {
  const { t } = useLanguage();
  const { ref, inView } = useInView({ threshold: 0.1 });

  const benefits = [
    {
      icon: Heart,
      title: t('benefits.shared.title'),
      description: t('benefits.shared.description'),
    },
    {
      icon: Globe,
      title: t('benefits.multicurrency.title'),
      description: t('benefits.multicurrency.description'),
    },
    {
      icon: Bot,
      title: t('benefits.ai.title'),
      description: t('benefits.ai.description'),
    },
    {
      icon: Plane,
      title: t('benefits.miles.title'),
      description: t('benefits.miles.description'),
    },
    {
      icon: Mic,
      title: t('benefits.voice.title'),
      description: t('benefits.voice.description'),
    },
    {
      icon: Shield,
      title: t('benefits.security.title'),
      description: t('benefits.security.description'),
    },
  ];

  return (
    <section id="benefits" className="py-20 bg-background" ref={ref}>
      <div className="container mx-auto px-4">
        {/* Header with SEO-optimized structure */}
        <header className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
            {t('benefits.title.full')}{" "}
            <span className="bg-hero-gradient bg-clip-text text-transparent">
              {t('benefits.brand')}
            </span>
          </h2>
          <h3 className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {t('benefits.subtitle')}
          </h3>
        </header>
        
        {/* Benefits Grid with lazy loading */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => (
            <Card 
              key={index} 
              className={`p-6 hover:shadow-elegant transition-all duration-300 hover:-translate-y-2 group border-2 hover:border-primary/20 ${
                inView ? 'animate-in slide-in-from-bottom-4' : 'opacity-0'
              }`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-lg bg-hero-gradient flex items-center justify-center group-hover:shadow-glow-green transition-all duration-300">
                    <benefit.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                    {benefit.title}
                  </h4>
                  <p className="text-muted-foreground leading-relaxed">
                    {benefit.description}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;