import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Shield, Key, RefreshCw } from 'lucide-react';
import { use2FA, TwoFactorMethod } from '@/hooks/use2FA';
import { useLanguage } from '@/hooks/useLanguage';
import { useToast } from '@/hooks/use-toast';

interface TwoFactorVerificationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  method: TwoFactorMethod;
  onVerified: () => void;
  onCancel: () => void;
}

export function TwoFactorVerification({ 
  open, 
  onOpenChange, 
  method, 
  onVerified,
  onCancel 
}: TwoFactorVerificationProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { verifyTOTP, verifySMS, verifyEmail, verifyBackupCode, sendVerificationCode } = use2FA();

  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [code, setCode] = useState('');
  const [backupCode, setBackupCode] = useState('');
  const [useBackup, setUseBackup] = useState(false);

  const handleVerify = async () => {
    setIsLoading(true);
    try {
      let success = false;
      
      if (useBackup) {
        success = await verifyBackupCode(backupCode);
      } else if (method === 'totp') {
        success = await verifyTOTP(code);
      } else if (method === 'sms') {
        success = await verifySMS(code);
      } else if (method === 'email') {
        success = await verifyEmail(code);
      }

      if (success) {
        toast({
          title: t('2fa.verification.success.title'),
          description: t('2fa.verification.success.description'),
        });
        onVerified();
      } else {
        toast({
          variant: 'destructive',
          title: t('2fa.error.title'),
          description: useBackup ? t('2fa.error.invalidBackupCode') : t('2fa.error.invalidCode'),
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (method === 'totp') return; // TOTP doesn't need resending
    
    setIsResending(true);
    try {
      const success = await sendVerificationCode(method as 'sms' | 'email');
      if (success) {
        toast({
          title: t('2fa.resend.success.title'),
          description: t('2fa.resend.success.description'),
        });
      } else {
        toast({
          variant: 'destructive',
          title: t('2fa.error.title'),
          description: t('2fa.error.resendFailed'),
        });
      }
    } finally {
      setIsResending(false);
    }
  };

  const getMethodDescription = () => {
    switch (method) {
      case 'totp': return t('2fa.verification.totp.description');
      case 'sms': return t('2fa.verification.sms.description');
      case 'email': return t('2fa.verification.email.description');
      default: return '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={(value) => {
      if (!value) onCancel();
      onOpenChange(value);
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <Shield className="h-6 w-6 text-primary" />
            <DialogTitle>{t('2fa.verification.title')}</DialogTitle>
          </div>
          <DialogDescription>
            {t('2fa.verification.subtitle')}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="code" onValueChange={(v) => setUseBackup(v === 'backup')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="code">{t('2fa.verification.codeTab')}</TabsTrigger>
            <TabsTrigger value="backup">{t('2fa.verification.backupTab')}</TabsTrigger>
          </TabsList>

          <TabsContent value="code" className="space-y-4 py-4">
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                {getMethodDescription()}
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label>{t('2fa.verification.codeLabel')}</Label>
              <div className="flex justify-center">
                <InputOTP 
                  maxLength={6} 
                  value={code}
                  onChange={setCode}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
            </div>

            {(method === 'sms' || method === 'email') && (
              <Button 
                variant="ghost" 
                size="sm"
                className="w-full"
                onClick={handleResend}
                disabled={isResending}
              >
                {isResending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                {t('2fa.verification.resend')}
              </Button>
            )}

            <Button 
              className="w-full" 
              onClick={handleVerify}
              disabled={isLoading || code.length !== 6}
            >
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {t('2fa.verification.verify')}
            </Button>
          </TabsContent>

          <TabsContent value="backup" className="space-y-4 py-4">
            <Alert>
              <Key className="h-4 w-4" />
              <AlertDescription>
                {t('2fa.verification.backup.description')}
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label>{t('2fa.verification.backup.label')}</Label>
              <Input
                placeholder="XXXX-XXXX"
                value={backupCode}
                onChange={(e) => setBackupCode(e.target.value.toUpperCase())}
                className="font-mono text-center text-lg tracking-widest"
              />
            </div>

            <Button 
              className="w-full" 
              onClick={handleVerify}
              disabled={isLoading || backupCode.length < 8}
            >
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {t('2fa.verification.verify')}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
