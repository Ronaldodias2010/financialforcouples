import { Card } from "@/components/ui/card";
import { Receipt, Calculator, FileText, Building2, Download, CheckCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import useInView from "@/hooks/use-in-view";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const IncomeTaxSection = () => {
  const { t } = useLanguage();
  const { ref, inView } = useInView({ threshold: 0.1 });
  const navigate = useNavigate();

  const features = [
    {
      icon: Receipt,
      title: t('landing.incomeTax.feature1.title'),
      description: t('landing.incomeTax.feature1.description'),
    },
    {
      icon: Download,
      title: t('landing.incomeTax.feature2.title'),
      description: t('landing.incomeTax.feature2.description'),
    },
    {
      icon: Calculator,
      title: t('landing.incomeTax.feature3.title'),
      description: t('landing.incomeTax.feature3.description'),
    },
    {
      icon: FileText,
      title: t('landing.incomeTax.feature4.title'),
      description: t('landing.incomeTax.feature4.description'),
    },
  ];

  const benefits = [
    t('landing.incomeTax.benefit1'),
    t('landing.incomeTax.benefit2'),
    t('landing.incomeTax.benefit3'),
    t('landing.incomeTax.benefit4'),
  ];

  return (
    <section id="income-tax" className="py-20 bg-gradient-to-b from-background to-muted/30" ref={ref}>
      <div className="container mx-auto px-4">
        {/* Badge exclusivo Brasil */}
        <div className="flex justify-center mb-6">
          <Badge 
            variant="outline" 
            className="px-4 py-2 text-sm font-semibold border-2 border-green-500 text-green-600 bg-green-50 flex items-center gap-2"
          >
            <Building2 className="w-4 h-4" />
            {t('landing.incomeTax.badge')}
          </Badge>
        </div>

        {/* Header */}
        <header className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
            {t('landing.incomeTax.title')}
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            {t('landing.incomeTax.subtitle')}
          </p>
        </header>

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Features cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <Card 
                key={index}
                className={`p-6 hover:shadow-elegant transition-all duration-300 hover:-translate-y-2 group border-2 hover:border-green-500/30 ${
                  inView ? 'animate-in slide-in-from-left-4' : 'opacity-0'
                }`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex flex-col space-y-4">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center group-hover:shadow-lg transition-all duration-300">
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-foreground mb-2 group-hover:text-green-600 transition-colors">
                      {feature.title}
                    </h4>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Benefits list and CTA */}
          <div className={`space-y-8 ${inView ? 'animate-in slide-in-from-right-4' : 'opacity-0'}`} style={{ animationDelay: '200ms' }}>
            <Card className="p-8 border-2 border-green-500/20 bg-gradient-to-br from-green-50/50 to-transparent dark:from-green-950/20">
              <h3 className="text-2xl font-bold text-foreground mb-6">
                {t('landing.incomeTax.benefitsTitle')}
              </h3>
              
              <ul className="space-y-4 mb-8">
                {benefits.map((benefit, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{benefit}</span>
                  </li>
                ))}
              </ul>

              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-6">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  <strong>💡 {t('landing.incomeTax.tip.title')}:</strong> {t('landing.incomeTax.tip.description')}
                </p>
              </div>

              <Button 
                size="lg" 
                className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold"
                onClick={() => navigate('/auth')}
              >
                {t('landing.incomeTax.cta')}
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default IncomeTaxSection;
