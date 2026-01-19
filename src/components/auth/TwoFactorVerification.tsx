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
import { Loader2, Shield, Key, RefreshCw, Mail, AlertTriangle } from 'lucide-react';
import { use2FA, TwoFactorMethod } from '@/hooks/use2FA';
import { useLanguage } from '@/hooks/useLanguage';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface TwoFactorVerificationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  method: TwoFactorMethod;
  onVerified: () => void;
  onCancel: () => void;
  smsError?: boolean;
  smsErrorMessage?: string | null;
  onRetrySMS?: () => void;
  onSwitchToEmail?: () => void;
  userEmail?: string;
  userId?: string;
}

export function TwoFactorVerification({ 
  open, 
  onOpenChange, 
  method, 
  onVerified,
  onCancel,
  smsError = false,
  smsErrorMessage,
  onRetrySMS,
  onSwitchToEmail,
  userEmail,
  userId
}: TwoFactorVerificationProps) {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const { verifyTOTP, verifySMS, verifyEmail, verifyBackupCode, sendVerificationCode } = use2FA();

  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isSwitchingToEmail, setIsSwitchingToEmail] = useState(false);
  const [code, setCode] = useState('');
  const [backupCode, setBackupCode] = useState('');
  const [useBackup, setUseBackup] = useState(false);
  const [currentMethod, setCurrentMethod] = useState<TwoFactorMethod>(method);
  const [emailFallbackActive, setEmailFallbackActive] = useState(false);

  // Helper to get translated Twilio error message
  const getTwilioErrorDescription = (errorCode: string | null) => {
    if (!errorCode) return null;
    
    const errorMessages: Record<string, { pt: string; en: string; es: string }> = {
      '21211': {
        pt: 'Número de telefone inválido. Verifique o formato.',
        en: 'Invalid phone number. Check the format.',
        es: 'Número de teléfono inválido. Verifique el formato.'
      },
      '21614': {
        pt: 'Número não pode receber SMS (linha fixa ou bloqueado).',
        en: 'Number cannot receive SMS (landline or blocked).',
        es: 'El número no puede recibir SMS (línea fija o bloqueado).'
      },
      '21608': {
        pt: 'Número não verificado na conta Twilio (modo trial).',
        en: 'Number not verified in Twilio account (trial mode).',
        es: 'Número no verificado en la cuenta Twilio (modo trial).'
      },
      '21610': {
        pt: 'Usuário optou por não receber mensagens.',
        en: 'User opted out of receiving messages.',
        es: 'El usuario optó por no recibir mensajes.'
      },
      '21612': {
        pt: 'Número não pode receber SMS nesta região.',
        en: 'Number cannot receive SMS in this region.',
        es: 'El número no puede recibir SMS en esta región.'
      },
      '60200': {
        pt: 'Limite de verificações atingido. Aguarde alguns minutos.',
        en: 'Verification limit reached. Wait a few minutes.',
        es: 'Límite de verificaciones alcanzado. Espere unos minutos.'
      },
      '60203': {
        pt: 'Número bloqueado temporariamente. Tente novamente mais tarde.',
        en: 'Number temporarily blocked. Try again later.',
        es: 'Número bloqueado temporalmente. Intente más tarde.'
      },
      '60205': {
        pt: 'SMS falhou - operadora pode ter bloqueado.',
        en: 'SMS failed - carrier may have blocked it.',
        es: 'SMS falló - el operador puede haberlo bloqueado.'
      }
    };
    
    const msg = errorMessages[errorCode];
    if (msg) {
      return msg[language as 'pt' | 'en' | 'es'] || msg.pt;
    }
    return null;
  };

  // Handle switching to email as fallback
  const handleSwitchToEmail = async () => {
    if (!userId || !userEmail) {
      toast({
        variant: 'destructive',
        title: t('2fa.error.title'),
        description: language === 'en' 
          ? 'Could not switch to email. Missing user information.'
          : language === 'es'
          ? 'No se pudo cambiar al correo electrónico. Falta información del usuario.'
          : 'Não foi possível mudar para email. Informações do usuário ausentes.',
      });
      return;
    }

    setIsSwitchingToEmail(true);
    try {
      // Send verification email
      const { error } = await supabase.functions.invoke('send-2fa-email', {
        body: { userId, email: userEmail, language }
      });

      if (error) {
        throw error;
      }

      // Switch to email method locally (not permanent - just for this session)
      setCurrentMethod('email');
      setEmailFallbackActive(true);
      setCode(''); // Clear any existing code
      
      toast({
        title: language === 'en' ? 'Email Sent' : language === 'es' ? 'Correo Enviado' : 'Email Enviado',
        description: language === 'en' 
          ? 'A verification code has been sent to your email.'
          : language === 'es'
          ? 'Se ha enviado un código de verificación a su correo.'
          : 'Um código de verificação foi enviado para seu email.',
      });

      // Call parent callback if provided
      if (onSwitchToEmail) {
        onSwitchToEmail();
      }
    } catch (error) {
      console.error('Failed to switch to email:', error);
      toast({
        variant: 'destructive',
        title: t('2fa.error.title'),
        description: language === 'en' 
          ? 'Could not send verification email. Please try again.'
          : language === 'es'
          ? 'No se pudo enviar el correo de verificación. Intente de nuevo.'
          : 'Não foi possível enviar o email de verificação. Tente novamente.',
      });
    } finally {
      setIsSwitchingToEmail(false);
    }
  };

  const handleVerify = async () => {
    setIsLoading(true);
    try {
      let success = false;
      
      // Use currentMethod which may have been switched to email fallback
      const methodToVerify = emailFallbackActive ? 'email' : currentMethod;
      
      if (useBackup) {
        success = await verifyBackupCode(backupCode);
      } else if (methodToVerify === 'totp') {
        success = await verifyTOTP(code);
      } else if (methodToVerify === 'sms') {
        success = await verifySMS(code);
      } else if (methodToVerify === 'email') {
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
    const methodToResend = emailFallbackActive ? 'email' : currentMethod;
    if (methodToResend === 'totp') return; // TOTP doesn't need resending
    
    setIsResending(true);
    try {
      const success = await sendVerificationCode(methodToResend as 'sms' | 'email');
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
    // If fallback to email is active, show email description
    if (emailFallbackActive) {
      return language === 'en' 
        ? 'A verification code was sent to your email as a backup.'
        : language === 'es'
        ? 'Se envió un código de verificación a su correo como respaldo.'
        : 'Um código de verificação foi enviado para seu email como backup.';
    }
    
    switch (currentMethod) {
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
            {/* Show email fallback success message */}
            {emailFallbackActive && (
              <Alert className="border-green-500 bg-green-50">
                <Mail className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-700">
                  {language === 'en' 
                    ? 'Email verification active. Check your inbox for the code.'
                    : language === 'es'
                    ? 'Verificación por correo activa. Revise su bandeja de entrada.'
                    : 'Verificação por email ativa. Verifique sua caixa de entrada.'}
                </AlertDescription>
              </Alert>
            )}
            
            {/* Show SMS error with fallback options */}
            {smsError && method === 'sms' && !emailFallbackActive ? (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="space-y-3">
                  <p className="font-medium">{t('2fa.error.smsFailed')}</p>
                  {smsErrorMessage && (
                    <div className="text-xs opacity-90 bg-destructive/10 p-2 rounded">
                      <p>{getTwilioErrorDescription(smsErrorMessage) || smsErrorMessage}</p>
                    </div>
                  )}
                  <p className="text-sm">
                    {language === 'en' 
                      ? 'You can retry SMS, use email as backup, or use a backup code.'
                      : language === 'es'
                      ? 'Puede reintentar SMS, usar correo como respaldo, o usar un código de respaldo.'
                      : 'Você pode tentar novamente por SMS, usar email como backup, ou usar um código de backup.'}
                  </p>
                </AlertDescription>
              </Alert>
            ) : !emailFallbackActive && (
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  {getMethodDescription()}
                </AlertDescription>
              </Alert>
            )}

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

            {/* SMS Error: Show retry and email fallback buttons */}
            {method === 'sms' && smsError && !emailFallbackActive && (
              <div className="space-y-2">
                {onRetrySMS && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="w-full"
                    onClick={onRetrySMS}
                    disabled={isResending}
                  >
                    {isResending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    {t('2fa.verification.retrySms')}
                  </Button>
                )}
                
                {/* Email fallback button - Plan B */}
                {userId && userEmail && (
                  <Button 
                    variant="secondary" 
                    size="sm"
                    className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200"
                    onClick={handleSwitchToEmail}
                    disabled={isSwitchingToEmail}
                  >
                    {isSwitchingToEmail ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Mail className="h-4 w-4 mr-2" />
                    )}
                    {language === 'en' 
                      ? 'Use Email Instead (Backup)'
                      : language === 'es'
                      ? 'Usar Correo en su Lugar (Respaldo)'
                      : 'Usar Email em Vez de SMS (Backup)'}
                  </Button>
                )}
              </div>
            )}

            {/* Normal SMS resend button */}
            {method === 'sms' && !smsError && !emailFallbackActive && (
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
            
            {/* Email fallback resend button */}
            {emailFallbackActive && (
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
                {language === 'en' 
                  ? 'Resend Email Code'
                  : language === 'es'
                  ? 'Reenviar Código por Correo'
                  : 'Reenviar Código por Email'}
              </Button>
            )}

            {method === 'email' && !emailFallbackActive && (
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
