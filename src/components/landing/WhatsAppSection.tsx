import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MessageCircle, Mic, Sparkles, Zap, BarChart3 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import whatsappChat from "@/assets/whatsapp-chat.jpg";
import { openWhatsApp } from "@/utils/whatsapp";

const WhatsAppSection = () => {
  const { t } = useLanguage();

  const features = [
    {
      icon: Mic,
      title: t('whatsapp.feature1'),
    },
    {
      icon: Zap,
      title: t('whatsapp.feature2'),
    },
    {
      icon: BarChart3,
      title: t('whatsapp.feature3'),
    },
  ];

  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
            {t('whatsapp.title')}
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {t('whatsapp.subtitle')}
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* WhatsApp Chat Image */}
          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden shadow-elegant">
              <img 
                src={whatsappChat} 
                alt={t('whatsapp.imageAlt')} 
                className="w-full h-auto object-cover max-w-md mx-auto"
              />
            </div>
            {/* Floating voice indicator */}
            <div className="absolute -top-4 -right-4 animate-pulse">
              <Card className="p-3 bg-[#25D366] text-white shadow-lg">
                <div className="flex items-center gap-2">
                  <Mic className="w-4 h-4" />
                  <span className="text-sm font-medium">{t('whatsapp.recording')}</span>
                </div>
              </Card>
            </div>
          </div>
          
          {/* Content */}
          <div className="space-y-8">
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-foreground">
                {t('whatsapp.howItWorks')}
              </h3>
              
              {/* Steps */}
              <div className="space-y-4">
                <Card className="p-4 border-l-4 border-l-[#25D366]">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-[#25D366] text-white flex items-center justify-center text-sm font-bold">
                      1
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">{t('whatsapp.step1.title')}</h4>
                      <p className="text-muted-foreground text-sm">
                        {t('whatsapp.step1.example')}
                      </p>
                    </div>
                  </div>
                </Card>
                
                <Card className="p-4 border-l-4 border-l-primary">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold">
                      2
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">{t('whatsapp.step2.title')}</h4>
                      <p className="text-muted-foreground text-sm">
                        {t('whatsapp.step2.description')}
                      </p>
                    </div>
                  </div>
                </Card>
                
                <Card className="p-4 border-l-4 border-l-secondary">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center text-sm font-bold">
                      3
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">{t('whatsapp.step3.title')}</h4>
                      <p className="text-muted-foreground text-sm">
                        {t('whatsapp.step3.description')}
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
            
            {/* Benefits */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-foreground">
                {t('whatsapp.benefitsTitle')}
              </h4>
              <ul className="space-y-2 text-muted-foreground">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <feature.icon className="w-4 h-4 text-primary" />
                    {feature.title}
                  </li>
                ))}
                <li className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  {t('whatsapp.naturalLanguage')}
                </li>
              </ul>
            </div>
            
            {/* CTA */}
            <Button 
              size="lg" 
              className="bg-[#25D366] hover:bg-[#1DA851] text-white w-full sm:w-auto"
              onClick={() => openWhatsApp(t('whatsapp.defaultMessage'))}
            >
              <MessageCircle className="w-5 h-5" />
              {t('whatsapp.cta')}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhatsAppSection;