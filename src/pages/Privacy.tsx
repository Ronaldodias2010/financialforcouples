import PrivacyPolicy from "@/components/landing/PrivacyPolicy";
import { LanguageProvider } from "@/contexts/LanguageContext";
import "@/styles/landing-theme.css";

const Privacy = () => {
  return (
    <LanguageProvider>
      <div className="landing-theme">
        <main>
          <PrivacyPolicy />
        </main>
      </div>
    </LanguageProvider>
  );
};

export default Privacy;
