import { useState, useEffect } from 'react';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Smartphone, Mail, Check, Copy, QrCode } from 'lucide-react';
import { use2FA, TwoFactorMethod } from '@/hooks/use2FA';
import { useLanguage } from '@/hooks/useLanguage';
import { useToast } from '@/hooks/use-toast';

interface TwoFactorSetupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  method: TwoFactorMethod;
  onComplete: () => void;
}

export function TwoFactorSetup({ open, onOpenChange, method, onComplete }: TwoFactorSetupProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { enableTOTP, verifyTOTP, enableSMS, verifySMS, enableEmail, verifyEmail } = use2FA();

  const [step, setStep] = useState<'setup' | 'verify'>('setup');
  const [isLoading, setIsLoading] = useState(false);
  const [code, setCode] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  
  // TOTP specific
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [factorId, setFactorId] = useState('');
  const [copied, setCopied] = useState(false);

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (open) {
      setStep('setup');
      setCode('');
      setQrCode('');
      setSecret('');
      setFactorId('');
      setPhoneNumber('');
      setCopied(false);
    }
  }, [open]);

  const handleSetup = async () => {
    setIsLoading(true);
    try {
      if (method === 'totp') {
        const result = await enableTOTP();
        if (result) {
          setQrCode(result.qrCode);
          setSecret(result.secret);
          setFactorId(result.factorId);
          console.log('[TwoFactorSetup] TOTP enrolled, factorId:', result.factorId);
          setStep('verify');
        } else {
          toast({
            variant: 'destructive',
            title: t('2fa.error.title'),
            description: t('2fa.error.setupFailed'),
          });
        }
      } else if (method === 'sms') {
        if (!phoneNumber) {
          toast({
            variant: 'destructive',
            title: t('2fa.error.title'),
            description: t('2fa.error.phoneRequired'),
          });
          return;
        }
        const success = await enableSMS(phoneNumber);
        if (success) {
          setStep('verify');
          toast({
            title: t('2fa.sms.sent.title'),
            description: t('2fa.sms.sent.description'),
          });
        }
      } else if (method === 'email') {
        const success = await enableEmail();
        if (success) {
          setStep('verify');
          toast({
            title: t('2fa.email.sent.title'),
            description: t('2fa.email.sent.description'),
          });
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async () => {
    if (code.length !== 6) return;
    
    setIsLoading(true);
    try {
      let success = false;
      
      if (method === 'totp') {
        console.log('[TwoFactorSetup] Verifying TOTP with factorId:', factorId);
        success = await verifyTOTP(code, factorId || undefined);
      } else if (method === 'sms') {
        success = await verifySMS(code);
      } else if (method === 'email') {
        success = await verifyEmail(code);
      }

      if (success) {
        toast({
          title: t('2fa.enabled.title'),
          description: t('2fa.enabled.description'),
        });
        onComplete();
        onOpenChange(false);
      } else {
        toast({
          variant: 'destructive',
          title: t('2fa.error.title'),
          description: t('2fa.error.invalidCode'),
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const copySecret = () => {
    navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getMethodIcon = () => {
    switch (method) {
      case 'totp': return <Smartphone className="h-6 w-6 text-primary" />;
      case 'sms': return <Smartphone className="h-6 w-6 text-blue-500" />;
      case 'email': return <Mail className="h-6 w-6 text-purple-500" />;
      default: return null;
    }
  };

  const getMethodTitle = () => {
    switch (method) {
      case 'totp': return t('2fa.setup.totp.title');
      case 'sms': return t('2fa.setup.sms.title');
      case 'email': return t('2fa.setup.email.title');
      default: return '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            {getMethodIcon()}
            <DialogTitle>{getMethodTitle()}</DialogTitle>
          </div>
          <DialogDescription>
            {step === 'setup' 
              ? t(`2fa.setup.${method}.description`)
              : t('2fa.verify.description')
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {step === 'setup' && (
            <>
              {method === 'totp' && (
                <Alert>
                  <QrCode className="h-4 w-4" />
                  <AlertDescription>
                    {t('2fa.setup.totp.instruction')}
                  </AlertDescription>
                </Alert>
              )}

              {method === 'sms' && (
                <div className="space-y-2">
                  <Label htmlFor="phone">{t('2fa.setup.sms.phoneLabel')}</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+55 11 99999-9999"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    {t('2fa.setup.sms.phoneHint')}
                  </p>
                </div>
              )}

              {method === 'email' && (
                <Alert>
                  <Mail className="h-4 w-4" />
                  <AlertDescription>
                    {t('2fa.setup.email.instruction')}
                  </AlertDescription>
                </Alert>
              )}

              <Button 
                className="w-full" 
                onClick={handleSetup}
                disabled={isLoading || (method === 'sms' && !phoneNumber)}
              >
                {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {t('2fa.setup.continue')}
              </Button>
            </>
          )}

          {step === 'verify' && (
            <>
              {method === 'totp' && qrCode && (
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <img 
                      src={qrCode} 
                      alt="QR Code" 
                      className="w-48 h-48 border rounded-lg p-2 bg-white"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>{t('2fa.setup.totp.secretLabel')}</Label>
                    <div className="flex gap-2">
                      <Input 
                        value={secret} 
                        readOnly 
                        className="font-mono text-sm"
                      />
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={copySecret}
                      >
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t('2fa.setup.totp.secretHint')}
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>{t('2fa.verify.codeLabel')}</Label>
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

              <Button 
                className="w-full" 
                onClick={handleVerify}
                disabled={isLoading || code.length !== 6}
              >
                {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {t('2fa.verify.button')}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
