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

const Landing = () => {
  return (
    <LanguageProvider>
    <main className="min-h-screen">
      <HeroSection />
      <BenefitsSection />
      <AppDemoSection />
      <PricingSection />
      <WhatsAppSection />
      <FinalCTASection />
      <FAQSection />
      <Footer />
    </main>
    </LanguageProvider>
  );
};

export default Landing;
