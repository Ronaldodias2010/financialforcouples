import { Button } from "@/components/ui/button";
import { Download, Sparkles } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import LanguageSelector from "@/components/landing/LanguageSelector";
import heroCouple from "@/assets/hero-couple.jpg";
import { Link } from "react-router-dom";
import { usePWA } from "@/hooks/usePWA";
const HeroSection = () => {
  const { t } = useLanguage();
  const { installApp } = usePWA();
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-hero-gradient">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-20 w-72 h-72 rounded-full bg-white/20 blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 rounded-full bg-white/10 blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full" style={{backgroundColor: 'hsl(8 85% 72% / 0.15)'}}></div>
      </div>
      
      <div className="container mx-auto px-4 py-20 relative z-10">
        {/* Language Selector + Login */}
        <div className="absolute top-4 right-4 z-10">
          <div className="flex items-center gap-2">
            <LanguageSelector />
            <Button asChild size="sm" variant="outline">
              <Link to="/auth">{t('header.login')}</Link>
            </Button>
          </div>
        </div>
        
        {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
            <div className="text-center lg:text-left space-y-8">
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
            
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-sm text-white text-sm font-medium border border-white/20" style={{backgroundColor: 'hsl(8 85% 72% / 0.2)'}}>
              <Sparkles className="w-4 h-4" />
              {t('hero.badge')}
            </div>
            
            {/* Main heading */}
            <div className="space-y-6">
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-white leading-tight">
                {t('hero.title')}
              </h1>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-semibold text-white/90 leading-tight">
                {t('hero.subtitle')}
              </h2>
            </div>
            
            {/* Description */}
            <p className="text-lg text-white/80 max-w-xl">
              {t('hero.description')}
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button size="lg" variant="secondary" className="group" onClick={installApp}>
                <Download className="w-5 h-5 group-hover:animate-bounce" />
                {t('hero.cta.free')}
              </Button>
                  <Button size="lg" variant="ctaGradient" className="group" onClick={() => document.getElementById('pricing-premium')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
                    <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                    {t('hero.cta.premium')}
                  </Button>
            </div>
            
            {/* Social proof */}
            <div className="flex items-center gap-4 text-white/70 text-sm justify-center lg:justify-start">
              <div className="flex items-center gap-1">
                <div className="flex -space-x-2">
                  <div className="w-6 h-6 rounded-full bg-white/30 border-2 border-white"></div>
                  <div className="w-6 h-6 rounded-full bg-white/30 border-2 border-white"></div>
                  <div className="w-6 h-6 rounded-full bg-white/30 border-2 border-white"></div>
                </div>
                <span className="ml-2">+10k casais já usam</span>
              </div>
            </div>
          </div>
          
          {/* Hero Image */}
          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden shadow-elegant">
              <img 
                src={heroCouple} 
                alt="Casal feliz gerenciando finanças" 
                className="w-full h-auto object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
            </div>
            {/* Floating elements */}
            <div className="absolute -top-4 -right-4 w-20 h-20 bg-secondary rounded-full flex items-center justify-center shadow-glow-yellow animate-bounce">
              <span className="text-2xl">💰</span>
            </div>
            <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-primary rounded-full flex items-center justify-center shadow-glow-green animate-bounce delay-500">
              <span className="text-xl">📊</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Bottom wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-20 fill-background">
          <path d="M1200 120L0 16.48L0 120L1200 120Z"></path>
        </svg>
      </div>
    </section>
  );
};

export default HeroSection;