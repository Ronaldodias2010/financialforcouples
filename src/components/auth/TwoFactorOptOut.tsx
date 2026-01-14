import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Shield, Info } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';

interface TwoFactorOptOutProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (dontAskAgain: boolean) => void;
  onGoBack: () => void;
}

export function TwoFactorOptOut({ open, onOpenChange, onConfirm, onGoBack }: TwoFactorOptOutProps) {
  const { t } = useLanguage();
  const [dontAskAgain, setDontAskAgain] = useState(false);
  const [understood, setUnderstood] = useState(false);

  const handleConfirm = () => {
    onConfirm(dontAskAgain);
    onOpenChange(false);
    setDontAskAgain(false);
    setUnderstood(false);
  };

  const handleGoBack = () => {
    onGoBack();
    onOpenChange(false);
    setDontAskAgain(false);
    setUnderstood(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-amber-500/10 rounded-full">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
            </div>
            <DialogTitle>{t('2fa.optout.title')}</DialogTitle>
          </div>
          <DialogDescription>
            {t('2fa.optout.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Alert variant="destructive" className="border-amber-500/50 bg-amber-500/10">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <AlertTitle className="text-amber-600 dark:text-amber-400">{t('2fa.optout.warning.title')}</AlertTitle>
            <AlertDescription className="text-amber-600/80 dark:text-amber-400/80">
              {t('2fa.optout.warning.description')}
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 border rounded-lg">
              <Shield className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">{t('2fa.optout.risk1.title')}</p>
                <p className="text-xs text-muted-foreground">{t('2fa.optout.risk1.description')}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 border rounded-lg">
              <Shield className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">{t('2fa.optout.risk2.title')}</p>
                <p className="text-xs text-muted-foreground">{t('2fa.optout.risk2.description')}</p>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="understood" 
                checked={understood}
                onCheckedChange={(checked) => setUnderstood(checked === true)}
              />
              <label
                htmlFor="understood"
                className="text-sm font-medium leading-none cursor-pointer"
              >
                {t('2fa.optout.understood')}
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox 
                id="dontAskAgain" 
                checked={dontAskAgain}
                onCheckedChange={(checked) => setDontAskAgain(checked === true)}
              />
              <label
                htmlFor="dontAskAgain"
                className="text-sm text-muted-foreground leading-none cursor-pointer"
              >
                {t('2fa.optout.dontAskAgain')}
              </label>
            </div>
          </div>

          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <p className="text-xs text-muted-foreground">
                {t('2fa.optout.canEnable')}
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 sticky bottom-0 bg-background pt-4 -mb-6 pb-[env(safe-area-inset-bottom)]">
          <Button variant="outline" onClick={handleGoBack} className="w-full sm:w-auto">
            {t('2fa.optout.goBack')}
          </Button>
          <Button 
            variant="outline"
            onClick={handleConfirm}
            disabled={!understood}
            className="w-full sm:w-auto border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
          >
            {t('2fa.optout.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
