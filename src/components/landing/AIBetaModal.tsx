import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-hero-gradient rounded-full flex items-center justify-center mb-4">
            <Brain className="w-8 h-8 text-white" />
          </div>
          
          <DialogTitle className="text-2xl font-bold bg-hero-gradient bg-clip-text text-transparent">
            {t('aiBeta.title')}
          </DialogTitle>
          
          <DialogDescription className="text-base text-muted-foreground space-y-4">
            <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg">
              <Clock className="w-5 h-5 text-primary" />
              <span>{t('aiBeta.status')}</span>
            </div>
            
            <p className="leading-relaxed">
              {t('aiBeta.description')}
            </p>
            
            <div className="bg-gradient-to-r from-primary/5 to-secondary/5 p-4 rounded-lg border border-primary/10">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="font-semibold text-foreground">{t('aiBeta.betatester')}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {t('aiBeta.betatesterDescription')}
              </p>
            </div>
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col gap-3 mt-6">
          <Button onClick={handleEmailContact} className="w-full" size="lg">
            <Mail className="w-4 h-4 mr-2" />
            {t('aiBeta.contactButton')}
          </Button>
          
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full">
            {t('aiBeta.waitButton')}
          </Button>
        </div>
        
        <div className="text-center mt-4 space-y-1">
          <p className="text-sm text-muted-foreground">
            {t('aiBeta.emails')}
          </p>
          <div className="flex flex-col text-xs text-primary">
            <span>contato@couplesfinancials.com</span>
            <span>contact@couplesfinancials.com</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AIBetaModal;