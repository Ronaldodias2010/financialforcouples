import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Shield, 
  Smartphone, 
  Mail, 
  Key, 
  ChevronLeft, 
  Check, 
  AlertTriangle,
  Lock,
  Loader2,
  Sparkles
} from 'lucide-react';
import { use2FA, TwoFactorMethod } from '@/hooks/use2FA';
import { use2FAPrompt } from '@/hooks/use2FAPrompt';
import { use2FAStatus } from '@/hooks/use2FAStatus';
import { useLanguage } from '@/hooks/useLanguage';
import { TwoFactorSetup } from '@/components/auth/TwoFactorSetup';
import { TwoFactorWizard } from '@/components/auth/TwoFactorWizard';
import { BackupCodes } from '@/components/auth/BackupCodes';
import { useToast } from '@/hooks/use-toast';

export default function SecuritySettings() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { toast } = useToast();
  const { 
    settings, 
    isLoading, 
    isEnabled, 
    method, 
    disable2FA,
    fetchSettings 
  } = use2FA();
  const { resetPrompt } = use2FAPrompt();
  const { markAs2FAEnabled, markAs2FADisabled } = use2FAStatus();

  const [showSetup, setShowSetup] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<TwoFactorMethod>('totp');
  const [isDisabling, setIsDisabling] = useState(false);

  const handleSetup = (method: TwoFactorMethod) => {
    setSelectedMethod(method);
    setShowSetup(true);
  };

  const handleDisable2FA = async () => {
    setIsDisabling(true);
    try {
      const success = await disable2FA();
      if (success) {
        // Mark 2FA as disabled (to show recommendation on login page again)
        markAs2FADisabled();
        toast({
          title: t('2fa.disabled.title'),
          description: t('2fa.disabled.description'),
        });
      } else {
        toast({
          variant: 'destructive',
          title: t('2fa.error.title'),
          description: t('2fa.error.disableFailed'),
        });
      }
    } finally {
      setIsDisabling(false);
    }
  };

  const handleSetupComplete = () => {
    // Mark 2FA as enabled (to hide recommendation on login page)
    markAs2FAEnabled();
    setShowSetup(false);
    fetchSettings();
  };

  const getMethodIcon = (m: TwoFactorMethod) => {
    switch (m) {
      case 'totp': return <Smartphone className="h-5 w-5" />;
      case 'sms': return <Smartphone className="h-5 w-5" />;
      case 'email': return <Mail className="h-5 w-5" />;
      default: return <Shield className="h-5 w-5" />;
    }
  };

  const getMethodName = (m: TwoFactorMethod) => {
    switch (m) {
      case 'totp': return t('2fa.method.totp');
      case 'sms': return t('2fa.method.sms');
      case 'email': return t('2fa.method.email');
      default: return t('2fa.method.none');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-2xl mx-auto py-6 px-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{t('2fa.settings.title')}</h1>
            <p className="text-muted-foreground">{t('2fa.settings.subtitle')}</p>
          </div>
        </div>

        {/* Security Recommendation Alert */}
        {!isEnabled && (
          <Alert className="mb-6 border-amber-500/50 bg-amber-500/10 cursor-pointer hover:bg-amber-500/15 transition-colors" onClick={() => setShowWizard(true)}>
            <Sparkles className="h-4 w-4 text-amber-500" />
            <AlertTitle className="text-amber-600">{t('2fa.recommendation.title')}</AlertTitle>
            <AlertDescription className="text-amber-600/80">
              {t('2fa.recommendation.description')}
              <span className="block mt-2 text-amber-600 font-medium underline">
                {t('2fa.wizard.start')} →
              </span>
            </AlertDescription>
          </Alert>
        )}

        {/* Current Status Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${isEnabled ? 'bg-green-500/10' : 'bg-muted'}`}>
                  <Shield className={`h-5 w-5 ${isEnabled ? 'text-green-500' : 'text-muted-foreground'}`} />
                </div>
                <div>
                  <CardTitle className="text-lg">{t('2fa.status.title')}</CardTitle>
                  <CardDescription>
                    {isEnabled ? t('2fa.status.enabled') : t('2fa.status.disabled')}
                  </CardDescription>
                </div>
              </div>
              <Badge variant={isEnabled ? 'default' : 'secondary'}>
                {isEnabled ? (
                  <><Check className="h-3 w-3 mr-1" />{t('2fa.status.active')}</>
                ) : (
                  t('2fa.status.inactive')
                )}
              </Badge>
            </div>
          </CardHeader>
          {isEnabled && (
            <CardContent className="pt-0">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  {getMethodIcon(method)}
                  <div>
                    <p className="font-medium">{getMethodName(method)}</p>
                    <p className="text-sm text-muted-foreground">{t('2fa.currentMethod')}</p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleDisable2FA}
                  disabled={isDisabling}
                >
                  {isDisabling && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {t('2fa.disable')}
                </Button>
              </div>
            </CardContent>
          )}
        </Card>

        {/* 2FA Methods */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{t('2fa.methods.title')}</CardTitle>
            <CardDescription>{t('2fa.methods.description')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* TOTP - App Authenticator */}
            <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-primary/10 rounded-full">
                  <Smartphone className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{t('2fa.method.totp')}</p>
                  <p className="text-sm text-muted-foreground">{t('2fa.method.totp.description')}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {method === 'totp' && isEnabled && (
                  <Badge variant="outline" className="text-green-500 border-green-500">
                    <Check className="h-3 w-3 mr-1" />{t('2fa.active')}
                  </Badge>
                )}
                <Button 
                  variant={method === 'totp' && isEnabled ? 'outline' : 'default'}
                  size="sm"
                  onClick={() => handleSetup('totp')}
                  disabled={method === 'totp' && isEnabled}
                >
                  {method === 'totp' && isEnabled ? t('2fa.configured') : t('2fa.configure')}
                </Button>
              </div>
            </div>

            <Separator />

            {/* SMS */}
            <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-blue-500/10 rounded-full">
                  <Smartphone className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="font-medium">{t('2fa.method.sms')}</p>
                  <p className="text-sm text-muted-foreground">{t('2fa.method.sms.description')}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {method === 'sms' && isEnabled && (
                  <Badge variant="outline" className="text-green-500 border-green-500">
                    <Check className="h-3 w-3 mr-1" />{t('2fa.active')}
                  </Badge>
                )}
                <Button 
                  variant={method === 'sms' && isEnabled ? 'outline' : 'default'}
                  size="sm"
                  onClick={() => handleSetup('sms')}
                  disabled={method === 'sms' && isEnabled}
                >
                  {method === 'sms' && isEnabled ? t('2fa.configured') : t('2fa.configure')}
                </Button>
              </div>
            </div>

            <Separator />

            {/* Email */}
            <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-purple-500/10 rounded-full">
                  <Mail className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <p className="font-medium">{t('2fa.method.email')}</p>
                  <p className="text-sm text-muted-foreground">{t('2fa.method.email.description')}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {method === 'email' && isEnabled && (
                  <Badge variant="outline" className="text-green-500 border-green-500">
                    <Check className="h-3 w-3 mr-1" />{t('2fa.active')}
                  </Badge>
                )}
                <Button 
                  variant={method === 'email' && isEnabled ? 'outline' : 'default'}
                  size="sm"
                  onClick={() => handleSetup('email')}
                  disabled={method === 'email' && isEnabled}
                >
                  {method === 'email' && isEnabled ? t('2fa.configured') : t('2fa.configure')}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reset 2FA Prompt - Only show when 2FA is disabled */}
        {!isEnabled && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{t('2fa.resetPrompt.title')}</p>
                    <p className="text-sm text-muted-foreground">{t('2fa.resetPrompt.description')}</p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    resetPrompt();
                    toast({
                      title: t('2fa.resetPrompt.success.title'),
                      description: t('2fa.resetPrompt.success.description'),
                    });
                  }}
                >
                  {t('2fa.resetPrompt.button')}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Backup Codes */}
        {isEnabled && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/10 rounded-full">
                  <Key className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <CardTitle>{t('2fa.backupCodes.title')}</CardTitle>
                  <CardDescription>{t('2fa.backupCodes.description')}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {settings?.backup_codes_count 
                      ? t('2fa.backupCodes.remaining').replace('{count}', String(settings.backup_codes_count))
                      : t('2fa.backupCodes.notGenerated')
                    }
                  </p>
                </div>
                <Button variant="outline" onClick={() => setShowBackupCodes(true)}>
                  <Lock className="h-4 w-4 mr-2" />
                  {settings?.backup_codes_count ? t('2fa.backupCodes.regenerate') : t('2fa.backupCodes.generate')}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Setup Modal */}
        <TwoFactorSetup
          open={showSetup}
          onOpenChange={setShowSetup}
          method={selectedMethod}
          onComplete={handleSetupComplete}
        />

        {/* Wizard Modal */}
        <TwoFactorWizard
          open={showWizard}
          onOpenChange={setShowWizard}
          onSelectMethod={(m) => {
            setSelectedMethod(m);
            setShowWizard(false);
            setShowSetup(true);
          }}
          onSkip={() => setShowWizard(false)}
        />

        {/* Backup Codes Modal */}
        <BackupCodes
          open={showBackupCodes}
          onOpenChange={setShowBackupCodes}
        />
      </div>
    </div>
  );
}
