import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useGlobalSettings } from '@/contexts/GlobalSettingsContext';

const StablePricingSection = () => {
  const navigate = useNavigate();
  const { 
    language, 
    currency, 
    formatPrice, 
    isInternational,
    loading 
  } = useGlobalSettings();

  // Base prices in BRL for Brazil, USD for international
  const brazilPrices = { free: 0, premium: 19.90 };
  const internationalPrices = { free: 0, premium: 9.90 };
  
  const prices = isInternational ? internationalPrices : brazilPrices;
  const baseCurrency = isInternational ? 'USD' : 'BRL';

  const translations = {
    pt: {
      title: 'Escolha o plano',
      titleHighlight: 'ideal para você',
      subtitle: 'Comece gratuitamente e evolua conforme suas necessidades',
      free: {
        name: 'Gratuito',
        period: 'para sempre',
        description: 'Perfeito para começar',
        features: [
          'Gestão básica de finanças',
          'Controle em múltiplas moedas',
          'Análise financeira conjunta ou separada',
          'Multi idiomas',
          'Controle de investimentos',
          'Simulador de rentabilidade',
          'Segurança básica'
        ],
        button: 'Começar Grátis'
      },
      premium: {
        name: 'Premium com IA',
        period: '/mês',
        description: 'Para quem quer mais inteligência',
        features: [
          'Tudo do plano gratuito',
          'Input por voz via WhatsApp',
          'Controle de milhas com IA',
          'Planejamento inteligente com IA',
          'Sugestões de investimento',
          'Metas financeiras personalizadas',
          'Análises avançadas',
          'Suporte prioritário'
        ],
        button: 'Assinar Premium'
      },
      popular: 'Mais Popular',
      note: '🔒 Pagamento seguro • ❌ Sem compromisso • 📱 Cancele quando quiser'
    },
    en: {
      title: 'Choose the',
      titleHighlight: 'perfect plan for you',
      subtitle: 'Start for free and evolve according to your needs',
      free: {
        name: 'Free',
        period: 'forever',
        description: 'Perfect to get started',
        features: [
          'Basic financial management',
          'Multi-currency control',
          'Joint or separate financial analysis',
          'Multi languages',
          'Investment control',
          'Profitability simulator',
          'Basic security'
        ],
        button: 'Start Free'
      },
      premium: {
        name: 'Premium with AI',
        period: '/month',
        description: 'For those who want more intelligence',
        features: [
          'Everything from free plan',
          'Voice input via WhatsApp',
          'AI Miles control',
          'AI intelligent planning',
          'Investment suggestions',
          'Personalized financial goals',
          'Advanced analytics',
          'Priority support'
        ],
        button: 'Subscribe Premium'
      },
      popular: 'Most Popular',
      note: '🔒 Secure payment • ❌ No commitment • 📱 Cancel anytime'
    },
    es: {
      title: 'Elige el plan',
      titleHighlight: 'ideal para ti',
      subtitle: 'Comienza gratis y evoluciona según tus necesidades',
      free: {
        name: 'Gratuito',
        period: 'para siempre',
        description: 'Perfecto para comenzar',
        features: [
          'Gestión básica de finanzas',
          'Control en múltiples monedas',
          'Análisis financiero conjunto o separado',
          'Múltiples idiomas',
          'Control de inversiones',
          'Simulador de rentabilidad',
          'Seguridad básica'
        ],
        button: 'Comenzar Gratis'
      },
      premium: {
        name: 'Premium con IA',
        period: '/mes',
        description: 'Para quienes quieren más inteligencia',
        features: [
          'Todo del plan gratuito',
          'Entrada por voz vía WhatsApp',
          'Control de millas con IA',
          'Planificación inteligente con IA',
          'Sugerencias de inversión',
          'Metas financieras personalizadas',
          'Análisis avanzados',
          'Soporte prioritario'
        ],
        button: 'Suscribir Premium'
      },
      popular: 'Más Popular',
      note: '🔒 Pago seguro • ❌ Sin compromiso • 📱 Cancela cuando quieras'
    }
  };

  const text = translations[language];

  const handleFreePlan = () => {
    navigate('/auth');
  };

  const handlePremiumPlan = () => {
    navigate('/subscription');
  };

  if (loading) {
    return (
      <section className="py-24 bg-gradient-to-b from-background to-secondary/10">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <div className="h-8 bg-muted rounded w-48 mx-auto mb-4 animate-pulse" />
            <div className="h-6 bg-muted rounded w-96 mx-auto animate-pulse" />
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {[1, 2].map((i) => (
              <div key={i} className="h-96 bg-muted rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="pricing" className="py-24 bg-gradient-to-b from-background to-secondary/10">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold mb-4">
            {text.title} <span className="text-primary">{text.titleHighlight}</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {text.subtitle}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free Plan */}
          <Card className="relative border-2 hover:shadow-lg transition-all duration-300 bg-white/50 backdrop-blur-sm">
            <CardHeader className="text-center pb-8">
              <CardTitle className="text-2xl font-bold">{text.free.name}</CardTitle>
              <div className="flex items-baseline justify-center mt-4">
                <span className="text-5xl font-bold">{formatPrice(prices.free)}</span>
              </div>
              <CardDescription className="text-base mt-2">
                {text.free.period}
              </CardDescription>
              <p className="text-muted-foreground mt-4">
                {text.free.description}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3">
                {text.free.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              <Button 
                className="w-full mt-8" 
                variant="outline"
                size="lg"
                onClick={handleFreePlan}
              >
                {text.free.button}
              </Button>
            </CardContent>
          </Card>

          {/* Premium Plan */}
          <Card className="relative border-2 border-primary hover:shadow-xl transition-all duration-300 bg-gradient-to-b from-primary/5 to-primary/10 backdrop-blur-sm">
            <Badge 
              className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1"
            >
              {text.popular}
            </Badge>
            <CardHeader className="text-center pb-8">
              <CardTitle className="text-2xl font-bold">{text.premium.name}</CardTitle>
              <div className="flex items-baseline justify-center mt-4">
                <span className="text-5xl font-bold text-primary">
                  {formatPrice(prices.premium)}
                </span>
                <span className="text-muted-foreground ml-1">{text.premium.period}</span>
              </div>
              <p className="text-muted-foreground mt-4">
                {text.premium.description}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3">
                {text.premium.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              <Button 
                className="w-full mt-8 bg-primary hover:bg-primary/90" 
                size="lg"
                onClick={handlePremiumPlan}
              >
                {text.premium.button}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-12">
          <p className="text-sm text-muted-foreground">
            {text.note}
          </p>
        </div>
      </div>
    </section>
  );
};

export default StablePricingSection;