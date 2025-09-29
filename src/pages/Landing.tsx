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
import { useEffect } from "react";
import "@/styles/landing-theme.css";

const Landing = () => {
  useEffect(() => {
    // Force light mode for landing page
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');
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
        <PDFConverterSection />
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
