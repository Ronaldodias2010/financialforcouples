import HeroSection from "@/components/landing/HeroSection";
import BenefitsSection from "@/components/landing/BenefitsSection";
import AppDemoSection from "@/components/landing/AppDemoSection";
import PricingSection from "@/components/landing/PricingSection";
import SecuritySection from "@/components/landing/SecuritySection";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import WhatsAppSection from "@/components/landing/WhatsAppSection";
import AIRecommendationsSection from "@/components/landing/AIRecommendationsSection";
import SmartMileageSection from "@/components/landing/SmartMileageSection";
import PDFConverterSection from "@/components/landing/PDFConverterSection";
import FinalCTASection from "@/components/landing/FinalCTASection";
import FAQSection from "@/components/landing/FAQSection";
import Footer from "@/components/landing/Footer";
import IncomeTaxSection from "@/components/landing/IncomeTaxSection";
import DecisionCenterSection from "@/components/landing/DecisionCenterSection";
import { useLayoutEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import "@/styles/landing-theme.css";

const Landing = () => {
  const { language, inBrazil } = useLanguage();
  
  // Show Income Tax section only for Brazilian users or Portuguese language
  const showIncomeTaxSection = language === 'pt' || inBrazil;

  useLayoutEffect(() => {
    // Force light mode for landing page (even if user preference is dark)
    const root = document.documentElement;
    root.dataset.forceTheme = 'light';
    root.classList.remove('dark');
    root.classList.add('light');
    window.dispatchEvent(new Event('app:force-theme-change'));

    return () => {
      delete root.dataset.forceTheme;
      window.dispatchEvent(new Event('app:force-theme-change'));
    };
  }, []);

  return (
    <div className="landing-theme light">
      <main className="min-h-screen">
        <HeroSection />
        <BenefitsSection />
        <AppDemoSection />
        <PricingSection />
        <WhatsAppSection />
        <SmartMileageSection />
        <AIRecommendationsSection />
        <DecisionCenterSection />
        <PDFConverterSection />
        {showIncomeTaxSection && <IncomeTaxSection />}
        <SecuritySection />
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
  );
};

export default Landing;
