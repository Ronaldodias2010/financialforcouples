import { Button } from "@/components/ui/button";
import { Download, Sparkles } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import LanguageSelector from "@/components/landing/LanguageSelector";
import heroCouple from "@/assets/hero-couple.jpg";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import AIBetaModal from "@/components/landing/AIBetaModal";
const HeroSection = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [aiBetaOpen, setAiBetaOpen] = useState(false);
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    toast({
      title: "Inscrição registrada",
      description: "Avisaremos assim que a IA estiver disponível.",
    });
    setOpen(false);
    setName("");
    setEmail("");
  };
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-hero-gradient">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-20 w-72 h-72 rounded-full bg-white/20 blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 rounded-full bg-white/10 blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full" style={{backgroundColor: 'hsl(8 85% 72% / 0.15)'}}></div>
      </div>
      
      <div className="container mx-auto px-2 sm:px-4 py-12 sm:py-16 lg:py-20 relative z-10">
        {/* Language Selector + Login */}
        <div className="absolute top-2 sm:top-4 right-2 sm:right-4 z-10">
          <div className="flex items-center gap-1 sm:gap-2">
            <LanguageSelector />
            <Button asChild size="sm" variant="outline" className="text-xs sm:text-sm px-2 sm:px-3">
              <Link to="/auth">{t('header.login')}</Link>
            </Button>
          </div>
        </div>
        
        {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Content */}
            <div className="text-center lg:text-left space-y-6 lg:space-y-8 px-2 sm:px-4">
            <div className="flex justify-center lg:justify-start mb-4 lg:mb-6">
              <div
                className="relative w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40"
                style={{
                  filter:
                    "drop-shadow(0 6px 22px hsl(var(--cherry-light) / 0.15)) drop-shadow(0 3px 12px hsl(var(--blue-soft) / 0.15))",
                }}
             >
                <img
                  src="/lovable-uploads/2f7e7907-5cf5-4262-adbd-04f4dbd3151b.png"
                  alt="Couples Financials Logo"
                  className="w-full h-full object-contain relative z-10"
                />
                <div
                  className="pointer-events-none absolute inset-0 rounded-xl"
                  style={{
                    background:
                      "linear-gradient(135deg, hsl(var(--cherry-light) / 0.08), hsl(var(--blue-soft) / 0.08))",
                  }}
                />
              </div>
            </div>
            
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full backdrop-blur-sm text-white text-xs sm:text-sm font-medium border border-white/20 mx-auto lg:mx-0" style={{backgroundColor: 'hsl(8 85% 72% / 0.2)'}}>
              <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
              {t('hero.badge')}
            </div>
            
            {/* Main heading */}
            <div className="space-y-4 lg:space-y-6">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl xl:text-8xl font-bold text-white leading-tight">
                {t('hero.title')}
              </h1>
              <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-semibold text-white/90 leading-tight">
                {t('hero.subtitle')}
              </h2>
            </div>
            
            {/* Description */}
            <p className="text-sm sm:text-base lg:text-lg text-white/80 max-w-xl mx-auto lg:mx-0">
              {t('hero.description')}
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col gap-3 sm:gap-4 justify-center lg:justify-start">
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <Button size="default" variant="secondary" className="group flex-1 sm:flex-none">
                  <Download className="w-4 h-4 group-hover:animate-bounce" />
                  <span className="text-sm">Baixe gratuitamente PWA</span>
                </Button>
                <Button size="default" variant="ctaGradient" className="group flex-1 sm:flex-none" onClick={() => setAiBetaOpen(true)}>
                  <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                  <span className="text-sm">{t('hero.cta.premium')}</span>
                </Button>
              </div>
              
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <div style={{ display: 'none' }}></div>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Em breve: IA Premium</DialogTitle>
                    <DialogDescription>
                      A nossa IA está em fase de testes e logo deixaremos disponível para todos.
                      Caso deseje, adicione seu email e assim que estivermos online,
                      entraremos em contato com a boa notícia!
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Nome</Label>
                      <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" required />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@exemplo.com" required />
                    </div>
                    <DialogFooter>
                      <Button type="submit">Quero ser avisado</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
              
              <AIBetaModal open={aiBetaOpen} onOpenChange={setAiBetaOpen} />
            </div>
            
            {/* Social proof */}
            <div className="flex items-center gap-2 sm:gap-4 text-white/70 text-xs sm:text-sm justify-center lg:justify-start">
              <div className="flex items-center gap-1">
                <div className="flex -space-x-1 sm:-space-x-2">
                  <div className="w-4 h-4 sm:w-6 sm:h-6 rounded-full bg-white/30 border-2 border-white"></div>
                  <div className="w-4 h-4 sm:w-6 sm:h-6 rounded-full bg-white/30 border-2 border-white"></div>
                  <div className="w-4 h-4 sm:w-6 sm:h-6 rounded-full bg-white/30 border-2 border-white"></div>
                </div>
                <span className="ml-1 sm:ml-2">+10k casais já usam</span>
              </div>
            </div>
          </div>
          
          {/* Hero Image */}
          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden shadow-elegant">
              <img 
                src={heroCouple} 
                alt="Casal feliz gerenciando finanças" 
                className="w-full h-auto object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
            </div>
            {/* Floating elements */}
            <div className="absolute -top-4 -right-4 w-20 h-20 bg-secondary rounded-full flex items-center justify-center shadow-glow-yellow animate-bounce">
              <span className="text-2xl">💰</span>
            </div>
            <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-primary rounded-full flex items-center justify-center shadow-glow-green animate-bounce delay-500">
              <span className="text-xl">📊</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Bottom wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-20 fill-background">
          <path d="M1200 120L0 16.48L0 120L1200 120Z"></path>
        </svg>
      </div>
    </section>
  );
};

export default HeroSection;