import React from 'react';
import { GlobalSettingsProvider } from '@/contexts/GlobalSettingsContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import StableHeroSection from '@/components/landing/StableHeroSection';
import StablePricingSection from '@/components/landing/StablePricingSection';
import BenefitsSection from '@/components/landing/BenefitsSection';
import AppDemoSection from '@/components/landing/AppDemoSection';
import TestimonialsSection from '@/components/landing/TestimonialsSection';
import WhatsAppSection from '@/components/landing/WhatsAppSection';
import FinalCTASection from '@/components/landing/FinalCTASection';
import FAQSection from '@/components/landing/FAQSection';
import Footer from '@/components/landing/Footer';
import "@/styles/landing-theme.css";

const LandingStable = () => {
  console.log("🚀 LandingStable: Renderizando landing page estável");

  return (
    <GlobalSettingsProvider>
      <LanguageProvider>
        <div className="landing-theme">
          <main className="min-h-screen">
            <StableHeroSection />
            <BenefitsSection />
            <AppDemoSection />
            <StablePricingSection />
            <WhatsAppSection />
            <FinalCTASection />
            <FAQSection />
            <Footer />
          </main>
        </div>
      </LanguageProvider>
    </GlobalSettingsProvider>
  );
};

export default LandingStable;