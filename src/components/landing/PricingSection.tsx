import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, Sparkles, Download } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import useInView from "@/hooks/use-in-view";

const PricingSection = () => {
  const { t } = useLanguage();
  const plans = [
    {
      name: t('pricing.free.name'),
      price: t('pricing.free.price'),
      period: t('pricing.free.period'),
      description: t('pricing.free.description'),
      features: [
        t('pricing.free.feature1'),
        t('pricing.free.feature2'),
        t('pricing.free.feature3'),
        t('pricing.free.feature4'),
        t('pricing.free.feature5'),
        t('pricing.free.feature6'),
        t('pricing.free.feature7'),
      ],
      buttonText: t('pricing.free.button'),
      buttonVariant: "outline" as const,
      popular: false,
    },
    {
      name: t('pricing.premium.name'),
      price: t('pricing.premium.price'),
      period: t('pricing.premium.period'),
      description: t('pricing.premium.description'),
      features: [
        t('pricing.premium.feature1'),
        t('pricing.premium.feature2'),
        t('pricing.premium.feature3'),
        t('pricing.premium.feature4'),
        t('pricing.premium.feature5'),
        t('pricing.premium.feature6'),
        t('pricing.premium.feature7'),
        t('pricing.premium.feature8'),
      ],
      buttonText: t('pricing.premium.button'),
      buttonVariant: "premium" as const,
      popular: true,
    },
];

  const { ref: headerRef, inView: headerIn } = useInView({ threshold: 0.2 });

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div ref={headerRef as unknown as React.RefObject<HTMLDivElement> as any} className={`text-center mb-16 ${headerIn ? 'animate-fade-in' : 'opacity-0'}`}>
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
            {t('pricing.title')}{" "}
            <span className="bg-hero-gradient bg-clip-text text-transparent">
              {t('pricing.title.highlight')}
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {t('pricing.subtitle')}
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan, index) => (
            <Card 
              key={index} 
              className={`relative p-8 hover:shadow-elegant transition-all duration-300 flex flex-col ${
                plan.popular 
                  ? 'border-2 border-primary shadow-glow-green scale-105' 
                  : 'hover:-translate-y-2 border-2 border-card-border'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-hero-gradient text-white px-4 py-2 rounded-full text-sm font-medium flex items-center gap-1">
                    <Sparkles className="w-4 h-4" />
                    {t('pricing.popular')}
                  </div>
                </div>
              )}
              
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-foreground mb-2">{plan.name}</h3>
                <p className="text-muted-foreground mb-4">{plan.description}</p>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
                {plan.popular && (
                  <div className="mt-2 text-sm text-muted-foreground">
                    ou <span className="font-semibold text-foreground">R$ 179,80/ano</span>
                    <span className="ml-2 inline-flex items-center rounded-full bg-primary/10 text-primary px-2 py-0.5 text-xs">~25% OFF no anual</span>
                  </div>
                )}
              </div>
              
              <ul className="space-y-4 mb-8 flex-grow">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                      <Check className="w-3 h-3 text-primary" />
                    </div>
                    <span className="text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Button 
                variant={plan.buttonVariant} 
                size="lg" 
                className={`w-full mt-auto ${!plan.popular ? 'border-2 border-card-border' : ''}`}
              >
                {plan.popular ? (
                  <>
                    <Sparkles className="w-4 h-4" />
                    {plan.buttonText}
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    {plan.buttonText}
                  </>
                )}
              </Button>
            </Card>
          ))}
        </div>
        
        {/* Bottom note */}
        <div className="text-center mt-12">
          <p className="text-muted-foreground">
            {t('pricing.note')}
          </p>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;