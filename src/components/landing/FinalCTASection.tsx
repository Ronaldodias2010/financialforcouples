import { Button } from "@/components/ui/button";
import { Download, Sparkles, ArrowRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useState } from "react";
import { Link } from "react-router-dom";
import AIBetaModal from "@/components/landing/AIBetaModal";
import PWAInstallModal from "@/components/landing/PWAInstallModal";

const FinalCTASection = () => {
  const { t } = useLanguage();
  const [aiBetaOpen, setAiBetaOpen] = useState(false);
  const [pwaModalOpen, setPwaModalOpen] = useState(false);

  return (
    <section className="py-20 bg-hero-gradient relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-64 h-64 rounded-full bg-white/20 blur-3xl animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-80 h-80 rounded-full bg-white/10 blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-white/5 blur-3xl animate-pulse delay-500"></div>
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center space-y-8 max-w-4xl mx-auto">
          {/* Emoji line */}
          <div className="text-4xl mb-4">🚀✨💰</div>
          
          {/* Main heading */}
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
            {t('finalcta.title')}
          </h2>
          
          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-white/90 max-w-2xl mx-auto leading-relaxed">
            {t('finalcta.subtitle')}
          </p>
          
          {/* Benefits highlight */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">⚡</span>
              </div>
              <h3 className="text-white font-semibold mb-1">{t('finalcta.benefit1.title')}</h3>
              <p className="text-white/80 text-sm">{t('finalcta.benefit1.description')}</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">🤖</span>
              </div>
              <h3 className="text-white font-semibold mb-1">{t('finalcta.benefit2.title')}</h3>
              <p className="text-white/80 text-sm">{t('finalcta.benefit2.description')}</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">💎</span>
              </div>
              <h3 className="text-white font-semibold mb-1">{t('finalcta.benefit3.title')}</h3>
              <p className="text-white/80 text-sm">{t('finalcta.benefit3.description')}</p>
            </div>
          </div>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              size="lg" 
              variant="secondary" 
              className="group min-w-64"
              onClick={() => setPwaModalOpen(true)}
            >
              <Download className="w-5 h-5 group-hover:animate-bounce" />
              {t('finalcta.free')}
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button asChild size="lg" className="bg-card text-card-foreground border border-white/20 hover:bg-card/90 min-w-64 group">
              <Link to="/checkout-direto">
                <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                {t('finalcta.premium')}
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>
          
          {/* Social proof */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 text-white/80 text-sm mt-8">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-1">
                <div className="w-6 h-6 rounded-full bg-white/30 border-2 border-white"></div>
                <div className="w-6 h-6 rounded-full bg-white/30 border-2 border-white"></div>
                <div className="w-6 h-6 rounded-full bg-white/30 border-2 border-white"></div>
                <div className="w-6 h-6 rounded-full bg-white/30 border-2 border-white"></div>
              </div>
              <span>{t('finalcta.socialProof.users')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex text-yellow-300">
                ⭐⭐⭐⭐⭐
              </div>
              <span>{t('finalcta.socialProof.rating')}</span>
            </div>
            <div className="flex items-center gap-2">
              <span>🔒</span>
              <span>{t('finalcta.socialProof.secure')}</span>
            </div>
          </div>
          
          {/* Final note */}
          <p className="text-white/60 text-xs">
            {t('finalcta.disclaimer')}
          </p>
        </div>
      </div>
      
      <AIBetaModal open={aiBetaOpen} onOpenChange={setAiBetaOpen} />
      <PWAInstallModal open={pwaModalOpen} onOpenChange={setPwaModalOpen} />
    </section>
  );
};

export default FinalCTASection;