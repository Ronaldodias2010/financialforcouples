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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Key, Copy, Check, Download, AlertTriangle } from 'lucide-react';
import { use2FA } from '@/hooks/use2FA';
import { useLanguage } from '@/hooks/useLanguage';
import { useToast } from '@/hooks/use-toast';

interface BackupCodesProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BackupCodes({ open, onOpenChange }: BackupCodesProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { generateBackupCodes } = use2FA();

  const [isLoading, setIsLoading] = useState(false);
  const [codes, setCodes] = useState<string[] | null>(null);
  const [copied, setCopied] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const handleGenerate = async () => {
    setIsLoading(true);
    try {
      const newCodes = await generateBackupCodes();
      if (newCodes) {
        setCodes(newCodes);
        toast({
          title: t('2fa.backupCodes.generated.title'),
          description: t('2fa.backupCodes.generated.description'),
        });
      } else {
        toast({
          variant: 'destructive',
          title: t('2fa.error.title'),
          description: t('2fa.error.generateFailed'),
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!codes) return;
    navigator.clipboard.writeText(codes.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: t('2fa.backupCodes.copied.title'),
      description: t('2fa.backupCodes.copied.description'),
    });
  };

  const handleDownload = () => {
    if (!codes) return;
    const content = `Couples Financials - ${t('2fa.backupCodes.title')}\n\n${codes.join('\n')}\n\n${t('2fa.backupCodes.downloadNote')}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'backup-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClose = () => {
    if (codes && !confirmed) {
      // Show warning that codes won't be shown again
      return;
    }
    setCodes(null);
    setConfirmed(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <Key className="h-6 w-6 text-amber-500" />
            <DialogTitle>{t('2fa.backupCodes.title')}</DialogTitle>
          </div>
          <DialogDescription>
            {t('2fa.backupCodes.dialogDescription')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!codes ? (
            <>
              <Alert variant="destructive" className="border-amber-500/50 bg-amber-500/10">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <AlertTitle className="text-amber-600">{t('2fa.backupCodes.warning.title')}</AlertTitle>
                <AlertDescription className="text-amber-600/80">
                  {t('2fa.backupCodes.warning.description')}
                </AlertDescription>
              </Alert>

              <Button 
                className="w-full" 
                onClick={handleGenerate}
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {t('2fa.backupCodes.generateButton')}
              </Button>
            </>
          ) : (
            <>
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {t('2fa.backupCodes.saveWarning')}
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-2 gap-2 p-4 bg-muted rounded-lg font-mono text-sm">
                {codes.map((code, index) => (
                  <div key={index} className="text-center py-1">
                    {code}
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={handleCopy}
                >
                  {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                  {copied ? t('2fa.backupCodes.copied') : t('2fa.backupCodes.copy')}
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={handleDownload}
                >
                  <Download className="h-4 w-4 mr-2" />
                  {t('2fa.backupCodes.download')}
                </Button>
              </div>

              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                  className="rounded border-input"
                />
                {t('2fa.backupCodes.confirmSaved')}
              </label>
            </>
          )}
        </div>

        {codes && (
          <DialogFooter>
            <Button 
              onClick={handleClose}
              disabled={!confirmed}
            >
              {t('2fa.backupCodes.done')}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
