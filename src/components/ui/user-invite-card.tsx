import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, UserPlus, Mail } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';

interface UserInviteCardProps {
  onInviteClick: () => void;
  showCard: boolean;
}

export const UserInviteCard = ({ onInviteClick, showCard }: UserInviteCardProps) => {
  const { t } = useLanguage();
  const [isVisible, setIsVisible] = useState(showCard);
  const [isDismissedThisSession, setIsDismissedThisSession] = useState(false);
  const [isPermanentlyDismissed, setIsPermanentlyDismissed] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const val = localStorage.getItem('dismissInvitePermanently') === 'true';
      setIsPermanentlyDismissed(val);
    }
  }, []);

  useEffect(() => {
    setIsVisible(showCard && !isDismissedThisSession && !isPermanentlyDismissed);
  }, [showCard, isDismissedThisSession, isPermanentlyDismissed]);

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDismissedThisSession(true);
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <Card 
      className="ml-2 border-2 border-dashed border-primary/40 bg-gradient-to-br from-primary/5 to-secondary/5 cursor-pointer hover:border-primary/60 transition-all duration-200 animate-pulse"
      onClick={onInviteClick}
    >
      <CardContent className="p-3 relative">
        <Button
          variant="ghost"
          size="sm"
          className="absolute -top-1 -right-1 h-6 w-6 p-0 hover:bg-destructive/10"
          onClick={handleDismiss}
        >
          <X className="h-3 w-3" />
        </Button>
        
        <div className="flex items-center gap-2 pr-4">
          <div className="flex items-center gap-1">
            <UserPlus className="h-4 w-4 text-primary" />
            <Mail className="h-3 w-3 text-secondary" />
          </div>
          <div className="text-xs">
            <div className="font-medium text-primary">
              {t('inviteCard')}
            </div>
            <div className="text-muted-foreground">
              {t('inviteSubtext')}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};