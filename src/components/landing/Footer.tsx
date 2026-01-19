import { Heart, Mail, Phone, MapPin, MessageCircle, Download } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "react-router-dom";
import logo from "/lovable-uploads/1f5e0469-b056-4cf9-9583-919702fa8736.png";
import { openWhatsApp } from "@/utils/whatsapp";
import { downloadTutorialPDF } from "@/utils/tutorialUtils";

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
      {/* Partner highlight banner */}
      <div className="container mx-auto px-4 mb-12">
        <Link 
          to="/parceria" 
          className="block max-w-4xl mx-auto bg-gradient-to-r from-primary via-primary-glow to-primary py-6 px-8 text-center hover:from-primary-glow hover:via-primary hover:to-primary-glow transition-all duration-300 rounded-3xl shadow-lg hover:shadow-xl hover:scale-[1.02]"
        >
          <p className="text-white font-semibold text-lg md:text-xl leading-relaxed">
            {t('footer.partnerBanner')}
          </p>
        </Link>
      </div>
      
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
              <li><Link to="/blog" className="hover:text-background transition-colors">Blog</Link></li>
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
              <li>
                <button 
                  onClick={() => downloadTutorialPDF(language as 'pt' | 'en' | 'es')}
                  className="hover:text-background transition-colors flex items-center gap-1"
                >
                  <Download className="w-3 h-3" />
                  {t('footer.tutorialComplete')}
                </button>
              </li>
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
              
              {/* WhatsApp Smart destacado */}
              <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg cursor-pointer hover:bg-green-500/20 transition-colors" onClick={() => openWhatsApp(language === 'pt' ? 'Olá! Gostaria de saber mais sobre o Couples Financials.' : 'Hello! I would like to know more about Couples Financials.')}>
                <div className="flex items-center gap-2 mb-1">
                  <MessageCircle className="w-5 h-5 text-green-500" />
                  <span className="text-green-400 font-semibold text-sm">
                    IA WhatsApp Smart
                  </span>
                </div>
                <p className="text-xs text-background/70 mb-2">
                  {language === 'pt' 
                    ? 'Envie suas receitas e despesas para nossa IA'
                    : language === 'es'
                    ? 'Envía tus ingresos y gastos a nuestra IA'
                    : 'Send your income and expenses to our AI'
                  }
                </p>
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-green-500" />
                  <span className="text-green-300 font-mono text-sm font-bold">
                    {language === 'pt' ? '(11) 98806-6403' : '+55 11 98806 6403'}
                  </span>
                </div>
                <p className="text-xs text-green-400/60 mt-1 underline">
                  wa.me/5511988066403
                </p>
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
          
          {/* Logos centralizados */}
          <div className="flex items-center justify-center gap-4 my-4 md:my-0">
            <img 
              src={logo} 
              alt="Couples Financials Logo" 
              className="w-12 h-12 rounded-lg"
            />
            <img 
              src="/lovable-uploads/f14c6e9f-fbe6-4deb-b2aa-30e7435c93dd.png" 
              alt="ARx eXperience Logo" 
              className="w-12 h-12 rounded-lg"
            />
          </div>
          
          <div className="flex gap-6">
            <Link to="/privacy" className="hover:text-background transition-colors">{t('footer.privacy')}</Link>
            <Link to="/terms" className="hover:text-background transition-colors">{t('footer.terms')}</Link>
            <Link to="/sobre-nos" className="hover:text-background transition-colors">
              {language === 'pt' ? 'Sobre Nós' : language === 'es' ? 'Sobre Nosotros' : 'About Us'}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;