import { useEffect, useState } from "react";
import { ArrowLeft, Home, Users, Gift, Handshake, Rocket, Check } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";
import { ThemeSwitcher } from "@/components/ui/theme-switcher";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { supabase } from '@/integrations/supabase/client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { trackEvent } from "@/utils/analytics";

const Partnership = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    audienceType: '',
    socialMedia: '',
    paymentInfo: ''
  });

  useEffect(() => {
    // SEO optimization for Partnership page
    document.title = `${t('partnership.title')} | Couples Financials`;
    
    const setMeta = (name: string, content: string) => {
      let el = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute("name", name);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    setMeta("description", t('partnership.seo.description'));
    setMeta("keywords", t('partnership.seo.keywords'));

    // Structured data for Service
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "Service",
      "name": t('partnership.seo.name'),
      "provider": {
        "@type": "Organization",
        "name": "Couples Financials"
      },
      "description": t('partnership.seo.description'),
      "serviceType": t('partnership.seo.serviceType'),
      "areaServed": t('partnership.seo.areaServed')
    };

    let script = document.querySelector('script[type="application/ld+json"]');
    if (!script) {
      script = document.createElement('script');
      script.setAttribute('type', 'application/ld+json');
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(structuredData);

    return () => {
      const metaTags = ['description', 'keywords'];
      metaTags.forEach(name => {
        const el = document.querySelector(`meta[name="${name}"]`);
        if (el) el.remove();
      });
      if (script) script.remove();
    };
  }, [t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.audienceType || !formData.socialMedia.trim() || !formData.paymentInfo.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: !formData.socialMedia.trim() 
          ? "Por favor, informe seus links de redes sociais. Este campo é obrigatório para análise da sua candidatura."
          : !formData.paymentInfo.trim()
          ? "Por favor, informe seus dados PIX ou conta bancária. Este campo é obrigatório para pagamento das comissões."
          : "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const { error } = await supabase.functions.invoke('send-partnership-application', {
        body: formData
      });

      if (error) {
        throw error;
      }
      
      // Track partnership application for GTM
      trackEvent('partnership_application', {
        audience_type: formData.audienceType
      });
      
      toast({
        title: "Sucesso!",
        description: t('partnership.form.success'),
      });
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        audienceType: '',
        socialMedia: '',
        paymentInfo: ''
      });
    } catch (error: any) {
      console.error('Partnership application error:', error);
      toast({
        title: "Erro",
        description: error.message || t('partnership.form.error'),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header with navigation */}
      <header className="container mx-auto px-4 py-6">
        {/* Mobile Layout */}
        <div className="flex flex-col gap-4 sm:hidden">
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate('/')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <LanguageSwitcher />
              <ThemeSwitcher />
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigate('/')}
                className="flex items-center gap-2"
              >
                <Home className="h-4 w-4" />
                <span>Início</span>
              </Button>
            </div>
          </div>
          
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground">{t('partnership.title')}</h1>
            <p className="text-base text-muted-foreground mt-2">{t('partnership.subtitle')}</p>
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden sm:flex sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-bold text-foreground truncate">{t('partnership.title')}</h1>
              <p className="text-lg text-muted-foreground mt-2">{t('partnership.subtitle')}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <LanguageSwitcher />
            <ThemeSwitcher />
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate('/')}
              className="flex items-center gap-2 whitespace-nowrap"
            >
              <Home className="h-4 w-4" />
              <span>{t('partnership.backToHome')}</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 pb-12">
        <div className="max-w-4xl mx-auto space-y-12">
          
          {/* Hero Section */}
          <section className="text-center">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-primary/5 via-primary-glow/5 to-primary/5">
              <CardContent className="p-8">
                <div className="mb-6">
                  <div className="text-6xl mb-4">🏆</div>
                  <h2 className="text-3xl font-bold text-primary mb-4">
                    {t('partnership.hero.title')}
                  </h2>
                  <p className="text-lg text-muted-foreground leading-relaxed max-w-3xl mx-auto">
                    {t('partnership.hero.description')}
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* How It Works Section */}
          <section>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-8">
                <h2 className="text-2xl font-semibold text-primary mb-6 flex items-center gap-2">
                  <div className="text-2xl">💸</div>
                  {t('partnership.howItWorks.title')}
                </h2>
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="bg-primary/10 rounded-full p-2 flex-shrink-0">
                      <Check className="h-5 w-5 text-primary" />
                    </div>
                    <p className="text-muted-foreground leading-relaxed">
                      {t('partnership.howItWorks.step1')}
                    </p>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="bg-primary/10 rounded-full p-2 flex-shrink-0">
                      <Check className="h-5 w-5 text-primary" />
                    </div>
                    <p className="text-muted-foreground leading-relaxed">
                      {t('partnership.howItWorks.step2')}
                    </p>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="bg-primary/10 rounded-full p-2 flex-shrink-0">
                      <Check className="h-5 w-5 text-primary" />
                    </div>
                    <p className="text-muted-foreground leading-relaxed">
                      {t('partnership.howItWorks.step3')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Benefits Grid */}
          <section className="grid md:grid-cols-2 gap-8">
            {/* Benefits for You */}
            <Card className="border-0 shadow-sm">
              <CardContent className="p-8">
                <h2 className="text-2xl font-semibold text-primary mb-6 flex items-center gap-2">
                  <Gift className="h-6 w-6" />
                  {t('partnership.benefits.title')}
                </h2>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="bg-green-100 text-green-600 rounded-full p-1 flex-shrink-0 mt-1">
                      <Check className="h-4 w-4" />
                    </div>
                    <p className="text-muted-foreground">
                      {t('partnership.benefits.commissions')}
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-green-100 text-green-600 rounded-full p-1 flex-shrink-0 mt-1">
                      <Check className="h-4 w-4" />
                    </div>
                    <p className="text-muted-foreground">
                      {t('partnership.benefits.bonuses')}
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-green-100 text-green-600 rounded-full p-1 flex-shrink-0 mt-1">
                      <Check className="h-4 w-4" />
                    </div>
                    <p className="text-muted-foreground">
                      {t('partnership.benefits.earlyAccess')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Benefits for Followers */}
            <Card className="border-0 shadow-sm">
              <CardContent className="p-8">
                <h2 className="text-2xl font-semibold text-primary mb-6 flex items-center gap-2">
                  <Handshake className="h-6 w-6" />
                  {t('partnership.followersBenefits.title')}
                </h2>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-100 text-blue-600 rounded-full p-1 flex-shrink-0 mt-1">
                      <Check className="h-4 w-4" />
                    </div>
                    <p className="text-muted-foreground">
                      {t('partnership.followersBenefits.discount')}
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-100 text-blue-600 rounded-full p-1 flex-shrink-0 mt-1">
                      <Check className="h-4 w-4" />
                    </div>
                    <p className="text-muted-foreground">
                      {t('partnership.followersBenefits.specialContent')}
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-100 text-blue-600 rounded-full p-1 flex-shrink-0 mt-1">
                      <Check className="h-4 w-4" />
                    </div>
                    <p className="text-muted-foreground">
                      {t('partnership.followersBenefits.promotions')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Get Started Form */}
          <section>
            <Card className="border-0 shadow-lg">
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-semibold text-primary mb-4 flex items-center justify-center gap-2">
                    <Rocket className="h-6 w-6" />
                    {t('partnership.getStarted.title')}
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    {t('partnership.getStarted.description')}
                  </p>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
                  <div className="space-y-2">
                    <Label htmlFor="name">{t('partnership.form.name')} *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="João Silva"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">{t('partnership.form.email')} *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="joao@exemplo.com"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone">{t('partnership.form.phone')}</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="audience">{t('partnership.form.audience')} *</Label>
                     <Select value={formData.audienceType} onValueChange={(value) => setFormData(prev => ({ ...prev, audienceType: value }))}>
                       <SelectTrigger>
                         <SelectValue placeholder={t('partnership.form.audienceSelectPlaceholder')} />
                       </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="lifestyle">{t('partnership.form.audienceOptions.lifestyle')}</SelectItem>
                        <SelectItem value="finance">{t('partnership.form.audienceOptions.finance')}</SelectItem>
                        <SelectItem value="couples">{t('partnership.form.audienceOptions.couples')}</SelectItem>
                        <SelectItem value="family">{t('partnership.form.audienceOptions.family')}</SelectItem>
                        <SelectItem value="business">{t('partnership.form.audienceOptions.business')}</SelectItem>
                        <SelectItem value="other">{t('partnership.form.audienceOptions.other')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                   <div className="space-y-2">
                     <Label htmlFor="socialMedia">{t('partnership.form.socialMedia')} *</Label>
                      <Textarea
                        id="socialMedia"
                        value={formData.socialMedia}
                        onChange={(e) => setFormData(prev => ({ ...prev, socialMedia: e.target.value }))}
                        placeholder={t('partnership.form.socialMediaPlaceholder')}
                        rows={3}
                        required
                      />
                      <p className="text-sm text-muted-foreground">
                        {t('partnership.form.socialMediaHelper')}
                      </p>
                   </div>

                    <div className="space-y-2">
                      <Label htmlFor="paymentInfo">{t('partnership.form.paymentInfoLabel')}</Label>
                       <Textarea
                         id="paymentInfo"
                         value={formData.paymentInfo}
                         onChange={(e) => setFormData(prev => ({ ...prev, paymentInfo: e.target.value }))}
                         placeholder={t('partnership.form.paymentInfoPlaceholder')}
                         rows={3}
                         required
                       />
                       <p className="text-sm text-muted-foreground">
                         {t('partnership.form.paymentInfoHelper')}
                       </p>
                    </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full" 
                    size="lg"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? t('partnership.form.submitting') : t('partnership.form.submit')}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </section>
          
        </div>
      </main>
    </div>
  );
};

export default Partnership;