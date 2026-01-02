import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/landing/ui/button";
import { MessageSquarePlus, Mail, Sparkles } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface TestimonialInviteCardProps {
  className?: string;
  style?: React.CSSProperties;
}

const TestimonialInviteCard = ({ className, style }: TestimonialInviteCardProps) => {
  const { t } = useLanguage();

  const handleSendTestimonial = () => {
    const subject = encodeURIComponent(t('testimonials.emailSubject'));
    const body = encodeURIComponent(t('testimonials.emailBody'));
    window.open(`mailto:contato@couplesfinancials.com?subject=${subject}&body=${body}`);
  };

  return (
    <Card 
      className={`relative border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10 hover:border-primary/50 hover:shadow-elegant transition-all duration-300 group ${className}`}
      style={style}
    >
      <CardContent className="p-6 flex flex-col items-center justify-center h-full min-h-[200px] text-center">
        <div className="relative mb-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
            <MessageSquarePlus className="w-8 h-8 text-primary" />
          </div>
          <Sparkles className="absolute -top-1 -right-1 w-5 h-5 text-primary animate-pulse" />
        </div>
        
        <h3 className="font-semibold text-lg text-foreground mb-2">
          {t('testimonials.invite.title')}
        </h3>
        
        <p className="text-sm text-muted-foreground mb-4 max-w-[200px]">
          {t('testimonials.invite.description')}
        </p>
        
        <Button
          onClick={handleSendTestimonial}
          variant="outline"
          className="gap-2 border-primary/30 hover:bg-primary hover:text-primary-foreground transition-all"
        >
          <Mail className="w-4 h-4" />
          {t('testimonials.invite.button')}
        </Button>
      </CardContent>
    </Card>
  );
};

export default TestimonialInviteCard;
