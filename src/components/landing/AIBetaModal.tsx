import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Mail, Sparkles, Brain, Clock } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface AIBetaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AIBetaModal = ({ open, onOpenChange }: AIBetaModalProps) => {
  const { t } = useLanguage();

  const handleEmailContact = () => {
    window.open('mailto:contato@couplesfinancials.com?subject=Beta AI - Teste&body=Olá, gostaria de ser um testador beta da funcionalidade de IA.', '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-0 bg-gradient-to-br from-background via-background to-primary/5 max-h-[90vh]">
        <ScrollArea className="max-h-[80vh] pr-6">
          <DialogHeader className="text-center space-y-4">
            {/* Logo */}
            <div className="mx-auto w-28 h-28 relative">
              <img
                src="/lovable-uploads/2f7e7907-5cf5-4262-adbd-04f4dbd3151b.png"
                alt="Couples Financials Logo"
                className="w-full h-full object-contain relative z-10"
              />
              <div className="absolute inset-0 bg-hero-gradient rounded-full opacity-20 blur-md animate-pulse"></div>
            </div>
            
            {/* AI Icon with gradient background */}
            <div className="mx-auto w-16 h-16 bg-hero-gradient rounded-full flex items-center justify-center shadow-glow-green">
              <Brain className="w-8 h-8 text-white" />
            </div>
            
            <DialogTitle className="text-2xl font-bold bg-hero-gradient bg-clip-text text-transparent">
              {t('aiBeta.title')}
            </DialogTitle>
            
            <DialogDescription className="text-base text-muted-foreground space-y-4">
              <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl border border-primary/20">
                <div className="w-8 h-8 bg-hero-gradient rounded-full flex items-center justify-center">
                  <Clock className="w-4 h-4 text-white" />
                </div>
                <span className="font-medium text-foreground">{t('aiBeta.status')}</span>
              </div>
              
              <p className="leading-relaxed text-foreground">
                {t('aiBeta.description')}
              </p>
              
              <div className="bg-gradient-to-r from-primary/10 via-secondary/5 to-primary/10 p-5 rounded-xl border border-primary/20 shadow-inner">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-6 h-6 bg-hero-gradient rounded-full flex items-center justify-center">
                    <Sparkles className="w-3 h-3 text-white" />
                  </div>
                  <span className="font-semibold text-foreground text-lg">{t('aiBeta.betatester')}</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t('aiBeta.betatesterDescription')}
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col gap-3 mt-6">
            <Button onClick={handleEmailContact} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg" size="lg">
              <Mail className="w-4 h-4 mr-2" />
              {t('aiBeta.contactButton')}
            </Button>
            
            <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full border-primary/30 hover:bg-primary/5">
              {t('aiBeta.waitButton')}
            </Button>
          </div>
          
          <div className="text-center mt-4 p-4 bg-gradient-to-r from-secondary/10 to-primary/10 rounded-xl border border-secondary/20">
            <p className="text-sm font-medium text-foreground mb-2">
              {t('aiBeta.emails')}
            </p>
            <div className="flex flex-col text-sm space-y-1">
              <span className="text-primary font-medium">contato@couplesfinancials.com</span>
              <span className="text-primary font-medium">contact@couplesfinancials.com</span>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default AIBetaModal;