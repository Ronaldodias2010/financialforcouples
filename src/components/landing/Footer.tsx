import { Heart, Mail, Phone, MapPin, MessageCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "react-router-dom";
import logo from "/lovable-uploads/1f5e0469-b056-4cf9-9583-919702fa8736.png";

const Footer = () => {
  const { t, language } = useLanguage();
  
  const contactInfo = language === 'pt' ? {
    email: 'contato@couplesfinancials.com',
    phone: '(11) 2724-7564',
    location: 'São Paulo, Brasil'
  } : {
    email: 'contact@couplesfinancials.com',
    phone: '(201) 5902401',
    location: 'EUA'
  };

  return (
    <footer className="bg-foreground text-background py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-hero-gradient rounded-lg flex items-center justify-center">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">Couples Financials</span>
            </div>
            <p className="text-background/70 text-sm">
              {t('footer.description')}
            </p>
          </div>
          
          {/* Produto */}
          <div className="space-y-4">
            <h3 className="font-semibold text-background">{t('footer.product')}</h3>
            <ul className="space-y-2 text-sm text-background/70">
              <li><a href="#benefits" className="hover:text-background transition-colors" onClick={(e) => {e.preventDefault(); document.getElementById('benefits')?.scrollIntoView({behavior: 'smooth'});}}>{t('footer.features')}</a></li>
              <li><a href="#pricing" className="hover:text-background transition-colors" onClick={(e) => {e.preventDefault(); document.getElementById('pricing')?.scrollIntoView({behavior: 'smooth'});}}>{t('footer.pricing')}</a></li>
              <li><a href="#" className="hover:text-background transition-colors">{t('footer.download')}</a></li>
            </ul>
          </div>
          
          {/* Suporte */}
          <div className="space-y-4">
            <h3 className="font-semibold text-background">{t('footer.support')}</h3>
            <ul className="space-y-2 text-sm text-background/70">
              <li><a href="#" className="hover:text-background transition-colors">{t('footer.help')}</a></li>
              <li><a href={`mailto:${contactInfo.email}`} className="hover:text-background transition-colors">{t('footer.contact')}</a></li>
              <li><a href="#faq" className="hover:text-background transition-colors" onClick={(e) => {e.preventDefault(); document.getElementById('faq')?.scrollIntoView({behavior: 'smooth'});}}>{t('footer.faq')}</a></li>
            </ul>
          </div>
          
          {/* Contato */}
          <div className="space-y-4">
            <h3 className="font-semibold text-background">{t('footer.contact')}</h3>
            <div className="space-y-3 text-sm text-background/70">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <span>{contactInfo.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <span>{contactInfo.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-green-500" />
                <span className="text-green-400">
                  {language === 'pt' 
                    ? 'WhatsApp Inteligente (11) 98806-6403'
                    : 'WhatsApp Smart +55(11) 98806-6403'
                  }
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>{contactInfo.location}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Bottom */}
        <div className="border-t border-background/20 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-background/70">
          <p>&copy; {t('footer.rights')}</p>
          
          {/* Logo centralizado */}
          <div className="flex items-center justify-center my-4 md:my-0">
            <img 
              src={logo} 
              alt="Couples Financials Logo" 
              className="w-12 h-12 rounded-lg"
            />
          </div>
          
          <div className="flex gap-6">
            <Link to="/privacy" className="hover:text-background transition-colors">{t('footer.privacy')}</Link>
            <Link to="/terms" className="hover:text-background transition-colors">{t('footer.terms')}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;