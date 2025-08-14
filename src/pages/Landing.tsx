import HeroSection from "@/components/landing/HeroSection";
import BenefitsSection from "@/components/landing/BenefitsSection";
import AppDemoSection from "@/components/landing/AppDemoSection";
import PricingSection from "@/components/landing/PricingSection";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import WhatsAppSection from "@/components/landing/WhatsAppSection";
import FinalCTASection from "@/components/landing/FinalCTASection";
import FAQSection from "@/components/landing/FAQSection";
import Footer from "@/components/landing/Footer";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { useEffect } from "react";
import "@/styles/landing-theme.css";

const Landing = () => {
  useEffect(() => {
    // Force light mode for landing page
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');
  }, []);

  return (
    <LanguageProvider>
      <div className="landing-theme light">
        <main className="min-h-screen">
          <HeroSection />
          <BenefitsSection />
          <AppDemoSection />
          <PricingSection />
          <WhatsAppSection />
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/20 to-muted/30 h-32"></div>
            <div className="relative flex justify-center py-8">
              <div className="w-24 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent"></div>
            </div>
          </div>
          <TestimonialsSection />
          <FinalCTASection />
          <FAQSection />
          <Footer />
        </main>
      </div>
    </LanguageProvider>
  );
};

export default Landing;
