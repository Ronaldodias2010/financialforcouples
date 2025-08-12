import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { Globe, ArrowDown } from 'lucide-react';
import { usePWA } from '@/hooks/usePWA';
import { useGlobalSettings } from '@/contexts/GlobalSettingsContext';
import StableLanguageSelector from '@/components/landing/StableLanguageSelector';
import heroImage from '@/assets/hero-couple.jpg';

const StableHeroSection = () => {
  const navigate = useNavigate();
  const { isInstallable, installApp } = usePWA();
  const { 
    loading, 
    isInternational, 
    language, 
    currency, 
    formatPrice, 
    convertPrice,
    location,
    t 
  } = useGlobalSettings();

  useEffect(() => {
    console.log('🌍 StableHeroSection: Location data updated', {
      loading,
      isInternational,
      language,
      currency,
      location: location.country
    });
  }, [loading, isInternational, language, currency, location]);

  const scrollToPricing = () => {
    const pricingSection = document.getElementById('pricing');
    if (pricingSection) {
      pricingSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleGetStarted = () => {
    if (isInstallable) {
      installApp();
    } else {
      navigate('/auth');
    }
  };

  // Dynamically calculate premium price based on location
  const brazilPremiumPrice = 19.90;
  const internationalPremiumPrice = 9.90;
  
  const premiumPrice = isInternational 
    ? internationalPremiumPrice 
    : brazilPremiumPrice;

  const formattedPremiumPrice = formatPrice(premiumPrice);

  // Translation keys with dynamic prices
  const translations = {
    pt: {
      badge: 'Lançamento',
      title: 'Couples Financials',
      subtitle: 'Controle suas finanças de forma inteligente',
      description: 'Idealizado para casais, mas recomendamos para todos. Planeje, economize e invista com ajuda da IA.',
      ctaFree: 'Baixe Gratuitamente',
      ctaPremium: `Experimente a versão com IA por ${formattedPremiumPrice}`,
      login: 'Entrar',
      users: 'Já usado por 1.000+ usuários'
    },
    en: {
      badge: 'Launch',
      title: 'Couples Financials',
      subtitle: 'Control your finances intelligently',
      description: 'Designed for couples, but we recommend it for everyone. Plan, save and invest with AI help.',
      ctaFree: 'Download for Free',
      ctaPremium: `Try AI version for ${formattedPremiumPrice}`,
      login: 'Sign in',
      users: 'Already used by 1,000+ users'
    },
    es: {
      badge: 'Lanzamiento',
      title: 'Couples Financials',
      subtitle: 'Controla tus finanzas de forma inteligente',
      description: 'Diseñado para parejas, pero lo recomendamos para todos. Planifica, ahorra e invierte con ayuda de IA.',
      ctaFree: 'Descargar Gratis',
      ctaPremium: `Prueba la versión con IA por ${formattedPremiumPrice}`,
      login: 'Iniciar sesión',
      users: 'Ya usado por 1,000+ usuarios'
    }
  };

  const text = translations[language];

  if (loading) {
    return (
      <section className="relative min-h-screen bg-hero-gradient overflow-hidden flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </section>
    );
  }

  return (
    <section className="relative min-h-screen bg-hero-gradient overflow-hidden">
      {/* Floating decorative elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-20 h-20 bg-white/10 rounded-full animate-pulse" />
        <div className="absolute top-40 right-20 w-16 h-16 bg-white/5 rounded-full animate-pulse delay-1000" />
        <div className="absolute bottom-40 left-20 w-24 h-24 bg-white/5 rounded-full animate-pulse delay-2000" />
      </div>

      {/* Header */}
      <div className="relative z-10 flex justify-between items-center p-6">
        <div className="flex items-center gap-3">
          {loading ? (
            <div className="h-6 w-6 bg-white/20 rounded animate-pulse" />
          ) : (
            <Globe className="h-6 w-6 text-white" />
          )}
          <span className="text-white/90 text-sm">
            {loading ? 'Detectando...' : location.country}
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          <StableLanguageSelector />
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate('/auth')}
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            {text.login}
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-10 container mx-auto px-6 pt-12 pb-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[80vh]">
          {/* Left side - Text content */}
          <div className="text-center lg:text-left">
            {/* Logo */}
            <div className="flex justify-center lg:justify-start mb-6">
              <div
                className="relative w-32 h-32 md:w-40 md:h-40"
                style={{
                  filter:
                    "drop-shadow(0 6px 22px hsl(var(--cherry-light) / 0.15)) drop-shadow(0 3px 12px hsl(var(--blue-soft) / 0.15))",
                }}
             >
                <img
                  src="/lovable-uploads/2f7e7907-5cf5-4262-adbd-04f4dbd3151b.png"
                  alt="Couples Financials Logo"
                  className="w-full h-full object-contain relative z-10"
                />
                <div
                  className="pointer-events-none absolute inset-0 rounded-xl"
                  style={{
                    background:
                      "linear-gradient(135deg, hsl(var(--cherry-light) / 0.08), hsl(var(--blue-soft) / 0.08))",
                  }}
                />
              </div>
            </div>
            
            <Badge 
              variant="secondary" 
              className="mb-6 bg-white/20 text-white border-white/30 hover:bg-white/30"
            >
              {text.badge}
            </Badge>
            
            <h1 className="text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              {text.title}
            </h1>
            
            <h2 className="text-2xl lg:text-3xl text-white/90 mb-6 font-medium">
              {text.subtitle}
            </h2>
            
            <p className="text-lg text-white/80 mb-8 leading-relaxed max-w-2xl">
              {text.description}
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <Button
                size="lg"
                onClick={handleGetStarted}
                className="bg-white text-primary hover:bg-white/90 shadow-elegant text-lg px-8 py-4"
              >
                {text.ctaFree}
              </Button>
              
              <Button
                size="lg"
                variant="outline"
                onClick={scrollToPricing}
                className="bg-white/10 border-white/30 text-white hover:bg-white/20 text-lg px-8 py-4"
              >
                {text.ctaPremium}
              </Button>
            </div>
            
            {/* Social proof */}
            <p className="text-white/70 text-sm">
              {text.users}
            </p>
          </div>

          {/* Right side - Hero image */}
          <div className="relative">
            <div className="relative z-10">
              <img
                src={heroImage}
                alt="Couple managing finances together"
                className="w-full max-w-md mx-auto rounded-3xl shadow-2xl"
              />
              
              {/* Floating finance icons */}
              <div className="absolute -top-6 -left-6 bg-white/90 p-4 rounded-2xl shadow-lg animate-pulse">
                <span className="text-2xl">💰</span>
              </div>
              <div className="absolute -bottom-6 -right-6 bg-white/90 p-4 rounded-2xl shadow-lg animate-pulse delay-1000">
                <span className="text-2xl">📊</span>
              </div>
              <div className="absolute top-1/2 -right-8 bg-white/90 p-3 rounded-xl shadow-lg animate-pulse delay-2000">
                <span className="text-xl">🎯</span>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="flex justify-center mt-12">
          <button
            onClick={scrollToPricing}
            className="flex flex-col items-center text-white/70 hover:text-white transition-colors group"
          >
            <span className="text-sm mb-2">Veja os planos</span>
            <ArrowDown className="h-6 w-6 animate-bounce group-hover:scale-110 transition-transform" />
          </button>
        </div>
      </div>

      {/* Wave separator */}
      <div className="absolute bottom-0 left-0 w-full">
        <svg
          viewBox="0 0 1440 320"
          className="w-full h-20 fill-background"
          preserveAspectRatio="none"
        >
          <path d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,122.7C672,117,768,139,864,138.7C960,139,1056,117,1152,128C1248,139,1344,181,1392,202.7L1440,224L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
        </svg>
      </div>
    </section>
  );
};

export default StableHeroSection;